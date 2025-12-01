import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Clock, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { apiService } from '@/services/api';
import VideoUploadForm from '@/components/VideoUploadForm';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [jobs, setJobs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    try {
      // Try backend first
      try {
        const response = await apiService.listJobs(20);
        setJobs(response.jobs);
      } catch (error) {
        // Backend not available, load from localStorage (Gemini jobs)
        const geminiJobs: any[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key?.startsWith('gemini_job_')) {
            const jobData = JSON.parse(localStorage.getItem(key) || '{}');
            geminiJobs.push({
              id: jobData.jobId,
              status: jobData.status,
              progress: jobData.progress,
              step: jobData.step,
              createdAt: jobData.createdAt,
              summaryStyle: 'gemini',
            });
          }
        }
        // Sort by date (newest first)
        geminiJobs.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setJobs(geminiJobs.slice(0, 20));
      }
    } catch (error) {
      toast.error('Failed to load jobs');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'done':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'processing':
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'done':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Dashboard</h1>
        <button
          onClick={() => setShowUploadForm(!showUploadForm)}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="h-5 w-5" />
          <span>New Summarization</span>
        </button>
      </div>

      {showUploadForm && (
        <div className="card mb-8">
          <h2 className="text-xl font-semibold mb-4">Create New Summarization</h2>
          <VideoUploadForm
            onSuccess={() => {
              setShowUploadForm(false);
              loadJobs();
            }}
          />
        </div>
      )}

      <div className="card">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Recent Jobs</h2>
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <p>No jobs yet. Create your first summarization!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {jobs.map((job) => (
              <Link
                key={job.id}
                to={`/job/${job.id}`}
                className="block p-4 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-primary-300 dark:hover:border-primary-600 hover:shadow-md transition-all bg-white dark:bg-gray-800"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {getStatusIcon(job.status)}
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        Job {job.id.slice(0, 8)}
                        {job.id.startsWith('gemini_') && (
                          <span className="ml-2 text-xs text-blue-600 dark:text-blue-400">(Gemini)</span>
                        )}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {format(new Date(job.createdAt), 'MMM d, yyyy h:mm a')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(job.status)}`}>
                      {job.status}
                    </span>
                    {job.status === 'processing' && (
                      <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-primary-600 h-2 rounded-full transition-all"
                          style={{ width: `${job.progress}%` }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;

