'use client';

import { cn } from '@/lib/utils';
import { CheckCircle2, Pencil, Trash2 } from 'lucide-react';
import type { GoalWithProgress } from '@/types';
import { Button } from '@/components/ui/Button';

interface GoalProgressProps {
  goal: GoalWithProgress;
  onEdit: (goal: GoalWithProgress) => void;
  onDelete: (id: string) => void;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('pl-PL', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('pl-PL', { month: 'short', year: 'numeric' });
}

export function GoalProgress({ goal, onEdit, onDelete }: GoalProgressProps) {
  const isCompleted = goal.is_completed || goal.percentage >= 100;

  return (
    <div
      className={cn(
        'group p-4 rounded-lg border transition-colors',
        isCompleted
          ? 'bg-green-50 border-green-200'
          : 'bg-gray-50 border-gray-200 hover:border-gray-300'
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {goal.icon && (
            <span className="text-2xl shrink-0">{goal.icon}</span>
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="font-medium text-gray-900 truncate">{goal.name}</h4>
              {isCompleted && (
                <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(goal)}
            className="p-1.5"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(goal.id)}
            className="p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="mt-3">
        <div className="flex items-center justify-between text-sm mb-1.5">
          <span className="text-gray-600">
            {formatCurrency(goal.current_amount)} / {formatCurrency(goal.target_amount)} zł
          </span>
          <span
            className="font-medium"
            style={{ color: isCompleted ? '#16a34a' : goal.color }}
          >
            {goal.percentage}%
          </span>
        </div>

        <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${Math.min(goal.percentage, 100)}%`,
              backgroundColor: isCompleted ? '#16a34a' : goal.color,
            }}
          />
        </div>

        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
          {goal.deadline && (
            <span>
              Cel: {formatDate(goal.deadline)}
              {goal.monthlyRequired && !isCompleted && (
                <> &bull; Brakuje {formatCurrency(goal.monthlyRequired)} zł/msc</>
              )}
            </span>
          )}
          {!goal.deadline && goal.projectedDate && !isCompleted && (
            <span>
              Przy obecnym tempie: {formatDate(goal.projectedDate)}
            </span>
          )}
          {isCompleted && (
            <span className="text-green-600 font-medium">Cel osiągnięty!</span>
          )}
        </div>
      </div>
    </div>
  );
}
