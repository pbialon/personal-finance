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
  // Filter out zero values for cleaner display
  const filteredData = data.filter(d => d.y > 0);

  const options: Highcharts.Options = {
    chart: {
      type: 'pie',
      backgroundColor: 'transparent',
      height: 280,
    },
    title: {
      text: title || undefined,
      style: {
        fontSize: '14px',
        fontWeight: '600',
      },
    },
    tooltip: {
      backgroundColor: 'white',
      borderWidth: 0,
      borderRadius: 8,
      shadow: true,
      style: {
        fontSize: '13px',
      },
      pointFormat: '<b>{point.name}</b><br/>{point.y:,.2f} zł ({point.percentage:.1f}%)',
    },
    plotOptions: {
      pie: {
        allowPointSelect: true,
        cursor: 'pointer',
        dataLabels: {
          enabled: false,
        },
        showInLegend: true,
        states: {
          hover: {
            brightness: 0.1,
            halo: {
              size: 5,
            },
          },
          inactive: {
            opacity: 0.5,
          },
        },
      },
    },
    legend: {
      align: 'center',
      verticalAlign: 'bottom',
      layout: 'horizontal',
      itemStyle: {
        fontSize: '12px',
      },
    },
    series: [
      {
        type: 'pie',
        name: 'Wydatki',
        data: filteredData,
      },
    ],
    credits: {
      enabled: false,
    },
  };

  return <HighchartsReact highcharts={Highcharts} options={options} />;
}
