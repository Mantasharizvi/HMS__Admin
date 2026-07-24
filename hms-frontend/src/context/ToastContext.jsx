import { createContext, useCallback, useContext, useState } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, XCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

const icons = { success: CheckCircle2, error: XCircle, info: Info };
const styles = {
  success: 'bg-white border-success-600/30 text-success-600',
  error: 'bg-white border-danger-600/30 text-danger-600',
  info: 'bg-white border-teal-600/30 text-teal-700',
};

let idCounter = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message, type = 'success', duration = 3500) => {
    const id = ++idCounter;
    setToasts((current) => [...current, { id, message, type }]);
    if (duration) {
      setTimeout(() => dismiss(id), duration);
    }
    return id;
  }, [dismiss]);

  const value = {
    showToast,
    success: (msg, duration) => showToast(msg, 'success', duration),
    error: (msg, duration) => showToast(msg, 'error', duration),
    info: (msg, duration) => showToast(msg, 'info', duration),
    dismiss,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      {createPortal(
        <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 w-full max-w-sm px-4 sm:px-0">
          {toasts.map((t) => {
            const Icon = icons[t.type] ?? Info;
            return (
              <div
                key={t.id}
                role="status"
                className={`flex items-start gap-3 rounded-xl border shadow-lg px-4 py-3 animate-[fadeIn_0.15s_ease-out] ${styles[t.type]}`}
              >
                <Icon className="w-5 h-5 shrink-0 mt-0.5" />
                <p className="text-sm font-medium text-ink-900 flex-1">{t.message}</p>
                <button
                  onClick={() => dismiss(t.id)}
                  className="text-ink-400 hover:text-ink-700 shrink-0"
                  aria-label="Dismiss notification"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
}
