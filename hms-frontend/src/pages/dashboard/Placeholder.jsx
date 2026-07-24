import { Construction } from 'lucide-react';

export default function Placeholder({ title }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-24 bg-white rounded-xl border border-dashed border-line">
      <div className="w-12 h-12 rounded-full bg-teal-50 text-teal-700 flex items-center justify-center mb-4">
        <Construction className="w-6 h-6" />
      </div>
      <h2 className="font-display text-lg font-semibold text-ink-900 mb-1">{title}</h2>
      <p className="text-sm text-ink-600 max-w-xs">
        This module's UI is coming up next — it will connect to the backend API once available.
      </p>
    </div>
  );
}
