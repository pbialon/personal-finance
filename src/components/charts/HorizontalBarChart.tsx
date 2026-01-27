'use client';

import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';

interface HorizontalBarChartProps {
  data: {
    name: string;
    value: number;
    count?: number;
  }[];
  color?: string;
}

function formatCompactCurrency(amount: number): string {
  if (amount >= 1000) {
    return `${(amount / 1000).toFixed(1).replace('.0', '')}k`;
  }
  return Math.round(amount).toString();
}

export function HorizontalBarChart({ data, color = '#3b82f6' }: HorizontalBarChartProps) {
  const maxValue = Math.max(...data.map((d) => d.value));
  const maxIndex = data.findIndex((d) => d.value === maxValue);

  // Day emoji mapping for Polish day names
  const dayEmojis: Record<string, string> = {
    'Poniedziałek': '📅',
    'Wtorek': '📅',
    'Środa': '📅',
    'Czwartek': '📅',
    'Piątek': '🎉',
    'Sobota': '🌴',
    'Niedziela': '☀️',
  };

  const options: Highcharts.Options = {
    chart: {
      type: 'bar',
      backgroundColor: 'transparent',
      height: 280,
      animation: {
        duration: 500,
      },
    },
    title: {
      text: undefined,
    },
    xAxis: {
      categories: data.map((d) => {
        const emoji = dayEmojis[d.name] || '';
        return `${emoji} ${d.name}`;
      }),
      labels: {
        style: {
          fontSize: '12px',
          fontWeight: '500',
        },
        useHTML: true,
      },
      lineWidth: 0,
      tickWidth: 0,
    },
    yAxis: {
      min: 0,
      title: {
        text: undefined,
      },
      labels: {
        enabled: false,
      },
      gridLineWidth: 0,
    },
    tooltip: {
      useHTML: true,
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderRadius: 8,
      borderWidth: 0,
      shadow: true,
      formatter: function () {
        const ctx = this as unknown as { point: Highcharts.Point };
        const point = ctx.point;
        const dataItem = data[point.index];
        return `
          <div style="padding: 8px 12px;">
            <div style="font-weight: 600; margin-bottom: 4px;">${dataItem.name}</div>
            <div style="font-size: 16px; color: ${color};">${point.y?.toLocaleString('pl-PL')} PLN</div>
            ${dataItem.count ? `<div style="font-size: 11px; color: #6b7280; margin-top: 2px;">${dataItem.count} transakcji</div>` : ''}
          </div>
        `;
      },
    },
    plotOptions: {
      bar: {
        borderRadius: 6,
        pointPadding: 0.15,
        groupPadding: 0.1,
        dataLabels: {
          enabled: true,
          formatter: function () {
            return formatCompactCurrency(this.y || 0) + ' zł';
          },
          style: {
            fontSize: '11px',
            fontWeight: '600',
            textOutline: 'none',
          },
          color: '#374151',
        },
        states: {
          hover: {
            brightness: 0.1,
          },
        },
      },
    },
    legend: {
      enabled: false,
    },
    series: [{
      type: 'bar',
      name: 'Wydatki',
      data: data.map((d, idx) => ({
        y: d.value,
        color: idx === maxIndex
          ? {
              linearGradient: { x1: 0, x2: 1, y1: 0, y2: 0 },
              stops: [
                [0, '#f59e0b'],
                [1, '#fbbf24'],
              ] as [number, string][],
            }
          : {
              linearGradient: { x1: 0, x2: 1, y1: 0, y2: 0 },
              stops: [
                [0, color],
                [1, Highcharts.color(color).brighten(0.2).get() as string],
              ] as [number, string][],
            },
        borderColor: idx === maxIndex ? '#f59e0b' : undefined,
        borderWidth: idx === maxIndex ? 2 : 0,
      })),
      animation: {
        duration: 800,
      },
    }],
    credits: {
      enabled: false,
    },
  };

  return <HighchartsReact highcharts={Highcharts} options={options} />;
}
