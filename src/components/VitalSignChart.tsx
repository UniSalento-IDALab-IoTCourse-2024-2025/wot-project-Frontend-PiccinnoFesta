import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
  ChartData
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface DataPoint {
  time: string;
  value: number;
}

interface VitalSignsChartProps {
  data: DataPoint[];
}

const VitalSignsChart: React.FC<VitalSignsChartProps> = ({ data }) => {
  const chartData: ChartData<'line'> = {
    labels: data.map((d) => d.time),
    datasets: [
      {
        label: 'Battiti per minuto',
        data: data.map((d) => d.value),
        fill: false,
        borderColor: '#3498db',
        tension: 0.1,
      },
    ],
  };

  const options: ChartOptions<'line'> = {
    responsive: true,
    plugins: {
      legend: { display: true },
      tooltip: { enabled: true },
    },
    scales: {
      y: {
        title: { display: true, text: 'BPM' },
        min: 40,
        max: 120,
      },
      x: {
        title: { display: true, text: 'Orario' },
      },
    },
  };

  return (
    <div style={{ width: '100%', height: '400px' }}>
      <Line data={chartData} options={options} />
    </div>
  );
};

export default VitalSignsChart;