import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

const options = {
  indexAxis: 'y',
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: { callbacks: { label: (ctx) => ` ${ctx.parsed.x} patients` } },
  },
  scales: {
    x: { grid: { color: '#E4E9ED' }, beginAtZero: true },
    y: { grid: { display: false } },
  },
};

/** `labels`, `values` are parallel arrays. */
export default function DepartmentLoadChart({ labels = [], values = [] }) {
  if (!labels.length) {
    return (
      <div className="h-56 flex items-center justify-center text-sm text-ink-500">
        No department data yet.
      </div>
    );
  }

  const data = {
    labels,
    datasets: [{ data: values, backgroundColor: '#14899E', borderRadius: 4, barThickness: 14 }],
  };

  return (
    <div className="h-56">
      <Bar data={data} options={options} />
    </div>
  );
}
