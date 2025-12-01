import axios, { AxiosInstance } from 'axios';
import { API_ENDPOINTS } from '@/config/api';

const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export interface User {
  id: string;
  name: string;
  email: string;
  role?: string;
  bio?: string;
  expertise?: string[];
  summaryPreferences?: {
    length?: 'short' | 'medium' | 'long';
    focus?: string[];
    tone?: string;
  };
  language?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface JobStatus {
  jobId: string;
  status: 'queued' | 'processing' | 'done' | 'failed';
  progress: number;
  step: string;
  etaSeconds: number;
  createdAt?: string;
  summaryStyle?: string;
}

export interface JobResult {
  jobId: string;
  summary: string;
  audio_transcription: string;
  visualCaptions: Array<{ frame: number; caption: string }>;
  transcript: string;
  highlights: Array<{ timestamp: number; text: string }>;
  videoUrl?: string;
  summaryFormat?: string;
}

export const apiService = {
  // Auth
  async signup(data: { name: string; email: string; password: string; role?: string; expertise?: string[] }): Promise<AuthResponse> {
    const response = await api.post(API_ENDPOINTS.signup, data);
    return response.data;
  },

  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await api.post(API_ENDPOINTS.login, { email, password });
    return response.data;
  },

  async getCurrentUser(): Promise<User> {
    const response = await api.get(API_ENDPOINTS.me);
    return response.data;
  },

  // Profile
  async getProfile(): Promise<User> {
    const response = await api.get(API_ENDPOINTS.profile);
    return response.data;
  },

  async updateProfile(data: Partial<User>): Promise<void> {
    await api.put(API_ENDPOINTS.profile, data);
  },

  // Videos
  async uploadVideo(
    file: File,
    options: {
      num_frames?: number;
      summary_style?: string;
      summary_format?: string;
      summary_length_words?: number;
      metadata?: any;
    }
  ): Promise<{ jobId: string }> {
    const formData = new FormData();
    formData.append('file', file);
    if (options.num_frames) formData.append('num_frames', options.num_frames.toString());
    if (options.summary_style) formData.append('summary_style', options.summary_style);
    if (options.summary_format) formData.append('summary_format', options.summary_format);
    if (options.summary_length_words) formData.append('summary_length_words', options.summary_length_words.toString());
    if (options.metadata) formData.append('metadata', JSON.stringify(options.metadata));

    const response = await api.post(API_ENDPOINTS.upload, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  async summarizeFromUrl(
    url: string,
    options: {
      num_frames?: number;
      summary_style?: string;
      summary_format?: string;
      summary_length_words?: number;
      metadata?: any;
    }
  ): Promise<{ jobId: string }> {
    const response = await api.post(API_ENDPOINTS.fromUrl, {
      url,
      ...options,
    });
    return response.data;
  },

  async getJobStatus(jobId: string): Promise<JobStatus> {
    const response = await api.get(API_ENDPOINTS.status(jobId));
    return response.data;
  },

  async getJobResult(jobId: string): Promise<JobResult> {
    const response = await api.get(API_ENDPOINTS.result(jobId));
    return response.data;
  },

  async listJobs(limit?: number): Promise<{ jobs: Array<{ id: string; status: string; progress: number; step: string; createdAt: string; summaryStyle: string }> }> {
    const response = await api.get(API_ENDPOINTS.list, { params: { limit } });
    return response.data;
  },
};

export default api;

