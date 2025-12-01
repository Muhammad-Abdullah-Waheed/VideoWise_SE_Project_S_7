import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, apiService } from '@/services/api';
import { localStorageAuth } from '@/utils/localStorageAuth';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string, role?: string, expertise?: string[]) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  isAuthenticated: boolean;
  useBackend: boolean; // Whether to use backend or localStorage
  setUseBackend: (use: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [useBackend, setUseBackendState] = useState<boolean>(() => {
    // Check if backend is available, default to true
    const stored = localStorage.getItem('use_backend');
    return stored ? stored === 'true' : true;
  });

  useEffect(() => {
    // Check backend connectivity
    const checkBackend = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/health`, {
          method: 'GET',
          signal: AbortSignal.timeout(3000), // 3 second timeout
        });
        if (response.ok) {
          setUseBackendState(true);
          localStorage.setItem('use_backend', 'true');
        } else {
          setUseBackendState(false);
          localStorage.setItem('use_backend', 'false');
        }
      } catch (error) {
        // Backend not available
        setUseBackendState(false);
        localStorage.setItem('use_backend', 'false');
      }
    };

    checkBackend();

    // Load user based on mode
    if (useBackend) {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        // Verify token is still valid
        apiService.getCurrentUser()
          .then((currentUser) => {
            setUser(currentUser);
            localStorage.setItem('user', JSON.stringify(currentUser));
          })
          .catch(() => {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setToken(null);
            setUser(null);
          })
          .finally(() => setIsLoading(false));
      } else {
        setIsLoading(false);
      }
    } else {
      // Load from localStorage
      const localUser = localStorageAuth.getCurrentUser();
      if (localUser) {
        setUser({
          id: localUser.id,
          name: localUser.name,
          email: localUser.email,
          role: localUser.role,
          expertise: localUser.expertise,
        });
      }
      setIsLoading(false);
    }
  }, [useBackend]);

  const login = async (email: string, password: string) => {
    if (useBackend) {
      try {
        const response = await apiService.login(email, password);
        setToken(response.token);
        setUser(response.user);
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
      } catch (error) {
        // If backend fails, fallback to localStorage
        const localUser = localStorageAuth.login(email, password);
        setUser({
          id: localUser.id,
          name: localUser.name,
          email: localUser.email,
          role: localUser.role,
          expertise: localUser.expertise,
        });
        setUseBackendState(false);
        localStorage.setItem('use_backend', 'false');
      }
    } else {
      // Use localStorage auth
      const localUser = localStorageAuth.login(email, password);
      setUser({
        id: localUser.id,
        name: localUser.name,
        email: localUser.email,
        role: localUser.role,
        expertise: localUser.expertise,
      });
    }
  };

  const signup = async (name: string, email: string, password: string, role?: string, expertise?: string[]) => {
    if (useBackend) {
      try {
        const response = await apiService.signup({ name, email, password, role, expertise });
        setToken(response.token);
        setUser(response.user);
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
      } catch (error) {
        // If backend fails, fallback to localStorage
        const localUser = localStorageAuth.createAccount(name, email, password, role, expertise);
        setUser({
          id: localUser.id,
          name: localUser.name,
          email: localUser.email,
          role: localUser.role,
          expertise: localUser.expertise,
        });
        setUseBackendState(false);
        localStorage.setItem('use_backend', 'false');
      }
    } else {
      // Use localStorage auth
      const localUser = localStorageAuth.createAccount(name, email, password, role, expertise);
      setUser({
        id: localUser.id,
        name: localUser.name,
        email: localUser.email,
        role: localUser.role,
        expertise: localUser.expertise,
      });
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    if (useBackend) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    } else {
      localStorageAuth.clearCurrentUser();
    }
  };

  const setUseBackend = (use: boolean) => {
    setUseBackendState(use);
    localStorage.setItem('use_backend', use.toString());
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        signup,
        logout,
        isLoading,
        isAuthenticated: !!user,
        useBackend,
        setUseBackend,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

