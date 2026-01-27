'use client';

import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import { formatCurrency } from '@/lib/utils';

interface AreaChartProps {
  data: {
    label: string;
    value: number;
  }[];
  color?: string;
  title?: string;
}

export function AreaChart({ data, color = '#3b82f6', title }: AreaChartProps) {
  const options: Highcharts.Options = {
    chart: {
      type: 'area',
      backgroundColor: 'transparent',
      height: 250,
    },
    title: {
      text: title || undefined,
      style: {
        fontSize: '14px',
        fontWeight: '600',
      },
    },
    xAxis: {
      categories: data.map((d) => d.label),
      labels: {
        style: {
          fontSize: '10px',
        },
        step: 5,
      },
      tickInterval: 5,
    },
    yAxis: {
      title: {
        text: undefined,
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
        return `<b>Dzień ${this.x}</b><br/>${formatCurrency(this.y || 0)}`;
      },
    },
    plotOptions: {
      area: {
        fillOpacity: 0.3,
        lineWidth: 2,
        marker: {
          enabled: false,
          states: {
            hover: {
              enabled: true,
            },
          },
        },
      },
    },
    legend: {
      enabled: false,
    },
    series: [{
      type: 'area',
      name: 'Wydatki',
      data: data.map((d) => d.value),
      color: color,
    }],
    credits: {
      enabled: false,
    },
  };

  return <HighchartsReact highcharts={Highcharts} options={options} />;
}
