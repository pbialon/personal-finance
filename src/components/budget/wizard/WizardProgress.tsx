'use client';

import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface WizardProgressProps {
  currentStep: number;
  totalSteps: number;
  labels?: string[];
}

export function WizardProgress({ currentStep, totalSteps, labels }: WizardProgressProps) {
  const defaultLabels = ['Miesiąc', 'Przychody', 'Stałe', 'Budżety', 'Podsumowanie'];
  const stepLabels = labels || defaultLabels;

  return (
    <div className="flex items-center justify-between">
      {Array.from({ length: totalSteps }, (_, i) => {
        const step = i + 1;
        const isCompleted = step < currentStep;
        const isCurrent = step === currentStep;

        return (
          <div key={step} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors',
                  {
                    'bg-blue-600 text-white': isCurrent,
                    'bg-green-500 text-white': isCompleted,
                    'bg-gray-200 text-gray-500': !isCurrent && !isCompleted,
                  }
                )}
              >
                {isCompleted ? <Check className="h-4 w-4" /> : step}
              </div>
              <span
                className={cn('mt-1 text-xs', {
                  'text-blue-600 font-medium': isCurrent,
                  'text-green-600': isCompleted,
                  'text-gray-400': !isCurrent && !isCompleted,
                })}
              >
                {stepLabels[i]}
              </span>
            </div>
            {step < totalSteps && (
              <div
                className={cn('mx-2 h-0.5 w-12 transition-colors', {
                  'bg-green-500': isCompleted,
                  'bg-gray-200': !isCompleted,
                })}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
