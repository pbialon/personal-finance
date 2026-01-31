import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getFinancialMonthStartDay } from '@/lib/settings';
import { addFinancialMonths, getFinancialMonthBoundaries } from '@/lib/utils';
import type { Goal, GoalWithProgress } from '@/types';

function calculateProgress(goal: Goal, avgMonthlySavings: number): GoalWithProgress {
  const percentage = goal.target_amount > 0
    ? Math.min((goal.current_amount / goal.target_amount) * 100, 100)
    : 0;
  const remaining = Math.max(goal.target_amount - goal.current_amount, 0);

  let monthlyRequired: number | null = null;
  let projectedDate: string | null = null;

  if (goal.deadline && remaining > 0) {
    const now = new Date();
    const deadline = new Date(goal.deadline);
    const monthsUntilDeadline = Math.max(
      (deadline.getFullYear() - now.getFullYear()) * 12 +
      (deadline.getMonth() - now.getMonth()),
      1
    );
    monthlyRequired = remaining / monthsUntilDeadline;
  }

  if (avgMonthlySavings > 0 && remaining > 0) {
    const monthsToGoal = Math.ceil(remaining / avgMonthlySavings);
    const projected = new Date();
    projected.setMonth(projected.getMonth() + monthsToGoal);
    projectedDate = projected.toISOString().split('T')[0];
  }

  return {
    ...goal,
    percentage: Math.round(percentage * 10) / 10,
    remaining,
    monthlyRequired: monthlyRequired ? Math.round(monthlyRequired) : null,
    projectedDate,
  };
}

export async function GET() {
  const supabase = await createClient();

  const { data: goals, error } = await supabase
    .from('goals')
    .select('*')
    .order('is_completed', { ascending: true })
    .order('deadline', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Calculate average monthly savings from last 3 financial months
  const financialStartDay = await getFinancialMonthStartDay();
  const isFinancialMonth = financialStartDay !== 1;
  const now = new Date();

  // Get current financial month boundaries
  const currentFinancialMonth = getFinancialMonthBoundaries(now, financialStartDay);

  // Go back 3 financial months
  const threeMonthsAgoDate = addFinancialMonths(now, -3, financialStartDay);
  const threeMonthsAgoBoundaries = getFinancialMonthBoundaries(threeMonthsAgoDate, financialStartDay);

  const { data: savingsTransactions } = await supabase
    .from('transactions')
    .select('amount, categories!inner(is_savings)')
    .gte('transaction_date', threeMonthsAgoBoundaries.start)
    .lte('transaction_date', currentFinancialMonth.end)
    .eq('categories.is_savings', true)
    .eq('is_ignored', false);

  let avgMonthlySavings = 0;
  if (savingsTransactions && savingsTransactions.length > 0) {
    const totalSavings = savingsTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
    avgMonthlySavings = totalSavings / 3;
  }

  const goalsWithProgress: GoalWithProgress[] = (goals || []).map((goal: Goal) =>
    calculateProgress(goal, avgMonthlySavings)
  );

  return NextResponse.json({
    goals: goalsWithProgress,
    meta: {
      isFinancialMonth,
      financialStartDay,
      periodStart: threeMonthsAgoBoundaries.start,
      periodEnd: currentFinancialMonth.end,
    },
  });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const body = await request.json();

  const { data, error } = await supabase
    .from('goals')
    .insert({
      name: body.name,
      target_amount: body.target_amount,
      current_amount: body.current_amount || 0,
      deadline: body.deadline || null,
      icon: body.icon || null,
      color: body.color || '#3b82f6',
      category_id: body.category_id || null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}

export async function PUT(request: NextRequest) {
  const supabase = await createClient();
  const body = await request.json();

  if (!body.id) {
    return NextResponse.json({ error: 'ID is required' }, { status: 400 });
  }

  const updateData: Partial<Goal> = {};
  if (body.name !== undefined) updateData.name = body.name;
  if (body.target_amount !== undefined) updateData.target_amount = body.target_amount;
  if (body.current_amount !== undefined) updateData.current_amount = body.current_amount;
  if (body.deadline !== undefined) updateData.deadline = body.deadline;
  if (body.icon !== undefined) updateData.icon = body.icon;
  if (body.color !== undefined) updateData.color = body.color;
  if (body.is_completed !== undefined) updateData.is_completed = body.is_completed;
  if (body.category_id !== undefined) updateData.category_id = body.category_id;

  const { data, error } = await supabase
    .from('goals')
    .update(updateData)
    .eq('id', body.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'ID is required' }, { status: 400 });
  }

  const { error } = await supabase
    .from('goals')
    .delete()
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
