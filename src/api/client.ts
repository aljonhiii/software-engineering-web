import {
  AuthUser,
  PublicKiosk,
  AdminOverviewData,
  AdminKiosk,
  AdminBuyer,
  KioskAssignmentRecord,
  BuyerInvitationInfo,
  CustomerInquiry,
} from '../types';

/**
 * Dynamically resolves the API base URL.
 * Automatically adapts between:
 * - Desktop development (Vite proxy /api forwarding to backend :3000)
 * - Mobile / LAN devices (routes through Vite proxy or dynamic host IP so 'localhost' is never queried on the mobile device)
 * - Custom remote / production domains
 */
export function getApiBaseUrl(): string {
  const envUrl = (import.meta.env.VITE_API_URL || '').trim();

  if (typeof window !== 'undefined' && window.location) {
    const { hostname, port, protocol } = window.location;

    // 1. If an explicit remote production URL (not localhost) is configured, respect it
    if (envUrl && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1')) {
      return envUrl.replace(/\/+$/, '');
    }

    // 2. When accessed under Vite dev server (port 5173), always use relative '/api'
    // Vite's proxy receives the request at http://<ip>:5173/api and forwards it locally
    // to http://localhost:3000/api on the host machine.
    // This completely eliminates cross-device 'localhost' lookups on mobile phones,
    // avoids Windows Firewall restrictions on port 3000, and prevents CORS issues.
    if (port === '5173') {
      return '/api';
    }

    // 3. If accessed over LAN IP on any other port:
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      return `${protocol}//${hostname}:3000/api`;
    }
  }

  // 4. Fallback default
  if (!envUrl || envUrl === 'http://localhost:3000/api') {
    return '/api';
  }

  return envUrl.replace(/\/+$/, '');
}

const TOKEN_KEY = 'kixcleen_central_auth_token';

export function getStoredToken(): string | null {
  try {
    return sessionStorage.getItem(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token: string | null): void {
  try {
    if (token) {
      sessionStorage.setItem(TOKEN_KEY, token);
      localStorage.removeItem(TOKEN_KEY);
    } else {
      sessionStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(TOKEN_KEY);
    }
  } catch {
    // Ignore storage errors
  }
}

export class ApiError extends Error {
  status: number;
  code?: string;
  conflicts?: any[];

  constructor(message: string, status: number, code?: string, conflicts?: any[]) {
    super(message);
    this.status = status;
    this.code = code;
    this.conflicts = conflicts;
  }
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getStoredToken();
  const baseUrl = getApiBaseUrl();
  const cleanEndpoint = endpoint.replace(/^\/+/, '');
  const url = baseUrl ? `${baseUrl}/${cleanEndpoint}` : `/${cleanEndpoint}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 401) {
      setStoredToken(null);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('auth:unauthorized'));
      }
    }

    throw new ApiError(
      data.message || `Request failed with status ${response.status}`,
      response.status,
      data.code,
      data.conflicts
    );
  }

  return data as T;
}

// ============================================================================
// Public Website — Kiosk Locator API
// ============================================================================
export async function fetchPublicKiosks(params?: {
  search?: string;
  city?: string;
  status?: string;
}): Promise<{
  success: boolean;
  count: number;
  totalPublicKiosks: number;
  cities: string[];
  kiosks: PublicKiosk[];
}> {
  const qs = new URLSearchParams();
  if (params?.search) qs.set('search', params.search);
  if (params?.city && params.city !== 'all') qs.set('city', params.city);
  if (params?.status && params.status !== 'all') qs.set('status', params.status);
  const queryStr = qs.toString();
  return apiRequest(`/public/kiosks${queryStr ? `?${queryStr}` : ''}`);
}

export async function fetchPublicKioskById(id: string): Promise<{
  success: boolean;
  kiosk: PublicKiosk;
}> {
  return apiRequest(`/public/kiosks/${encodeURIComponent(id)}`);
}

// ============================================================================
// Authentication & Buyer Invitation Setup API
// ============================================================================
export async function loginUser(identifier: string, password: string): Promise<{
  success: boolean;
  token: string;
  user: AuthUser;
}> {
  return apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ identifier, password }),
  });
}

export async function fetchCurrentUser(): Promise<{
  success: boolean;
  user: AuthUser;
}> {
  return apiRequest('/auth/me');
}

export async function verifyInvitationToken(token: string): Promise<{
  success: boolean;
  invitation: BuyerInvitationInfo;
}> {
  return apiRequest(`/auth/verify-invite?token=${encodeURIComponent(token)}`);
}

export async function completeBuyerAccountSetup(
  token: string,
  password: string,
  extra?: {
    username?: string;
    fullName?: string;
    phone?: string;
  }
): Promise<{
  success: boolean;
  message: string;
  token: string;
  user: AuthUser;
}> {
  return apiRequest('/auth/complete-setup', {
    method: 'POST',
    body: JSON.stringify({ token, password, ...(extra || {}) }),
  });
}

// ============================================================================
// Super Admin Dashboard API
// ============================================================================
export async function fetchAdminOverview(): Promise<{
  success: boolean;
  overview: AdminOverviewData;
}> {
  return apiRequest('/admin/overview');
}

export async function fetchAdminKiosks(): Promise<{
  success: boolean;
  count: number;
  kiosks: AdminKiosk[];
}> {
  return apiRequest('/admin/kiosks');
}

export async function registerAdminKiosk(payload: {
  id?: string;
  name: string;
  address: string;
  city: string;
  location: string;
  latitude: number | string | null;
  longitude: number | string | null;
  status?: string;
  isActive?: boolean;
  isPublic?: boolean;
  operatingHours?: string;
  servicesOffered?: string;
  buyerId?: string | null;
}): Promise<{
  success: boolean;
  message: string;
  kiosk: AdminKiosk;
}> {
  return apiRequest('/admin/kiosks', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateAdminKiosk(
  id: string,
  payload: Partial<{
    name: string;
    address: string;
    city: string;
    location: string;
    latitude: number | string | null;
    longitude: number | string | null;
    status: string;
    isActive: boolean;
    isPublic: boolean;
    operatingHours: string;
    servicesOffered: string;
  }>
): Promise<{
  success: boolean;
  message: string;
  kiosk: AdminKiosk;
}> {
  return apiRequest(`/admin/kiosks/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function updateAdminKioskStatus(
  id: string,
  payload: { status?: string; isActive?: boolean; isPublic?: boolean }
): Promise<{
  success: boolean;
  message: string;
  kiosk: AdminKiosk;
}> {
  return apiRequest(`/admin/kiosks/${encodeURIComponent(id)}/status`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function fetchAdminBuyers(): Promise<{
  success: boolean;
  count: number;
  buyers: AdminBuyer[];
}> {
  return apiRequest('/admin/buyers');
}

export async function createAdminBuyer(payload: {
  fullName: string;
  email: string;
  username?: string;
  phone?: string;
  companyName?: string;
  kioskIds?: string[];
  allowTransfer?: boolean;
  createDedicatedKiosk?: boolean;
  dedicatedKioskId?: string;
  dedicatedKioskName?: string;
  dedicatedKioskCity?: string;
  dedicatedKioskAddress?: string;
  kioskCount?: number;
  dedicatedKiosks?: Array<{
    id?: string;
    name?: string;
    city?: string;
    address?: string;
  }>;
}): Promise<{
  success: boolean;
  message: string;
  buyer: AdminBuyer;
  dedicatedKiosk?: {
    id: string;
    name: string;
    city: string;
    address: string;
    launcherUrl: string;
  } | null;
  provisionedKiosks?: Array<{
    id: string;
    name: string;
    city: string;
    address: string;
    launcherUrl: string;
  }>;
  launcherUrl?: string;
  invitation: {
    token: string;
    setupPath: string;
    expiresAt: string;
  };
}> {
  return apiRequest('/admin/buyers', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Returns the dynamic auto-discovery launcher URL for a given kiosk ID.
 * This URL routes to the backend launcher which detects Shoeclean across all ports.
 */
export function getKioskLaunchUrl(kioskId: string, directUrl?: string): string {
  if (directUrl && directUrl.includes('/launcher/kiosk')) return directUrl;
  const cleanId = encodeURIComponent((kioskId || 'KIOSK-01-MAIN').trim().toUpperCase());

  if (typeof window !== 'undefined' && window.location) {
    const { hostname, protocol } = window.location;
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      return `${protocol}//${hostname}:3000/api/launcher/kiosk?kioskId=${cleanId}`;
    }
  }
  return `http://localhost:3000/api/launcher/kiosk?kioskId=${cleanId}`;
}

export const KIOSK_LAUNCHER_URL = getKioskLaunchUrl('KIOSK-01-MAIN');
export const KIOSK_APP_URL = KIOSK_LAUNCHER_URL;

export async function fetchLauncherNetworkInfo(): Promise<{
  success: boolean;
  primaryIp: string;
  lanBackendUrl: string;
  lanKioskUrl: string;
  launcherUrl: string;
}> {
  try {
    const baseUrl = getApiBaseUrl();
    const res = await fetch(`${baseUrl}/launcher/network-info`);
    if (!res.ok) throw new Error('Failed to fetch network info');
    return await res.json();
  } catch {
    const host =
      typeof window !== 'undefined' &&
      window.location.hostname !== 'localhost' &&
      window.location.hostname !== '127.0.0.1'
        ? window.location.hostname
        : '192.168.1.4';
    return {
      success: false,
      primaryIp: host,
      lanBackendUrl: `http://${host}:3000`,
      lanKioskUrl: `http://${host}:8081`,
      launcherUrl: `http://${host}:3000/api/launcher/kiosk`,
    };
  }
}

/**
 * Downloads a pre-configured Windows .bat script that dynamically launches the dedicated Kiosk Web Terminal (Shoeclean).
 * Auto-detects the active Shoeclean port so it NEVER breaks if Expo changes ports.
 */
export function downloadKioskWindowsLauncher(kioskId: string, ownerName?: string): void {
  const cleanId = (kioskId || 'KIOSK-01-MAIN').trim().toUpperCase();
  const label = ownerName ? ` - ${ownerName}` : '';
  const launcherUrl = getKioskLaunchUrl(cleanId);
  const batContent = `@echo off
title KixCleen Kiosk Software${label} [%KIOSK_ID%]
echo ========================================================
echo   KixCleen Automated Shoe-Cleaning Kiosk Terminal
echo   Assigned Kiosk ID: ${cleanId}
echo   Owner Account: ${ownerName || 'Authorized Operator'}
echo ========================================================
echo.
echo Connecting to Shoeclean Kiosk Terminal...
echo Auto-detecting active terminal port...
start "" "${launcherUrl}"
echo.
echo Connected via dynamic launcher: ${launcherUrl}
echo You can keep this window open or close it.
`;

  const blob = new Blob([batContent], { type: 'application/x-bat' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Launch_KixCleen_${cleanId}.bat`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function updateAdminBuyer(
  id: string,
  payload: {
    fullName?: string;
    email?: string;
    username?: string;
    phone?: string;
    companyName?: string;
    kioskIds?: string[];
  }
): Promise<{
  success: boolean;
  message: string;
  buyer: AdminBuyer;
}> {
  return apiRequest(`/admin/buyers/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function toggleAdminBuyerStatus(
  id: string,
  isActive: boolean
): Promise<{
  success: boolean;
  message: string;
  buyer: AdminBuyer;
}> {
  return apiRequest(`/admin/buyers/${encodeURIComponent(id)}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ isActive }),
  });
}

export async function deleteAdminBuyer(id: string): Promise<{
  success: boolean;
  message: string;
  deletedId?: string;
  deletedEmail?: string;
}> {
  return apiRequest(`/admin/buyers/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}

export async function regenerateBuyerInvite(id: string): Promise<{
  success: boolean;
  message: string;
  buyer: AdminBuyer;
  invitation: {
    token: string;
    setupPath: string;
    expiresAt: string;
  };
}> {
  return apiRequest(`/admin/buyers/${encodeURIComponent(id)}/invite`, {
    method: 'POST',
  });
}

export async function fetchAdminAssignments(): Promise<{
  success: boolean;
  count: number;
  assignments: KioskAssignmentRecord[];
  unassignedKiosks: AdminKiosk[];
}> {
  return apiRequest('/admin/assignments');
}

export async function assignKiosksToBuyer(payload: {
  buyerId: string;
  kioskIds: string[];
  allowTransfer?: boolean;
  notes?: string;
}): Promise<{
  success: boolean;
  message: string;
  buyer: AdminBuyer;
}> {
  return apiRequest('/admin/assignments', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function unassignKiosk(kioskId: string): Promise<{
  success: boolean;
  message: string;
}> {
  return apiRequest(`/admin/assignments/${encodeURIComponent(kioskId)}`, {
    method: 'DELETE',
  });
}

// ============================================================================
// Public Customer Inquiries & Order Requests
// ============================================================================
export async function submitCustomerInquiry(payload: {
  fullName: string;
  email: string;
  phone: string;
  preferredLocation?: string;
  inquiryType?: string;
  estimatedPairs?: string;
  message?: string;
}): Promise<{
  success: boolean;
  message: string;
  inquiry: CustomerInquiry;
}> {
  return apiRequest('/public/inquiries', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function fetchAdminInquiries(): Promise<{
  success: boolean;
  count: number;
  inquiries: CustomerInquiry[];
}> {
  return apiRequest('/admin/inquiries');
}

export async function updateAdminInquiryStatus(
  id: string,
  status: 'pending' | 'contacted' | 'completed' | 'cancelled',
  adminNotes?: string
): Promise<{
  success: boolean;
  message: string;
  inquiry: CustomerInquiry;
}> {
  return apiRequest(`/admin/inquiries/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify({ status, adminNotes }),
  });
}

export async function deleteAdminInquiry(id: string): Promise<{
  success: boolean;
  message: string;
}> {
  return apiRequest(`/admin/inquiries/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}
