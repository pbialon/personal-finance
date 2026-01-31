'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { GoalProgress } from '@/components/goals/GoalProgress';
import { GoalModal } from '@/components/goals/GoalModal';
import { GoalFormData } from '@/components/goals/GoalForm';
import { useGoals } from '@/hooks/useGoals';
import { Loader2, Plus, Target, Calendar } from 'lucide-react';
import { cn, formatShortDate } from '@/lib/utils';
import type { GoalWithProgress } from '@/types';

export function GoalsCard() {
  const { goals, meta, loading, error, createGoal, updateGoal, deleteGoal } = useGoals();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<GoalWithProgress | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleAddClick = () => {
    setEditingGoal(null);
    setIsModalOpen(true);
  };

  const handleEditClick = (goal: GoalWithProgress) => {
    setEditingGoal(goal);
    setIsModalOpen(true);
  };

  const handleDeleteClick = async (id: string) => {
    if (!confirm('Czy na pewno chcesz usunąć ten cel?')) return;

    setDeletingId(id);
    try {
      await deleteGoal(id);
    } finally {
      setDeletingId(null);
    }
  };

  const handleSubmit = async (data: GoalFormData) => {
    if (editingGoal) {
      await updateGoal({
        id: editingGoal.id,
        ...data,
      });
    } else {
      await createGoal(data);
    }
  };

  const activeGoals = goals.filter((g) => !g.is_completed);
  const completedGoals = goals.filter((g) => g.is_completed);

  if (error && !goals.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Cele finansowe
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">Nie udało się załadować celów</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Cele finansowe
              {loading && <Loader2 className="h-4 w-4 animate-spin text-gray-400" />}
            </CardTitle>
            <Button size="sm" onClick={handleAddClick}>
              <Plus className="h-4 w-4 mr-1" />
              Dodaj cel
            </Button>
          </div>
        </CardHeader>
        <CardContent className={cn('transition-opacity duration-200', loading && 'opacity-60')}>
          {meta?.isFinancialMonth && (
            <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-4 pb-3 border-b">
              <Calendar className="h-3.5 w-3.5" />
              <span>
                Średnie oszczędności liczone dla miesięcy finansowych ({formatShortDate(meta.periodStart)} - {formatShortDate(meta.periodEnd)})
              </span>
            </div>
          )}
          {goals.length === 0 && !loading ? (
            <div className="text-center py-8">
              <Target className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 mb-4">Nie masz jeszcze żadnych celów finansowych</p>
              <Button onClick={handleAddClick}>
                <Plus className="h-4 w-4 mr-1" />
                Dodaj pierwszy cel
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {activeGoals.length > 0 && (
                <div className="space-y-3">
                  {activeGoals.map((goal) => (
                    <div
                      key={goal.id}
                      className={cn(deletingId === goal.id && 'opacity-50 pointer-events-none')}
                    >
                      <GoalProgress
                        goal={goal}
                        onEdit={handleEditClick}
                        onDelete={handleDeleteClick}
                      />
                    </div>
                  ))}
                </div>
              )}

              {completedGoals.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-3">
                    Osiągnięte cele ({completedGoals.length})
                  </h4>
                  <div className="space-y-3">
                    {completedGoals.map((goal) => (
                      <div
                        key={goal.id}
                        className={cn(deletingId === goal.id && 'opacity-50 pointer-events-none')}
                      >
                        <GoalProgress
                          goal={goal}
                          onEdit={handleEditClick}
                          onDelete={handleDeleteClick}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <GoalModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        goal={editingGoal}
        onSubmit={handleSubmit}
      />
    </>
  );
}
