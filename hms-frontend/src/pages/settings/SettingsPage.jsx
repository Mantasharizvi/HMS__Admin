import { useState, useEffect } from 'react';
import {
  User,
  Building2,
  Users,
  Bell,
  ShieldCheck,
  Camera,
  Plus,
  X,
  KeyRound,
} from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Toggle from '../../components/common/Toggle';
import StatusBadge from '../../components/common/StatusBadge';
import { useAuth } from '../../context/AuthContext';
import { useUserManagement } from '../../context/UserManagementContext';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';

const TABS = [
  { key: 'profile', label: 'Profile', icon: User },
  { key: 'hospital', label: 'Hospital info', icon: Building2 },
  { key: 'users', label: 'Users & roles', icon: Users },
  { key: 'notifications', label: 'Notifications', icon: Bell },
  { key: 'security', label: 'Security', icon: ShieldCheck },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile');

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6 items-start">
      <nav className="bg-white rounded-xl border border-line p-2 lg:sticky lg:top-20">
        <ul className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <li key={tab.key} className="shrink-0">
                <button
                  onClick={() => setActiveTab(tab.key)}
                  className={`
                    w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-sm font-medium
                    transition-colors duration-150 whitespace-nowrap
                    ${isActive ? 'bg-teal-700 text-white' : 'text-ink-600 hover:bg-surface'}
                  `}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div>
        {activeTab === 'profile' && <ProfileTab />}
        {activeTab === 'hospital' && <HospitalTab />}
        {activeTab === 'users' && <UsersRolesTab />}
        {activeTab === 'notifications' && <NotificationsTab />}
        {activeTab === 'security' && <SecurityTab />}
      </div>
    </div>
  );
}

/* ----------------------------- Profile tab ----------------------------- */

function ProfileTab() {
  const { user, updateUser } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    role: user?.role || '',
    department: user?.department || 'Administration',
  });
  const [saved, setSaved] = useState(false);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
    setSaved(false);
  }

  function handleSave(e) {
    e.preventDefault();
    // Persists to MongoDB via PUT /api/users/:id (see AuthContext.updateUser)
    updateUser({ name: form.name, email: form.email, phone: form.phone, department: form.department });
    setSaved(true);
    toast.success('Profile updated');
  }

  return (
    <Card title="Your profile">
      <form onSubmit={handleSave} className="space-y-6">
        <div className="flex items-center gap-4">
  <div className="w-16 h-16 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-display font-semibold text-xl">
    {form.name?.[0] ?? 'A'}
  </div>
  <div>
    <p className="text-sm font-medium text-ink-900">{form.name}</p>
  </div>
</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Full name" value={form.name} onChange={(e) => update('name', e.target.value)} />
          <Input
            label="Email address"
            type="email"
            value={form.email}
            onChange={(e) => update('email', e.target.value)}
          />
          <Input label="Phone number" value={form.phone} onChange={(e) => update('phone', e.target.value)} />
          <Input label="Role" value={form.role} disabled hint="Contact an admin to change your role" />
          <Select
            label="Department"
            value={form.department}
            onChange={(e) => update('department', e.target.value)}
            options={[
              { value: 'Administration', label: 'Administration' },
              { value: 'Cardiology', label: 'Cardiology' },
              { value: 'Orthopedics', label: 'Orthopedics' },
              { value: 'Neurology', label: 'Neurology' },
              { value: 'General', label: 'General' },
              { value: 'Not recommended', label: 'Not recommended' },
            ]}
          />
        </div>

        <div className="flex items-center gap-3 pt-2 border-t border-line">
          <Button type="submit" className="mt-4">
            Save changes
          </Button>
          {saved && <span className="text-sm text-success-600 mt-4">Saved</span>}
        </div>
      </form>
    </Card>
  );
}

/* --------------------------- Hospital info tab -------------------------- */

function HospitalTab() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(null);
  const [newDept, setNewDept] = useState('');

  useEffect(() => {
    api.get('/settings/hospital')
      .then((res) => setForm(res.data.data))
      .catch(() => toast.error('Could not load hospital settings'))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function saveDetails() {
    try {
      const { data } = await api.put('/settings/hospital', form);
      setForm(data.data);
      toast.success('Hospital details saved');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save hospital details');
    }
  }

 async function addDept(e) {
  e.preventDefault();
  const name = newDept.trim();
  const isDuplicate = form.departments.some((d) => d.toLowerCase() === name.toLowerCase());
  if (!name || isDuplicate) {
    if (isDuplicate) toast.error(`"${name}" is already a registered department`);
    return;
  }
  try {
    const { data } = await api.put('/settings/hospital', { departments: [...form.departments, name] });
    setForm(data.data);
    setNewDept('');
  } catch (err) {
    toast.error(err.response?.data?.message || 'Failed to add department');
  }
}

  async function removeDept(name) {
    try {
      const { data } = await api.put('/settings/hospital', {
        departments: form.departments.filter((x) => x !== name),
      });
      setForm(data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove department');
    }
  }

  if (loading || !form) {
    return <Card title="Hospital details"><p className="text-sm text-ink-600">Loading…</p></Card>;
  }

  return (
    <div className="space-y-6">
      <Card title="Hospital details">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Hospital name" value={form.hospitalName} onChange={(e) => update('hospitalName', e.target.value)} />
          <Input label="Registration number" value={form.registrationNumber} onChange={(e) => update('registrationNumber', e.target.value)} />
          <Input label="Contact email" type="email" value={form.contactEmail} onChange={(e) => update('contactEmail', e.target.value)} />
          <Input label="Contact phone" value={form.contactPhone} onChange={(e) => update('contactPhone', e.target.value)} />
          <div className="sm:col-span-2">
            <Input label="Address" value={form.address} onChange={(e) => update('address', e.target.value)} />
          </div>
          <Select
            label="Time zone"
            value={form.timezone}
            onChange={(e) => update('timezone', e.target.value)}
            options={[{ value: 'Asia/Kolkata', label: 'Asia/Kolkata (IST, UTC+5:30)' }]}
          />
          <Select
            label="Currency"
            value={form.currency}
            onChange={(e) => update('currency', e.target.value)}
            options={[{ value: 'INR', label: '₹ Indian Rupee (INR)' }]}
          />
        </div>
        <div className="pt-4 mt-4 border-t border-line">
          <Button onClick={saveDetails}>Save changes</Button>
        </div>
      </Card>

      <Card title="Departments" action={<span className="text-xs text-ink-600">{form.departments.length} total</span>}>
        <div className="flex flex-wrap gap-2 mb-4">
          {form.departments.map((d) => (
            <span
              key={d}
              className="inline-flex items-center gap-1.5 pl-3 pr-1.5 py-1.5 rounded-full bg-surface text-sm text-ink-900 border border-line"
            >
              {d}
              <button
                onClick={() => removeDept(d)}
                className="w-4 h-4 rounded-full flex items-center justify-center text-ink-400 hover:text-danger-600 hover:bg-danger-50"
                aria-label={`Remove ${d}`}
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
        <form onSubmit={addDept} className="flex gap-2 max-w-sm">
          <Input
            placeholder="e.g. Radiology"
            value={newDept}
            onChange={(e) => setNewDept(e.target.value)}
            className="!py-2"
          />
          <Button type="submit" icon={Plus} variant="secondary">
            Add
          </Button>
        </form>
      </Card>
    </div>
  );
}

/* --------------------------- Users & roles tab -------------------------- */

function UsersRolesTab() {
  const { usersList, rolesList } = useUserManagement();

  return (
    <Card
      title="Users & roles"
      action={
        <a href="/users">
          <Button variant="secondary" size="sm">
            Open full user management
          </Button>
        </a>
      }
    >
      <p className="text-sm text-ink-600 mb-5">
        Roles currently registered in the database ({usersList.length} total users). Add, edit, or remove
        individual users and permissions from the full user management page.
      </p>
      <div className="divide-y divide-line border border-line rounded-lg overflow-hidden">
        {rolesList.map((role) => (
          <div key={role.id || role.name} className="flex items-center justify-between px-4 py-3">
            <div>
              <p className="text-sm font-medium text-ink-900">{role.name}</p>
              <p className="text-xs text-ink-600">
                {role.permissions?.includes('All')
                  ? 'All modules'
                  : `${role.permissionsSummary} permission(s) enabled`}
              </p>
            </div>
            <StatusBadge status="info">{role.users} users</StatusBadge>
          </div>
        ))}
        {rolesList.length === 0 && (
          <p className="px-4 py-6 text-sm text-ink-600">No roles registered yet.</p>
        )}
      </div>
    </Card>
  );
}

/* --------------------------- Notifications tab --------------------------- */

const DEFAULT_PREFS = {
  lowStock: { email: true, push: true },
  appointments: { email: true, push: true },
  billing: { email: true, push: false },
};

function NotificationsTab() {
  const { user, updateUser } = useAuth();
  const toast = useToast();
  const [prefs, setPrefs] = useState(user?.notificationPrefs || DEFAULT_PREFS);

  const rows = [
    { key: 'lowStock', label: 'Low medicine stock', hint: 'Alerts when inventory drops below threshold' },
    { key: 'appointments', label: 'Appointment updates', hint: 'New bookings, reschedules, cancellations' },
    { key: 'billing', label: 'Billing & payments', hint: 'Pending bills and payment confirmations' },
  ];

  function toggle(rowKey, channel) {
    setPrefs((p) => ({
      ...p,
      [rowKey]: { ...p[rowKey], [channel]: !p[rowKey][channel] },
    }));
  }

  function savePrefs() {
    // Persisted to the user's DB record; the backend emails whichever
    // registered address opted in to each alert category (see notify.js).
    updateUser({ notificationPrefs: prefs });
    toast.success('Notification preferences saved. Alerts will be emailed to your registered address.');
  }

  return (
    <Card title="Notification preferences">
      <div className="hidden sm:grid grid-cols-[1fr_70px_70px] gap-4 px-1 pb-3 mb-3 border-b border-line text-xs font-medium text-ink-600">
        <span>Alert type</span>
        <span className="text-center">Email</span>
        <span className="text-center">Push</span>
      </div>
      <div className="space-y-5">
        {rows.map((row) => (
          <div key={row.key} className="grid grid-cols-1 sm:grid-cols-[1fr_70px_70px] gap-4 items-center">
            <div>
              <p className="text-sm font-medium text-ink-900">{row.label}</p>
              <p className="text-xs text-ink-600">{row.hint}</p>
            </div>
            {['email', 'push'].map((channel) => (
              <div key={channel} className="flex sm:justify-center">
                <Toggle checked={!!prefs[row.key]?.[channel]} onChange={() => toggle(row.key, channel)} />
              </div>
            ))}
          </div>
        ))}
      </div>
      <div className="pt-4 mt-5 border-t border-line">
        <Button onClick={savePrefs}>Save preferences</Button>
      </div>
    </Card>
  );
}

/* ------------------------------ Security tab ----------------------------- */

function SecurityTab() {
  const { user, updateUser, changePassword } = useAuth();
  const toast = useToast();

  // const [twoFactor, setTwoFactor] = useState(!!user?.twoFactorEnabled);
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' });
  const [pwSubmitting, setPwSubmitting] = useState(false);

  // async function handleTwoFactorToggle(checked) {
  //   setTwoFactor(checked);
  //   updateUser({ twoFactorEnabled: checked });
  //   toast.success(checked ? 'Two-factor authentication enabled' : 'Two-factor authentication disabled');
  // }

  async function handlePasswordSubmit(e) {
    e.preventDefault();
    if (!pwForm.current || !pwForm.next) {
      toast.error('Enter your current and new password');
      return;
    }
    if (pwForm.next.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }
    if (pwForm.next !== pwForm.confirm) {
      toast.error('New password and confirmation do not match');
      return;
    }
    setPwSubmitting(true);
    const result = await changePassword(pwForm.current, pwForm.next);
    setPwSubmitting(false);
    if (result.success) {
      toast.success('Password updated successfully');
      setPwForm({ current: '', next: '', confirm: '' });
    } else {
      toast.error(result.message);
    }
  }

  return (
    <div className="space-y-6">
      <Card title="Change password">
        <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-sm">
          <Input
            label="Current password"
            type="password"
            placeholder="••••••••"
            value={pwForm.current}
            onChange={(e) => setPwForm({ ...pwForm, current: e.target.value })}
          />
          <Input
            label="New password"
            type="password"
            placeholder="••••••••"
            hint="At least 6 characters"
            value={pwForm.next}
            onChange={(e) => setPwForm({ ...pwForm, next: e.target.value })}
          />
          <Input
            label="Confirm new password"
            type="password"
            placeholder="••••••••"
            value={pwForm.confirm}
            onChange={(e) => setPwForm({ ...pwForm, confirm: e.target.value })}
          />
          <Button type="submit" icon={KeyRound} loading={pwSubmitting}>
            Update password
          </Button>
        </form>
      </Card>

      {/* <Card title="Two-factor authentication">
        <Toggle
          checked={twoFactor}
          onChange={handleTwoFactorToggle}
          label="Require a verification code at login"
          hint="Adds an extra step using an authenticator app or SMS"
        />
      </Card> */}
    </div>
  );
}
