import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { RefreshCw, ArrowUpRight } from 'lucide-react';
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
      setError(err.message || 'Could not load overview.');
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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-neutral-950">
            Overview
          </h1>
          <p className="mt-0.5 text-xs text-neutral-500">
            Registered kiosks, buyers, and active locations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadOverview}
            className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-4 py-2 text-xs font-medium text-neutral-700 hover:border-neutral-950"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <Link
            to="/admin/kiosks"
            className="rounded-full bg-neutral-950 px-4 py-2 text-xs font-medium text-white hover:bg-neutral-800"
          >
            Manage Kiosks
          </Link>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-700">
          {error}
        </div>
      )}

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-2xl border border-neutral-200 bg-white p-5">
          <span className="text-xs text-neutral-400">Total Kiosks</span>
          <p className="font-display mt-2 text-3xl font-bold text-neutral-950">
            {data?.totalKiosks ?? 0}
          </p>
          <p className="mt-1 text-xs text-neutral-500">
            {data?.assignedKiosks ?? 0} assigned, {data?.unassignedKiosks ?? 0} unassigned
          </p>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-5">
          <span className="text-xs text-neutral-400">Buyer Accounts</span>
          <p className="font-display mt-2 text-3xl font-bold text-neutral-950">
            {data?.totalBuyers ?? 0}
          </p>
          <p className="mt-1 text-xs text-neutral-500">
            {data?.activeBuyers ?? 0} active, {data?.invitedBuyers ?? 0} invited
          </p>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-5">
          <span className="text-xs text-neutral-400">Active Kiosks</span>
          <p className="font-display mt-2 text-3xl font-bold text-neutral-950">
            {data?.activeKiosks ?? 0}
          </p>
          <p className="mt-1 text-xs text-neutral-500">
            {data?.statusBreakdown.online ?? 0} online, {data?.statusBreakdown.busy ?? 0} in use
          </p>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-5">
          <span className="text-xs text-neutral-400">Inactive / Offline</span>
          <p className="font-display mt-2 text-3xl font-bold text-neutral-950">
            {data?.inactiveKiosks ?? 0}
          </p>
          <p className="mt-1 text-xs text-neutral-500">
            {data?.statusBreakdown.offline ?? 0} offline
          </p>
        </div>
      </div>

      {/* Map + Table */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-6">
          <div className="rounded-2xl border border-neutral-200 bg-white p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-display text-base font-bold text-neutral-950">
                Kiosk Locations
              </h2>
              <Link
                to="/admin/kiosks"
                className="inline-flex items-center gap-1 text-xs font-medium text-neutral-600 hover:text-neutral-950"
              >
                Edit coordinates
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
              heightClass="h-[420px]"
            />
          </div>
        </div>

        <div className="lg:col-span-6">
          <div className="flex h-full flex-col rounded-2xl border border-neutral-200 bg-white p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-display text-base font-bold text-neutral-950">
                Registered Kiosks
              </h2>
              <Link
                to="/admin/assignments"
                className="inline-flex items-center gap-1 text-xs font-medium text-neutral-600 hover:text-neutral-950"
              >
                Assignments
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="flex-1 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-neutral-200 text-neutral-400">
                    <th className="py-2.5 pr-3 font-medium">Kiosk</th>
                    <th className="px-3 py-2.5 font-medium">City</th>
                    <th className="px-3 py-2.5 font-medium">Status</th>
                    <th className="py-2.5 pl-3 font-medium">Buyer</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {(data?.kiosks || []).map((k) => (
                    <tr
                      key={k.id}
                      onClick={() => {
                        if (k.hasValidCoordinates) setSelectedKioskId(k.id);
                      }}
                      className={`cursor-pointer transition hover:bg-neutral-50 ${
                        selectedKioskId === k.id ? 'bg-neutral-50' : ''
                      }`}
                    >
                      <td className="py-3 pr-3">
                        <p className="font-mono text-[11px] text-neutral-400">
                          {k.id}
                        </p>
                        <p className="font-semibold text-neutral-950">{k.name}</p>
                      </td>
                      <td className="px-3 py-3">
                        <p className="text-neutral-800">{k.city}</p>
                        <p className="font-mono text-[10px] text-neutral-400">
                          {k.hasValidCoordinates
                            ? `${k.latitude?.toFixed(4)}, ${k.longitude?.toFixed(4)}`
                            : 'No pin'}
                        </p>
                      </td>
                      <td className="px-3 py-3">
                        <StatusBadge status={k.status} type="kiosk" size="sm" />
                      </td>
                      <td className="py-3 pl-3">
                        {k.owner ? (
                          <div>
                            <p className="font-medium text-neutral-950">
                              {k.owner.fullName}
                            </p>
                            <p className="text-[11px] text-neutral-400">
                              {k.owner.email}
                            </p>
                          </div>
                        ) : (
                          <span className="text-neutral-400">Unassigned</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
