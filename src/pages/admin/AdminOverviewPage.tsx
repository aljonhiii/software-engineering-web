import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  RefreshCw,
  ArrowUpRight,
  ShoppingBag,
  Users,
  Cpu,
  Mail,
} from 'lucide-react';
import { fetchAdminOverview } from '../../api/client';
import { AdminOverviewData } from '../../types';
import { KioskMap } from '../../components/map/KioskMap';

export const AdminOverviewPage: React.FC = () => {
  const [data, setData] = useState<AdminOverviewData | null>(null);
  const [selectedKioskId, setSelectedKioskId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadOverview = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchAdminOverview();
      if (res.success && res.overview) {
        setData(res.overview);
        if (!selectedKioskId && res.overview.kiosks.length > 0) {
          const firstWithCoords = res.overview.kiosks.find((k) => k.hasValidCoordinates);
          setSelectedKioskId(firstWithCoords?.id || res.overview.kiosks[0].id);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Could not load overview telemetry.');
    } finally {
      setLoading(false);
    }
  }, [selectedKioskId]);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  if (loading && !data) {
    return (
      <div className="flex h-72 items-center justify-center rounded-2xl border border-neutral-200 bg-white text-xs text-neutral-500">
        Loading overview...
      </div>
    );
  }

  const totalUsers = data?.totalBuyers ?? 0;
  const totalOrders = data?.totalOrders ?? 0;
  const totalKiosks = data?.totalKiosks ?? 0;
  const pendingInquiries = data?.pendingInquiriesCount ?? 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-neutral-950">
            Overview
          </h1>
          <p className="mt-0.5 text-xs text-neutral-500">
            Zamboanga City system overview: registered users, kiosk orders, and hardware fleet.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadOverview}
            className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-4 py-2 text-xs font-medium text-neutral-700 hover:border-neutral-950 transition"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <Link
            to="/admin/kiosks"
            className="rounded-full bg-neutral-950 px-4 py-2 text-xs font-medium text-white hover:bg-neutral-800 transition shadow-2xs"
          >
            Manage Kiosks
          </Link>
        </div>
      </div>

      {/* Customer Inquiries Banner if pending */}
      {Boolean(pendingInquiries > 0) && (
        <div className="flex items-center justify-between rounded-2xl border border-amber-200 bg-amber-50/80 p-4 text-xs text-amber-950">
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="h-4 w-4 text-amber-700 shrink-0" />
            <span>
              You have <strong>{pendingInquiries} new customer order inquiries</strong> from Zamboanga City residents.
            </span>
          </div>
          <Link
            to="/admin/inquiries"
            className="inline-flex items-center gap-1 font-semibold text-amber-900 hover:underline"
          >
            Review Inquiries &rarr;
          </Link>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-700">
          {error}
        </div>
      )}

      {/* Primary Metrics: Total Users and Total Kiosk Orders */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {/* Total Users */}
        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-500">Total Users</span>
            <Users className="h-4 w-4 text-neutral-400" />
          </div>
          <p className="font-display mt-2 text-3xl font-bold text-neutral-950">
            {totalUsers}
          </p>
          <p className="mt-1 text-xs text-neutral-400">
            Registered accounts
          </p>
        </div>

        {/* Total Kiosk Orders */}
        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-500">Total Kiosk Orders</span>
            <ShoppingBag className="h-4 w-4 text-neutral-400" />
          </div>
          <p className="font-display mt-2 text-3xl font-bold text-neutral-950">
            {totalOrders}
          </p>
          <p className="mt-1 text-xs text-neutral-400">
            Completed cleaning cycles
          </p>
        </div>

        {/* Kiosks */}
        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-500">Kiosks</span>
            <Cpu className="h-4 w-4 text-neutral-400" />
          </div>
          <p className="font-display mt-2 text-3xl font-bold text-neutral-950">
            {totalKiosks}
          </p>
          <p className="mt-1 text-xs text-neutral-400">
            Zamboanga City machines
          </p>
        </div>

        {/* Customer Inquiries */}
        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-500">Customer Inquiries</span>
            <Mail className="h-4 w-4 text-neutral-400" />
          </div>
          <p className="font-display mt-2 text-3xl font-bold text-neutral-950">
            {pendingInquiries}
          </p>
          <p className="mt-1 text-xs text-neutral-400">
            Pending service requests
          </p>
        </div>
      </div>

      {/* Interactive Zamboanga Map (Full Width) */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-2xs">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="font-display text-base font-bold text-neutral-950">
              Zamboanga City Kiosks
            </h2>
            <p className="text-[11px] text-neutral-400">
              GPS locations across malls and commercial centers
            </p>
          </div>
          <Link
            to="/admin/kiosks"
            className="inline-flex items-center gap-1 text-xs font-medium text-neutral-600 hover:text-neutral-950"
          >
            View all
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <KioskMap
          kiosks={(data?.kiosks || []).map((k) => ({
            ...k,
            ownerName: k.owner ? k.owner.fullName : 'Unassigned',
          }))}
          selectedKioskId={selectedKioskId}
          onSelectKiosk={(item) => setSelectedKioskId(item.id)}
          heightClass="h-[480px]"
        />
      </div>
    </div>
  );
};
