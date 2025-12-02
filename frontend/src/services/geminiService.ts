/**
 * AI Direct Service - Client-side video processing using AI API
 * This allows users to process videos directly in the browser without backend
 */

import {
  GoogleGenAI,
  createUserContent,
  createPartFromUri,
} from "@google/genai";

export interface AIConfig {
  apiKey: string;
}

export interface UserProfile {
  id?: string;
  name?: string;
  expertise?: string[];
  summaryPreferences?: {
    length?: string;
    focus?: string[];
  };
}

export interface VideoProcessingOptions {
  numFrames?: number;
  summaryStyle?: string;
  summaryFormat?: string;
  summaryLengthWords?: number;
  userProfile?: UserProfile | null;
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

class AIService {
  private ai: GoogleGenAI | null = null;
  private apiKey: string | null = null;

  initialize(apiKey: string) {
    this.apiKey = apiKey;
    this.ai = new GoogleGenAI({ apiKey });
  }

  isInitialized(): boolean {
    return this.ai !== null && this.apiKey !== null;
  }

  /**
   * Download video from URL and convert to File object
   */
  async downloadVideoFromUrl(url: string, onProgress?: (progress: number, step: string) => void): Promise<File> {
    try {
      onProgress?.(5, 'Downloading video from URL...');
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to download video: ${response.statusText}`);
      }

      const contentLength = response.headers.get('content-length');
      const total = contentLength ? parseInt(contentLength, 10) : 0;
      
      const reader = response.body?.getReader();
      const chunks: Uint8Array[] = [];
      let receivedLength = 0;

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          chunks.push(value);
          receivedLength += value.length;
          
          if (total > 0) {
            const progress = Math.round((receivedLength / total) * 90) + 5; // 5-95%
            onProgress?.(progress, `Downloading video... ${Math.round((receivedLength / total) * 100)}%`);
          }
        }
      }

      // Combine all chunks into a single Uint8Array
      const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
      const combined = new Uint8Array(totalLength);
      let offset = 0;
      for (const chunk of chunks) {
        combined.set(chunk, offset);
        offset += chunk.length;
      }
      
      const blob = new Blob([combined]);
      const fileName = url.split('/').pop()?.split('?')[0] || 'video.mp4';
      const mimeType = blob.type || 'video/mp4';
      
      onProgress?.(95, 'Video downloaded');
      return new File([blob], fileName, { type: mimeType });
    } catch (error: any) {
      throw new Error(`Failed to download video from URL: ${error.message}`);
    }
  }

  /**
   * Build summary prompt with all user options (style, format, length, personality)
   */
  private buildSummaryPrompt(options: VideoProcessingOptions): string {
    // Length instruction
    const lengthInstruction = options.summaryLengthWords
      ? ` The summary must be approximately ${options.summaryLengthWords} words.`
      : '';

    // Format instructions
    const formatInstructions = {
      paragraph: 'Write a flowing narrative summary in paragraph form.',
      bullet: 'Write the summary as a bulleted list with clear, concise points.',
      timeline: 'Write the summary in chronological order, organized by time segments.',
      chapters: 'Divide the summary into clear chapters or sections with headings.',
      highlights: 'Write only the key highlights and most important moments, be very concise.',
    };
    const formatInstruction = formatInstructions[options.summaryFormat as keyof typeof formatInstructions] || formatInstructions.paragraph;

    // User profile context
    let profileContext = '';
    if (options.userProfile) {
      profileContext = '\n\nUSER PROFILE:\n';
      if (options.userProfile.expertise && options.userProfile.expertise.length > 0) {
        profileContext += `User Expertise: ${options.userProfile.expertise.join(', ')}\n`;
      }
      if (options.userProfile.summaryPreferences) {
        const prefs = options.userProfile.summaryPreferences;
        profileContext += `User Preferences: Length=${prefs.length || 'medium'}, Focus=${prefs.focus?.join(', ') || 'general'}\n`;
      }
      profileContext += "Please tailor the summary to match the user's expertise and preferences.\n";
    }

    // Style-specific prompts
    const stylePrompts = {
      default: `You are an expert video summarizer. Watch this video and provide a comprehensive, human-readable summary.${lengthInstruction}

${formatInstruction}

The summary should:
1. Be written like a professional article or essay summary
2. Flow naturally and be easy to read
3. Highlight the main topics, themes, and key information
4. Be informative and engaging
5. Write in complete sentences with proper grammar${profileContext}`,

      professional: `You are a professional business analyst. Watch this video and write a formal, professional summary suitable for business reports or presentations.${lengthInstruction}

${formatInstruction}

The summary should:
1. Use formal, professional language
2. Focus on key business insights, objectives, and outcomes
3. Be concise and structured
4. Highlight actionable items or important decisions
5. Maintain a professional tone throughout
6. Be suitable for executive summaries or meeting notes${profileContext}`,

      commercial: `You are a marketing copywriter. Watch this video and write an engaging commercial/advertisement summary that highlights key selling points.${lengthInstruction}

${formatInstruction}

The summary should:
1. Be persuasive and engaging
2. Highlight benefits, features, and value propositions
3. Use compelling language that captures attention
4. Focus on what makes the content/product/service appealing
5. Include call-to-action elements if appropriate
6. Be suitable for marketing materials or promotional content${profileContext}`,

      educational: `You are an educational content specialist. Watch this video and write an academic-style summary focusing on learning outcomes.${lengthInstruction}

${formatInstruction}

The summary should:
1. Focus on key concepts, learning objectives, and educational value
2. Use clear, instructional language
3. Highlight important facts, theories, or information presented
4. Be suitable for study notes or educational materials
5. Organize information logically for learning purposes
6. Emphasize what viewers can learn from the content${profileContext}`,

      casual: `You are a friendly content creator. Watch this video and write a casual, conversational summary in everyday language.${lengthInstruction}

${formatInstruction}

The summary should:
1. Use relaxed, conversational tone
2. Be easy to read and understand
3. Feel like a friend explaining the video to you
4. Use natural, everyday language
5. Be engaging and relatable
6. Avoid overly formal or technical terms${profileContext}`,

      technical: `You are a technical documentation specialist. Watch this video and write a detailed technical summary with specific terminology.${lengthInstruction}

${formatInstruction}

The summary should:
1. Use precise technical language and terminology
2. Include specific details, specifications, and technical information
3. Be comprehensive and detailed
4. Focus on technical aspects, processes, and methodologies
5. Be suitable for technical documentation or engineering notes
6. Maintain accuracy and precision${profileContext}`,
    };

    return stylePrompts[options.summaryStyle as keyof typeof stylePrompts] || stylePrompts.default;
  }

  /**
   * Process video using AI File API (matching the new SDK pattern)
   * Uploads video file, waits for processing, then generates summary with all user options
   */
  async processVideo(
    videoFile: File,
    options: VideoProcessingOptions,
    onProgress?: (progress: number, step: string) => void
  ): Promise<ProcessingResult> {
    if (!this.isInitialized()) {
      throw new Error('AI API not initialized. Please provide your API key.');
    }

    if (!this.ai) {
      throw new Error('AI service not initialized');
    }

    let uploadedFile: any = null;

    try {
      // Step 1: Upload the video to the File API
      onProgress?.(10, `Uploading ${videoFile.name}...`);

      uploadedFile = await this.ai.files.upload({
        file: videoFile,
        config: { mimeType: videoFile.type || 'video/mp4' },
      });

      onProgress?.(20, `Completed upload: ${uploadedFile.uri}`);

      // Step 2: Wait for the video to process
      // Videos need time to be analyzed by Google's servers before you can prompt them
      onProgress?.(30, 'Waiting for video processing...');
      
      let fileState = uploadedFile.state;
      let checkCount = 0;
      const maxChecks = 60; // Max 2 minutes wait

      while (fileState === 'PROCESSING' && checkCount < maxChecks) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        try {
          const fileInfo = await this.ai.files.get({ name: uploadedFile.name });
          fileState = fileInfo.state;
          const progress = 30 + Math.min(30, (checkCount / maxChecks) * 30);
          onProgress?.(progress, 'Processing video...');
        } catch (error) {
          console.warn('Error checking file status:', error);
        }
        
        checkCount++;
      }

      if (fileState === 'FAILED') {
        throw new Error(`Video processing failed: ${fileState}`);
      }

      if (checkCount >= maxChecks) {
        throw new Error('Video processing timed out. Please try again.');
      }

      onProgress?.(60, 'Video is ready. Generating summary...');

      // Step 3: Build prompt with ALL user options (style, format, length, personality)
      const prompt = this.buildSummaryPrompt({
        ...options,
        summaryStyle: options.summaryStyle || 'default',
        summaryFormat: options.summaryFormat || 'paragraph',
        summaryLengthWords: options.summaryLengthWords,
        userProfile: options.userProfile,
      });

      onProgress?.(70, 'Generating summary...');

      // Step 4: Generate Content (matching the new SDK pattern)
      const response = await this.ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: createUserContent([
          createPartFromUri(uploadedFile.uri, uploadedFile.mimeType),
          prompt,
        ]),
      });

      // Step 5: Get Result
      let summary = response.text || '';

      // Trim to approximate word count if specified
      if (options.summaryLengthWords && summary) {
        const words = summary.split(/\s+/);
        if (words.length > options.summaryLengthWords) {
          const trimmed = words.slice(0, options.summaryLengthWords).join(' ');
          const lastPeriod = trimmed.lastIndexOf('.');
          const lastExclamation = trimmed.lastIndexOf('!');
          const lastQuestion = trimmed.lastIndexOf('?');
          const lastSentenceEnd = Math.max(lastPeriod, lastExclamation, lastQuestion);
          
          if (lastSentenceEnd > options.summaryLengthWords * 0.7) {
            summary = trimmed.substring(0, lastSentenceEnd + 1);
          } else {
            summary = trimmed + '...';
          }
        }
      }

      onProgress?.(100, 'Complete');

      // Optional: Delete the file from the cloud to clean up
      try {
        await this.ai.files.delete({ name: uploadedFile.name });
      } catch (error) {
        // Ignore cleanup errors
        console.warn('Could not delete uploaded file:', error);
      }

      // Generate job ID
      const jobId = `direct_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Create video URL from file
      const videoUrl = URL.createObjectURL(videoFile);

      return {
        jobId,
        summary,
        audio_transcription: '', // Don't include transcription in output - user only sees summary
        visualCaptions: [], // Don't include visual captions in output - user only sees summary
        status: 'done',
        videoUrl,
        summaryFormat: options.summaryFormat || 'paragraph',
      };
    } catch (error: any) {
      console.error('Error processing video:', error);
      
      // Clean up uploaded file on error
      if (uploadedFile?.name) {
        try {
          await this.ai?.files.delete({ name: uploadedFile.name });
        } catch (cleanupError) {
          // Ignore cleanup errors
        }
      }

      return {
        jobId: `direct_error_${Date.now()}`,
        summary: '',
        status: 'failed',
      };
    }
  }
}

export const geminiService = new AIService();
