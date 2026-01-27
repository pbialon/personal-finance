'use client';

import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import { formatCurrency } from '@/lib/utils';

interface HorizontalBarChartProps {
  data: {
    name: string;
    value: number;
    count?: number;
  }[];
  color?: string;
}

export function HorizontalBarChart({ data, color = '#3b82f6' }: HorizontalBarChartProps) {
  const options: Highcharts.Options = {
    chart: {
      type: 'bar',
      backgroundColor: 'transparent',
      height: 250,
    },
    title: {
      text: undefined,
    },
    xAxis: {
      categories: data.map((d) => d.name),
      labels: {
        style: {
          fontSize: '11px',
        },
      },
    },
    yAxis: {
      min: 0,
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
      pointFormat: '{point.y:.0f} PLN',
    },
    plotOptions: {
      bar: {
        borderRadius: 4,
        dataLabels: {
          enabled: true,
          formatter: function () {
            return formatCurrency(this.y || 0);
          },
          style: {
            fontSize: '10px',
            fontWeight: 'normal',
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
      data: data.map((d) => d.value),
      color: color,
    }],
    credits: {
      enabled: false,
    },
  };

  return <HighchartsReact highcharts={Highcharts} options={options} />;
}
