export type KioskOperatingStatus = 'online' | 'offline' | 'busy' | 'error' | 'maintenance';

export type UserRole = 'superadmin' | 'buyer' | 'owner' | 'admin' | 'public';

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  fullName: string;
  phone?: string | null;
  companyName?: string | null;
  role: UserRole;
  accountStatus?: 'invited' | 'active' | 'deactivated';
  assignedKioskIds?: string[] | null;
  createdAt?: string;
}

export interface PublicKiosk {
  id: string;
  name: string;
  address: string;
  city: string;
  location: string;
  latitude: number | null;
  longitude: number | null;
  hasValidCoordinates: boolean;
  status: KioskOperatingStatus;
  operatingHours: string;
  servicesOffered: string[];
  currentActivity: string;
  lastHeartbeat: string | null;
}

export interface AdminKioskOwnerInfo {
  assignmentId: number;
  buyerId: string;
  fullName: string;
  email: string;
  username: string;
  companyName: string | null;
  isActive: boolean;
  assignedAt: string;
  notes: string | null;
}

export interface AdminKiosk {
  id: string;
  name: string;
  address: string;
  city: string;
  location: string;
  latitude: number | null;
  longitude: number | null;
  hasValidCoordinates: boolean;
  status: KioskOperatingStatus;
  isActive: boolean;
  isPublic: boolean;
  operatingHours: string;
  servicesOffered: string;
  doorLocked: boolean;
  waterLevelPercent: number;
  soapLevelPercent: number;
  currentOrderId: string | null;
  currentActivity: string;
  lastHeartbeat: string | null;
  createdAt: string;
  updatedAt: string;
  owner: AdminKioskOwnerInfo | null;
}

export interface BuyerAssignedKioskSummary {
  id: string;
  name: string;
  city: string;
  address: string;
  status: KioskOperatingStatus;
  isActive: boolean;
  assignedAt: string;
  launcherUrl?: string;
}

export interface AdminBuyer {
  id: string;
  username: string;
  email: string;
  fullName: string;
  phone: string;
  companyName: string;
  role: string;
  isActive: boolean;
  accountStatus: 'invited' | 'active' | 'deactivated';
  inviteExpiresAt: string | null;
  assignedKiosksCount: number;
  assignedKiosks: BuyerAssignedKioskSummary[];
  createdAt: string;
  updatedAt: string;
}

export interface KioskAssignmentRecord {
  id: number;
  kioskId: string;
  kioskName: string;
  kioskCity: string;
  kioskAddress: string;
  kioskStatus: KioskOperatingStatus;
  buyerId: string;
  buyerName: string;
  buyerEmail: string;
  buyerCompany: string;
  buyerIsActive: boolean;
  assignedBy: string;
  notes: string;
  assignedAt: string;
}

export interface AdminOverviewData {
  totalKiosks: number;
  activeKiosks: number;
  inactiveKiosks: number;
  assignedKiosks: number;
  unassignedKiosks: number;
  statusBreakdown: {
    online: number;
    busy: number;
    maintenance: number;
    offline: number;
  };
  totalBuyers: number;
  activeBuyers: number;
  invitedBuyers: number;
  deactivatedBuyers: number;
  kiosks: AdminKiosk[];
  recentBuyers: AdminBuyer[];
}

export interface BuyerInvitationInfo {
  userId: string;
  username: string;
  email: string;
  fullName: string;
  companyName: string | null;
  role: string;
  assignedKioskIds: string[];
  assignedKiosks?: Array<{
    id: string;
    name: string;
    city: string;
    address: string;
    location: string;
    status: string;
    launcherUrl?: string;
  }>;
}
