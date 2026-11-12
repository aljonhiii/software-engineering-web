import React, { useState } from 'react';
import { useNavigate, Navigate, Link } from 'react-router-dom';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const AdminLoginPage: React.FC = () => {
  const { login, isAuthenticated, isSuperAdmin } = useAuth();
  const navigate = useNavigate();

  const [identifier, setIdentifier] = useState<string>('superadmin@kixcleen.com');
  const [password, setPassword] = useState<string>('admin1234');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (isAuthenticated && isSuperAdmin) {
    return <Navigate to="/admin" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!identifier.trim() || !password.trim()) {
      setError('Enter your email and password.');
      return;
    }

    setLoading(true);
    try {
      const loggedUser = await login(identifier.trim(), password);
      if (loggedUser.role !== 'superadmin') {
        setError('Super Admin access required. Buyers sign in on the mobile app.');
        return;
      }
      navigate('/admin');
    } catch (err: any) {
      setError(err.message || 'Invalid credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen grid-cols-1 bg-white text-neutral-950 lg:grid-cols-12">
      {/* Left Form Column */}
      <div className="flex flex-col justify-between p-6 sm:p-12 lg:col-span-6">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <img
              src="/kixcleen-logo.png"
              alt="KixCleen"
              className="h-8 w-8 rounded-lg object-contain"
            />
            <span className="font-display text-base font-bold tracking-[0.12em] uppercase">
              KixCleen
            </span>
          </Link>

          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-500 hover:text-neutral-950"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to site
          </Link>
        </div>

        <div className="mx-auto w-full max-w-sm py-12">
          <h1 className="font-display text-2xl font-bold text-neutral-950 sm:text-3xl">
            Admin Sign In
          </h1>
          <p className="mt-1 text-xs text-neutral-500">
            Manage kiosks, buyer accounts, and assignments.
          </p>

          {error && (
            <div className="mt-5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="block text-xs font-medium text-neutral-700">
                Email or username
              </label>
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="superadmin@kixcleen.com"
                className="mt-1 w-full rounded-xl border border-neutral-200 px-3.5 py-2.5 text-sm focus:border-neutral-950 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-700">
                Password
              </label>
              <div className="relative mt-1">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full rounded-xl border border-neutral-200 px-3.5 py-2.5 pr-10 text-sm focus:border-neutral-950 focus:outline-hidden"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute top-1/2 right-3 -translate-y-1/2 text-neutral-400 hover:text-neutral-700"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-neutral-950 py-3 text-xs font-medium text-white transition hover:bg-neutral-800 disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 rounded-xl border border-neutral-200 bg-neutral-50 p-3 text-xs text-neutral-500">
            Default login: <span className="font-mono text-neutral-900">superadmin@kixcleen.com</span> /{' '}
            <span className="font-mono text-neutral-900">admin1234</span>
          </div>
        </div>

        <p className="text-xs text-neutral-400">
          &copy; {new Date().getFullYear()} KixCleen
        </p>
      </div>

      {/* Right Photography Column */}
      <div className="hidden lg:block lg:col-span-6 p-4">
        <div className="relative h-full w-full overflow-hidden rounded-3xl bg-neutral-100">
          <img
            src="https://images.unsplash.com/photo-1560769629-975ec94e6a86?auto=format&fit=crop&w=1400&q=85"
            alt="KixCleen Footwear Care"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/60 via-transparent to-transparent" />
          <div className="absolute right-8 bottom-8 left-8 text-white">
            <p className="font-display text-2xl font-bold">
              KixCleen Central Management
            </p>
            <p className="mt-1 text-xs text-white/80">
              Kiosk directory, buyer accounts, and machine assignments in one place.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
