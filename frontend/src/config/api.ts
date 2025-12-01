// Backend URL - can be localhost or remote (Colab/Railway/Render)
// Set this in .env file: VITE_API_BASE_URL=https://your-backend-url

// Get API URL from environment or use default
const getApiBaseUrl = (): string => {
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (envUrl && envUrl.trim() !== '') {
    return envUrl.trim();
  }
  return 'http://localhost:5000';
};

export const API_BASE_URL = getApiBaseUrl();

// Log the API URL for debugging (remove in production)
if (import.meta.env.DEV) {
  console.log('🔗 Backend API URL:', API_BASE_URL);
  console.log('📝 Environment variable:', import.meta.env.VITE_API_BASE_URL);
}

export const API_ENDPOINTS = {
  // Auth
  signup: `${API_BASE_URL}/auth/signup`,
  login: `${API_BASE_URL}/auth/login`,
  me: `${API_BASE_URL}/auth/me`,
  
  // Profile
  profile: `${API_BASE_URL}/user/profile`,
  
  // Videos
  upload: `${API_BASE_URL}/videos/upload`,
  fromUrl: `${API_BASE_URL}/videos/from-url`,
  status: (jobId: string) => `${API_BASE_URL}/videos/status/${jobId}`,
  result: (jobId: string) => `${API_BASE_URL}/videos/result/${jobId}`,
  list: `${API_BASE_URL}/videos/list`,
  
  // Health
  health: `${API_BASE_URL}/health`,
};

