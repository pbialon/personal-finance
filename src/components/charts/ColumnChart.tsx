'use client';

import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import { formatCurrency } from '@/lib/utils';

interface ColumnChartProps {
  categories: string[];
  series: {
    name: string;
    data: number[];
    color: string;
  }[];
  title?: string;
}

export function ColumnChart({ categories, series, title }: ColumnChartProps) {
  const options: Highcharts.Options = {
    chart: {
      type: 'column',
      backgroundColor: 'transparent',
      height: 300,
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
      crosshair: true,
      labels: {
        style: {
          fontSize: '11px',
        },
      },
    },
    yAxis: {
      min: 0,
      title: {
        text: 'Kwota (PLN)',
        style: {
          fontSize: '11px',
        },
      },
      labels: {
        formatter: function () {
          return formatCurrency(this.value as number);
        },
        style: {
          fontSize: '11px',
        },
      },
    },
    tooltip: {
      formatter: function () {
        return `<b>${this.series.name}</b><br/>${this.x}: ${formatCurrency(this.y || 0)}`;
      },
    },
    plotOptions: {
      column: {
        pointPadding: 0.2,
        borderWidth: 0,
        borderRadius: 4,
      },
    },
    legend: {
      align: 'center',
      verticalAlign: 'bottom',
      layout: 'horizontal',
      itemStyle: {
        fontSize: '11px',
      },
    },
    series: series.map((s) => ({
      type: 'column' as const,
      ...s,
    })),
    credits: {
      enabled: false,
    },
  };

  return <HighchartsReact highcharts={Highcharts} options={options} />;
}
