import Modal from './Modal';
import Button from './Button';

/**
 * Generic confirmation dialog, used before destructive actions (delete, discharge, etc).
 * Keeps the confirm/cancel UX identical everywhere instead of ad-hoc `window.confirm()` calls.
 */
export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  message = 'This action cannot be undone.',
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  variant = 'danger',
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="px-6 py-4">
        <p className="text-sm text-ink-700">{message}</p>
      </div>
      <div className="flex gap-3 px-6 py-4 border-t border-line bg-surface rounded-b-xl">
        <Button variant={variant} onClick={onConfirm} fullWidth>
          {confirmLabel}
        </Button>
        <Button variant="secondary" onClick={onClose} fullWidth>
          {cancelLabel}
        </Button>
      </div>
    </Modal>
  );
}
