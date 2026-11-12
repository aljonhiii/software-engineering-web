import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { KioskLocatorPage } from './pages/public/KioskLocatorPage';
import { BuyerSetupPage } from './pages/auth/BuyerSetupPage';
import { AdminLoginPage } from './pages/admin/AdminLoginPage';
import { AdminLayout } from './components/layout/AdminLayout';
import { AdminOverviewPage } from './pages/admin/AdminOverviewPage';
import { KioskManagementPage } from './pages/admin/KioskManagementPage';
import { BuyerManagementPage } from './pages/admin/BuyerManagementPage';
import { KioskAssignmentsPage } from './pages/admin/KioskAssignmentsPage';

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public KixCleen Website — Kiosk Locator */}
          <Route path="/" element={<KioskLocatorPage />} />

          {/* Buyer Account Invitation / Password Setup Portal */}
          <Route path="/setup-account" element={<BuyerSetupPage />} />

          {/* Super Admin Authentication */}
          <Route path="/admin/login" element={<AdminLoginPage />} />

          {/* Protected Super Admin Dashboard Routes */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminOverviewPage />} />
            <Route path="kiosks" element={<KioskManagementPage />} />
            <Route path="buyers" element={<BuyerManagementPage />} />
            <Route path="assignments" element={<KioskAssignmentsPage />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
