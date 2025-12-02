import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Loader2, XCircle } from 'lucide-react';
import { apiService, JobStatus, JobResult } from '@/services/api';
import VideoPlayer from '@/components/VideoPlayer';
import SummaryFormatViewer from '@/components/SummaryFormatViewer';
import ExportMenu from '@/components/ExportMenu';
import { ExportData } from '@/utils/export';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';

const JobPage = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [pollingInterval, setPollingInterval] = useState(2000);
  const [summaryFormat, setSummaryFormat] = useState<'paragraph' | 'bullet' | 'timeline' | 'chapters' | 'highlights'>('paragraph');
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [seekTo, setSeekTo] = useState<number | undefined>(undefined);

  // Check if this is a direct processing job (stored in localStorage)
  const isDirectJob = jobId?.startsWith('direct_');
  
  // For direct jobs, get data from localStorage and verify user ownership
  const directJobData = isDirectJob && jobId 
    ? (() => {
        try {
          const data = JSON.parse(localStorage.getItem(`direct_job_${jobId}`) || 'null');
          // Verify this job belongs to the current user
          if (data && user && data.userId !== user.id) {
            console.warn('Job does not belong to current user');
            navigate('/dashboard');
            return null; // Don't allow access to other users' jobs
          }
          return data;
        } catch (e) {
          return null;
        }
      })()
    : null;

  // Redirect if user tries to access a job that doesn't belong to them
  useEffect(() => {
    if (isDirectJob && directJobData && user && directJobData.userId !== user.id) {
      navigate('/dashboard');
    }
  }, [isDirectJob, directJobData, user, navigate]);

  const { data: status, isLoading: statusLoading } = useQuery<JobStatus>({
    queryKey: ['job-status', jobId],
    queryFn: () => {
      if (isDirectJob && directJobData) {
        // Return direct job status from localStorage
        return {
          jobId: directJobData.jobId,
          status: directJobData.status || 'done',
          progress: directJobData.progress || 100,
          step: directJobData.step || 'Complete',
          etaSeconds: 0,
          createdAt: directJobData.createdAt || new Date().toISOString(),
        };
      }
      return apiService.getJobStatus(jobId!);
    },
    enabled: !!jobId,
    refetchInterval: (query) => {
      const data = query.state.data;
      if (isDirectJob) return false; // Don't poll for direct jobs
      if (data?.status === 'done' || data?.status === 'failed') {
        return false;
      }
      return pollingInterval;
    },
  });

  const { data: result } = useQuery<JobResult>({
    queryKey: ['job-result', jobId],
    queryFn: () => {
      if (isDirectJob && directJobData) {
        // Return direct job result from localStorage
        const directResult = directJobData.result;
        const jobResult = {
          jobId: directJobData.jobId,
          summary: directResult.final_summary || directResult.summary || '',
          audio_transcription: directResult.audio_transcription || '',
          visualCaptions: directResult.visual_analysis?.frame_captions || [],
          transcript: directResult.audio_transcription || '',
          highlights: [],
          videoUrl: directResult.video_url || directResult.videoUrl,
          summaryFormat: directResult.summary_format || directResult.summaryFormat || 'paragraph',
        };
        console.log('Direct job result:', jobResult);
        return jobResult;
      }
      return apiService.getJobResult(jobId!);
    },
    enabled: !!jobId && (isDirectJob ? !!directJobData : status?.status === 'done'),
  });

  // Get video URL from job metadata or result - MUST be before any conditional returns
  useEffect(() => {
    if (result) {
      // Handle direct jobs (blob URL) or backend jobs (server URL)
      if ('videoUrl' in result && (result as any).videoUrl) {
        const url = (result as any).videoUrl;
        // If it's a relative URL, make it absolute (backend job)
        if (url && url.startsWith('/')) {
          const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
          setVideoUrl(`${apiBase}${url}`);
        } else if (url && url.startsWith('blob:')) {
          // Direct job - blob URL
          setVideoUrl(url);
        } else if (url) {
          setVideoUrl(url);
        }
      }
      // Also check if we can get format from result
      if ('summaryFormat' in result) {
        setSummaryFormat((result as any).summaryFormat || 'paragraph');
      }
    }
  }, [result]);

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

      {status.status === 'done' && (
        <div className="space-y-6">
          {!result && (
            <div className="card bg-yellow-50 border-yellow-200">
              <p className="text-yellow-800">Loading result...</p>
            </div>
          )}

          {result && (
            <>
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
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Summary Format</h2>
                  <div className="flex flex-wrap gap-2">
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

              {/* Summary Viewer - Only show summary, no transcription or frame details */}
              {result.summary ? (
                <SummaryFormatViewer
                  summary={result.summary}
                  format={summaryFormat}
                  transcript={undefined} // Don't show transcription
                  visualCaptions={undefined} // Don't show frame-by-frame captions
                />
              ) : (
                <div className="card bg-red-50 border-red-200">
                  <p className="text-red-800">No summary available. Summary field is empty.</p>
                  <p className="text-red-600 text-sm mt-2">Result data: {JSON.stringify(result, null, 2)}</p>
                </div>
              )}
            </>
          )}
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

