import { useEffect, useState } from 'react';
import { Users, Edit2, Settings, KeyRound } from 'lucide-react';
import Modal from './Modal';
import Button from './Button';
import Input from './Input';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

const emptyPasswordForm = { currentPassword: '', newPassword: '', confirmPassword: '' };

/**
 * Reusable profile popup: view details, edit profile, or open account settings.
 * Used both for "My Profile" in the header and for viewing other users from
 * the User Management list, so the UX is identical everywhere.
 *
 * Password change behaves differently depending on WHO is being edited:
 * - isOwnProfile=true  (Header -> My Profile, any role): shows Current/New/
 *   Confirm Password. Verifies the current password server-side via
 *   PUT /api/auth/change-password.
 * - isOwnProfile=false (Admin -> User Management -> Profile -> Edit, on
 *   SOMEONE ELSE'S account): shows only New/Confirm Password — no current
 *   password needed, since this is an admin override. Calls onSetPassword.
 */
export default function UserProfileModal({
  isOpen,
  onClose,
  user,
  onSave,
  editableRole = true,
  isOwnProfile = false,
  onSetPassword, // async (userId, newPassword) => { success, message }
}) {
  const toast = useToast();
  const { changePassword } = useAuth();
  const [mode, setMode] = useState('view'); // view | edit | settings
  const [form, setForm] = useState(user);
  const [passwordForm, setPasswordForm] = useState(emptyPasswordForm);
  const [passwordErrors, setPasswordErrors] = useState({});
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setForm(user);
      setMode('view');
      setPasswordForm(emptyPasswordForm);
      setPasswordErrors({});
    }
  }, [isOpen, user]);

  const handleClose = () => {
    setMode('view');
    setPasswordForm(emptyPasswordForm);
    setPasswordErrors({});
    onClose?.();
  };

  const validatePasswordForm = () => {
    const errors = {};
    const wantsPasswordChange =
      passwordForm.newPassword || passwordForm.confirmPassword || passwordForm.currentPassword;

    if (!wantsPasswordChange) return { errors, wantsPasswordChange: false };

    if (isOwnProfile && !passwordForm.currentPassword) {
      errors.currentPassword = 'Enter your current password';
    }
    if (!passwordForm.newPassword || passwordForm.newPassword.length < 6) {
      errors.newPassword = 'New password must be at least 6 characters';
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    return { errors, wantsPasswordChange: true };
  };

  const handleSave = async () => {
    if (!form?.name?.trim()) {
      toast.error('Name cannot be empty');
      return;
    }

    const { errors, wantsPasswordChange } = validatePasswordForm();
    if (wantsPasswordChange && Object.keys(errors).length > 0) {
      setPasswordErrors(errors);
      return;
    }

    // Save the regular profile fields first (name/email/department/role/status).
    onSave?.(form);

    if (wantsPasswordChange) {
      setSavingPassword(true);
      let result;
      if (isOwnProfile) {
        result = await changePassword(passwordForm.currentPassword, passwordForm.newPassword);
      } else {
        result = (await onSetPassword?.(user.id || user._id, passwordForm.newPassword)) ?? { success: false };
      }
      setSavingPassword(false);

      if (!result.success) {
        // Profile fields already saved above; only the password step failed.
        if (isOwnProfile) setPasswordErrors({ currentPassword: result.message });
        toast.error(result.message || 'Failed to update password');
        return; // stay in edit mode so they can retry the password fields
      }
    }

    setPasswordForm(emptyPasswordForm);
    setPasswordErrors({});
    setMode('view');
    toast.success(wantsPasswordChange ? 'Profile and password updated successfully' : 'Profile updated successfully');
  };

  if (!user) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={mode === 'settings' ? 'Account Settings' : 'User Profile'} size="lg">
      {mode === 'view' && (
        <>
          <div className="px-6 py-4 space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-teal-100 flex items-center justify-center">
                <Users className="h-10 w-10 text-teal-600" />
              </div>
              <div>
                <p className="font-semibold text-lg text-ink-900">{user.name}</p>
                <p className="text-sm text-ink-600">{user.role}</p>
                <p className="text-xs text-ink-500 mt-1">{user.email}</p>
              </div>
            </div>
            <div className="border-t border-line pt-4 grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-ink-600 uppercase font-semibold">Department</p>
                <p className="text-sm font-medium text-ink-900 mt-1">{user.department}</p>
              </div>
              <div>
                <p className="text-xs text-ink-600 uppercase font-semibold">Status</p>
                <p className="mt-1">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${user.status === 'Active' ? 'bg-success-50 text-success-600' : 'bg-danger-50 text-danger-600'}`}>
                    {user.status}
                  </span>
                </p>
              </div>
              <div>
                <p className="text-xs text-ink-600 uppercase font-semibold">Last Login</p>
                <p className="text-sm font-medium text-ink-900 mt-1">{user.lastLogin}</p>
              </div>
              <div>
                <p className="text-xs text-ink-600 uppercase font-semibold">Member Since</p>
                <p className="text-sm font-medium text-ink-900 mt-1">{user.memberSince}</p>
              </div>
            </div>
          </div>
          <div className="flex gap-3 px-6 py-4 border-t border-line bg-surface rounded-b-xl">
            <Button icon={Edit2} onClick={() => setMode('edit')} fullWidth>
              Edit Profile
            </Button>
            <Button variant="secondary" icon={Settings} onClick={() => setMode('settings')} fullWidth>
              Settings
            </Button>
          </div>
        </>
      )}

      {mode === 'edit' && form && (
        <>
          <div className="px-6 py-4 space-y-4">
            <Input label="Full Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <Input label="Department" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
            {editableRole && (
              <Input label="Role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} />
            )}
            <div>
              <label className="block text-sm font-medium text-ink-900 mb-1.5">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm text-ink-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>

            <div className="border-t border-line pt-4">
              <div className="flex items-center gap-2 mb-3">
                <KeyRound className="w-4 h-4 text-ink-500" />
                <h4 className="font-semibold text-ink-900 text-sm">
                  {isOwnProfile ? 'Change Password' : 'Set New Password'}
                </h4>
              </div>
              <p className="text-xs text-ink-500 mb-3">
                {isOwnProfile
                  ? 'Leave blank if you don\u2019t want to change your password.'
                  : 'Leave blank to keep this user\u2019s current password. As an admin, you can set a new one without knowing the old one.'}
              </p>
              <div className="space-y-3">
                {isOwnProfile && (
                  <Input
                    label="Current Password"
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    error={passwordErrors.currentPassword}
                  />
                )}
                <Input
                  label="New Password"
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  error={passwordErrors.newPassword}
                  hint="At least 6 characters"
                />
                <Input
                  label="Confirm New Password"
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  error={passwordErrors.confirmPassword}
                />
              </div>
            </div>
          </div>
          <div className="flex gap-3 px-6 py-4 border-t border-line bg-surface rounded-b-xl">
            <Button onClick={handleSave} fullWidth disabled={savingPassword}>
              {savingPassword ? 'Saving…' : 'Save Changes'}
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setForm(user);
                setPasswordForm(emptyPasswordForm);
                setPasswordErrors({});
                setMode('view');
              }}
              fullWidth
            >
              Cancel
            </Button>
          </div>
        </>
      )}

      {mode === 'settings' && (
        <>
          <div className="px-6 py-4 space-y-4">
            <div>
              <h4 className="font-semibold text-ink-900 mb-3">System Settings</h4>
              <div className="space-y-3">
                <label className="flex items-center gap-2">
                  <input type="checkbox" defaultChecked className="w-4 h-4 rounded border-line" />
                  <span className="text-sm text-ink-700">Email notifications</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" defaultChecked className="w-4 h-4 rounded border-line" />
                  <span className="text-sm text-ink-700">SMS alerts</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="w-4 h-4 rounded border-line" />
                  <span className="text-sm text-ink-700">Two-factor authentication</span>
                </label>
              </div>
            </div>
            <div className="border-t border-line pt-4">
              <h4 className="font-semibold text-ink-900 mb-3">Privacy Settings</h4>
              <div className="space-y-3">
                <label className="flex items-center gap-2">
                  <input type="checkbox" defaultChecked className="w-4 h-4 rounded border-line" />
                  <span className="text-sm text-ink-700">Show profile to other users</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" defaultChecked className="w-4 h-4 rounded border-line" />
                  <span className="text-sm text-ink-700">Allow activity tracking</span>
                </label>
              </div>
            </div>
          </div>
          <div className="flex gap-3 px-6 py-4 border-t border-line bg-surface rounded-b-xl">
            <Button onClick={() => { toast.success('Settings saved'); setMode('view'); }} fullWidth>
              Save Settings
            </Button>
            <Button variant="secondary" onClick={() => setMode('view')} fullWidth>
              Back
            </Button>
          </div>
        </>
      )}
    </Modal>
  );
}
