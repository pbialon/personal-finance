export interface CategoryForecast {
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  categoryIcon: string | null;
  currentSpent: number;
  projectedTotal: number;
  confidence: 'high' | 'medium' | 'low';
  trend: 'up' | 'down' | 'stable';
  vsLastMonth: number;
  vsBudget: number | null;
}

export interface MonthlyForecast {
  totalProjected: number;
  totalBudget: number;
  projectedSavings: number;
  categories: CategoryForecast[];
  alerts: string[];
  daysRemaining: number;
  percentMonthComplete: number;
}

interface CategoryData {
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  categoryIcon: string | null;
  currentSpent: number;
  budget: number | null;
  lastMonthSpent: number | null;
  historicalAvg: number | null;
}

interface ForecastInput {
  categories: CategoryData[];
  totalIncome: number;
  totalBudget: number;
  currentDate: Date;
}

function getDaysInMonth(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

function getDayOfMonth(date: Date): number {
  return date.getDate();
}

function calculateProjection(
  currentSpent: number,
  dayOfMonth: number,
  daysInMonth: number,
  historicalAvg: number | null
): { projected: number; confidence: 'high' | 'medium' | 'low' } {
  // Linear extrapolation
  const linearProjection = dayOfMonth > 0
    ? currentSpent * (daysInMonth / dayOfMonth)
    : 0;

  // If we have historical data, blend it
  if (historicalAvg !== null && historicalAvg > 0) {
    // Weight: 60% linear (current pace), 40% historical
    const blendedProjection = linearProjection * 0.6 + historicalAvg * 0.4;

    // Higher confidence if current spending aligns with historical
    const deviation = Math.abs(linearProjection - historicalAvg) / historicalAvg;
    const confidence = deviation < 0.2 ? 'high' : deviation < 0.4 ? 'medium' : 'low';

    return { projected: blendedProjection, confidence };
  }

  // Without historical data, use pure linear extrapolation
  const confidence = dayOfMonth >= 15 ? 'medium' : 'low';
  return { projected: linearProjection, confidence };
}

function determineTrend(
  projectedTotal: number,
  lastMonthSpent: number | null,
  historicalAvg: number | null
): 'up' | 'down' | 'stable' {
  const baseline = lastMonthSpent || historicalAvg;

  if (baseline === null || baseline === 0) return 'stable';

  const change = (projectedTotal - baseline) / baseline;

  if (change > 0.1) return 'up';
  if (change < -0.1) return 'down';
  return 'stable';
}

export function forecastMonthlySpending(input: ForecastInput): MonthlyForecast {
  const { categories, totalIncome, totalBudget, currentDate } = input;

  const dayOfMonth = getDayOfMonth(currentDate);
  const daysInMonth = getDaysInMonth(currentDate);
  const daysRemaining = daysInMonth - dayOfMonth;
  const percentMonthComplete = Math.round((dayOfMonth / daysInMonth) * 100);

  const forecasts: CategoryForecast[] = [];
  const alerts: string[] = [];
  let totalProjected = 0;

  categories.forEach((cat) => {
    const { projected, confidence } = calculateProjection(
      cat.currentSpent,
      dayOfMonth,
      daysInMonth,
      cat.historicalAvg
    );

    const trend = determineTrend(projected, cat.lastMonthSpent, cat.historicalAvg);

    // Calculate vs last month
    const vsLastMonth = cat.lastMonthSpent !== null && cat.lastMonthSpent > 0
      ? ((projected - cat.lastMonthSpent) / cat.lastMonthSpent) * 100
      : 0;

    // Calculate vs budget
    const vsBudget = cat.budget !== null && cat.budget > 0
      ? ((projected / cat.budget) * 100)
      : null;

    forecasts.push({
      categoryId: cat.categoryId,
      categoryName: cat.categoryName,
      categoryColor: cat.categoryColor,
      categoryIcon: cat.categoryIcon,
      currentSpent: cat.currentSpent,
      projectedTotal: Math.round(projected * 100) / 100,
      confidence,
      trend,
      vsLastMonth: Math.round(vsLastMonth),
      vsBudget: vsBudget !== null ? Math.round(vsBudget) : null,
    });

    totalProjected += projected;

    // Generate alerts
    if (vsBudget !== null && vsBudget > 100) {
      const overBy = Math.round(projected - (cat.budget || 0));
      alerts.push(`${cat.categoryName} przekroczy budżet o ~${overBy} zł`);
    } else if (vsBudget !== null && vsBudget > 90) {
      alerts.push(`${cat.categoryName} zbliża się do limitu budżetu`);
    }
  });

  // Sort forecasts by projected total (descending)
  forecasts.sort((a, b) => b.projectedTotal - a.projectedTotal);

  // Calculate projected savings
  const projectedSavings = totalIncome - totalProjected;

  // Overall alerts
  if (totalBudget > 0 && totalProjected > totalBudget) {
    const overBy = Math.round(totalProjected - totalBudget);
    alerts.unshift(`Prognozowane przekroczenie budżetu o ~${overBy} zł`);
  }

  return {
    totalProjected: Math.round(totalProjected * 100) / 100,
    totalBudget,
    projectedSavings: Math.round(projectedSavings * 100) / 100,
    categories: forecasts,
    alerts,
    daysRemaining,
    percentMonthComplete,
  };
}
