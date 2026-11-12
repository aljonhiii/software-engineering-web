# KixCleen Central Management Platform

Centralized Kiosk Locator, Super Admin Dashboard, Buyer Account Management, and Owner Monitoring Ecosystem for the **KixCleen Automated Shoe-Cleaning Vending Machine** network.

---

## 🏗️ Connected Applications

| Application | Location | Purpose |
| :--- | :--- | :--- |
| **1. Public KixCleen Website (Kiosk Locator)** | `c:\Users\PEKTO_Song\Desktop\kixcleen_web-admin` (`/`) | Public customers discover registered kiosks on an interactive **Leaflet + OpenStreetMap** map, filter by city or operating status, and inspect kiosk details without exposing private buyer or transaction data. |
| **2. Super Admin Dashboard** | `c:\Users\PEKTO_Song\Desktop\kixcleen_web-admin` (`/admin`) | Protected Super Admin portal (`role: superadmin`) to view fleet metrics, register/edit kiosks & GPS coordinates, create/manage buyer accounts, generate one-time invitation links, and manage buyer-to-kiosk ownership assignments. |
| **3. Buyer Account Setup Portal** | `c:\Users\PEKTO_Song\Desktop\kixcleen_web-admin` (`/setup-account?token=...`) | Secure one-time invitation link portal where newly onboarded buyers set their password (never visible to the Super Admin) before logging into the Mobile App. |
| **4. Centralized Backend API** | `c:\Users\PEKTO_Song\Desktop\kixcleen_monitoring\backend` (`port 3000`) | Unified Node.js + Express.js + Socket.IO + MySQL/MariaDB (with in-memory fallback & Supabase PostgreSQL migrations) server powering all 4 applications. |
| **5. Owner Monitoring Mobile App** | `c:\Users\PEKTO_Song\Desktop\kixcleen_monitoring\mobile` | React Native + Expo mobile app where authenticated buyers monitor **only** the kiosks assigned to their account. |
| **6. Customer Kiosk Application** | `c:\Users\PEKTO_Song\Desktop\shoeclean` | Customer-facing shoe-cleaning kiosk interface & ESP32 hardware telemetry sender. |

---

## 🗄️ Database Schema & Migrations

- **MySQL / MariaDB Migration**: [001_central_platform_mysql.sql](file:///c:/Users/PEKTO_Song/Desktop/kixcleen_web-admin/database/migrations/001_central_platform_mysql.sql) and [schema.sql](file:///c:/Users/PEKTO_Song/Desktop/kixcleen_monitoring/backend/database/schema.sql)
- **Supabase PostgreSQL + RLS Migration**: [20261112000001_central_platform_schema.sql](file:///c:/Users/PEKTO_Song/Desktop/kixcleen_web-admin/supabase/migrations/20261112000001_central_platform_schema.sql)

### Core Tables
1. `users` — User profiles, roles (`superadmin`, `buyer`, `owner`, `admin`), active status, and hashed one-time invitation tokens.
2. `kiosks` — Kiosk identity, street address, city, landmark, GPS coordinates (`latitude`, `longitude`), operating hours, and public visibility.
3. `kiosk_owners` — Buyer-to-kiosk assignments (`1 Buyer -> Many Kiosks`, with unique kiosk ownership constraint preventing conflicting assignments).
4. `machine_status` — Real-time ESP32 hardware telemetry, water/soap reservoir levels, magnetic lock state, and heartbeat timestamps.
5. `transactions` — Kiosk cleaning orders, shoe categories, services, add-ons, and payment records.

---

## 🚀 Quick Start Guide

### 1. Start the Centralized Backend (`port 3000`)
```bash
cd ../kixcleen_monitoring/backend
npm run dev
```
*(Optional: Run `npm run db:init` when XAMPP MySQL/MariaDB is active on port 3306 to initialize/migrate `kixcleen_db`.)*

### 2. Start the Web Platform (`port 5173`)
```bash
cd ../kixcleen_web-admin
npm run dev
```
- **Public Kiosk Locator**: `http://localhost:5173/`
- **Super Admin Console**: `http://localhost:5173/admin`

### 3. Default Credentials

| Role | Email / Username | Password | Portal |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `superadmin@kixcleen.com` (`superadmin`) | `admin1234` | Web Super Admin Dashboard (`/admin`) |
| **Buyer #1 (2 Kiosks)** | `owner@kixcleen.com` (`owner`) | `admin1234` | Owner Monitoring Mobile App (`KIOSK-01-MAIN`, `KIOSK-02-BGC`) |
| **Buyer #2 (1 Kiosk)** | `marco.santos@kixpartner.ph` (`marcosantos`) | `admin1234` | Owner Monitoring Mobile App (`KIOSK-03-MAKATI`) |
