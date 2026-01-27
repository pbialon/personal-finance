'use client';

import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';

interface PieChartProps {
  data: {
    name: string;
    y: number;
    color: string;
  }[];
  title?: string;
}

export function PieChart({ data, title }: PieChartProps) {
  const options: Highcharts.Options = {
    chart: {
      type: 'pie',
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
    tooltip: {
      pointFormat: '<b>{point.name}</b><br/>{point.y:.2f} PLN ({point.percentage:.1f}%)',
    },
    plotOptions: {
      pie: {
        allowPointSelect: true,
        cursor: 'pointer',
        dataLabels: {
          enabled: true,
          format: '<b>{point.name}</b>: {point.percentage:.1f}%',
          style: {
            fontSize: '11px',
          },
        },
        showInLegend: true,
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
    series: [
      {
        type: 'pie',
        name: 'Wydatki',
        data: data,
      },
    ],
    credits: {
      enabled: false,
    },
  };

  return <HighchartsReact highcharts={Highcharts} options={options} />;
}
