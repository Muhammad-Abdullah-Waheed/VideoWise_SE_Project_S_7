import React, { createContext, useContext, useState, useEffect } from 'react';

interface GeminiContextType {
  apiKey: string | null;
  setApiKey: (key: string) => void;
  isConfigured: boolean;
  clearApiKey: () => void;
}

const GeminiContext = createContext<GeminiContextType | undefined>(undefined);

export const GeminiProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [apiKey, setApiKeyState] = useState<string | null>(() => {
    // Load from localStorage
    return localStorage.getItem('gemini_api_key');
  });

  useEffect(() => {
    // Save to localStorage whenever it changes
    if (apiKey) {
      localStorage.setItem('gemini_api_key', apiKey);
    } else {
      localStorage.removeItem('gemini_api_key');
    }
  }, [apiKey]);

  const setApiKey = (key: string) => {
    setApiKeyState(key);
  };

  const clearApiKey = () => {
    setApiKeyState(null);
    localStorage.removeItem('gemini_api_key');
  };

  return (
    <GeminiContext.Provider
      value={{
        apiKey,
        setApiKey,
        isConfigured: !!apiKey,
        clearApiKey,
      }}
    >
      {children}
    </GeminiContext.Provider>
  );
};

export const useGemini = () => {
  const context = useContext(GeminiContext);
  if (!context) {
    throw new Error('useGemini must be used within GeminiProvider');
  }
  return context;
};
