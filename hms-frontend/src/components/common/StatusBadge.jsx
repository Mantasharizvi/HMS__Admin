const styles = {
  success: 'bg-success-50 text-success-600',
  warning: 'bg-warning-50 text-warning-600',
  danger: 'bg-danger-50 text-danger-600',
  neutral: 'bg-surface text-ink-600',
  info: 'bg-teal-50 text-teal-700',
};

export default function StatusBadge({ status = 'neutral', children }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
      {children}
    </span>
  );
}
