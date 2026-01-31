'use client';

import { useState, useRef, useEffect, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface TooltipProps {
  children: ReactNode;
  content: ReactNode;
  className?: string;
}

export function Tooltip({ children, content, className }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState<'top' | 'bottom'>('top');
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isVisible && triggerRef.current && tooltipRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();

      // Check if tooltip would go above viewport
      if (triggerRect.top - tooltipRect.height - 8 < 0) {
        setPosition('bottom');
      } else {
        setPosition('top');
      }
    }
  }, [isVisible]);

  return (
    <div className="relative inline-flex items-center">
      <div
        ref={triggerRef}
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        className="cursor-help"
      >
        {children}
      </div>
      {isVisible && (
        <div
          ref={tooltipRef}
          className={cn(
            'absolute z-50 px-3 py-2 text-xs text-white bg-gray-900 rounded-lg shadow-lg w-64 whitespace-normal',
            position === 'top' ? 'bottom-full mb-2' : 'top-full mt-2',
            'left-1/2 -translate-x-1/2',
            className
          )}
        >
          {content}
          <div
            className={cn(
              'absolute left-1/2 -translate-x-1/2 border-4 border-transparent',
              position === 'top'
                ? 'top-full border-t-gray-900'
                : 'bottom-full border-b-gray-900'
            )}
          />
        </div>
      )}
    </div>
  );
}
