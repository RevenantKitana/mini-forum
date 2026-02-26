import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { LoadingOverlay } from '@/components/common/LoadingOverlay';

interface GlobalLoadingContextType {
  isLoading: boolean;
  loadingMessage: string | null;
  showLoading: (message?: string) => void;
  hideLoading: () => void;
}

const GlobalLoadingContext = createContext<GlobalLoadingContextType | undefined>(undefined);

export function GlobalLoadingProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState<string | null>(null);

  const showLoading = useCallback((message?: string) => {
    setLoadingMessage(message || 'Đang tải...');
    setIsLoading(true);
  }, []);

  const hideLoading = useCallback(() => {
    setIsLoading(false);
    setLoadingMessage(null);
  }, []);

  return (
    <GlobalLoadingContext.Provider value={{ isLoading, loadingMessage, showLoading, hideLoading }}>
      {children}
      <LoadingOverlay
        isLoading={isLoading}
        message={loadingMessage || undefined}
        fullScreen
      />
    </GlobalLoadingContext.Provider>
  );
}

export function useGlobalLoading() {
  const context = useContext(GlobalLoadingContext);
  if (context === undefined) {
    throw new Error('useGlobalLoading must be used within a GlobalLoadingProvider');
  }
  return context;
}

/**
 * Hook to show global loading during async operations
 */
export function useAsyncOperation() {
  const { showLoading, hideLoading } = useGlobalLoading();

  const execute = useCallback(
    async <T,>(operation: () => Promise<T>, message?: string): Promise<T> => {
      try {
        showLoading(message);
        return await operation();
      } finally {
        hideLoading();
      }
    },
    [showLoading, hideLoading]
  );

  return { execute };
}
