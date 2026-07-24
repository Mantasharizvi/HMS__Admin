import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Lock, CheckCircle2 } from 'lucide-react';
import AuthLayout from '../../components/layout/AuthLayout';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { useAuth } from '../../context/AuthContext';

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { resetPassword } = useAuth();

  const [form, setForm] = useState({ password: '', confirmPassword: '' });
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const validate = () => {
    const errs = {};
    if (!form.password) errs.password = 'New password is required';
    else if (form.password.length < 6) errs.password = 'Must be at least 6 characters';
    if (!form.confirmPassword) errs.confirmPassword = 'Please confirm your new password';
    else if (form.password && form.confirmPassword !== form.password) {
      errs.confirmPassword = 'Passwords do not match';
    }
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!validate()) return;

    setLoading(true);
    const res = await resetPassword(token, form.password);
    setLoading(false);

    if (res.success) {
      setDone(true);
    } else {
      // Expired/invalid token, etc. — the backend message is user-facing.
      setFormError(res.message);
    }
  };

  if (done) {
    return (
      <AuthLayout
        title="Password reset"
        subtitle="Your password has been changed successfully."
      >
        <div className="text-center py-4">
          <div className="w-14 h-14 rounded-full bg-teal-50 text-teal-700 flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <Button fullWidth onClick={() => navigate('/login')}>
            Continue to sign in
          </Button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Set a new password"
      subtitle="Choose a new password for your MediCore HMS account."
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <Input
          label="New password"
          type="password"
          icon={Lock}
          placeholder="Enter your new password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          error={fieldErrors.password}
        />
        <Input
          label="Confirm new password"
          type="password"
          icon={Lock}
          placeholder="Re-enter your new password"
          value={form.confirmPassword}
          onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
          error={fieldErrors.confirmPassword}
        />

        {formError && (
          <div className="text-sm text-danger-600 bg-danger-50 rounded-lg px-3 py-2">
            {formError}
            <div className="mt-1">
              <Link to="/forgot-password" className="font-medium underline">
                Request a new reset link
              </Link>
            </div>
          </div>
        )}

        <Button type="submit" fullWidth loading={loading}>
          Reset password
        </Button>
      </form>

      <Link
        to="/login"
        className="flex items-center justify-center gap-1.5 text-sm text-ink-600 hover:text-ink-900 mt-8"
      >
        Back to sign in
      </Link>
    </AuthLayout>
  );
}