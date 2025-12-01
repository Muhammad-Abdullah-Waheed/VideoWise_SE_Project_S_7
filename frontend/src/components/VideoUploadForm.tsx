import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Link as LinkIcon, Loader2, Server, Sparkles } from 'lucide-react';
import { apiService } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { useGemini } from '@/contexts/GeminiContext';
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
  const [processingMode, setProcessingMode] = useState<'backend' | 'gemini'>(() => {
    // Check if backend is available, default to backend
    const useBackend = localStorage.getItem('use_backend') !== 'false';
    return useBackend ? 'backend' : 'gemini';
  });
  const [backendAvailable, setBackendAvailable] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState('');
  const [numFrames, setNumFrames] = useState(10);
  const [summaryStyle, setSummaryStyle] = useState('default');
  const [summaryFormat, setSummaryFormat] = useState('paragraph');
  const [summaryLength, setSummaryLength] = useState<string | number | null>(null);
  const [customWordCount, setCustomWordCount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [geminiApiKeyInput, setGeminiApiKeyInput] = useState('');
  const { user } = useAuth();
  const { apiKey: geminiApiKey, setApiKey: setGeminiApiKey, isConfigured: isGeminiConfigured } = useGemini();
  const navigate = useNavigate();

  // Check backend availability on mount
  useEffect(() => {
    const checkBackend = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/health`, {
          method: 'GET',
          signal: AbortSignal.timeout(3000),
        });
        setBackendAvailable(response.ok);
        if (!response.ok) {
          setProcessingMode('gemini');
          localStorage.setItem('use_backend', 'false');
        }
      } catch (error) {
        setBackendAvailable(false);
        setProcessingMode('gemini');
        localStorage.setItem('use_backend', 'false');
      }
    };
    checkBackend();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.size > 500 * 1024 * 1024) {
        toast.error('File size must be less than 500MB');
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const summaryLengthWords = summaryLength === 'custom' 
        ? (customWordCount ? parseInt(customWordCount) : null)
        : (typeof summaryLength === 'number' ? summaryLength : null);

      // Handle Gemini Direct processing
      if (processingMode === 'gemini') {
        if (!isGeminiConfigured && !geminiApiKeyInput) {
          toast.error('Please provide Gemini API key');
          setIsSubmitting(false);
          return;
        }

        // Initialize Gemini if not already done
        const apiKeyToUse = geminiApiKey || geminiApiKeyInput;
        if (!geminiService.isInitialized()) {
          geminiService.initialize(apiKeyToUse);
          if (geminiApiKeyInput) {
            setGeminiApiKey(geminiApiKeyInput);
          }
        }

        if (activeTab === 'upload' && file) {
          toast.loading('Processing video with Gemini...', { id: 'gemini-processing' });
          
          // Process with progress updates
          const result = await geminiService.processVideo(
            file,
            {
              numFrames: numFrames,
              summaryStyle,
              summaryFormat,
              summaryLengthWords: summaryLengthWords || undefined,
            },
            (progress, step) => {
              toast.loading(`${step} (${progress}%)`, { id: 'gemini-processing' });
            }
          );

          if (result.status === 'failed') {
            toast.error('Failed to process video with Gemini', { id: 'gemini-processing' });
            setIsSubmitting(false);
            return;
          }

          // Store result in localStorage for JobPage to access
          const geminiJob = {
            jobId: result.jobId,
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
            processingMode: 'gemini',
            createdAt: new Date().toISOString(),
          };

          localStorage.setItem(`gemini_job_${result.jobId}`, JSON.stringify(geminiJob));

          toast.success('Video processed successfully!', { id: 'gemini-processing' });
          
          // Navigate to results page
          if (onSuccess) {
            onSuccess(result.jobId);
          }
          navigate(`/job/${result.jobId}`);
        } else {
          toast.error('Gemini mode only supports file upload, not URLs');
          setIsSubmitting(false);
          return;
        }
        return;
      }

      // Handle Backend API processing
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
        // Backend not available, suggest using Gemini mode
        if (error.code === 'ERR_NETWORK' || error.message?.includes('Network') || error.response?.status === undefined) {
          toast.error('Backend not available. Please use Gemini Direct mode.', {
            duration: 5000,
          });
          setProcessingMode('gemini');
          setIsSubmitting(false);
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
      {/* Processing Mode Selection */}
      <div className="card bg-gradient-to-r from-primary-50 to-blue-50 dark:from-primary-900/20 dark:to-blue-900/20">
        <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
          Processing Mode
        </label>
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setProcessingMode('backend')}
            className={cn(
              'p-4 rounded-xl border-2 transition-all text-left',
              processingMode === 'backend'
                ? 'border-primary-600 bg-primary-100 dark:bg-primary-900/30'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800'
            )}
          >
            <div className="flex items-center space-x-2 mb-2">
              <Server className="h-5 w-5 text-primary-600" />
              <span className="font-semibold text-gray-900 dark:text-gray-100">Backend API</span>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Process on server with full ML models (BLIP, Whisper, OCR)
            </p>
            {!backendAvailable && (
              <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                ⚠️ Backend not available
              </p>
            )}
            {backendAvailable && (
              <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                ✓ Backend connected
              </p>
            )}
          </button>
          <button
            type="button"
            onClick={() => setProcessingMode('gemini')}
            className={cn(
              'p-4 rounded-xl border-2 transition-all text-left',
              processingMode === 'gemini'
                ? 'border-primary-600 bg-primary-100 dark:bg-primary-900/30'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800'
            )}
          >
            <div className="flex items-center space-x-2 mb-2">
              <Sparkles className="h-5 w-5 text-primary-600" />
              <span className="font-semibold text-gray-900 dark:text-gray-100">Gemini Direct</span>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Process directly with Gemini (free tier, client-side)
            </p>
            <p className="text-xs text-green-600 dark:text-green-400 mt-1">
              No backend required - works offline
            </p>
          </button>
        </div>

        {/* Gemini API Key Input */}
        {processingMode === 'gemini' && (
          <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
              Gemini API Key {isGeminiConfigured && <span className="text-green-600">✓ Configured</span>}
            </label>
            {!isGeminiConfigured ? (
              <>
                <input
                  type="password"
                  value={geminiApiKeyInput}
                  onChange={(e) => setGeminiApiKeyInput(e.target.value)}
                  placeholder="Enter your Gemini API key"
                  className="input-field mb-2"
                />
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Get your free API key from{' '}
                  <a
                    href="https://makersuite.google.com/app/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-600 hover:underline"
                  >
                    Google AI Studio
                  </a>
                  . Key is stored locally in your browser.
                </p>
                {geminiApiKeyInput && (
                  <button
                    type="button"
                    onClick={() => {
                      setGeminiApiKey(geminiApiKeyInput);
                      toast.success('Gemini API key saved!');
                    }}
                    className="mt-2 btn-secondary text-sm"
                  >
                    Save API Key
                  </button>
                )}
              </>
            ) : (
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  API key is configured and saved
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setGeminiApiKey('');
                    setGeminiApiKeyInput('');
                    toast.success('API key cleared');
                  }}
                  className="text-sm text-red-600 hover:text-red-700"
                >
                  Clear
                </button>
              </div>
            )}
          </div>
        )}
      </div>

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
      ) : (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Video URL
          </label>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://youtube.com/watch?v=..."
            className="input-field"
            required
          />
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
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
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

      {/* Summary Length Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Summary Length (Word Count)
        </label>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
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

