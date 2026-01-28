export interface CategoryForecast {
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  categoryIcon: string | null;
  currentSpent: number;
  projectedMin: number;
  projectedMax: number;
  projectedTotal: number;
  confidence: 'high' | 'medium' | 'low';
  trend: 'up' | 'down' | 'stable';
  vsLastMonth: number;
  vsBudget: number | null;
}

export interface MonthlyForecast {
  totalProjectedMin: number;
  totalProjectedMax: number;
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

interface HistoricalTransaction {
  amount: number;
  category_id: string | null;
  transaction_date: string;
}

interface SpendingRatios {
  min: number;
  max: number;
  avg: number;
}

interface ForecastInput {
  categories: CategoryData[];
  totalIncome: number;
  totalBudget: number;
  currentDate: Date;
  historicalTransactions?: HistoricalTransaction[];
}

function getDaysInMonth(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

function getDayOfMonth(date: Date): number {
  return date.getDate();
}

/**
 * Calculates historical spending ratios for a given day of month.
 * Returns the min, max, and avg ratio of spending up to that day vs total monthly spending.
 */
function calculateHistoricalSpendingRatios(
  historicalTransactions: HistoricalTransaction[],
  dayOfMonth: number,
  categoryId?: string
): SpendingRatios {
  // Group transactions by month (YYYY-MM)
  const byMonth: Record<string, { upToDay: number; total: number }> = {};

  historicalTransactions.forEach(t => {
    // Filter by category if specified
    if (categoryId && t.category_id !== categoryId) return;

    const month = t.transaction_date.slice(0, 7);
    const day = parseInt(t.transaction_date.slice(8, 10));

    if (!byMonth[month]) {
      byMonth[month] = { upToDay: 0, total: 0 };
    }
    byMonth[month].total += t.amount;
    if (day <= dayOfMonth) {
      byMonth[month].upToDay += t.amount;
    }
  });

  // Calculate ratio for each month
  const ratios = Object.values(byMonth)
    .filter(data => data.total > 0)
    .map(data => data.upToDay / data.total);

  if (ratios.length === 0) {
    // Fallback: linear ratio
    const daysInAvgMonth = 30;
    const linearRatio = dayOfMonth / daysInAvgMonth;
    return { min: linearRatio, max: linearRatio, avg: linearRatio };
  }

  return {
    min: Math.min(...ratios),
    max: Math.max(...ratios),
    avg: ratios.reduce((sum, r) => sum + r, 0) / ratios.length,
  };
}

function calculateProjection(
  currentSpent: number,
  dayOfMonth: number,
  daysInMonth: number,
  historicalAvg: number | null,
  ratios: SpendingRatios
): {
  projectedMin: number;
  projectedMax: number;
  projected: number;
  confidence: 'high' | 'medium' | 'low';
} {
  // If no spending yet, use historical average or return zeros
  if (currentSpent === 0) {
    if (historicalAvg !== null && historicalAvg > 0) {
      return {
        projectedMin: historicalAvg * 0.8,
        projectedMax: historicalAvg * 1.2,
        projected: historicalAvg,
        confidence: 'low',
      };
    }
    return { projectedMin: 0, projectedMax: 0, projected: 0, confidence: 'low' };
  }

  // Use historical ratios to calculate projections
  // prognoza = wydatki_dziś / ratio
  // min projection comes from max ratio (we've spent more % than usual)
  // max projection comes from min ratio (we've spent less % than usual)
  const projectedMin = ratios.max > 0 ? currentSpent / ratios.max : currentSpent;
  const projectedMax = ratios.min > 0 ? currentSpent / ratios.min : currentSpent;
  const projected = ratios.avg > 0 ? currentSpent / ratios.avg : currentSpent;

  // Cap max projection at 3x current spending to avoid unrealistic projections early in month
  const cappedMax = Math.min(projectedMax, currentSpent * 3);
  const cappedMin = Math.max(projectedMin, currentSpent);

  // Determine confidence based on ratio spread and day of month
  const ratioSpread = ratios.max - ratios.min;
  let confidence: 'high' | 'medium' | 'low';

  if (dayOfMonth >= 25 || ratioSpread < 0.1) {
    confidence = 'high';
  } else if (dayOfMonth >= 15 || ratioSpread < 0.2) {
    confidence = 'medium';
  } else {
    confidence = 'low';
  }

  // If historical average exists, blend it with ratio-based projection
  if (historicalAvg !== null && historicalAvg > 0) {
    const blendFactor = Math.min(dayOfMonth / daysInMonth, 0.8); // More weight to current pace as month progresses
    const blendedProjected = projected * blendFactor + historicalAvg * (1 - blendFactor);

    return {
      projectedMin: Math.round(cappedMin * 100) / 100,
      projectedMax: Math.round(cappedMax * 100) / 100,
      projected: Math.round(blendedProjected * 100) / 100,
      confidence,
    };
  }

  return {
    projectedMin: Math.round(cappedMin * 100) / 100,
    projectedMax: Math.round(cappedMax * 100) / 100,
    projected: Math.round(projected * 100) / 100,
    confidence,
  };
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
  const { categories, totalIncome, totalBudget, currentDate, historicalTransactions = [] } = input;

  const dayOfMonth = getDayOfMonth(currentDate);
  const daysInMonth = getDaysInMonth(currentDate);
  const daysRemaining = daysInMonth - dayOfMonth;
  const percentMonthComplete = Math.round((dayOfMonth / daysInMonth) * 100);

  // Calculate overall spending ratios from historical data
  const overallRatios = calculateHistoricalSpendingRatios(
    historicalTransactions,
    dayOfMonth
  );

  const forecasts: CategoryForecast[] = [];
  const alerts: string[] = [];
  let totalProjectedMin = 0;
  let totalProjectedMax = 0;
  let totalProjected = 0;

  categories.forEach((cat) => {
    // Calculate category-specific ratios if we have enough data
    const categoryRatios = calculateHistoricalSpendingRatios(
      historicalTransactions,
      dayOfMonth,
      cat.categoryId
    );

    // Use category ratios if available, otherwise fall back to overall ratios
    const hasGoodCategoryData = historicalTransactions
      .filter(t => t.category_id === cat.categoryId).length >= 10;

    const ratiosToUse = hasGoodCategoryData ? categoryRatios : overallRatios;

    const { projectedMin, projectedMax, projected, confidence } = calculateProjection(
      cat.currentSpent,
      dayOfMonth,
      daysInMonth,
      cat.historicalAvg,
      ratiosToUse
    );

    const trend = determineTrend(projected, cat.lastMonthSpent, cat.historicalAvg);

    // Calculate vs last month
    const vsLastMonth = cat.lastMonthSpent !== null && cat.lastMonthSpent > 0
      ? ((projected - cat.lastMonthSpent) / cat.lastMonthSpent) * 100
      : 0;

    // Calculate vs budget (using projected average)
    const vsBudget = cat.budget !== null && cat.budget > 0
      ? ((projected / cat.budget) * 100)
      : null;

    forecasts.push({
      categoryId: cat.categoryId,
      categoryName: cat.categoryName,
      categoryColor: cat.categoryColor,
      categoryIcon: cat.categoryIcon,
      currentSpent: cat.currentSpent,
      projectedMin,
      projectedMax,
      projectedTotal: Math.round(projected * 100) / 100,
      confidence,
      trend,
      vsLastMonth: Math.round(vsLastMonth),
      vsBudget: vsBudget !== null ? Math.round(vsBudget) : null,
    });

    totalProjectedMin += projectedMin;
    totalProjectedMax += projectedMax;
    totalProjected += projected;

    // Generate alerts based on max projection
    if (vsBudget !== null) {
      const maxVsBudget = cat.budget !== null && cat.budget > 0
        ? (projectedMax / cat.budget) * 100
        : null;

      if (maxVsBudget !== null && maxVsBudget > 100) {
        const overBy = Math.round(projectedMax - (cat.budget || 0));
        alerts.push(`${cat.categoryName} może przekroczyć budżet o ~${overBy} zł`);
      } else if (vsBudget > 90) {
        alerts.push(`${cat.categoryName} zbliża się do limitu budżetu`);
      }
    }
  });

  // Sort forecasts by projected total (descending)
  forecasts.sort((a, b) => b.projectedTotal - a.projectedTotal);

  // Calculate projected savings (using average projection)
  const projectedSavings = totalIncome - totalProjected;

  // Overall alerts
  if (totalBudget > 0 && totalProjectedMax > totalBudget) {
    const overBy = Math.round(totalProjectedMax - totalBudget);
    if (totalProjected > totalBudget) {
      alerts.unshift(`Prognozowane przekroczenie budżetu o ~${overBy} zł`);
    } else {
      alerts.unshift(`Ryzyko przekroczenia budżetu (do ~${overBy} zł)`);
    }
  }

  return {
    totalProjectedMin: Math.round(totalProjectedMin * 100) / 100,
    totalProjectedMax: Math.round(totalProjectedMax * 100) / 100,
    totalProjected: Math.round(totalProjected * 100) / 100,
    totalBudget,
    projectedSavings: Math.round(projectedSavings * 100) / 100,
    categories: forecasts,
    alerts,
    daysRemaining,
    percentMonthComplete,
  };
}
