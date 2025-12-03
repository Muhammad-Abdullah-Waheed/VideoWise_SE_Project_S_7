import React, { createContext, useContext, useState, useEffect } from 'react';

interface AIContextType {
  apiKey: string | null;
  setApiKey: (key: string) => void;
  isConfigured: boolean;
  clearApiKey: () => void;
}

const AIContext = createContext<AIContextType | undefined>(undefined);

export const AIProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [apiKey, setApiKeyState] = useState<string | null>(() => {
    // Prefer environment variable, fallback to localStorage
    const envKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
    const storedKey = localStorage.getItem('ai_api_key');
    return envKey || storedKey || null;
  });

  useEffect(() => {
    // Save to localStorage whenever it changes
    if (apiKey) {
      localStorage.setItem('ai_api_key', apiKey);
    } else {
      localStorage.removeItem('ai_api_key');
    }
  }, [apiKey]);

  const setApiKey = (key: string) => {
    setApiKeyState(key);
  };

  const clearApiKey = () => {
    setApiKeyState(null);
    localStorage.removeItem('ai_api_key');
  };

  return (
    <AIContext.Provider
      value={{
        apiKey,
        setApiKey,
        isConfigured: !!apiKey,
        clearApiKey,
      }}
    >
      {children}
    </AIContext.Provider>
  );
};

export const useAI = () => {
  const context = useContext(AIContext);
  if (!context) {
    throw new Error('useAI must be used within AIProvider');
  }
  return context;
};
