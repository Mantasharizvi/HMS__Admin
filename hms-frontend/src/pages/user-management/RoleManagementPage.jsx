import { UserPlus, Edit2 } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Table from '../../components/common/Table';
import Modal from '../../components/common/Modal';
import { useUserManagement } from '../../context/UserManagementContext';

export default function RoleManagementPage() {
  const {
    rolesList, permissions,
    showCreateRoleModal, setShowCreateRoleModal,
    showEditRoleModal, setShowEditRoleModal,
    editingRole, setEditingRole,
    newRoleForm, setNewRoleForm,
    handleCreateRoleClick, handleEditRoleClick,
    handleCreateRole, handleSelectRole, handleSaveEditRole,
  } = useUserManagement();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Role Management"
        description="Define roles and how many users are assigned to each."
        action={
          <>
            <Button icon={UserPlus} onClick={handleCreateRoleClick}>Create Role</Button>
            <Button variant="secondary" icon={Edit2} onClick={handleEditRoleClick}>Edit Roles</Button>
          </>
        }
      />

      <Table
        columns={[
          { key: 'roleCode', header: 'Role ID' },
          { key: 'name', header: 'Role Name' },
          { key: 'users', header: 'Users' },
         { key: 'permissionsSummary', header: 'Permissions' },
        ]}
        data={rolesList}
      />

      {/* Create Role Modal */}
      <Modal isOpen={showCreateRoleModal} onClose={() => setShowCreateRoleModal(false)} title="Create New Role" size="md">
        <div className="px-6 py-4 space-y-4">
          <Input
            label="Role Name"
            placeholder="e.g., Senior Doctor, Pharmacist"
            value={newRoleForm.name}
            onChange={(e) => setNewRoleForm({ ...newRoleForm, name: e.target.value })}
          />
          <div>
            <label className="block text-sm font-medium text-ink-900 mb-1.5">Description</label>
            <textarea
              rows="3"
              className="w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              placeholder="Describe the role and its responsibilities"
              value={newRoleForm.description}
              onChange={(e) => setNewRoleForm({ ...newRoleForm, description: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink-900 mb-2">Assign Permissions</label>
            <div className="grid grid-cols-2 gap-3 max-h-48 overflow-y-auto">
              {permissions.map((perm) => (
                <label key={perm.id} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={newRoleForm.permissions.includes(perm.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setNewRoleForm({ ...newRoleForm, permissions: [...newRoleForm.permissions, perm.id] });
                      } else {
                        setNewRoleForm({
                          ...newRoleForm,
                          permissions: newRoleForm.permissions.filter((p) => p !== perm.id),
                        });
                      }
                    }}
                    className="w-4 h-4 rounded border-line"
                  />
                  <span className="text-sm text-ink-700">{perm.name}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
        <div className="flex gap-3 px-6 py-4 border-t border-line bg-surface rounded-b-xl">
          <Button onClick={handleCreateRole} fullWidth>Create Role</Button>
          <Button variant="secondary" onClick={() => setShowCreateRoleModal(false)} fullWidth>Cancel</Button>
        </div>
      </Modal>

      {/* Edit Role Modal */}
      <Modal
        isOpen={showEditRoleModal}
        onClose={() => { setShowEditRoleModal(false); setEditingRole(null); }}
        title="Edit Role"
        size="lg"
      >
        <div className="px-6 py-4">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-ink-900 mb-2">Select Role to Edit</label>
              <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                {rolesList.map((role) => (
                  <button
                    key={role.id}
                    onClick={() => handleSelectRole(role)}
                    className={`p-3 rounded-lg border-2 text-left transition-colors ${
                      editingRole?.id === role.id
                        ? 'border-teal-600 bg-teal-50'
                        : 'border-line bg-white hover:border-teal-300'
                    }`}
                  >
                    <p className="font-medium text-ink-900">{role.name}</p>
                    <p className="text-xs text-ink-600">{role.users} users</p>
                  </button>
                ))}
              </div>
            </div>

            {editingRole && (
              <div className="space-y-4 border-t border-line pt-4">
                <Input
                  label="Role Name"
                  value={editingRole.name}
                  onChange={(e) => setEditingRole({ ...editingRole, name: e.target.value })}
                />
              <div>
  <label className="block text-sm font-medium text-ink-900 mb-2">Permissions</label>
  <div className="grid grid-cols-2 gap-3 max-h-48 overflow-y-auto">
    {permissions.map((perm) => (
      <label key={perm.id} className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={editingRole.permissions?.includes(perm.id) || false}
          onChange={(e) => {
            const current = editingRole.permissions || [];
            const next = e.target.checked
              ? [...current, perm.id]
              : current.filter((p) => p !== perm.id);
            setEditingRole({ ...editingRole, permissions: next });
          }}
          className="w-4 h-4 rounded border-line"
        />
        <span className="text-sm text-ink-700">{perm.name}</span>
      </label>
    ))}
  </div>
</div>
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-3 px-6 py-4 border-t border-line bg-surface rounded-b-xl">
          <Button onClick={handleSaveEditRole} disabled={!editingRole} fullWidth>Save Changes</Button>
          <Button
            variant="secondary"
            onClick={() => { setShowEditRoleModal(false); setEditingRole(null); }}
            fullWidth
          >
            Cancel
          </Button>
        </div>
      </Modal>
    </div>
  );
}
