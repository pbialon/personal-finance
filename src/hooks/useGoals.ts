'use client';

import { useState, useEffect, useCallback } from 'react';
import type { GoalWithProgress } from '@/types';

interface CreateGoalData {
  name: string;
  target_amount: number;
  current_amount?: number;
  deadline?: string | null;
  icon?: string | null;
  color?: string;
  category_id?: string | null;
}

interface UpdateGoalData {
  id: string;
  name?: string;
  target_amount?: number;
  current_amount?: number;
  deadline?: string | null;
  icon?: string | null;
  color?: string;
  is_completed?: boolean;
  category_id?: string | null;
}

interface UseGoalsResult {
  goals: GoalWithProgress[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
  createGoal: (data: CreateGoalData) => Promise<void>;
  updateGoal: (data: UpdateGoalData) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  contributeToGoal: (id: string, amount: number) => Promise<void>;
}

export function useGoals(): UseGoalsResult {
  const [goals, setGoals] = useState<GoalWithProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGoals = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/goals');
      if (!response.ok) throw new Error('Failed to fetch goals');

      const data = await response.json();
      setGoals(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  const createGoal = async (data: CreateGoalData) => {
    const response = await fetch('/api/goals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) throw new Error('Failed to create goal');

    await fetchGoals();
  };

  const updateGoal = async (data: UpdateGoalData) => {
    const response = await fetch('/api/goals', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) throw new Error('Failed to update goal');

    await fetchGoals();
  };

  const deleteGoal = async (id: string) => {
    const response = await fetch(`/api/goals?id=${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) throw new Error('Failed to delete goal');

    setGoals((prev) => prev.filter((g) => g.id !== id));
  };

  const contributeToGoal = async (id: string, amount: number) => {
    const goal = goals.find((g) => g.id === id);
    if (!goal) throw new Error('Goal not found');

    const newAmount = goal.current_amount + amount;
    const isCompleted = newAmount >= goal.target_amount;

    await updateGoal({
      id,
      current_amount: newAmount,
      is_completed: isCompleted,
    });
  };

  return {
    goals,
    loading,
    error,
    refresh: fetchGoals,
    createGoal,
    updateGoal,
    deleteGoal,
    contributeToGoal,
  };
}
