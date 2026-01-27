'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { CheckCircle, XCircle, MinusCircle, Loader2, Minimize2, Maximize2 } from 'lucide-react';
import { useImport } from './ImportContext';

export function ImportProgressPanel() {
  const { isImporting, progress, isComplete, resetImport } = useImport();
  const [minimized, setMinimized] = useState(false);

  // Auto-reset minimized state when new import starts
  useEffect(() => {
    if (isImporting && !progress) {
      setMinimized(false);
    }
  }, [isImporting, progress]);

  if (!isImporting) return null;

  const current = progress?.current ?? 0;
  const total = progress?.total ?? 0;
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0;
  const isLoading = !progress;

  // Minimized view - compact progress bar
  if (minimized) {
    return (
      <div
        className="fixed bottom-4 right-4 z-50 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden cursor-pointer hover:shadow-xl transition-shadow"
        onClick={() => setMinimized(false)}
      >
        <div className="flex items-center gap-3 px-4 py-2.5">
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
              <span className="text-sm text-gray-600">Analizowanie...</span>
            </>
          ) : isComplete ? (
            <>
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium text-gray-900">
                Import zakończony ({progress?.imported ?? 0} nowych)
              </span>
            </>
          ) : (
            <>
              <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 transition-all duration-300 ease-out rounded-full"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <span className="text-sm text-gray-600 whitespace-nowrap">
                {current}/{total}
              </span>
            </>
          )}
          <Maximize2 className="h-4 w-4 text-gray-400 ml-1" />
        </div>
      </div>
    );
  }

  // Full view
  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
        <h3 className="font-semibold text-gray-900">Import transakcji</h3>
        <button
          onClick={() => setMinimized(true)}
          className="p-1 hover:bg-gray-200 rounded-lg transition-colors text-gray-500 hover:text-gray-700"
          title="Minimalizuj"
        >
          <Minimize2 className="h-4 w-4" />
        </button>
      </div>

      <div className="p-4 space-y-4">
        {isLoading ? (
          /* Loading state - analyzing file */
          <div className="flex items-center gap-3 py-2">
            <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
            <span className="text-gray-600">Analizowanie pliku...</span>
          </div>
        ) : (
          <>
            {/* Progress bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">
                  {isComplete ? 'Zakończono' : 'Importowanie...'}
                </span>
                <span className="font-medium text-gray-900">
                  {current} z {total}
                </span>
              </div>
              <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 transition-all duration-300 ease-out rounded-full"
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>

            {/* Current transaction */}
            {!isComplete && progress?.lastTransaction && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                <span className="truncate">
                  <span className="font-medium text-gray-700">{progress.lastTransaction}</span>
                </span>
              </div>
            )}

            {/* Statistics */}
            <div className="bg-gray-50 rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-gray-600">Zaimportowane:</span>
                </div>
                <span className="font-semibold text-gray-900">{progress?.imported ?? 0}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <MinusCircle className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">Pominięte:</span>
                </div>
                <span className="font-semibold text-gray-900">{progress?.skipped ?? 0}</span>
              </div>
              {(progress?.errors ?? 0) > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-red-500" />
                    <span className="text-gray-600">Błędy:</span>
                  </div>
                  <span className="font-semibold text-gray-900">{progress?.errors ?? 0}</span>
                </div>
              )}
            </div>

            {/* Action button - only when complete */}
            {isComplete && (
              <Button onClick={resetImport} className="w-full">
                Zamknij
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
