import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, X } from 'lucide-react';
import {
  fetchAdminKiosks,
  fetchAdminBuyers,
  registerAdminKiosk,
  updateAdminKiosk,
  updateAdminKioskStatus,
} from '../../api/client';
import { AdminKiosk, AdminBuyer, KioskOperatingStatus } from '../../types';
import { KioskMap } from '../../components/map/KioskMap';
import { StatusBadge } from '../../components/common/StatusBadge';
import { ConfirmModal } from '../../components/common/ConfirmModal';

interface KioskFormState {
  id: string;
  name: string;
  address: string;
  city: string;
  location: string;
  latitude: string;
  longitude: string;
  status: KioskOperatingStatus;
  isActive: boolean;
  isPublic: boolean;
  operatingHours: string;
  servicesOffered: string;
  buyerId: string;
}

const initialForm: KioskFormState = {
  id: '',
  name: '',
  address: '',
  city: 'Zamboanga City',
  location: '',
  latitude: '6.921400',
  longitude: '122.079000',
  status: 'online',
  isActive: true,
  isPublic: true,
  operatingHours: '8:00 AM - 10:00 PM Daily',
  servicesOffered:
    'Sanitation, Disinfection, Deodorize, UV Light Bacterial Removal, Dryer',
  buyerId: '',
};

export const KioskManagementPage: React.FC = () => {
  const [kiosks, setKiosks] = useState<AdminKiosk[]>([]);
  const [buyers, setBuyers] = useState<AdminBuyer[]>([]);
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const [loading, setLoading] = useState<boolean>(true);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingKiosk, setEditingKiosk] = useState<AdminKiosk | null>(null);
  const [form, setForm] = useState<KioskFormState>(initialForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState<boolean>(false);

  const [confirmToggleKiosk, setConfirmToggleKiosk] = useState<AdminKiosk | null>(null);
  const [toggling, setToggling] = useState<boolean>(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [kRes, bRes] = await Promise.all([
        fetchAdminKiosks(),
        fetchAdminBuyers(),
      ]);
      if (kRes.success) setKiosks(kRes.kiosks);
      if (bRes.success) setBuyers(bRes.buyers);
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'Could not load kiosks.',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openRegisterModal = () => {
    setEditingKiosk(null);
    setForm({
      ...initialForm,
      id: `KIOSK-0${kiosks.length + 1}-ZAM`,
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (k: AdminKiosk) => {
    setEditingKiosk(k);
    setForm({
      id: k.id,
      name: k.name,
      address: k.address,
      city: k.city,
      location: k.location,
      latitude: k.latitude !== null ? String(k.latitude) : '',
      longitude: k.longitude !== null ? String(k.longitude) : '',
      status: k.status,
      isActive: k.isActive,
      isPublic: k.isPublic,
      operatingHours: k.operatingHours,
      servicesOffered: k.servicesOffered,
      buyerId: k.owner?.buyerId || '',
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSaveKiosk = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!form.name.trim() || !form.address.trim() || !form.city.trim()) {
      setFormError('Name, street address, and city are required.');
      return;
    }

    const latVal = form.latitude.trim() === '' ? null : Number(form.latitude);
    const lngVal = form.longitude.trim() === '' ? null : Number(form.longitude);

    if (
      (latVal !== null && (!Number.isFinite(latVal) || latVal < -90 || latVal > 90)) ||
      (lngVal !== null && (!Number.isFinite(lngVal) || lngVal < -180 || lngVal > 180))
    ) {
      setFormError('Enter valid latitude (-90 to 90) and longitude (-180 to 180).');
      return;
    }

    if ((latVal !== null && lngVal === null) || (latVal === null && lngVal !== null)) {
      setFormError('Provide both latitude and longitude, or leave both empty.');
      return;
    }

    setSaving(true);
    try {
      if (editingKiosk) {
        const res = await updateAdminKiosk(editingKiosk.id, {
          name: form.name.trim(),
          address: form.address.trim(),
          city: form.city.trim(),
          location: form.location.trim() || form.address.trim(),
          latitude: latVal,
          longitude: lngVal,
          status: form.status,
          isActive: form.isActive,
          isPublic: form.isPublic,
          operatingHours: form.operatingHours.trim(),
          servicesOffered: form.servicesOffered.trim(),
        });
        setFeedback({ type: 'success', message: res.message });
      } else {
        const res = await registerAdminKiosk({
          id: form.id.trim().toUpperCase(),
          name: form.name.trim(),
          address: form.address.trim(),
          city: form.city.trim(),
          location: form.location.trim() || form.address.trim(),
          latitude: latVal,
          longitude: lngVal,
          status: form.status,
          isActive: form.isActive,
          isPublic: form.isPublic,
          operatingHours: form.operatingHours.trim(),
          servicesOffered: form.servicesOffered.trim(),
          buyerId: form.buyerId || null,
        });
        setFeedback({ type: 'success', message: res.message });
      }
      setIsModalOpen(false);
      await loadData();
    } catch (err: any) {
      setFormError(err.message || 'Could not save kiosk.');
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmToggleActive = async () => {
    if (!confirmToggleKiosk) return;
    setToggling(true);
    try {
      const res = await updateAdminKioskStatus(confirmToggleKiosk.id, {
        isActive: !confirmToggleKiosk.isActive,
      });
      setFeedback({ type: 'success', message: res.message });
      setConfirmToggleKiosk(null);
      await loadData();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'Could not update kiosk state.',
      });
    } finally {
      setToggling(false);
    }
  };

  const handleQuickPublicToggle = async (k: AdminKiosk) => {
    try {
      await updateAdminKioskStatus(k.id, { isPublic: !k.isPublic });
      await loadData();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'Could not update visibility.',
      });
    }
  };

  const filteredKiosks = kiosks.filter((k) => {
    if (statusFilter !== 'all' && k.status !== statusFilter) return false;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      const hay = `${k.id} ${k.name} ${k.city} ${k.address} ${k.location} ${k.owner?.fullName || ''}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  const parsedPickedCoords =
    form.latitude.trim() !== '' &&
    form.longitude.trim() !== '' &&
    Number.isFinite(Number(form.latitude)) &&
    Number.isFinite(Number(form.longitude))
      ? { lat: Number(form.latitude), lng: Number(form.longitude) }
      : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-neutral-950">
            Kiosks
          </h1>
          <p className="mt-0.5 text-xs text-neutral-500">
            Register machines, edit coordinates, and update status.
          </p>
        </div>

        <button
          type="button"
          onClick={openRegisterModal}
          className="inline-flex items-center gap-1.5 rounded-full bg-neutral-950 px-4 py-2 text-xs font-medium text-white hover:bg-neutral-800"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Kiosk
        </button>
      </div>

      {feedback && (
        <div
          className={`flex items-center justify-between rounded-xl border p-3.5 text-xs ${
            feedback.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : 'border-rose-200 bg-rose-50 text-rose-700'
          }`}
        >
          <span>{feedback.message}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-neutral-400 hover:text-neutral-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Search & Status Filter */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative min-w-[260px] flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search kiosk ID, name, city, or buyer..."
            className="w-full rounded-xl border border-neutral-200 bg-white py-2 pr-4 pl-10 text-xs text-neutral-900 focus:border-neutral-950 focus:outline-hidden"
          />
        </div>

        <select
          aria-label="Filter by status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-xl border border-neutral-200 bg-white px-3.5 py-2 text-xs font-medium text-neutral-700 focus:border-neutral-950 focus:outline-hidden"
        >
          <option value="all">All statuses ({kiosks.length})</option>
          <option value="online">Online</option>
          <option value="busy">In Use</option>
          <option value="maintenance">Maintenance</option>
          <option value="offline">Offline</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50/60 text-neutral-400">
                <th className="px-5 py-3 font-medium">Kiosk</th>
                <th className="px-4 py-3 font-medium">Location</th>
                <th className="px-4 py-3 font-medium">Coordinates</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Buyer</th>
                <th className="px-4 py-3 font-medium">Map Visibility</th>
                <th className="px-5 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {loading && kiosks.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-neutral-400">
                    Loading...
                  </td>
                </tr>
              ) : filteredKiosks.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-neutral-400">
                    No kiosks found.
                  </td>
                </tr>
              ) : (
                filteredKiosks.map((k) => (
                  <tr key={k.id} className="hover:bg-neutral-50/70">
                    <td className="px-5 py-3.5">
                      <span className="font-mono text-[11px] text-neutral-400">
                        {k.id}
                      </span>
                      <p className="font-semibold text-neutral-950">{k.name}</p>
                    </td>

                    <td className="px-4 py-3.5">
                      <p className="font-medium text-neutral-800">{k.city}</p>
                      <p className="max-w-xs text-neutral-500">{k.address}</p>
                    </td>

                    <td className="px-4 py-3.5 font-mono text-[11px]">
                      {k.hasValidCoordinates ? (
                        <span className="text-neutral-700">
                          {k.latitude?.toFixed(4)}, {k.longitude?.toFixed(4)}
                        </span>
                      ) : (
                        <span className="font-sans text-amber-700">Not set</span>
                      )}
                    </td>

                    <td className="px-4 py-3.5">
                      <StatusBadge status={k.status} type="kiosk" size="sm" />
                      {!k.isActive && (
                        <span className="mt-1 block text-[10px] text-rose-600">
                          Deactivated
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3.5">
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

                    <td className="px-4 py-3.5">
                      <button
                        type="button"
                        onClick={() => handleQuickPublicToggle(k)}
                        className={`rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${
                          k.isPublic
                            ? 'border-neutral-300 bg-white text-neutral-800 hover:border-neutral-950'
                            : 'border-neutral-200 bg-neutral-100 text-neutral-400 hover:text-neutral-700'
                        }`}
                      >
                        {k.isPublic ? 'Public' : 'Hidden'}
                      </button>
                    </td>

                    <td className="px-5 py-3.5 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEditModal(k)}
                          className="rounded-full border border-neutral-200 px-3 py-1 text-xs font-medium text-neutral-700 hover:border-neutral-950"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmToggleKiosk(k)}
                          className="rounded-full border border-neutral-200 px-3 py-1 text-xs font-medium text-neutral-600 hover:border-neutral-950"
                        >
                          {k.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Kiosk Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/40 p-4 backdrop-blur-xs">
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-neutral-200 bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
              <h2 className="font-display text-lg font-bold text-neutral-950">
                {editingKiosk ? `Edit ${editingKiosk.id}` : 'Add Kiosk'}
              </h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-full p-1 text-neutral-400 hover:bg-neutral-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {formError && (
              <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveKiosk} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-700">
                    Kiosk ID
                  </label>
                  <input
                    type="text"
                    required
                    disabled={Boolean(editingKiosk)}
                    value={form.id}
                    onChange={(e) => setForm({ ...form, id: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2 font-mono text-xs disabled:bg-neutral-100"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-neutral-700">
                    Name
                  </label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="KixCleen Vendo #6"
                    className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-700">
                    City
                  </label>
                  <input
                    type="text"
                    required
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2 text-xs"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-neutral-700">
                    Street Address
                  </label>
                  <input
                    type="text"
                    required
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-neutral-700">
                    Landmark / Floor
                  </label>
                  <input
                    type="text"
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-700">
                    Operating Hours
                  </label>
                  <input
                    type="text"
                    value={form.operatingHours}
                    onChange={(e) =>
                      setForm({ ...form, operatingHours: e.target.value })
                    }
                    className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2 text-xs"
                  />
                </div>
              </div>

              <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3.5 space-y-3">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div>
                    <label className="block text-xs font-medium text-neutral-700">
                      Latitude
                    </label>
                    <input
                      type="text"
                      value={form.latitude}
                      onChange={(e) =>
                        setForm({ ...form, latitude: e.target.value })
                      }
                      className="mt-1 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-700">
                      Longitude
                    </label>
                    <input
                      type="text"
                      value={form.longitude}
                      onChange={(e) =>
                        setForm({ ...form, longitude: e.target.value })
                      }
                      className="mt-1 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-700">
                      Status
                    </label>
                    <select
                      aria-label="Status"
                      value={form.status}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          status: e.target.value as KioskOperatingStatus,
                        })
                      }
                      className="mt-1 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs"
                    >
                      <option value="online">Online</option>
                      <option value="busy">In Use</option>
                      <option value="maintenance">Maintenance</option>
                      <option value="offline">Offline</option>
                      <option value="error">Error</option>
                    </select>
                  </div>
                </div>

                <KioskMap
                  kiosks={kiosks}
                  heightClass="h-[200px]"
                  pickerMode={true}
                  pickedCoords={parsedPickedCoords}
                  onPickCoordinates={(lat, lng) =>
                    setForm({
                      ...form,
                      latitude: String(lat),
                      longitude: String(lng),
                    })
                  }
                />
              </div>

              {!editingKiosk && (
                <div>
                  <label className="block text-xs font-medium text-neutral-700">
                    Assign to Buyer (Optional)
                  </label>
                  <select
                    aria-label="Assign to Buyer"
                    value={form.buyerId}
                    onChange={(e) => setForm({ ...form, buyerId: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2 text-xs"
                  >
                    <option value="">Unassigned</option>
                    {buyers.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.fullName} ({b.email})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-6 pt-1 text-xs text-neutral-700">
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.isPublic}
                    onChange={(e) =>
                      setForm({ ...form, isPublic: e.target.checked })
                    }
                    className="h-4 w-4 rounded border-neutral-300"
                  />
                  Show on public map
                </label>

                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) =>
                      setForm({ ...form, isActive: e.target.checked })
                    }
                    className="h-4 w-4 rounded border-neutral-300"
                  />
                  Active
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-neutral-100 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-full border border-neutral-200 px-4 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-full bg-neutral-950 px-5 py-2 text-xs font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        open={Boolean(confirmToggleKiosk)}
        title={
          confirmToggleKiosk?.isActive
            ? `Deactivate ${confirmToggleKiosk.name}?`
            : `Activate ${confirmToggleKiosk?.name}?`
        }
        description={
          confirmToggleKiosk?.isActive
            ? 'This hides the kiosk from the public website and marks it inactive.'
            : 'This restores the kiosk to active operations.'
        }
        confirmLabel={confirmToggleKiosk?.isActive ? 'Deactivate' : 'Activate'}
        variant={confirmToggleKiosk?.isActive ? 'danger' : 'primary'}
        loading={toggling}
        onConfirm={handleConfirmToggleActive}
        onCancel={() => setConfirmToggleKiosk(null)}
      />
    </div>
  );
};
