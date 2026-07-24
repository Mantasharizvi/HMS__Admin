import { Lock, ShieldCheck } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import Button from '../../components/common/Button';
import Toggle from '../../components/common/Toggle';
import { useUserManagement } from '../../context/UserManagementContext';

export default function PermissionsManagementPage() {
  const {
    permissions, rolesList,
    editingRole, handleSelectRole, setEditingRole, handleSaveEditRole,
  } = useUserManagement();

  const categories = [...new Set(permissions.map((p) => p.category))];

  // Admin is granted every permission via the 'All' sentinel rather than an
  // explicit list -- treat it as fully checked and non-editable here so it
  // can't accidentally be locked out of the app from this screen.
  const isAdminRole = editingRole?.permissions?.includes('All');

  const isPermChecked = (permId) => isAdminRole || (editingRole?.permissions?.includes(permId) ?? false);

  const togglePermForRole = (permId, checked) => {
    const current = editingRole.permissions || [];
    const next = checked ? [...current, permId] : current.filter((p) => p !== permId);
    setEditingRole({ ...editingRole, permissions: next });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Permissions Management"
        description="Choose a registered role, then enable or disable exactly what it can access."
      />

      <div className="max-w-2xl rounded-lg border border-line p-4 space-y-3">
        <div className="flex items-center gap-2 text-teal-700">
          <ShieldCheck className="h-4 w-4" />
          <span className="text-sm font-semibold">Registered role</span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {rolesList.map((role) => (
            <button
              key={role.id}
              type="button"
              onClick={() => handleSelectRole(role)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md border transition-colors ${
                editingRole?.id === role.id
                  ? 'bg-teal-700 text-white border-teal-700'
                  : 'text-gray-600 border-line hover:bg-gray-100'
              }`}
            >
              {role.name}
            </button>
          ))}
        </div>

        {!editingRole && (
          <p className="text-xs text-gray-500">Select a role above to view and edit its permissions.</p>
        )}
        {isAdminRole && (
          <p className="text-xs text-gray-500">
            Admin has full access to every permission automatically and can&apos;t be restricted from here.
          </p>
        )}
      </div>

      {editingRole && (
        <>
          <div className="space-y-6 max-w-2xl">
            {categories.map((category) => (
              <div key={category}>
                <div className="flex items-center gap-2 text-teal-700 mb-3">
                  <Lock className="h-4 w-4" />
                  <span className="text-sm font-semibold">{category}</span>
                </div>
                <div className="space-y-4 rounded-lg border border-line p-4">
                  {permissions
                    .filter((p) => p.category === category)
                    .map((perm) => (
                      <Toggle
                        key={perm.id}
                        label={perm.name}
                        hint={perm.permissionCode}
                        checked={isPermChecked(perm.id)}
                        disabled={isAdminRole}
                        onChange={(checked) => togglePermForRole(perm.id, checked)}
                      />
                    ))}
                </div>
              </div>
            ))}
          </div>

          {!isAdminRole && (
            <Button onClick={handleSaveEditRole}>Save Changes for &quot;{editingRole.name}&quot;</Button>
          )}
        </>
      )}
    </div>
  );
}