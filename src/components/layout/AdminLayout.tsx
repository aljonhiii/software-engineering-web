import React from 'react';
import { NavLink, Navigate, Outlet, Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Cpu,
  Users,
  Link2,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const AdminLayout: React.FC = () => {
  const { user, isLoading, isAuthenticated, isSuperAdmin, logout } = useAuth();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50 text-xs text-neutral-500">
        Loading...
      </div>
    );
  }

  if (!isAuthenticated || !isSuperAdmin) {
    return <Navigate to="/admin/login" replace />;
  }

  const navItems = [
    {
      to: '/admin',
      end: true,
      label: 'Overview',
      icon: LayoutDashboard,
    },
    {
      to: '/admin/kiosks',
      end: false,
      label: 'Kiosks',
      icon: Cpu,
    },
    {
      to: '/admin/buyers',
      end: false,
      label: 'Buyers',
      icon: Users,
    },
    {
      to: '/admin/assignments',
      end: false,
      label: 'Assignments',
      icon: Link2,
    },
  ];

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  return (
    <div className="flex min-h-screen bg-neutral-50 text-neutral-950">
      {/* Minimalist Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 flex w-60 flex-col border-r border-neutral-200 bg-white">
        <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-4">
          <Link to="/admin" className="flex items-center gap-2.5">
            <img
              src="/kixcleen-logo.png"
              alt="KixCleen"
              className="h-7 w-7 rounded-md object-contain"
            />
            <span className="font-display text-sm font-bold tracking-[0.12em] uppercase">
              KixCleen
            </span>
          </Link>
          <span className="rounded-md bg-neutral-100 px-2 py-0.5 text-[10px] font-semibold text-neutral-600">
            Admin
          </span>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium transition ${
                    isActive
                      ? 'bg-neutral-950 text-white'
                      : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-950'
                  }`
                }
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="border-t border-neutral-100 p-4">
          <div className="mb-3 px-1">
            <p className="truncate text-xs font-semibold text-neutral-950">
              {user?.fullName}
            </p>
            <p className="truncate text-[11px] text-neutral-400">
              {user?.email}
            </p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-1.5 rounded-full border border-neutral-200 py-1.5 text-xs font-medium text-neutral-700 hover:border-neutral-950 hover:text-neutral-950"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col pl-60">
        <main className="flex-1 p-6 sm:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
