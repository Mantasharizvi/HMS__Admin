export default function Toggle({ checked, onChange, label, hint, disabled = false }) {
  return (
    <label className={`flex items-center justify-between gap-4 ${disabled ? 'opacity-50' : 'cursor-pointer'}`}>
      {(label || hint) && (
        <span>
          {label && <span className="block text-sm font-medium text-ink-900">{label}</span>}
          {hint && <span className="block text-xs text-ink-600 mt-0.5">{hint}</span>}
        </span>
      )}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange?.(!checked)}
        className={`
          relative inline-flex h-6 w-11 shrink-0 items-center rounded-full
          transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2
          focus-visible:ring-teal-500 focus-visible:ring-offset-2
          ${checked ? 'bg-teal-600' : 'bg-line'}
          ${disabled ? 'cursor-not-allowed' : ''}
        `}
      >
        <span
          className={`
            inline-block h-4.5 w-4.5 transform rounded-full bg-white shadow
            transition-transform duration-150
            ${checked ? 'translate-x-6' : 'translate-x-1'}
          `}
        />
      </button>
    </label>
  );
}
