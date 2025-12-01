import { useAuth } from '@/contexts/AuthContext';
import { LogOut, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const Settings = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/');
  };

  const handleDeleteAccount = () => {
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      // TODO: Implement account deletion API call
      toast.error('Account deletion not yet implemented');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Settings</h1>

      <div className="space-y-6">
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Account</h2>
          <div className="space-y-4">
            <button
              onClick={handleLogout}
              className="btn-secondary flex items-center space-x-2 w-full sm:w-auto"
            >
              <LogOut className="h-5 w-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>

        <div className="card border-red-200">
          <h2 className="text-xl font-semibold mb-4 text-red-600">Danger Zone</h2>
          <div className="space-y-4">
            <button
              onClick={handleDeleteAccount}
              className="bg-red-600 hover:bg-red-700 text-white font-medium px-6 py-2.5 rounded-xl transition-colors flex items-center space-x-2"
            >
              <Trash2 className="h-5 w-5" />
              <span>Delete Account</span>
            </button>
            <p className="text-sm text-gray-600">
              Permanently delete your account and all associated data. This action cannot be undone.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;

