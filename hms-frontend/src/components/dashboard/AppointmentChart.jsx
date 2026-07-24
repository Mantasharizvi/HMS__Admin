import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip } from 'chart.js';

ChartJS.register(ArcElement, Tooltip);

const options = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: (ctx) => ` ${ctx.label}: ${ctx.parsed}`,
      },
    },
  },
};

/** `labels`, `values`, `colors` are parallel arrays. */
export default function AppointmentChart({ labels = [], values = [], colors = [] }) {
  const total = values.reduce((a, b) => a + b, 0);

  if (!labels.length) {
    return (
      <div className="h-44 flex items-center justify-center text-sm text-ink-500">
        No appointments yet.
      </div>
    );
  }

  const data = {
    labels,
    datasets: [{ data: values, backgroundColor: colors, borderWidth: 0, cutout: '72%' }],
  };

  return (
    <div>
      <div className="relative h-44">
        <Doughnut data={data} options={options} />
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="font-display text-xl font-semibold text-ink-900">{total}</span>
          <span className="text-xs text-ink-600">Appointments</span>
        </div>
      </div>

      <ul className="mt-4 space-y-2">
        {labels.map((label, i) => (
          <li key={label} className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 text-ink-600">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: colors[i] }} />
              {label}
            </span>
            <span className="font-medium text-ink-900">{values[i]}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
