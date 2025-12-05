/**
 * Gemini Direct Service - Client-side video processing using Gemini API
 * This allows users to process videos directly in the browser without backend
 */

import {
  GoogleGenAI,
  createUserContent,
  createPartFromUri,
} from "@google/genai";

export interface GeminiConfig {
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

class GeminiService {
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
   * Process video using Gemini File API (matching the new SDK pattern)
   * Uploads video file, waits for processing, then generates summary with all user options
   */
  async processVideo(
    videoFile: File,
    options: VideoProcessingOptions,
    onProgress?: (progress: number, step: string) => void
  ): Promise<ProcessingResult> {
    if (!this.isInitialized()) {
      throw new Error('Gemini API not initialized. Please provide your API key.');
    }

    if (!this.ai) {
      throw new Error('Gemini not initialized');
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

      onProgress?.(70, 'Generating summary with Gemini...');

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
      const jobId = `gemini_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
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
        jobId: `gemini_error_${Date.now()}`,
        summary: '',
        status: 'failed',
      };
    }
  }

  /**
   * Extract YouTube video ID from URL
   */
  private extractYouTubeVideoId(url: string): string | null {
    const patterns = [
      /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i,
      /youtube\.com\/watch\?v=([^"&?\/\s]{11})/i,
      /youtu\.be\/([^"&?\/\s]{11})/i,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
    return null;
  }


  /**
   * Download video from URL (YouTube, direct URLs, etc.)
   * Works even when backend is down by using public APIs for YouTube
   */
  async downloadVideoFromUrl(
    url: string,
    onProgress?: (progress: number, step: string) => void
  ): Promise<File> {
    // Check if it's a YouTube URL
    const videoId = this.extractYouTubeVideoId(url);
    
    if (videoId) {
      // YouTube video - use API service to get download URL
      try {
        onProgress?.(10, 'Processing YouTube URL...');
        
        // Try multiple YouTube download API services
        let downloadUrl: string | null = null;
        let lastError: string | null = null;
        
        // Method 1: Try vevioz API (convert endpoint)
        try {
          onProgress?.(15, 'Connecting to video service (method 1)...');
          const response = await fetch(`https://api.vevioz.com/api/convert/mp4/${videoId}`, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
            },
          });
          
          if (response.ok) {
            const data = await response.json();
            if (data.url || data.downloadUrl) {
              downloadUrl = data.url || data.downloadUrl;
              onProgress?.(25, 'Found video download URL');
            }
          }
        } catch (e: any) {
          lastError = e.message || 'Method 1 failed';
        }
        
        // Method 2: Try vevioz API (formats endpoint)
        if (!downloadUrl) {
          try {
            onProgress?.(20, 'Trying alternative service (method 2)...');
            const response = await fetch(`https://api.vevioz.com/api/formats/${videoId}`, {
              method: 'GET',
              headers: {
                'Accept': 'application/json',
              },
            });
            
            if (response.ok) {
              const data = await response.json();
              if (data.formats && Array.isArray(data.formats)) {
                // Find best quality MP4 format with both video and audio
                const mp4Format = data.formats.find((f: any) => 
                  f.ext === 'mp4' && f.vcodec !== 'none' && f.acodec !== 'none'
                ) || data.formats.find((f: any) => f.ext === 'mp4' && f.vcodec !== 'none');
                
                if (mp4Format && mp4Format.url) {
                  downloadUrl = mp4Format.url;
                  onProgress?.(25, 'Found video download URL');
                }
              }
            }
          } catch (e: any) {
            lastError = e.message || 'Method 2 failed';
          }
        }
        
        if (!downloadUrl) {
          throw new Error(
            `Unable to download YouTube video. ${lastError || 'All download services are unavailable'}. ` +
            `Please try one of these alternatives:\n` +
            `1. Ensure your backend server is running (YouTube downloads work better with backend)\n` +
            `2. Download the video manually and upload the file directly\n` +
            `3. Try a different YouTube video`
          );
        }
        
        onProgress?.(30, 'Downloading YouTube video...');
        
        // Download the video using the obtained URL
        return await this.downloadDirectVideoUrl(downloadUrl, onProgress, `youtube_${videoId}.mp4`);
      } catch (error: any) {
        // Provide helpful error message
        throw new Error(error.message || 'Failed to download YouTube video');
      }
    }

    // For direct video URLs (mp4, etc.), download directly
    return await this.downloadDirectVideoUrl(url, onProgress);
  }

  /**
   * Download video from a direct URL (mp4, etc.)
   */
  private async downloadDirectVideoUrl(
    url: string,
    onProgress?: (progress: number, step: string) => void,
    filename?: string
  ): Promise<File> {
    try {
      onProgress?.(onProgress ? 50 : 10, 'Fetching video from URL...');
      
      const response = await fetch(url, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error(`Failed to download video: ${response.statusText}`);
      }

      const contentLength = response.headers.get('content-length');
      const total = contentLength ? parseInt(contentLength, 10) : 0;

      const startProgress = onProgress ? 50 : 30;
      onProgress?.(startProgress, 'Downloading video...');

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Response body is not readable');
      }

      const chunks: Uint8Array[] = [];
      let receivedLength = 0;

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        chunks.push(value);
        receivedLength += value.length;
        
        if (total > 0) {
          const progress = startProgress + Math.floor((receivedLength / total) * (100 - startProgress - 10));
          onProgress?.(progress, `Downloading video... ${Math.floor((receivedLength / total) * 100)}%`);
        } else {
          // If we don't know total size, estimate progress
          const estimatedProgress = startProgress + Math.min(40, Math.floor(receivedLength / 1000000) * 5);
          onProgress?.(estimatedProgress, `Downloading video... (${Math.floor(receivedLength / 1024 / 1024)}MB)`);
        }
      }

      onProgress?.(90, 'Preparing video file...');

      // Combine chunks into a single Uint8Array
      const allChunks = new Uint8Array(receivedLength);
      let position = 0;
      for (const chunk of chunks) {
        allChunks.set(chunk, position);
        position += chunk.length;
      }

      // Create File object from blob
      const blob = new Blob([allChunks], { type: 'video/mp4' });
      
      // Extract filename from URL or use provided/default
      let finalFilename = filename;
      if (!finalFilename) {
        const urlParts = url.split('/');
        finalFilename = urlParts[urlParts.length - 1].split('?')[0] || 'video.mp4';
        // Ensure .mp4 extension
        if (!finalFilename.endsWith('.mp4') && !finalFilename.endsWith('.webm') && !finalFilename.endsWith('.mov')) {
          finalFilename = 'video.mp4';
        }
      }
      
      const file = new File([blob], finalFilename, { type: 'video/mp4' });

      onProgress?.(100, 'Download complete');

      return file;
    } catch (error: any) {
      throw new Error(`Failed to download video from URL: ${error.message}`);
    }
  }

  /**
   * Test if an API key is valid
   */
  async testApiKey(apiKey: string): Promise<boolean> {
    try {
      const testAi = new GoogleGenAI({ apiKey });
      // Try a simple operation to test the key
      await testAi.models.list();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Initialize with fallback keys - tries multiple keys and uses the first working one
   */
  async initializeWithFallback(apiKeys: string[]): Promise<string | null> {
    for (const key of apiKeys) {
      try {
        const isValid = await this.testApiKey(key);
        if (isValid) {
          this.initialize(key);
          return key;
        }
      } catch {
        // Try next key
        continue;
      }
    }
    return null;
  }
}

export const geminiService = new GeminiService();
