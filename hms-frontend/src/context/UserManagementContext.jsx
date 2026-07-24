import { createContext, useContext, useState, useEffect } from 'react';
import { useToast } from './ToastContext';
import { validateForm, rules, isValid } from '../utils/validators';
import api from '../services/api';

const UserManagementContext = createContext(null);

const emptyNewUser = { name: '', email: '', department: '', role: '', phone: '', license: '' };
const newUserSchema = {
  name: [rules.required('Full name is required')],
  email: [rules.required('Email is required'), rules.email()],
  department: [rules.required('Department is required')],
  role: [rules.required('Role is required')],
  phone: [rules.phone('Enter a valid contact number')],
};

// Map a User document to the shape the UI expects: formatted lastLogin/memberSince.
const mapUser = (u) => ({
  ...u,
  lastLogin: u.lastLogin ? new Date(u.lastLogin).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '—',
  memberSince: u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—',
});

export function UserManagementProvider({ children }) {
  const toast = useToast();
  const [usersList, setUsersList] = useState([]);
  const [rolesList, setRolesList] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [departments, setDepartments] = useState([]); 
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUserForm, setNewUserForm] = useState(emptyNewUser);
  const [newUserErrors, setNewUserErrors] = useState({});

  const [showCreateRoleModal, setShowCreateRoleModal] = useState(false);
  const [showEditRoleModal, setShowEditRoleModal] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newRoleForm, setNewRoleForm] = useState({ name: '', description: '', permissions: [] });

  // Attach a live user count + readable permission summary to each role,
  // derived from the users list rather than stored redundantly on the server.
 const decorateRoles = (roles, users) =>
  roles.map((r) => ({
    ...r,
    users: users.filter((u) => u.role === r.name).length,
    permissionsSummary: r.permissions?.includes('All') ? 'All' : String(r.permissions?.length || 0), // ← renamed, no longer clobbers `permissions`
  }));

  // ---------- Initial data load ----------
useEffect(() => {
  Promise.all([
    api.get('/users'),
    api.get('/users/roles'),
    api.get('/users/permissions'),
  ])
    .then(([usersRes, rolesRes, permsRes]) => {
      const users = usersRes.data.data.map(mapUser);
      setUsersList(users);
      setRolesList(decorateRoles(rolesRes.data.data, users));
      setPermissions(permsRes.data.data);
    })
    .catch(() => toast.error('Could not load user management data'));

  // Registered departments (from Hospital Settings), for the Add User form.
  api.get('/settings/hospital')
    .then((res) => setDepartments(res.data.data.departments || []))
    .catch(() => toast.error('Could not load the registered departments list'));
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);

  const handleOpenUserProfile = (user) => {
    setSelectedUser(user);
    setShowProfileModal(true);
  };

  const handleSaveProfile = async (updated) => {
    try {
      // lastLogin/memberSince are formatted display strings (see mapUser
      // above), not real editable fields — never send them back to the API.
      const { lastLogin, memberSince, ...editable } = updated;
      const { data } = await api.put(`/users/${updated.id}`, editable);
      const mapped = mapUser(data.data);
      setUsersList((current) => current.map((u) => (u.id === mapped.id ? mapped : u)));
      setSelectedUser(mapped);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update user');
    }
  };

  // Admin-only: set a NEW password for another user directly (no current
  // password needed — that's the point of the admin override). Used from
  // the Edit Profile screen in User Management. Returns { success } so the
  // modal can decide whether to clear its password fields.
  const handleSetUserPassword = async (userId, newPassword) => {
    try {
      const { data } = await api.put(`/users/${userId}/set-password`, { newPassword });
      toast.success(data.message || 'Password updated successfully');
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to update password';
      toast.error(message);
      return { success: false, message };
    }
  };

  const handleOpenAddUser = () => {
    setNewUserForm(emptyNewUser);
    setNewUserErrors({});
    setShowAddUserModal(true);
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    const errors = validateForm(newUserForm, newUserSchema);
    setNewUserErrors(errors);
    if (!isValid(errors)) {
      toast.error('Please fix the highlighted fields');
      return;
    }
    try {
      const { data } = await api.post('/users', newUserForm);
      const mapped = mapUser(data.data);
      setUsersList((current) => [mapped, ...current]);
      setRolesList((current) => decorateRoles(current, [mapped, ...usersList]));
      setShowAddUserModal(false);
      // duration: 0 disables the auto-dismiss timer — this toast carries the
      // one-time temp password, so it must stay until the admin clicks the X
      // to close it (they need time to copy it before it disappears).
      toast.success(
        `User "${mapped.name}" added successfully. Temporary password: ${data.tempPassword}`,
        0
      );
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add user');
    }
  };

  const handleCreateRoleClick = () => {
    setNewRoleForm({ name: '', description: '', permissions: [] });
    setShowCreateRoleModal(true);
  };

  const handleEditRoleClick = () => setShowEditRoleModal(true);

  const handleCreateRole = async () => {
    if (!newRoleForm.name.trim()) {
      toast.error('Please enter a role name');
      return;
    }
    try {
      const { data } = await api.post('/users/roles', newRoleForm);
      setRolesList((current) => decorateRoles([...current, data.data], usersList));
      setShowCreateRoleModal(false);
      setNewRoleForm({ name: '', description: '', permissions: [] });
      toast.success(`Role "${data.data.name}" created successfully`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create role');
    }
  };

  const handleSelectRole = (role) => setEditingRole(role);

  const handleSaveEditRole = async () => {
    if (!editingRole.name.trim()) {
      toast.error('Please enter a role name');
      return;
    }
    try {
      const { data } = await api.put(`/users/roles/${editingRole.id}`, editingRole);
      setRolesList((current) =>
        decorateRoles(current.map((role) => (role.id === data.data.id ? data.data : role)), usersList)
      );
      setShowEditRoleModal(false);
      setEditingRole(null);
      toast.success(`Role "${data.data.name}" updated successfully`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update role');
    }
  };

  const togglePermission = async (id, enabled) => {
    const perm = permissions.find((p) => p.id === id);
    try {
      const { data } = await api.put(`/users/permissions/${id}`, { enabled });
      setPermissions((current) => current.map((p) => (p.id === id ? data.data : p)));
      toast.success(`"${perm?.name}" ${enabled ? 'enabled' : 'disabled'}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update permission');
    }
  };

  const value = {
    usersList, rolesList, permissions, togglePermission,
    showAddUserModal, setShowAddUserModal,
    newUserForm, setNewUserForm, newUserErrors,
    showCreateRoleModal, setShowCreateRoleModal,
    showEditRoleModal, setShowEditRoleModal,
    editingRole, setEditingRole,
    showProfileModal, setShowProfileModal,
    selectedUser, setSelectedUser,
    newRoleForm, setNewRoleForm,
    handleOpenUserProfile, handleSaveProfile, handleSetUserPassword,
    handleOpenAddUser, handleAddUser,
    handleCreateRoleClick, handleEditRoleClick,
    handleCreateRole, handleSelectRole, handleSaveEditRole,
    departments, 
  };

  return <UserManagementContext.Provider value={value}>{children}</UserManagementContext.Provider>;
}

export function useUserManagement() {
  const ctx = useContext(UserManagementContext);
  if (!ctx) throw new Error('useUserManagement must be used within UserManagementProvider');
  return ctx;
}
