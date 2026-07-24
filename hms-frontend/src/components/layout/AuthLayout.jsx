import { Activity } from 'lucide-react';

export default function AuthLayout({ children, eyebrow, title, subtitle }) {
  return (
    <div className="min-h-screen flex">
      {/* Left panel — signature visual, hidden on small screens */}
      <div className="hidden lg:flex lg:w-[45%] bg-navy-900 relative overflow-hidden flex-col justify-between p-10 text-white">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-teal-500 flex items-center justify-center">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <span className="font-display font-semibold text-lg tracking-tight">MediCore HMS</span>
        </div>

        <div className="relative z-10">
          <p className="text-teal-400 text-sm font-medium mb-3">{eyebrow ?? 'Hospital Management System'}</p>
          <h2 className="font-display text-3xl font-semibold leading-snug mb-4 max-w-sm">
            One console for every ward, doctor, and patient record.
          </h2>
          <p className="text-white/60 text-sm max-w-sm">
            Admissions, billing, pharmacy, and diagnostics in a single view.
          </p>
        </div>

        {/* pulse-line signature */}
        <svg viewBox="0 0 400 80" className="w-full h-20 relative z-10" fill="none">
          <path
            d="M0 40 H120 L140 10 L160 70 L180 40 H260 L275 25 L290 55 L305 40 H400"
            stroke="#14899E"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="pulse-draw"
          />
        </svg>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 bg-surface">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2.5 mb-8 justify-center">
            <div className="w-8 h-8 rounded-lg bg-teal-700 flex items-center justify-center">
              <Activity className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="font-display font-semibold text-lg">MediCore HMS</span>
          </div>

          <h1 className="font-display text-2xl font-semibold text-ink-900 mb-1.5">{title}</h1>
          {subtitle && <p className="text-sm text-ink-600 mb-8">{subtitle}</p>}

          {children}
        </div>
      </div>
    </div>
  );
}
