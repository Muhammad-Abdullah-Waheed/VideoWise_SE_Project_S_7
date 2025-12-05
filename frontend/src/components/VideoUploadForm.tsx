import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Link as LinkIcon, Loader2 } from 'lucide-react';
import { apiService } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { geminiService } from '@/services/geminiService';
import toast from 'react-hot-toast';
import { cn } from '@/utils/cn';

interface VideoUploadFormProps {
  onSuccess?: (jobId: string) => void;
}

const SUMMARY_STYLES = [
  { value: 'default', label: 'Default', desc: 'Standard comprehensive summary' },
  { value: 'professional', label: 'Professional', desc: 'Formal, business-oriented' },
  { value: 'commercial', label: 'Commercial', desc: 'Marketing-focused' },
  { value: 'educational', label: 'Educational', desc: 'Academic-style' },
  { value: 'casual', label: 'Casual', desc: 'Relaxed, conversational' },
  { value: 'technical', label: 'Technical', desc: 'Detailed technical summary' },
];

const SUMMARY_FORMATS = [
  { value: 'paragraph', label: 'Paragraph', desc: 'Flowing narrative summary' },
  { value: 'bullet', label: 'Bullet Points', desc: 'Quick scanning format' },
  { value: 'timeline', label: 'Timeline', desc: 'Chronological breakdown' },
  { value: 'chapters', label: 'Chapters', desc: 'Divided into sections' },
  { value: 'highlights', label: 'Key Moments', desc: 'Only important highlights' },
];

const SUMMARY_LENGTH_OPTIONS = [
  { value: null, label: 'Auto', desc: 'Let AI decide optimal length' },
  { value: 100, label: 'Short', desc: '~100 words - Quick overview' },
  { value: 250, label: 'Medium', desc: '~250 words - Balanced summary' },
  { value: 500, label: 'Long', desc: '~500 words - Detailed summary' },
  { value: 'custom', label: 'Custom', desc: 'Specify exact word count' },
];

const VideoUploadForm: React.FC<VideoUploadFormProps> = ({ onSuccess }) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'url'>('upload');
  const [backendAvailable, setBackendAvailable] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState('');
  const [numFrames, setNumFrames] = useState(10);
  const [summaryStyle, setSummaryStyle] = useState('default');
  const [summaryFormat, setSummaryFormat] = useState('paragraph');
  const [summaryLength, setSummaryLength] = useState<string | number | null>(null);
  const [customWordCount, setCustomWordCount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [processingProgress, setProcessingProgress] = useState<number | null>(null);
  const [processingStep, setProcessingStep] = useState<string | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  // Check backend availability on mount (silently, don't show to user)
  useEffect(() => {
    const checkBackend = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/health`, {
          method: 'GET',
          signal: AbortSignal.timeout(3000),
        });
        setBackendAvailable(response.ok);
      } catch (error) {
        // Silently mark backend as unavailable - will use direct processing fallback
        setBackendAvailable(false);
      }
    };
    checkBackend();
  }, []);

  const ensureAIServiceInitialized = async () => {
    // If already initialized, skip
    if (geminiService.isInitialized()) {
      return;
    }

    // Check if we have a working key stored
    const storedKey = localStorage.getItem('ai_api_key');
    if (storedKey) {
      // Test if stored key still works
      const isValid = await geminiService.testApiKey(storedKey);
      if (isValid) {
        geminiService.initialize(storedKey);
        return;
      } else {
        // Stored key is invalid, remove it
        localStorage.removeItem('ai_api_key');
      }
    }

    // Collect all API keys from environment variables (primary + fallbacks)
    const apiKeys: string[] = [];
    
    // Primary key
    const envKey1 = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
    if (envKey1) apiKeys.push(envKey1);
    
    // Fallback key 1
    const envKey2 = import.meta.env.VITE_GEMINI_API_KEY_2 as string | undefined;
    if (envKey2) apiKeys.push(envKey2);
    
    // Fallback key 2
    const envKey3 = import.meta.env.VITE_GEMINI_API_KEY_3 as string | undefined;
    if (envKey3) apiKeys.push(envKey3);

    if (apiKeys.length === 0) {
      throw new Error('No API keys configured. Set VITE_GEMINI_API_KEY (and optionally VITE_GEMINI_API_KEY_2, VITE_GEMINI_API_KEY_3) in your frontend .env file.');
    }

    // Try all keys in order, use the first one that works
    const workingKey = await geminiService.initializeWithFallback(apiKeys);
    
    if (workingKey) {
      // Cache the working key in localStorage
      localStorage.setItem('ai_api_key', workingKey);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.size > 500 * 1024 * 1024) {
        toast.error('File size must be less than 500MB');
        return;
      }
      setFile(selectedFile);
      // Create a local preview URL for the selected video
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl((old) => {
        if (old) {
          URL.revokeObjectURL(old);
        }
        return url;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setProcessingProgress(null);
    setProcessingStep(null);

    try {
      const summaryLengthWords = summaryLength === 'custom' 
        ? (customWordCount ? parseInt(customWordCount) : null)
        : (typeof summaryLength === 'number' ? summaryLength : null);

      const useBackendFirst = backendAvailable;

      const processWithDirect = async (videoFileToProcess?: File) => {
        let fileToProcess = videoFileToProcess || file;
        
        if (!fileToProcess) {
          toast.error('Please select a video file or enter a URL');
          setIsSubmitting(false);
          return;
        }

        try {
          await ensureAIServiceInitialized();
        } catch (err: any) {
          toast.error(err.message || 'API key not configured');
          setIsSubmitting(false);
          return;
        }

        toast.loading('Processing video...', { id: 'direct-processing' });

        const result = await geminiService.processVideo(
          fileToProcess,
          {
            numFrames: numFrames,
            summaryStyle,
            summaryFormat,
            summaryLengthWords: summaryLengthWords || undefined,
            userProfile: user ? {
              id: user.id,
              name: user.name,
              expertise: user.expertise || [],
              summaryPreferences: user.summaryPreferences || {},
            } : null,
          },
          (progress, step) => {
            setProcessingProgress(progress);
            setProcessingStep(step);
            toast.loading(`${step} (${progress}%)`, { id: 'direct-processing' });
          }
        );

        if (result.status === 'failed') {
          toast.error('Failed to process video', { id: 'direct-processing' });
          setIsSubmitting(false);
          return;
        }

        // Store result in localStorage for JobPage to access
        // Include user ID to filter jobs by account
        const directJob = {
          jobId: result.jobId,
          userId: user?.id || 'anonymous', // Store user ID for filtering
          status: 'done',
          progress: 100,
          step: 'Complete',
          result: {
            final_summary: result.summary,
            audio_transcription: result.audio_transcription || '',
            visual_analysis: {
              frame_captions: result.visualCaptions || [],
            },
            video_url: result.videoUrl,
            summary_format: result.summaryFormat,
          },
          processingMode: 'direct',
          createdAt: new Date().toISOString(),
        };

        localStorage.setItem(`direct_job_${result.jobId}`, JSON.stringify(directJob));

        toast.success('Video processed successfully!', { id: 'direct-processing' });
        
        if (onSuccess) {
          onSuccess(result.jobId);
        }
        navigate(`/job/${result.jobId}`);
      };

      // If backend is not available at all, go straight to direct processing
      if (!useBackendFirst) {
        if (activeTab === 'url' && url) {
          // Check if it's a YouTube URL
          if (geminiService.isYouTubeUrl(url)) {
            toast.error('YouTube URLs require the backend server. Please start the backend server or upload the video file directly.', { id: 'direct-processing', duration: 6000 });
            setIsSubmitting(false);
            return;
          }
          
          // Download video from URL first (for direct video URLs only)
          try {
            setProcessingProgress(5);
            setProcessingStep('Downloading video from URL...');
            toast.loading('Downloading video from URL...', { id: 'direct-processing' });
            const downloadedFile = await geminiService.downloadVideoFromUrl(url, (progress, step) => {
              setProcessingProgress(progress);
              setProcessingStep(step);
              toast.loading(`${step} (${progress}%)`, { id: 'direct-processing' });
            });
            await processWithDirect(downloadedFile);
          } catch (error: any) {
            toast.error(error.message || 'Failed to download video from URL', { id: 'direct-processing' });
            setIsSubmitting(false);
          }
        } else {
          await processWithDirect();
        }
        return;
      }

      // Handle Backend API processing first, with automatic fallback to direct processing on network failure
      try {
        const metadata = {
          userProfile: user ? {
            id: user.id,
            name: user.name,
            expertise: user.expertise || [],
            summaryPreferences: user.summaryPreferences || {},
          } : null,
        };

        let jobId: string;

        if (activeTab === 'upload' && file) {
          const response = await apiService.uploadVideo(file, {
            num_frames: numFrames,
            summary_style: summaryStyle,
            summary_format: summaryFormat,
            summary_length_words: summaryLengthWords || undefined,
            metadata,
          });
          jobId = response.jobId;
        } else if (activeTab === 'url' && url) {
          const response = await apiService.summarizeFromUrl(url, {
            num_frames: numFrames,
            summary_style: summaryStyle,
            summary_format: summaryFormat,
            summary_length_words: summaryLengthWords || undefined,
            metadata,
          });
          jobId = response.jobId;
        } else {
          toast.error('Please select a file or enter a URL');
          setIsSubmitting(false);
          return;
        }

        toast.success('Video processing started!');
        if (onSuccess) {
          onSuccess(jobId);
        }
        navigate(`/job/${jobId}`);
      } catch (error: any) {
        // Backend not available, automatically fall back to direct processing (silently)
        if (error.code === 'ERR_NETWORK' || error.message?.includes('Network') || error.response?.status === undefined) {
          if (activeTab === 'url' && url) {
            // Check if it's a YouTube URL
            if (geminiService.isYouTubeUrl(url)) {
              toast.error('YouTube URLs require the backend server. Please start the backend server or upload the video file directly.', { id: 'direct-processing', duration: 6000 });
              setIsSubmitting(false);
              return;
            }
            
            // Download video from URL first (for direct video URLs only)
            try {
              setProcessingProgress(5);
              setProcessingStep('Downloading video from URL...');
              toast.loading('Downloading video from URL...', { id: 'direct-processing' });
              const downloadedFile = await geminiService.downloadVideoFromUrl(url, (progress, step) => {
                setProcessingProgress(progress);
                setProcessingStep(step);
                toast.loading(`${step} (${progress}%)`, { id: 'direct-processing' });
              });
              await processWithDirect(downloadedFile);
            } catch (downloadError: any) {
              toast.error(downloadError.message || 'Failed to download video from URL', { id: 'direct-processing' });
              setIsSubmitting(false);
            }
          } else {
            await processWithDirect();
          }
          return;
        } else {
          throw error;
        }
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || error.message || 'Failed to process video');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      {/* Tab Selection */}
      <div className="flex space-x-2 border-b border-gray-200 dark:border-gray-700">
        <button
          type="button"
          onClick={() => setActiveTab('upload')}
          className={cn(
            'px-4 py-2 font-medium transition-colors',
            activeTab === 'upload'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-gray-500 hover:text-gray-700'
          )}
        >
          <Upload className="inline h-4 w-4 mr-2" />
          Upload Video
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('url')}
          className={cn(
            'px-4 py-2 font-medium transition-colors',
            activeTab === 'url'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-gray-500 hover:text-gray-700'
          )}
        >
          <LinkIcon className="inline h-4 w-4 mr-2" />
          From URL
        </button>
      </div>

      {/* Upload/URL Input */}
      {activeTab === 'upload' ? (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Video File
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-xl hover:border-primary-400 transition-colors">
              <div className="space-y-1 text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <div className="flex text-sm text-gray-600">
                  <label className="relative cursor-pointer rounded-md font-medium text-primary-600 hover:text-primary-500">
                    <span>Upload a file</span>
                    <input
                      type="file"
                      className="sr-only"
                      accept="video/*"
                      onChange={handleFileChange}
                    />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-gray-500">MP4, AVI, MOV up to 500MB</p>
                {file && (
                  <p className="text-sm text-gray-900 mt-2">{file.name}</p>
                )}
              </div>
            </div>
          </div>

          {/* Video Preview */}
          {previewUrl && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Video Preview
              </label>
              <video
                src={previewUrl}
                controls
                className="w-full max-h-80 rounded-xl border border-gray-200 dark:border-gray-700"
              />
              <p className="text-xs text-gray-500 mt-1">
                You can review the video here before starting the summarization.
              </p>
            </div>
          )}
        </div>
      ) : (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Video URL
          </label>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://youtube.com/watch?v=... or direct video URL"
            className="input-field"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            Supports YouTube URLs (requires backend) or direct video links (MP4, etc.)
          </p>
        </div>
      )}

      {/* Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Number of Frames */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Number of Frames
          </label>
          <input
            type="number"
            min="5"
            max="20"
            value={numFrames}
            onChange={(e) => setNumFrames(parseInt(e.target.value))}
            className="input-field"
          />
          <p className="text-xs text-gray-500 mt-1">More frames = better analysis but slower</p>
        </div>

        {/* Summary Style */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Summary Style
          </label>
          <select
            value={summaryStyle}
            onChange={(e) => setSummaryStyle(e.target.value)}
            className="input-field"
          >
            {SUMMARY_STYLES.map((style) => (
              <option key={style.value} value={style.value}>
                {style.label} - {style.desc}
              </option>
            ))}
          </select>
        </div>

        {/* Summary Format */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Summary Format
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {SUMMARY_FORMATS.map((format) => (
              <button
                key={format.value}
                type="button"
                onClick={() => setSummaryFormat(format.value)}
                className={cn(
                  'p-3 rounded-xl border-2 transition-all text-left',
                  summaryFormat === format.value
                    ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                )}
              >
                <div className="font-medium text-sm">{format.label}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{format.desc}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Processing progress */}
      {processingProgress !== null && (
        <div className="p-4 rounded-lg bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-gray-800 dark:text-gray-100">
              {processingStep || 'Processing video...'}
            </span>
            <span className="text-gray-700 dark:text-gray-200">
              {processingProgress}%
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
            <div
              className="h-2 rounded-full bg-primary-500 transition-all"
              style={{ width: `${Math.min(100, Math.max(0, processingProgress))}%` }}
            />
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Processing your video...
          </p>
        </div>
      )}

      {/* Summary Length Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Summary Length (Word Count)
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {SUMMARY_LENGTH_OPTIONS.map((option) => (
            <button
              key={option.value || 'auto'}
              type="button"
              onClick={() => {
                setSummaryLength(option.value as string | number | null);
                if (option.value !== 'custom') setCustomWordCount('');
              }}
              className={cn(
                'p-3 rounded-xl border-2 transition-all text-left',
                summaryLength === option.value
                  ? 'border-primary-600 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'
              )}
            >
              <div className="font-medium text-sm">{option.label}</div>
              <div className="text-xs text-gray-500 mt-1">{option.desc}</div>
            </button>
          ))}
        </div>

        {/* Custom Word Count Input */}
        {summaryLength === 'custom' && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Custom Word Count
            </label>
            <input
              type="number"
              min="50"
              max="2000"
              value={customWordCount}
              onChange={(e) => setCustomWordCount(e.target.value)}
              placeholder="Enter word count (50-2000)"
              className="input-field"
            />
          </div>
        )}
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting || (activeTab === 'upload' && !file) || (activeTab === 'url' && !url)}
        className="btn-primary w-full flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Starting...</span>
          </>
        ) : (
          <span>Start Summarization</span>
        )}
      </button>
    </form>
  );
};

export default VideoUploadForm;

