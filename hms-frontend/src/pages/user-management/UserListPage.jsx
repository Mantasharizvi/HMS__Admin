import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { UserPlus, Eye } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Table from '../../components/common/Table';
import FormModal from '../../components/common/FormModal';
import UserProfileModal from '../../components/common/UserProfileModal';
import { useUserManagement } from '../../context/UserManagementContext';
import { useAuth } from '../../context/AuthContext';

export default function UserListPage() {
  const { user: loggedInUser } = useAuth();
  const {
    usersList, departments,
    showAddUserModal, setShowAddUserModal,
    newUserForm, setNewUserForm, newUserErrors,
    showProfileModal, setShowProfileModal,
    selectedUser,
    handleOpenUserProfile, handleSaveProfile, handleSetUserPassword,
    handleOpenAddUser, handleAddUser,
  } = useUserManagement();

  // Arriving from global search passes ?openUser=<id> — open that
  // user's profile once the list has loaded.
  const [searchParams, setSearchParams] = useSearchParams();
  const openUserId = searchParams.get('openUser');
  useEffect(() => {
    if (!openUserId || usersList.length === 0) return;
    const match = usersList.find((u) => String(u.id) === String(openUserId));
    if (match) handleOpenUserProfile(match);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete('openUser');
      return next;
    }, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openUserId, usersList]);


  const isViewingOwnAccount =
    !!selectedUser &&
    !!loggedInUser &&
    String(selectedUser.id || selectedUser._id) === String(loggedInUser.id || loggedInUser._id);

  return (
    <div className="space-y-6">
      <PageHeader
        title="User List"
        description="All system users. Add new staff accounts here."
        action={<Button icon={UserPlus} onClick={handleOpenAddUser}>Add User</Button>}
      />

      <Table
        columns={[
          { key: 'userId', header: 'User ID' },
          { key: 'name', header: 'Name' },
          { key: 'email', header: 'Email' },
          { key: 'role', header: 'Role' },
          { key: 'status', header: 'Status' },
          {
            key: 'action',
            header: 'Action',
            render: (row) => (
              <Button size="sm" variant="secondary" icon={Eye} onClick={() => handleOpenUserProfile(row)}>
                Profile
              </Button>
            ),
          },
        ]}
        data={usersList}
      />

      {/* Add New User popup */}
      <FormModal
        isOpen={showAddUserModal}
        onClose={() => setShowAddUserModal(false)}
        onSubmit={handleAddUser}
        title="Add New User"
        submitLabel="Add User"
      >
        <Input
          label="Full Name"
          placeholder="Enter full name"
          value={newUserForm.name}
          onChange={(e) => setNewUserForm({ ...newUserForm, name: e.target.value })}
          error={newUserErrors.name}
        />
        <Input
          label="Email Address"
          type="email"
          placeholder="user@medicore.com"
          value={newUserForm.email}
          onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
          error={newUserErrors.email}
        />
       <Select
  label="Department"
  value={newUserForm.department}
  onChange={(e) => setNewUserForm({ ...newUserForm, department: e.target.value })}
  options={[
    { value: '', label: 'Select registered department' },
    ...departments.map((dept) => ({ value: dept, label: dept })),
    { value: 'Not Assigned', label: 'Not Assigned' },
  ]}
  error={newUserErrors.department}
/>
        <Select
          label="Role"
          value={newUserForm.role}
          onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value })}
          options={[
            { value: 'Admin', label: 'Admin' },
            { value: 'Doctor', label: 'Doctor' },
            { value: 'Nurse', label: 'Nurse' },
            { value: 'Receptionist', label: 'Receptionist' },
            { value: 'Pharmacist', label: 'Pharmacist' },
          ]}
          error={newUserErrors.role}
        />
        <Input
          label="Contact Number"
          placeholder="+91 XXXXXXXXXX"
          value={newUserForm.phone}
          onChange={(e) => setNewUserForm({ ...newUserForm, phone: e.target.value })}
          error={newUserErrors.phone}
        />
        <Input
          label="License Number"
          placeholder="If applicable"
          value={newUserForm.license}
          onChange={(e) => setNewUserForm({ ...newUserForm, license: e.target.value })}
        />
     
      </FormModal>

      <UserProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        user={selectedUser}
        onSave={handleSaveProfile}
        isOwnProfile={isViewingOwnAccount}
        onSetPassword={handleSetUserPassword}
      />
    </div>
  );
}
