import React, { useState, useEffect } from 'react';
import { NavLink, Navigate, Outlet, Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Cpu,
  Users,
  MessageSquare,
  LogOut,
  ExternalLink,
  MapPin,
  Radio,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { fetchAdminInquiries } from '../../api/client';

export const AdminLayout: React.FC = () => {
  const { user, isLoading, isAuthenticated, isSuperAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const [pendingCount, setPendingCount] = useState<number>(0);

  useEffect(() => {
    fetchAdminInquiries()
      .then((res) => {
        if (res.success && Array.isArray(res.inquiries)) {
          const count = res.inquiries.filter((i) => i.status === 'pending').length;
          setPendingCount(count);
        }
      })
      .catch(() => {});
  }, []);

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

  const handleLogout = () => {
    logout();
    navigate('/admin/login', { replace: true });
  };

  return (
    <div className="flex min-h-screen bg-neutral-50 text-neutral-950">
      {/* Modern High-Grade Admin Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r border-neutral-200/90 bg-white">
        {/* Brand Header */}
        <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-4">
          <Link to="/admin" className="flex items-center gap-2.5">
            <img
              src="/kixcleen-logo.png"
              alt="KixCleen"
              className="h-8 w-8 rounded-lg object-contain shadow-2xs"
            />
            <div className="flex flex-col">
              <span className="font-display text-sm font-bold tracking-[0.12em] uppercase text-neutral-950">
                KixCleen
              </span>
              <span className="text-[10px] font-medium text-neutral-400">
                Central Management
              </span>
            </div>
          </Link>
          <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-[10px] font-semibold text-neutral-700 border border-neutral-200">
            Admin
          </span>
        </div>

        {/* Navigation Content Area */}
        <div className="flex flex-1 flex-col justify-between overflow-y-auto px-3.5 py-4">
          <div className="space-y-6">
            {/* Group 1: Core Fleet Management */}
            <div>
              <p className="px-2.5 text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
                Management
              </p>
              <nav className="mt-1.5 space-y-1">
                <NavLink
                  to="/admin"
                  end
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium transition ${
                      isActive
                        ? 'bg-neutral-950 text-white shadow-2xs'
                        : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-950'
                    }`
                  }
                >
                  <LayoutDashboard className="h-4 w-4 shrink-0" />
                  <span>Overview</span>
                </NavLink>

                <NavLink
                  to="/admin/kiosks"
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium transition ${
                      isActive
                        ? 'bg-neutral-950 text-white shadow-2xs'
                        : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-950'
                    }`
                  }
                >
                  <Cpu className="h-4 w-4 shrink-0" />
                  <span>Kiosks</span>
                </NavLink>

                <NavLink
                  to="/admin/buyers"
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium transition ${
                      isActive
                        ? 'bg-neutral-950 text-white shadow-2xs'
                        : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-950'
                    }`
                  }
                >
                  <Users className="h-4 w-4 shrink-0" />
                  <span>Buyers</span>
                </NavLink>
              </nav>
            </div>

            {/* Group 2: Operations & Customer Inquiries */}
            <div>
              <p className="px-2.5 text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
                Operations
              </p>
              <nav className="mt-1.5 space-y-1">
                <NavLink
                  to="/admin/inquiries"
                  className={({ isActive }) =>
                    `flex items-center justify-between rounded-xl px-3 py-2 text-xs font-medium transition ${
                      isActive
                        ? 'bg-neutral-950 text-white shadow-2xs'
                        : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-950'
                    }`
                  }
                >
                  <div className="flex items-center gap-2.5">
                    <MessageSquare className="h-4 w-4 shrink-0" />
                    <span>Orders &amp; Inquiries</span>
                  </div>
                  {pendingCount > 0 && (
                    <span className="inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-amber-500 px-1.5 text-[9px] font-bold text-white shadow-2xs">
                      {pendingCount}
                    </span>
                  )}
                </NavLink>
              </nav>
            </div>

            {/* Quick Fleet Status Widget (fills vertical space with live operational state) */}
            <div className="rounded-2xl border border-neutral-200/90 bg-gradient-to-b from-neutral-50 to-neutral-100/70 p-3.5 text-xs shadow-2xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-semibold text-neutral-900">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                  </span>
                  <span>Zamboanga Fleet</span>
                </div>
                <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-emerald-800 border border-emerald-200">
                  Live
                </span>
              </div>

              <p className="mt-1.5 text-[11px] text-neutral-500 leading-relaxed">
                Active terminals deployed across Zamboanga City commercial centers.
              </p>

              <div className="mt-3 flex items-center justify-between border-t border-neutral-200/70 pt-2.5 text-[11px]">
                <span className="flex items-center gap-1 text-neutral-500">
                  <MapPin className="h-3 w-3 text-neutral-400" />
                  Zamboanga City
                </span>
                <Link
                  to="/admin/kiosks"
                  className="font-semibold text-neutral-950 hover:underline inline-flex items-center gap-0.5"
                >
                  Fleet Map &rarr;
                </Link>
              </div>
            </div>
          </div>

          {/* Group 3: Quick Public Portal Preview */}
          <div className="pt-4 border-t border-neutral-100">
            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between rounded-xl px-3 py-2 text-xs font-medium text-neutral-600 hover:bg-neutral-100 hover:text-neutral-950 transition"
            >
              <div className="flex items-center gap-2.5">
                <Radio className="h-4 w-4 text-neutral-400" />
                <span>View Public Site</span>
              </div>
              <ExternalLink className="h-3 w-3 text-neutral-400" />
            </a>
          </div>
        </div>

        {/* User Footer Profile & Sign Out */}
        <div className="border-t border-neutral-100 bg-neutral-50/50 p-4">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-neutral-950 text-xs font-bold text-white shadow-2xs">
              {user?.fullName ? user.fullName.slice(0, 2).toUpperCase() : 'AD'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold text-neutral-950">
                {user?.fullName || 'Administrator'}
              </p>
              <div className="flex items-center gap-1 text-[11px] text-neutral-400">
                <ShieldCheck className="h-3 w-3 text-emerald-600" />
                <span className="truncate">Super Administrator</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-1.5 rounded-full border border-neutral-200 bg-white py-1.5 text-xs font-medium text-neutral-700 hover:border-neutral-950 hover:text-neutral-950 transition shadow-2xs"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign out
          </button>

          <p className="mt-2.5 text-center text-[10px] text-neutral-400">
            KixCleen v2.0 &bull; Zamboanga Hub
          </p>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col pl-64">
        <main className="flex-1 p-6 sm:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
