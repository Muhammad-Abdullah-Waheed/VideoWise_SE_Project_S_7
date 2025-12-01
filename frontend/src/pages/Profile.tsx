import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { apiService } from '@/services/api';
import { Loader2, Save } from 'lucide-react';
import toast from 'react-hot-toast';

const Profile = () => {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [role, setRole] = useState('');
  const [expertise, setExpertise] = useState<string[]>([]);
  const [summaryLength, setSummaryLength] = useState<'short' | 'medium' | 'long'>('medium');
  const [focus, setFocus] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const expertiseOptions = ['Computer Vision', 'Machine Learning', 'Healthcare', 'Education', 'Business', 'Technology'];
  const focusOptions = ['technical', 'highlevel', 'actionable'];

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setIsLoading(true);
    try {
      const profile = await apiService.getProfile();
      setName(profile.name || '');
      setBio(profile.bio || '');
      setRole(profile.role || '');
      setExpertise(profile.expertise || []);
      setSummaryLength(profile.summaryPreferences?.length || 'medium');
      setFocus(profile.summaryPreferences?.focus || []);
    } catch (error) {
      toast.error('Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleExpertise = (item: string) => {
    setExpertise(prev =>
      prev.includes(item) ? prev.filter(e => e !== item) : [...prev, item]
    );
  };

  const toggleFocus = (item: string) => {
    setFocus(prev =>
      prev.includes(item) ? prev.filter(f => f !== item) : [...prev, item]
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await apiService.updateProfile({
        name,
        bio,
        role,
        expertise,
        summaryPreferences: {
          length: summaryLength,
          focus,
        },
      });
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Profile Settings</h1>

      <div className="card space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input-field"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email
          </label>
          <input
            type="email"
            value={user?.email || ''}
            disabled
            className="input-field bg-gray-50"
          />
          <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Bio
          </label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={4}
            className="input-field"
            placeholder="Tell us about yourself..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Role
          </label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="input-field"
          >
            <option value="">Select role</option>
            <option value="user">User</option>
            <option value="researcher">Researcher</option>
            <option value="student">Student</option>
            <option value="professional">Professional</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Expertise Areas
          </label>
          <div className="flex flex-wrap gap-2">
            {expertiseOptions.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => toggleExpertise(item)}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                  expertise.includes(item)
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Default Summary Length
          </label>
          <select
            value={summaryLength}
            onChange={(e) => setSummaryLength(e.target.value as 'short' | 'medium' | 'long')}
            className="input-field"
          >
            <option value="short">Short (~100 words)</option>
            <option value="medium">Medium (~250 words)</option>
            <option value="long">Long (~500 words)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Summary Focus Areas
          </label>
          <div className="flex flex-wrap gap-2">
            {focusOptions.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => toggleFocus(item)}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                  focus.includes(item)
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="btn-primary flex items-center space-x-2 disabled:opacity-50"
        >
          {isSaving ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <Save className="h-5 w-5" />
              <span>Save Changes</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default Profile;

