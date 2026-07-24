import { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler,
} from 'chart.js';
import api from '../../services/api';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler);

const formatCompactINR = (v) => `₹${(v / 1000).toFixed(0)}k`;

export default function RevenueTrendChart() {
  const [chartData, setChartData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    api
      .get('/dashboard/revenue-chart')
      .then(({ data }) => {
        if (!cancelled) setChartData(data.data);
      })
      .catch(() => {
        if (!cancelled) setError('Could not load revenue data');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return <div className="h-72 flex items-center justify-center text-sm text-ink-500">{error}</div>;
  }
  if (!chartData) {
    return <div className="h-72 flex items-center justify-center text-sm text-ink-500">Loading…</div>;
  }

  const data = {
    labels: chartData.labels,
    datasets: [
      {
        label: 'OPD',
        data: chartData.opd,
        borderColor: '#14899E',
        backgroundColor: '#14899E33',
        tension: 0.35,
        fill: true,
        pointRadius: 3,
      },
      {
        label: 'IPD',
        data: chartData.ipd,
        borderColor: '#0B5566',
        backgroundColor: '#0B556633',
        tension: 0.35,
        fill: true,
        pointRadius: 3,
      },
      {
        label: 'Pharmacy',
        data: chartData.pharmacy,
        borderColor: '#B87A17',
        backgroundColor: '#B87A1733',
        tension: 0.35,
        fill: true,
        pointRadius: 3,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: { boxWidth: 10, boxHeight: 10, usePointStyle: true, pointStyle: 'circle', font: { size: 12 } },
      },
      tooltip: {
        callbacks: {
          label: (ctx) => ` ${ctx.dataset.label}: ${formatCompactINR(ctx.parsed.y)}`,
        },
      },
    },
    scales: {
      x: { grid: { display: false } },
      y: {
        grid: { color: '#E4E9ED' },
        beginAtZero: true,
        ticks: { callback: formatCompactINR },
      },
    },
  };

  return (
    <div className="h-72">
      <Line data={data} options={options} />
    </div>
  );
}
