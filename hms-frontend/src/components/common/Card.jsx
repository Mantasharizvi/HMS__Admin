export default function Card({ title, action, children, className = '', accent }) {
  return (
    <div
      className={`bg-white rounded-xl border border-line p-5 ${accent ? `border-l-4` : ''} ${className}`}
      style={accent ? { borderLeftColor: accent } : undefined}
    >
      {(title || action) && (
        <div className="flex items-center justify-between mb-4">
          {title && <h3 className="font-display font-semibold text-ink-900">{title}</h3>}
          {action}
        </div>
      )}
      {children}
    </div>
  );
}
