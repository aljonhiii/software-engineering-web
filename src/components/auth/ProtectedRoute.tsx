import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * Route guard enforcing super administrator session security.
 * Prevents URL tampering by unauthenticated users or expired sessions,
 * immediately redirecting to login with a security audit notice.
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isLoading, isAuthenticated, isSuperAdmin } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50 text-xs text-neutral-500">
        <div className="flex flex-col items-center gap-2">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-neutral-900 border-t-transparent" />
          <span>Verifying administrator session...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !isSuperAdmin) {
    // If user attempted to navigate directly to an admin URL without a session:
    const isDirectTamper = location.pathname.startsWith('/admin') && location.pathname !== '/admin/login';
    const redirectUrl = isDirectTamper ? '/admin/login?tampered=1' : '/admin/login';
    return <Navigate to={redirectUrl} replace state={{ from: location }} />;
  }

  return <>{children}</>;
};
