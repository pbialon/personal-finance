'use client';

import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import { formatCurrency } from '@/lib/utils';

interface TrendChartProps {
  categories: string[];
  series: {
    name: string;
    data: number[];
    color: string;
  }[];
  title?: string;
}

export function TrendChart({ categories, series, title }: TrendChartProps) {
  // If only one data point, show a nice column chart instead
  const hasMultiplePoints = categories.length > 1;

  const options: Highcharts.Options = {
    chart: {
      type: hasMultiplePoints ? 'areaspline' : 'column',
      backgroundColor: 'transparent',
      height: 280,
      style: {
        fontFamily: 'inherit',
      },
    },
    title: {
      text: title || undefined,
      style: {
        fontSize: '14px',
        fontWeight: '600',
      },
    },
    xAxis: {
      categories: categories,
      labels: {
        style: {
          fontSize: '12px',
          color: '#6b7280',
        },
      },
      lineColor: '#e5e7eb',
      tickColor: '#e5e7eb',
    },
    yAxis: {
      title: {
        text: undefined,
      },
      labels: {
        formatter: function () {
          const value = this.value as number;
          if (value >= 1000) {
            return (value / 1000).toFixed(0) + 'k zł';
          }
          return value + ' zł';
        },
        style: {
          fontSize: '11px',
          color: '#9ca3af',
        },
      },
      gridLineColor: '#f3f4f6',
      min: 0,
    },
    tooltip: {
      backgroundColor: 'white',
      borderColor: '#e5e7eb',
      borderRadius: 8,
      shadow: true,
      useHTML: true,
      formatter: function () {
        return `
          <div style="padding: 4px 8px;">
            <div style="font-size: 12px; color: #6b7280; margin-bottom: 4px;">${this.x}</div>
            <div style="font-size: 14px; font-weight: 600; color: ${this.series.color};">
              ${formatCurrency(this.y || 0)}
            </div>
          </div>
        `;
      },
    },
    plotOptions: {
      areaspline: {
        fillOpacity: 0.15,
        marker: {
          enabled: true,
          radius: 5,
          symbol: 'circle',
          fillColor: '#ffffff',
          lineWidth: 2,
          lineColor: undefined, // inherit from series
        },
        lineWidth: 3,
        states: {
          hover: {
            lineWidth: 3,
          },
        },
      },
      column: {
        borderRadius: 6,
        borderWidth: 0,
        maxPointWidth: 60,
      },
    },
    legend: {
      enabled: series.length > 1,
      align: 'center',
      verticalAlign: 'bottom',
      layout: 'horizontal',
      itemStyle: {
        fontSize: '12px',
        fontWeight: '500',
        color: '#374151',
      },
      itemHoverStyle: {
        color: '#111827',
      },
      symbolRadius: 4,
    },
    series: series.map((s, index) => ({
      type: (hasMultiplePoints ? 'areaspline' : 'column') as 'areaspline' | 'column',
      name: s.name,
      data: s.data,
      color: s.color,
      fillColor: hasMultiplePoints
        ? {
            linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
            stops: [
              [0, Highcharts.color(s.color).setOpacity(0.3).get('rgba') as string],
              [1, Highcharts.color(s.color).setOpacity(0.02).get('rgba') as string],
            ],
          }
        : s.color,
      zIndex: series.length - index,
    })),
    credits: {
      enabled: false,
    },
  };

  return <HighchartsReact highcharts={Highcharts} options={options} />;
}
