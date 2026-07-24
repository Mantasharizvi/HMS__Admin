import { Loader2 } from 'lucide-react';

const variants = {
  primary: 'bg-teal-700 text-white hover:bg-teal-600 focus-visible:ring-teal-500',
  secondary: 'bg-white text-ink-900 border border-line hover:bg-surface focus-visible:ring-teal-500',
  danger: 'bg-danger-600 text-white hover:opacity-90 focus-visible:ring-danger-600',
  ghost: 'bg-transparent text-teal-700 hover:bg-teal-50 focus-visible:ring-teal-500',
  blue: 'bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-500',
};

const sizes = {
  sm: 'text-sm px-3 py-1.5 gap-1.5',
  md: 'text-sm px-4 py-2.5 gap-2',
  lg: 'text-base px-5 py-3 gap-2',
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  loading = false,
  disabled = false,
  fullWidth = false,
  type = 'button',
  className = '',
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center font-medium rounded-lg
        transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${className}
      `}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        Icon && <Icon className="w-4 h-4" />
      )}
      {children}
    </button>
  );
}
