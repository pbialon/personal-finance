'use client';

import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { CheckCircle, XCircle, MinusCircle, Loader2 } from 'lucide-react';
import type { ImportProgressEvent } from '@/types';

interface ImportProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  progress: ImportProgressEvent | null;
  isComplete: boolean;
}

export function ImportProgressModal({
  isOpen,
  onClose,
  progress,
  isComplete,
}: ImportProgressModalProps) {
  const current = progress?.current ?? 0;
  const total = progress?.total ?? 0;
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Import transakcji"
      size="md"
    >
      <div className="space-y-6">
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
          <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
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
              Przetwarzanie: <span className="font-medium text-gray-700">{progress.lastTransaction}</span>
            </span>
          </div>
        )}

        {/* Statistics */}
        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-gray-600">Zaimportowane:</span>
            </div>
            <span className="font-semibold text-gray-900">{progress?.imported ?? 0}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <MinusCircle className="h-4 w-4 text-gray-400" />
              <span className="text-gray-600">Pominięte (duplikaty):</span>
            </div>
            <span className="font-semibold text-gray-900">{progress?.skipped ?? 0}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <XCircle className="h-4 w-4 text-red-500" />
              <span className="text-gray-600">Błędy:</span>
            </div>
            <span className="font-semibold text-gray-900">{progress?.errors ?? 0}</span>
          </div>
        </div>

        {/* Action button */}
        <div className="flex justify-end">
          {isComplete ? (
            <Button onClick={onClose}>
              Zamknij
            </Button>
          ) : (
            <Button variant="secondary" onClick={onClose}>
              Zamknij
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
