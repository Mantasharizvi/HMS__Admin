import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, ChevronDown, LogOut, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import UserProfileModal from '../common/UserProfileModal';
import GlobalSearch from './GlobalSearch';

// Where each global-search result category should navigate, and which
// query param the destination page reads to auto-open that exact record.
const SEARCH_DESTINATIONS = {
  patients: (item) => `/opd/history?patient=${encodeURIComponent(item.id)}`,
  doctors: (item) => `/users/list?openUser=${encodeURIComponent(item.id)}`,
  appointments: () => `/opd/appointments`,
  medicines: () => `/pharmacy/inventory`,
  billing: () => `/opd/billing`,
};

export default function Header({ onMenuClick }) {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const handleSearchSelect = (item) => {
    const buildPath = SEARCH_DESTINATIONS[item.category];
    if (buildPath) navigate(buildPath(item));
  };

  const profileUser = {
    name: user?.name ?? 'Admin User',
    role: user?.role ?? 'Administrator',
    email: user?.email ?? 'admin@medicore.com',
    department: user?.department ?? 'Administration',
    status: user?.status ?? 'Active',
    lastLogin: user?.lastLogin ?? 'Just now',
    memberSince: user?.memberSince ?? '—',
  };

  return (
    <header className="sticky top-0 z-20 h-16 bg-white border-b border-line flex items-center gap-4 px-4 lg:px-6">
      <button
        onClick={onMenuClick}
        className="lg:hidden text-ink-600 hover:text-ink-900"
        aria-label="Open menu"
      >
        <Menu className="w-5.5 h-5.5" />
      </button>

      <div className="relative hidden sm:block flex-1 max-w-sm">
      <GlobalSearch onSelect={handleSearchSelect} />
      </div>

      <div className="ml-auto flex items-center gap-2">
        <div className="relative">
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-lg hover:bg-surface"
          >
            <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-medium text-sm">
              {user?.name?.[0] ?? 'A'}
            </div>
            <div className="hidden md:block text-left leading-tight">
              <p className="text-sm font-medium text-ink-900">{user?.name ?? 'Admin User'}</p>
              <p className="text-xs text-ink-600">{user?.role ?? 'Administrator'}</p>
            </div>
            <ChevronDown className="w-4 h-4 text-ink-400" />
          </button>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg border border-line shadow-lg z-20 py-1">
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    setProfileOpen(true);
                  }}
                  className="w-full flex items-center gap-2 px-3.5 py-2 text-sm text-ink-900 hover:bg-surface"
                >
                  <User className="w-4 h-4" /> My Profile
                </button>
                <button
                  onClick={logout}
                  className="w-full flex items-center gap-2 px-3.5 py-2 text-sm text-danger-600 hover:bg-danger-50"
                >
                  <LogOut className="w-4 h-4" /> Log Out
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <UserProfileModal
        isOpen={profileOpen}
        onClose={() => setProfileOpen(false)}
        user={profileUser}
        onSave={(updated) => updateUser(updated)}
        isOwnProfile
      />
    </header>
  );
}
