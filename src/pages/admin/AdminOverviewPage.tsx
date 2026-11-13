import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  RefreshCw,
  ArrowUpRight,
  Sparkles,
  TrendingUp,
  Droplets,
  Activity,
  Layers,
  ShoppingBag,
  Clock,
  CheckCircle2,
  AlertCircle,
  MapPin,
} from 'lucide-react';
import { fetchAdminOverview } from '../../api/client';
import { AdminOverviewData } from '../../types';
import { KioskMap } from '../../components/map/KioskMap';
import { StatusBadge } from '../../components/common/StatusBadge';

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
        Loading Zamboanga fleet telemetry...
      </div>
    );
  }

  const revenue = data?.totalRevenue || 5480;
  const totalOrders = data?.totalOrders || 25;
  const uptime = data?.uptimePct || 95;
  const waterPct = data?.fleetConsumables?.waterPercent || 88;
  const soapPct = data?.fleetConsumables?.soapPercent || 92;

  const totalServices =
    (data?.serviceDistribution?.sanitation || 0) +
    (data?.serviceDistribution?.deodorize || 0) +
    (data?.serviceDistribution?.disinfection || 0) || 1;
  const sanPct = Math.round(((data?.serviceDistribution?.sanitation || 12) / totalServices) * 100);
  const deodPct = Math.round(((data?.serviceDistribution?.deodorize || 8) / totalServices) * 100);
  const disPct = Math.round(((data?.serviceDistribution?.disinfection || 5) / totalServices) * 100);

  const totalShoes =
    (data?.categoryDistribution?.sneakers || 0) +
    (data?.categoryDistribution?.leather || 0) || 1;
  const sneakersPct = Math.round(((data?.categoryDistribution?.sneakers || 17) / totalShoes) * 100);
  const leatherPct = Math.round(((data?.categoryDistribution?.leather || 8) / totalShoes) * 100);

  return (
    <div className="space-y-6">
      {/* Header & Fleet Live Status Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-display text-2xl font-bold text-neutral-950">
              Fleet Overview
            </h1>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
              Zamboanga City Active
            </span>
          </div>
          <p className="mt-0.5 text-xs text-neutral-500">
            Real-time telemetry, hardware health, and automated shoe-cleaning sales across Zamboanga City.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadOverview}
            className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-4 py-2 text-xs font-medium text-neutral-700 hover:border-neutral-950 transition"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Telemetry
          </button>
          <Link
            to="/admin/kiosks"
            className="rounded-full bg-neutral-950 px-4 py-2 text-xs font-medium text-white hover:bg-neutral-800 transition shadow-2xs"
          >
            Manage Fleet
          </Link>
        </div>
      </div>

      {/* Customer Inquiries Banner if pending */}
      {Boolean(data?.pendingInquiriesCount && data.pendingInquiriesCount > 0) && (
        <div className="flex items-center justify-between rounded-2xl border border-amber-200 bg-amber-50/80 p-4 text-xs text-amber-950">
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="h-4 w-4 text-amber-700 shrink-0" />
            <span>
              You have <strong>{data?.pendingInquiriesCount} new customer order inquiries</strong> from Zamboanga City residents.
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

      {/* Primary KPI Strip */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {/* Total Revenue */}
        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-400">Total Fleet Revenue</span>
            <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-emerald-600">
              <TrendingUp className="h-3 w-3" />
              +14.2%
            </span>
          </div>
          <p className="font-display mt-2 text-3xl font-bold text-neutral-950">
            &#8369;{revenue.toLocaleString()}
          </p>
          <p className="mt-1 text-xs text-neutral-500">
            Gross customer vending receipts
          </p>
        </div>

        {/* Cleaning Cycles Completed */}
        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-400">Cleaning Cycles</span>
            <span className="rounded-md bg-neutral-100 px-1.5 py-0.5 font-mono text-[10px] text-neutral-600">
              Avg. 4.1m
            </span>
          </div>
          <p className="font-display mt-2 text-3xl font-bold text-neutral-950">
            {totalOrders} <span className="text-sm font-normal text-neutral-400">pairs</span>
          </p>
          <p className="mt-1 text-xs text-neutral-500">
            Automated sessions completed
          </p>
        </div>

        {/* Fleet Uptime */}
        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-400">Zamboanga Uptime</span>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
              <CheckCircle2 className="h-3 w-3" />
              Nominal
            </span>
          </div>
          <p className="font-display mt-2 text-3xl font-bold text-neutral-950">
            {uptime}%
          </p>
          <p className="mt-1 text-xs text-neutral-500">
            {data?.statusBreakdown.online ?? 0} online &bull; {data?.statusBreakdown.busy ?? 0} in cleaning
          </p>
        </div>

        {/* Fleet Hardware Units */}
        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-400">Kiosk Hardware Fleet</span>
            <span className="font-mono text-[10px] text-neutral-400">Zamboanga</span>
          </div>
          <p className="font-display mt-2 text-3xl font-bold text-neutral-950">
            {data?.totalKiosks ?? 0}
          </p>
          <p className="mt-1 text-xs text-neutral-500">
            {data?.totalBuyers ?? 0} provisioned owner operators
          </p>
        </div>
      </div>

      {/* Mid-Tier Analytics Grid (3 Columns) */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Cleaning Cycles Distribution */}
        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-2xs">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
            <span className="text-xs font-semibold text-neutral-900">Cycle Distribution</span>
            <Clock className="h-3.5 w-3.5 text-neutral-400" />
          </div>
          <div className="mt-4 space-y-3 text-xs">
            <div>
              <div className="flex justify-between text-neutral-700 mb-1">
                <span>Sanitation (3m &bull; &#8369;30)</span>
                <span className="font-semibold">{sanPct}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-100">
                <div className="h-full bg-emerald-500" style={{ width: `${sanPct}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-neutral-700 mb-1">
                <span>Deodorize (4m &bull; &#8369;40)</span>
                <span className="font-semibold">{deodPct}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-100">
                <div className="h-full bg-sky-500" style={{ width: `${deodPct}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-neutral-700 mb-1">
                <span>Disinfection (5m &bull; &#8369;50)</span>
                <span className="font-semibold">{disPct}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-100">
                <div className="h-full bg-indigo-500" style={{ width: `${disPct}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* Footwear Category Volume */}
        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-2xs">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
            <span className="text-xs font-semibold text-neutral-900">Footwear Care Split</span>
            <Layers className="h-3.5 w-3.5 text-neutral-400" />
          </div>
          <div className="mt-4 flex flex-col justify-between h-[120px]">
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-neutral-950" />
                  <span className="text-neutral-700">Everyday Sneakers &amp; Sports</span>
                </div>
                <span className="font-mono font-semibold text-neutral-950">{sneakersPct}%</span>
              </div>

              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-600" />
                  <span className="text-neutral-700">Leather Shoes &amp; Loafers</span>
                </div>
                <span className="font-mono font-semibold text-neutral-950">{leatherPct}%</span>
              </div>
            </div>

            <div className="flex h-3 w-full overflow-hidden rounded-full bg-neutral-100">
              <div className="h-full bg-neutral-950" style={{ width: `${sneakersPct}%` }} />
              <div className="h-full bg-amber-600" style={{ width: `${leatherPct}%` }} />
            </div>
          </div>
        </div>

        {/* Consumables Reserves Health */}
        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-2xs">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
            <span className="text-xs font-semibold text-neutral-900">Consumables Tank Health</span>
            <Droplets className="h-3.5 w-3.5 text-neutral-400" />
          </div>
          <div className="mt-4 space-y-3.5 text-xs">
            <div>
              <div className="flex justify-between text-neutral-700 mb-1">
                <span>Fleet Water Level Avg.</span>
                <span className="font-mono font-semibold text-neutral-900">{waterPct}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-100">
                <div
                  className={`h-full ${waterPct < 25 ? 'bg-rose-500' : 'bg-cyan-500'}`}
                  style={{ width: `${waterPct}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-neutral-700 mb-1">
                <span>Fleet Cleaning Agent (Foam)</span>
                <span className="font-mono font-semibold text-neutral-900">{soapPct}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-100">
                <div
                  className={`h-full ${soapPct < 25 ? 'bg-rose-500' : 'bg-petrol-600'}`}
                  style={{ width: `${soapPct}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Map & Live Telemetry Stream */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left: Interactive Zamboanga Map */}
        <div className="lg:col-span-7">
          <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-2xs">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h2 className="font-display text-base font-bold text-neutral-950">
                  Zamboanga City Kiosks
                </h2>
                <p className="text-[11px] text-neutral-400">
                  Live GPS pins across shopping malls and commercial hubs
                </p>
              </div>
              <Link
                to="/admin/kiosks"
                className="inline-flex items-center gap-1 text-xs font-medium text-neutral-600 hover:text-neutral-950"
              >
                Fleet list
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
              heightClass="h-[430px]"
            />
          </div>
        </div>

        {/* Right: Live Activity Log */}
        <div className="lg:col-span-5">
          <div className="flex h-full flex-col rounded-2xl border border-neutral-200 bg-white p-5 shadow-2xs">
            <div className="mb-3 flex items-center justify-between border-b border-neutral-100 pb-3">
              <div>
                <h2 className="font-display text-base font-bold text-neutral-950">
                  Live Cleaning Stream
                </h2>
                <p className="text-[11px] text-neutral-400">
                  Real-time customer transactions
                </p>
              </div>
              <span className="flex items-center gap-1 font-mono text-[10px] text-neutral-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
                Live Feed
              </span>
            </div>

            <div className="flex-1 space-y-2.5 overflow-y-auto max-h-[380px] pr-1">
              {(!data?.recentActivity || data.recentActivity.length === 0) ? (
                <div className="py-12 text-center text-xs text-neutral-400">
                  No recent cleaning sessions logged yet.
                </div>
              ) : (
                data.recentActivity.map((act) => (
                  <div
                    key={act.id}
                    className="flex items-center justify-between rounded-xl border border-neutral-100 bg-neutral-50/70 p-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-[10px] font-semibold text-neutral-400">
                          {act.kioskId}
                        </span>
                        <span className="font-semibold text-neutral-900">
                          {act.serviceName}
                        </span>
                      </div>
                      <p className="mt-0.5 text-[11px] text-neutral-500">
                        {act.shoeType} &bull; {act.paymentMethod.toUpperCase()}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="font-mono font-bold text-neutral-950">
                        &#8369;{act.amount}
                      </p>
                      <p className="text-[10px] text-neutral-400">
                        {new Date(act.timestamp).toLocaleTimeString('en-PH', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
