import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, FolderOpen, Trash2, Video } from 'lucide-react';
import { apiService } from '@/services/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

interface Collection {
  id: string;
  name: string;
  description?: string;
  jobIds: string[];
  createdAt: string;
}

interface Job {
  id: string;
  status: string;
  createdAt: string;
  summaryStyle?: string;
}

const Collections = () => {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [jobs, setJobs] = useState<Record<string, Job>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [newCollectionDesc, setNewCollectionDesc] = useState('');

  useEffect(() => {
    loadCollections();
    loadJobs();
  }, []);

  const loadCollections = async () => {
    try {
      // For now, use localStorage - in production, this would be an API call
      const saved = localStorage.getItem('videowise_collections');
      if (saved) {
        setCollections(JSON.parse(saved));
      }
    } catch (error) {
      toast.error('Failed to load collections');
    } finally {
      setIsLoading(false);
    }
  };

  const loadJobs = async () => {
    try {
      const response = await apiService.listJobs(100);
      const jobsMap: Record<string, Job> = {};
      response.jobs.forEach((job: Job) => {
        jobsMap[job.id] = job;
      });
      setJobs(jobsMap);
    } catch (error) {
      console.error('Failed to load jobs:', error);
    }
  };

  const createCollection = () => {
    if (!newCollectionName.trim()) {
      toast.error('Collection name is required');
      return;
    }

    const newCollection: Collection = {
      id: `col_${Date.now()}`,
      name: newCollectionName,
      description: newCollectionDesc,
      jobIds: [],
      createdAt: new Date().toISOString(),
    };

    const updated = [...collections, newCollection];
    setCollections(updated);
    localStorage.setItem('videowise_collections', JSON.stringify(updated));
    setShowCreateModal(false);
    setNewCollectionName('');
    setNewCollectionDesc('');
    toast.success('Collection created!');
  };

  const deleteCollection = (id: string) => {
    if (window.confirm('Are you sure you want to delete this collection?')) {
      const updated = collections.filter(c => c.id !== id);
      setCollections(updated);
      localStorage.setItem('videowise_collections', JSON.stringify(updated));
      toast.success('Collection deleted');
    }
  };

  // Function to add job to collection (for future use)
  // const addJobToCollection = (collectionId: string, jobId: string) => {
  //   const updated = collections.map(c => {
  //     if (c.id === collectionId && !c.jobIds.includes(jobId)) {
  //       return { ...c, jobIds: [...c.jobIds, jobId] };
  //     }
  //     return c;
  //   });
  //   setCollections(updated);
  //   localStorage.setItem('videowise_collections', JSON.stringify(updated));
  //   toast.success('Video added to collection');
  // };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Collections</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Organize your video summaries into collections
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="h-5 w-5" />
          <span>New Collection</span>
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : collections.length === 0 ? (
        <div className="card text-center py-12">
          <FolderOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400 mb-4">No collections yet</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary"
          >
            Create Your First Collection
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {collections.map((collection) => (
            <div key={collection.id} className="card hover:shadow-xl transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    {collection.name}
                  </h3>
                  {collection.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {collection.description}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    {collection.jobIds.length} video{collection.jobIds.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <button
                  onClick={() => deleteCollection(collection.id)}
                  className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-2">
                {collection.jobIds.length > 0 ? (
                  collection.jobIds.slice(0, 3).map((jobId) => {
                    const job = jobs[jobId];
                    return job ? (
                      <Link
                        key={jobId}
                        to={`/job/${jobId}`}
                        className="block p-2 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                      >
                        <div className="flex items-center space-x-2">
                          <Video className="h-4 w-4 text-primary-600" />
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {jobId.slice(0, 8)}...
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded ${
                            job.status === 'done' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                            job.status === 'processing' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                            'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                          }`}>
                            {job.status}
                          </span>
                        </div>
                      </Link>
                    ) : null;
                  })
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                    No videos in this collection
                  </p>
                )}
                {collection.jobIds.length > 3 && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                    +{collection.jobIds.length - 3} more
                  </p>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Created {format(new Date(collection.createdAt), 'MMM d, yyyy')}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Collection Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Create New Collection
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Collection Name *
                </label>
                <input
                  type="text"
                  value={newCollectionName}
                  onChange={(e) => setNewCollectionName(e.target.value)}
                  className="input-field"
                  placeholder="My Collection"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description (optional)
                </label>
                <textarea
                  value={newCollectionDesc}
                  onChange={(e) => setNewCollectionDesc(e.target.value)}
                  className="input-field"
                  rows={3}
                  placeholder="Describe this collection..."
                />
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={createCollection}
                  className="btn-primary flex-1"
                >
                  Create
                </button>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewCollectionName('');
                    setNewCollectionDesc('');
                  }}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Collections;
