'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import type { ImportProgressEvent } from '@/types';

interface ImportContextType {
  isImporting: boolean;
  progress: ImportProgressEvent | null;
  isComplete: boolean;
  startImport: (file: File) => Promise<void>;
  resetImport: () => void;
}

const ImportContext = createContext<ImportContextType | null>(null);

export function useImport() {
  const context = useContext(ImportContext);
  if (!context) {
    throw new Error('useImport must be used within ImportProvider');
  }
  return context;
}

export function ImportProvider({ children }: { children: ReactNode }) {
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState<ImportProgressEvent | null>(null);
  const [isComplete, setIsComplete] = useState(false);

  const resetImport = useCallback(() => {
    setIsImporting(false);
    setProgress(null);
    setIsComplete(false);
  }, []);

  const startImport = useCallback(async (file: File) => {
    setIsImporting(true);
    setProgress(null);
    setIsComplete(false);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/import/csv', {
        method: 'POST',
        body: formData,
      });

      // Check if response is SSE stream or JSON error
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        const data = await response.json();
        console.error('Import error:', data.error);
        resetImport();
        return;
      }

      // Read SSE stream
      const reader = response.body?.getReader();
      if (!reader) {
        console.error('Failed to get reader');
        resetImport();
        return;
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const event = JSON.parse(line.slice(6)) as ImportProgressEvent;
              setProgress(event);

              if (event.type === 'complete') {
                setIsComplete(true);
              }
            } catch {
              // Ignore parse errors
            }
          }
        }
      }
    } catch (error) {
      console.error('Import failed:', error);
      resetImport();
    }
  }, [resetImport]);

  return (
    <ImportContext.Provider value={{ isImporting, progress, isComplete, startImport, resetImport }}>
      {children}
    </ImportContext.Provider>
  );
}
