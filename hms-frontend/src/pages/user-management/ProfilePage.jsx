import { useState, useEffect } from 'react';
import { Users, Edit2, Save } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const toast = useToast();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(user);

  useEffect(() => setForm(user), [user]);

  const profile = user ?? {
    name: 'Admin User', role: 'Administrator', email: 'admin@medicore.com',
    department: 'Administration', status: 'Active', lastLogin: 'Just now', memberSince: '—',
  };

  const handleSave = () => {
    if (!form?.name?.trim()) {
      toast.error('Name cannot be empty');
      return;
    }
    updateUser(form);
    setEditing(false);
    toast.success('Profile updated successfully');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Profile"
        description="Your personal account details."
        action={
          editing ? (
            <Button icon={Save} onClick={handleSave}>Save Changes</Button>
          ) : (
            <Button icon={Edit2} variant="secondary" onClick={() => setEditing(true)}>Edit Profile</Button>
          )
        }
      />

      <div className="flex items-center gap-4 max-w-2xl">
        <div className="w-20 h-20 rounded-full bg-teal-100 flex items-center justify-center shrink-0">
          <Users className="h-10 w-10 text-teal-600" />
        </div>
        <div>
          <p className="font-semibold text-lg text-ink-900">{profile.name}</p>
          <p className="text-sm text-ink-600">{profile.role}</p>
          <p className="text-xs text-ink-500 mt-1">{profile.email}</p>
        </div>
      </div>

      {!editing ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl border-t border-line pt-4">
          <div>
            <p className="text-xs text-ink-600 uppercase font-semibold">Department</p>
            <p className="text-sm font-medium text-ink-900 mt-1">{profile.department}</p>
          </div>
          <div>
            <p className="text-xs text-ink-600 uppercase font-semibold">Status</p>
            <p className="text-sm font-medium text-ink-900 mt-1">{profile.status}</p>
          </div>
          <div>
            <p className="text-xs text-ink-600 uppercase font-semibold">Last Login</p>
            <p className="text-sm font-medium text-ink-900 mt-1">{profile.lastLogin}</p>
          </div>
          <div>
            <p className="text-xs text-ink-600 uppercase font-semibold">Member Since</p>
            <p className="text-sm font-medium text-ink-900 mt-1">{profile.memberSince}</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl border-t border-line pt-4">
          <Input
            label="Full Name"
            value={form?.name ?? ''}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <Input
            label="Email"
            value={form?.email ?? ''}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <Input
            label="Department"
            value={form?.department ?? ''}
            onChange={(e) => setForm({ ...form, department: e.target.value })}
          />
          <Input
            label="Phone"
            value={form?.phone ?? ''}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
        </div>
      )}
    </div>
  );
}
