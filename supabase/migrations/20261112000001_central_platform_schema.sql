-- =============================================================================
-- KixCleen Central Management Platform — Supabase PostgreSQL Schema & RLS
-- Entities: users, kiosks, kiosk_owners, machine_status, transactions,
--           machine_logs, notification_tokens
-- =============================================================================

-- 1. Users Profile & Role Table
CREATE TABLE IF NOT EXISTS public.users (
    id VARCHAR(50) PRIMARY KEY,
    auth_user_id UUID UNIQUE NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NULL,
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(30) NULL,
    company_name VARCHAR(120) NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'buyer' CHECK (role IN ('superadmin', 'buyer', 'owner', 'admin')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    account_status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (account_status IN ('invited', 'active', 'deactivated')),
    invite_token_hash VARCHAR(255) NULL,
    invite_expires_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_role_active ON public.users(role, is_active);
CREATE INDEX IF NOT EXISTS idx_users_auth_uid ON public.users(auth_user_id);

-- 2. Kiosks Registry & Geolocation Table
CREATE TABLE IF NOT EXISTS public.kiosks (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    address VARCHAR(255) NOT NULL DEFAULT '',
    city VARCHAR(100) NOT NULL DEFAULT '',
    location VARCHAR(200) NOT NULL,
    latitude NUMERIC(10, 7) NULL CHECK (latitude IS NULL OR (latitude >= -90 AND latitude <= 90)),
    longitude NUMERIC(10, 7) NULL CHECK (longitude IS NULL OR (longitude >= -180 AND longitude <= 180)),
    status VARCHAR(20) NOT NULL DEFAULT 'offline' CHECK (status IN ('online', 'offline', 'busy', 'error', 'maintenance')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_public BOOLEAN NOT NULL DEFAULT TRUE,
    operating_hours VARCHAR(120) DEFAULT '8:00 AM - 10:00 PM Daily',
    services_offered VARCHAR(255) DEFAULT 'Sanitation, Disinfection, Deodorize, UV Light Bacterial Removal, Dryer',
    door_locked BOOLEAN NOT NULL DEFAULT FALSE,
    water_level_pct INT NOT NULL DEFAULT 100,
    soap_level_pct INT NOT NULL DEFAULT 100,
    current_order_id VARCHAR(50) NULL,
    current_activity VARCHAR(100) DEFAULT 'Idle',
    last_heartbeat TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_kiosks_public_locator ON public.kiosks(is_public, is_active, city, status);
CREATE INDEX IF NOT EXISTS idx_kiosks_coords ON public.kiosks(latitude, longitude);

-- 3. Kiosk Owners (Buyer-to-Kiosk Assignments)
CREATE TABLE IF NOT EXISTS public.kiosk_owners (
    id BIGSERIAL PRIMARY KEY,
    kiosk_id VARCHAR(50) NOT NULL UNIQUE REFERENCES public.kiosks(id) ON DELETE CASCADE,
    buyer_id VARCHAR(50) NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    assigned_by VARCHAR(50) NULL REFERENCES public.users(id) ON DELETE SET NULL,
    notes VARCHAR(255) NULL,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_kiosk_owners_buyer ON public.kiosk_owners(buyer_id);
CREATE INDEX IF NOT EXISTS idx_kiosk_owners_kiosk ON public.kiosk_owners(kiosk_id);

-- 4. Machine Status Table
CREATE TABLE IF NOT EXISTS public.machine_status (
    kiosk_id VARCHAR(50) PRIMARY KEY REFERENCES public.kiosks(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'offline' CHECK (status IN ('online', 'offline', 'busy', 'error', 'maintenance')),
    door_locked BOOLEAN NOT NULL DEFAULT FALSE,
    water_level_pct INT NOT NULL DEFAULT 100,
    soap_level_pct INT NOT NULL DEFAULT 100,
    current_order_id VARCHAR(50) NULL,
    current_activity VARCHAR(100) DEFAULT 'Idle',
    error_code VARCHAR(50) NULL,
    last_heartbeat TIMESTAMPTZ NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_machine_status_heartbeat ON public.machine_status(last_heartbeat);

-- 5. Transactions Table
CREATE TABLE IF NOT EXISTS public.transactions (
    id VARCHAR(50) PRIMARY KEY,
    order_id VARCHAR(50) UNIQUE NOT NULL,
    kiosk_id VARCHAR(50) NOT NULL REFERENCES public.kiosks(id) ON DELETE RESTRICT,
    shoe_type VARCHAR(50) NOT NULL,
    service_tier VARCHAR(50) NOT NULL,
    service_name VARCHAR(100) NOT NULL,
    addons JSONB NULL,
    base_price NUMERIC(10, 2) NOT NULL,
    addons_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    total_amount NUMERIC(10, 2) NOT NULL,
    payment_method VARCHAR(30) NOT NULL,
    payment_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
    payment_ref VARCHAR(100) NULL,
    cleaning_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (cleaning_status IN ('pending', 'in_progress', 'completed', 'failed', 'cancelled')),
    started_at TIMESTAMPTZ NULL,
    completed_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transactions_kiosk_created ON public.transactions(kiosk_id, created_at DESC);

-- 6. Row Level Security (RLS) Policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kiosks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kiosk_owners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.machine_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Public read access to active public kiosks
CREATE POLICY "Public users can view active public kiosks"
ON public.kiosks FOR SELECT
TO anon, authenticated
USING (is_public = TRUE AND is_active = TRUE);

-- Buyers can view only their assigned kiosks
CREATE POLICY "Buyers can view their assigned kiosks"
ON public.kiosks FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.kiosk_owners ko
        JOIN public.users u ON u.id = ko.buyer_id
        WHERE ko.kiosk_id = public.kiosks.id
          AND u.auth_user_id = auth.uid()
          AND u.is_active = TRUE
    )
);

-- Buyers can view transactions only for their assigned kiosks
CREATE POLICY "Buyers can view transactions for assigned kiosks"
ON public.transactions FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.kiosk_owners ko
        JOIN public.users u ON u.id = ko.buyer_id
        WHERE ko.kiosk_id = public.transactions.kiosk_id
          AND u.auth_user_id = auth.uid()
          AND u.is_active = TRUE
    )
);

-- Buyers can view machine_status only for their assigned kiosks
CREATE POLICY "Buyers can view machine status for assigned kiosks"
ON public.machine_status FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.kiosk_owners ko
        JOIN public.users u ON u.id = ko.buyer_id
        WHERE ko.kiosk_id = public.machine_status.kiosk_id
          AND u.auth_user_id = auth.uid()
          AND u.is_active = TRUE
    )
);
