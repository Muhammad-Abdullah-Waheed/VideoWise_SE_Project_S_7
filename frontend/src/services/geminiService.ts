/**
 * Gemini Direct Service - Client-side video processing using Gemini API
 * This allows users to process videos directly in the browser without backend
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

export interface GeminiConfig {
  apiKey: string;
}

export interface VideoProcessingOptions {
  numFrames?: number;
  summaryStyle?: string;
  summaryFormat?: string;
  summaryLengthWords?: number;
}

export interface ProcessingResult {
  jobId: string;
  summary: string;
  audio_transcription?: string;
  visualCaptions?: Array<{ frame: number; caption: string }>;
  status: 'done' | 'processing' | 'failed';
  videoUrl?: string;
  summaryFormat?: string;
}

class GeminiService {
  private genAI: GoogleGenerativeAI | null = null;
  private apiKey: string | null = null;

  initialize(apiKey: string) {
    this.apiKey = apiKey;
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  isInitialized(): boolean {
    return this.genAI !== null && this.apiKey !== null;
  }

  /**
   * Extract frames from video file
   */
  private async extractFrames(videoFile: File, numFrames: number = 10): Promise<string[]> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const frames: string[] = [];
      let loadedFrames = 0;
      const targetFrames = numFrames;

      video.preload = 'metadata';
      video.muted = true;
      video.playsInline = true;

      video.onloadedmetadata = () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        const duration = video.duration;
        if (duration === 0 || isNaN(duration)) {
          reject(new Error('Invalid video duration'));
          return;
        }

        const interval = duration / (numFrames + 1);
        const seekTimes: number[] = [];

        for (let i = 1; i <= targetFrames; i++) {
          seekTimes.push(interval * i);
        }

        const processFrame = (index: number) => {
          if (index >= seekTimes.length) {
            resolve(frames);
            return;
          }

          const time = seekTimes[index];
          video.currentTime = time;

          const onSeeked = () => {
            if (ctx) {
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
              const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
              frames.push(dataUrl);
              loadedFrames++;
              
              video.removeEventListener('seeked', onSeeked);
              processFrame(index + 1);
            }
          };

          video.addEventListener('seeked', onSeeked, { once: true });
        };

        processFrame(0);
      };

      video.onerror = () => {
        reject(new Error('Failed to load video'));
      };

      video.src = URL.createObjectURL(videoFile);
    });
  }

  /**
   * Convert video frame to base64 for Gemini
   */
  private async frameToBase64(dataUrl: string): Promise<string> {
    return dataUrl.split(',')[1];
  }

  /**
   * Analyze frames using Gemini Vision
   */
  private async analyzeFrames(frames: string[]): Promise<string[]> {
    if (!this.genAI) {
      throw new Error('Gemini not initialized');
    }

    const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const captions: string[] = [];

    for (let i = 0; i < frames.length; i++) {
      try {
        const base64Data = await this.frameToBase64(frames[i]);
        
        const result = await model.generateContent([
          {
            inlineData: {
              data: base64Data,
              mimeType: 'image/jpeg',
            },
          },
          {
            text: 'Describe what you see in this video frame in one sentence. Focus on key visual elements, objects, people, actions, and text if any.',
          },
        ]);

        const response = result.response;
        const caption = response.text();
        captions.push(`Frame ${i + 1}: ${caption}`);
      } catch (error) {
        console.error(`Error analyzing frame ${i + 1}:`, error);
        captions.push(`Frame ${i + 1}: Unable to analyze this frame.`);
      }
    }

    return captions;
  }

  /**
   * Extract audio transcription (simplified - using Web Speech API or text extraction)
   * Note: Full audio transcription requires backend, but we can extract text from frames
   */
  private async extractTextFromFrames(_frames: string[]): Promise<string[]> {
    // This is a placeholder - full OCR would require Tesseract.js or similar
    // For now, we'll rely on Gemini Vision to extract text
    return [];
  }

  /**
   * Generate summary using Gemini
   */
  private async generateSummary(
    visualCaptions: string[],
    audioText: string,
    options: VideoProcessingOptions
  ): Promise<string> {
    if (!this.genAI) {
      throw new Error('Gemini not initialized');
    }

    const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const formatInstructions = {
      paragraph: 'Write a flowing narrative summary in paragraph form.',
      bullet: 'Write the summary as a bulleted list with clear, concise points.',
      timeline: 'Write the summary in chronological order, organized by time segments.',
      chapters: 'Divide the summary into clear chapters or sections with headings.',
      highlights: 'Write only the key highlights and most important moments, be very concise.',
    };

    const stylePrompts = {
      default: 'Write a comprehensive, human-readable summary.',
      professional: 'Write a formal, professional summary suitable for business reports.',
      commercial: 'Write an engaging commercial/advertisement summary highlighting key selling points.',
      educational: 'Write an academic-style summary focusing on learning outcomes.',
      casual: 'Write a casual, conversational summary in everyday language.',
      technical: 'Write a detailed technical summary with specific terminology.',
    };

    const format = formatInstructions[options.summaryFormat as keyof typeof formatInstructions] || formatInstructions.paragraph;
    const style = stylePrompts[options.summaryStyle as keyof typeof stylePrompts] || stylePrompts.default;
    const length = options.summaryLengthWords 
      ? ` The summary must be approximately ${options.summaryLengthWords} words.`
      : '';

    const context = `
VIDEO INFORMATION:

VISUAL CONTENT (Key Scenes):
${visualCaptions.join('\\n')}

${audioText ? `AUDIO TRANSCRIPTION:\\n${audioText}` : 'Note: No audio transcription available. Focus on visual content.'}

INSTRUCTIONS:
${style}
${format}
${length}

Write a comprehensive summary that combines information from the visual content${audioText ? ' and audio' : ''}.
`;

    try {
      const result = await model.generateContent(context);
      const response = result.response;
      return response.text();
    } catch (error) {
      console.error('Error generating summary:', error);
      throw new Error('Failed to generate summary with Gemini');
    }
  }

  /**
   * Process video using Gemini directly
   */
  async processVideo(
    videoFile: File,
    options: VideoProcessingOptions,
    onProgress?: (progress: number, step: string) => void
  ): Promise<ProcessingResult> {
    if (!this.isInitialized()) {
      throw new Error('Gemini API not initialized. Please provide your API key.');
    }

    try {
      // Step 1: Extract frames
      onProgress?.(10, 'Extracting frames from video...');
      const frames = await this.extractFrames(videoFile, options.numFrames || 10);

      // Step 2: Analyze frames
      onProgress?.(30, 'Analyzing visual content...');
      const visualCaptions = await this.analyzeFrames(frames);

      // Step 3: Extract text (placeholder)
      onProgress?.(50, 'Extracting text from frames...');
      const textFromFrames = await this.extractTextFromFrames(frames);

      // Step 4: Generate summary
      onProgress?.(70, 'Generating summary with Gemini...');
      const summary = await this.generateSummary(
        visualCaptions,
        textFromFrames.join(' '),
        options
      );

      onProgress?.(100, 'Complete');

      // Format visual captions
      const formattedCaptions = visualCaptions.map((caption, idx) => ({
        frame: idx + 1,
        caption: caption.replace(`Frame ${idx + 1}: `, ''),
      }));

      // Generate job ID
      const jobId = `gemini_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Create video URL from file
      const videoUrl = URL.createObjectURL(videoFile);

      return {
        jobId,
        summary,
        audio_transcription: textFromFrames.length > 0 ? textFromFrames.join(' ') : 'No audio transcription available.',
        visualCaptions: formattedCaptions,
        status: 'done',
        videoUrl,
        summaryFormat: options.summaryFormat || 'paragraph',
      };
    } catch (error) {
      console.error('Error processing video:', error);
      return {
        jobId: `gemini_error_${Date.now()}`,
        summary: '',
        status: 'failed',
      };
    }
  }
}

export const geminiService = new GeminiService();
