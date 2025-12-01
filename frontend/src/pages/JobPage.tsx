import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Loader2, XCircle, Sparkles } from 'lucide-react';
import { apiService, JobStatus, JobResult } from '@/services/api';
import VideoPlayer from '@/components/VideoPlayer';
import SummaryFormatViewer from '@/components/SummaryFormatViewer';
import ExportMenu from '@/components/ExportMenu';
import { ExportData } from '@/utils/export';
import { format } from 'date-fns';

const JobPage = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const [pollingInterval, setPollingInterval] = useState(2000);
  const [summaryFormat, setSummaryFormat] = useState<'paragraph' | 'bullet' | 'timeline' | 'chapters' | 'highlights'>('paragraph');
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [seekTo, setSeekTo] = useState<number | undefined>(undefined);

  // Check if this is a Gemini job (stored in localStorage)
  const isGeminiJob = jobId?.startsWith('gemini_');
  
  // For Gemini jobs, get data from localStorage
  const geminiJobData = isGeminiJob && jobId 
    ? JSON.parse(localStorage.getItem(`gemini_job_${jobId}`) || 'null')
    : null;

  const { data: status, isLoading: statusLoading } = useQuery<JobStatus>({
    queryKey: ['job-status', jobId],
    queryFn: () => {
      if (isGeminiJob && geminiJobData) {
        // Return Gemini job status from localStorage
        return {
          jobId: geminiJobData.jobId,
          status: geminiJobData.status,
          progress: geminiJobData.progress,
          step: geminiJobData.step,
          etaSeconds: 0,
          createdAt: geminiJobData.createdAt,
        };
      }
      return apiService.getJobStatus(jobId!);
    },
    enabled: !!jobId,
    refetchInterval: (query) => {
      const data = query.state.data;
      if (isGeminiJob) return false; // Don't poll for Gemini jobs
      if (data?.status === 'done' || data?.status === 'failed') {
        return false;
      }
      return pollingInterval;
    },
  });

  const { data: result } = useQuery<JobResult>({
    queryKey: ['job-result', jobId],
    queryFn: () => {
      if (isGeminiJob && geminiJobData) {
        // Return Gemini job result from localStorage
        const geminiResult = geminiJobData.result;
        return {
          jobId: geminiJobData.jobId,
          summary: geminiResult.final_summary || '',
          audio_transcription: geminiResult.audio_transcription || '',
          visualCaptions: geminiResult.visual_analysis?.frame_captions || [],
          transcript: geminiResult.audio_transcription || '',
          highlights: [],
          videoUrl: geminiResult.video_url,
          summaryFormat: geminiResult.summary_format || 'paragraph',
        };
      }
      return apiService.getJobResult(jobId!);
    },
    enabled: (isGeminiJob && !!geminiJobData) || status?.status === 'done',
  });

  useEffect(() => {
    if (status?.status === 'processing') {
      setPollingInterval(2000);
    } else if (status?.status === 'queued') {
      setPollingInterval(3000);
    }
  }, [status?.status]);

  if (statusLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        </div>
      </div>
    );
  }

  if (!status) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="card text-center">
          <p className="text-gray-500">Job not found</p>
          <Link to="/dashboard" className="text-primary-600 hover:text-primary-700 mt-4 inline-block">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // Get video URL from job metadata or result
  useEffect(() => {
    if (result) {
      // Handle Gemini jobs (blob URL) or backend jobs (server URL)
      if ('videoUrl' in result && (result as any).videoUrl) {
        const url = (result as any).videoUrl;
        // If it's a relative URL, make it absolute (backend job)
        if (url.startsWith('/')) {
          const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
          setVideoUrl(`${apiBase}${url}`);
        } else if (url.startsWith('blob:')) {
          // Gemini job - blob URL
          setVideoUrl(url);
        } else {
          setVideoUrl(url);
        }
      }
      // Also check if we can get format from result
      if ('summaryFormat' in result) {
        setSummaryFormat((result as any).summaryFormat || 'paragraph');
      }
    }
  }, [result]);

  // Prepare export data
  const exportData: ExportData = {
    title: `Video Summary - ${jobId?.slice(0, 8)}`,
    summary: result?.summary || '',
    transcript: result?.audio_transcription,
    metadata: {
      createdAt: status ? format(new Date(status.createdAt || Date.now()), 'PPpp') : undefined,
      style: (status as any)?.summaryStyle || 'default',
    }
  };

  // Extract timestamps from summary (simplified - would be better with actual timestamps from backend)
  const extractTimestamps = () => {
    if (!result?.summary) return [];
    // This is a simplified version - ideally timestamps would come from backend
    const sentences = result.summary.split(/[.!?]+/).filter(s => s.trim().length > 0);
    return sentences.map((s, idx) => ({
      time: idx * 10, // Approximate - should come from backend
      text: s.trim()
    }));
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link
        to="/dashboard"
        className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back to Dashboard</span>
      </Link>

      <div className="card mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900">Job Status</h1>
          {status.status === 'done' && result && (
            <ExportMenu data={exportData} />
          )}
        </div>

        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Status</span>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                status.status === 'done' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400' :
                status.status === 'failed' ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400' :
                'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400'
              }`}>
                {status.status}
              </span>
            </div>
            {status.status === 'processing' && (
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                <div
                  className="bg-primary-600 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${status.progress}%` }}
                />
              </div>
            )}
          </div>

          <div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Current Step</span>
            <p className="text-gray-900 dark:text-gray-100">{status.step}</p>
          </div>

          {status.status === 'processing' && status.etaSeconds > 0 && (
            <div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Estimated Time</span>
              <p className="text-gray-900 dark:text-gray-100">{Math.ceil(status.etaSeconds / 60)} minutes remaining</p>
            </div>
          )}
        </div>
      </div>

      {status.status === 'done' && result && (
        <div className="space-y-6">
          {/* Mode Indicator */}
          {isGeminiJob && (
            <div className="card bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
              <div className="flex items-center space-x-2">
                <Sparkles className="h-5 w-5 text-blue-600" />
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  This video was processed using <strong>Gemini Direct</strong> mode (client-side processing)
                </p>
              </div>
            </div>
          )}

          {/* Video Player */}
          {videoUrl && (
            <div className="card">
              <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Video</h2>
              <VideoPlayer
                videoUrl={videoUrl}
                seekTo={seekTo}
                onSeek={(time) => setSeekTo(time)}
                timestamps={extractTimestamps()}
              />
            </div>
          )}

          {/* Summary Format Selector */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Summary Format</h2>
              <div className="flex space-x-2">
                {(['paragraph', 'bullet', 'timeline', 'chapters', 'highlights'] as const).map((format) => (
                  <button
                    key={format}
                    onClick={() => setSummaryFormat(format)}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                      summaryFormat === format
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {format.charAt(0).toUpperCase() + format.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Summary Viewer */}
          <SummaryFormatViewer
            summary={result.summary}
            format={summaryFormat}
            transcript={result.audio_transcription}
            visualCaptions={result.visualCaptions}
          />
        </div>
      )}

      {status.status === 'failed' && (
        <div className="card bg-red-50 border-red-200">
          <div className="flex items-center space-x-2 text-red-800">
            <XCircle className="h-5 w-5" />
            <p>Processing failed. Please try again.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobPage;

