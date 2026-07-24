import Modal from './Modal';
import Button from './Button';

/**
 * Generic modal shell for create/edit forms. Every "Add X" popup in the app
 * (Patient Registration, Admission Form, Add Medicine, Add User, ...) is built
 * from this one component so they all share the same layout, spacing and
 * save/cancel behaviour.
 */
export default function FormModal({
  isOpen,
  onClose,
  title,
  children,
  onSubmit,
  submitLabel = 'Save',
  cancelLabel = 'Cancel',
  submitting = false,
  size = 'lg',
}) {
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit?.(e);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size={size}>
      <form onSubmit={handleSubmit} noValidate>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">{children}</div>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button type="submit" loading={submitting}>
            {submitLabel}
          </Button>
          <Button type="button" variant="secondary" onClick={onClose} disabled={submitting}>
            {cancelLabel}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
