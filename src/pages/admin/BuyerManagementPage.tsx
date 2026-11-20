import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, X, Monitor, Download, Play, QrCode, Mail, Trash2, Layers, Cpu, Check } from 'lucide-react';
import {
  fetchAdminBuyers,
  fetchAdminKiosks,
  createAdminBuyer,
  updateAdminBuyer,
  toggleAdminBuyerStatus,
  deleteAdminBuyer,
  regenerateBuyerInvite,
  downloadKioskWindowsLauncher,
  getKioskLaunchUrl,
  registerAdminKiosk,
} from '../../api/client';
import { AdminBuyer, AdminKiosk } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { ConfirmModal } from '../../components/common/ConfirmModal';
import { TabletQrModal } from '../../components/common/TabletQrModal';

export const BuyerManagementPage: React.FC = () => {
  const [buyers, setBuyers] = useState<AdminBuyer[]>([]);
  const [kiosks, setKiosks] = useState<AdminKiosk[]>([]);
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const [loading, setLoading] = useState<boolean>(true);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingBuyer, setEditingBuyer] = useState<AdminBuyer | null>(null);
  const [fullName, setFullName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [companyName, setCompanyName] = useState<string>('');
  const [selectedKioskIds, setSelectedKioskIds] = useState<string[]>([]);
  
  // Dedicated Kiosk Provisioning (supports 1, 2, or more kiosks)
  const [createDedicatedKiosk, setCreateDedicatedKiosk] = useState<boolean>(true);
  const [kioskCount, setKioskCount] = useState<number>(2); // Default to 2 for multi-kiosk owners
  const [dedicatedKioskId, setDedicatedKioskId] = useState<string>('');
  const [dedicatedKioskName, setDedicatedKioskName] = useState<string>('');
  const [dedicatedKioskCity, setDedicatedKioskCity] = useState<string>('Zamboanga City');
  const [dedicatedKioskAddress, setDedicatedKioskAddress] = useState<string>('');
  const [dedicatedKiosk2Id, setDedicatedKiosk2Id] = useState<string>('');
  const [dedicatedKiosk2Name, setDedicatedKiosk2Name] = useState<string>('');
  const [dedicatedKiosk2City, setDedicatedKiosk2City] = useState<string>('Zamboanga City');
  const [dedicatedKiosk2Address, setDedicatedKiosk2Address] = useState<string>('');

  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState<boolean>(false);

  // Dedicated Distribute Kiosks Modal State
  const [distributeModalBuyer, setDistributeModalBuyer] = useState<AdminBuyer | null>(null);
  const [distributeKioskIds, setDistributeKioskIds] = useState<string[]>([]);
  const [distributing, setDistributing] = useState<boolean>(false);
  const [distributeNewOpen, setDistributeNewOpen] = useState<boolean>(false);
  const [newKioskName, setNewKioskName] = useState<string>('');
  const [newKioskAddress, setNewKioskAddress] = useState<string>('');
  const [creatingNewKiosk, setCreatingNewKiosk] = useState<boolean>(false);

  const [confirmStatusBuyer, setConfirmStatusBuyer] = useState<AdminBuyer | null>(null);
  const [toggling, setToggling] = useState<boolean>(false);

  const [confirmDeleteBuyer, setConfirmDeleteBuyer] = useState<AdminBuyer | null>(null);
  const [deleting, setDeleting] = useState<boolean>(false);

  const [tabletQrTarget, setTabletQrTarget] = useState<{
    kioskId: string;
    kioskName?: string;
    ownerName?: string;
  } | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [bRes, kRes] = await Promise.all([
        fetchAdminBuyers(),
        fetchAdminKiosks(),
      ]);
      if (bRes.success) setBuyers(bRes.buyers);
      if (kRes.success) setKiosks(kRes.kiosks);
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'Could not load buyers.',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openCreateModal = () => {
    setEditingBuyer(null);
    setFullName('');
    setEmail('');
    setUsername('');
    setPhone('');
    setCompanyName('');
    setSelectedKioskIds([]);
    setCreateDedicatedKiosk(true);
    setKioskCount(2); // Default to 2 for multi-kiosk distribution
    setDedicatedKioskId('');
    setDedicatedKioskName('');
    setDedicatedKioskCity('Zamboanga City');
    setDedicatedKioskAddress('');
    setDedicatedKiosk2Id('');
    setDedicatedKiosk2Name('');
    setDedicatedKiosk2City('Zamboanga City');
    setDedicatedKiosk2Address('');
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (b: AdminBuyer) => {
    setEditingBuyer(b);
    setFullName(b.fullName);
    setEmail(b.email);
    setUsername(b.username);
    setPhone(b.phone);
    setCompanyName(b.companyName);
    setSelectedKioskIds(b.assignedKiosks.map((k) => k.id));
    setFormError(null);
    setIsModalOpen(true);
  };

  const openDistributeModal = (buyer: AdminBuyer) => {
    setDistributeModalBuyer(buyer);
    setDistributeKioskIds(buyer.assignedKiosks.map((k) => k.id));
    setDistributeNewOpen(false);
    setNewKioskName('');
    setNewKioskAddress('');
  };

  const handleSaveDistribute = async () => {
    if (!distributeModalBuyer) return;
    setDistributing(true);
    try {
      await updateAdminBuyer(distributeModalBuyer.id, {
        kioskIds: distributeKioskIds,
      });
      setFeedback({
        type: 'success',
        message: `Kiosk distribution updated for ${distributeModalBuyer.fullName}. ${distributeKioskIds.length} kiosk(s) assigned.`,
      });
      setDistributeModalBuyer(null);
      await loadData();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'Could not update kiosk distribution.',
      });
    } finally {
      setDistributing(false);
    }
  };

  const handleCreateAndDistributeNewKiosk = async () => {
    if (!distributeModalBuyer || !newKioskName.trim()) return;
    setCreatingNewKiosk(true);
    try {
      const cleanUname = (distributeModalBuyer.username || 'OWNER').toUpperCase().replace(/[^A-Z0-9]/g, '');
      const nextNum = (distributeKioskIds.length + 1).toString().padStart(2, '0');
      const genId = `KIOSK-${cleanUname}-${nextNum}`;

      const addr = newKioskAddress.trim() || 'Main Station';
      const res = await registerAdminKiosk({
        id: genId,
        name: newKioskName.trim(),
        address: addr,
        location: addr,
        city: 'Zamboanga City',
        latitude: null,
        longitude: null,
        buyerId: distributeModalBuyer.id,
      });

      if (res.success && res.kiosk) {
        setDistributeKioskIds((prev) => [...prev, res.kiosk.id]);
        setNewKioskName('');
        setNewKioskAddress('');
        setDistributeNewOpen(false);
        await loadData();
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'Could not create new kiosk.',
      });
    } finally {
      setCreatingNewKiosk(false);
    }
  };

  const handleSaveBuyer = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!fullName.trim() || !email.trim()) {
      setFormError('Full name and email are required.');
      return;
    }

    setSaving(true);
    try {
      if (editingBuyer) {
        const res = await updateAdminBuyer(editingBuyer.id, {
          fullName: fullName.trim(),
          email: email.trim(),
          username: username.trim() || editingBuyer.username,
          phone: phone.trim(),
          companyName: companyName.trim(),
          kioskIds: selectedKioskIds,
        });
        setFeedback({ type: 'success', message: res.message });
        setIsModalOpen(false);
        await loadData();
      } else {
        const dedicatedList = [];
        if (createDedicatedKiosk) {
          dedicatedList.push({
            id: dedicatedKioskId.trim() || undefined,
            name: dedicatedKioskName.trim() || undefined,
            city: dedicatedKioskCity.trim() || undefined,
            address: dedicatedKioskAddress.trim() || undefined,
          });
          if (kioskCount >= 2) {
            dedicatedList.push({
              id: dedicatedKiosk2Id.trim() || undefined,
              name: dedicatedKiosk2Name.trim() || undefined,
              city: dedicatedKiosk2City.trim() || undefined,
              address: dedicatedKiosk2Address.trim() || undefined,
            });
          }
        }

        const res = await createAdminBuyer({
          fullName: fullName.trim(),
          email: email.trim(),
          username: username.trim() || undefined,
          phone: phone.trim(),
          companyName: companyName.trim(),
          kioskIds: selectedKioskIds,
          createDedicatedKiosk,
          kioskCount,
          dedicatedKiosks: dedicatedList,
          dedicatedKioskId: dedicatedKioskId.trim() || undefined,
          dedicatedKioskName: dedicatedKioskName.trim() || undefined,
          dedicatedKioskCity: dedicatedKioskCity.trim() || undefined,
          dedicatedKioskAddress: dedicatedKioskAddress.trim() || undefined,
        });
        setIsModalOpen(false);
        await loadData();
        setFeedback({
          type: 'success',
          message:
            res.message ||
            `Owner account created for ${fullName.trim()}. An activation email with setup instructions was sent to ${email.trim()}.`,
        });
      }
    } catch (err: any) {
      setFormError(err.message || 'Could not save buyer.');
    } finally {
      setSaving(false);
    }
  };

  const handleSendInvite = async (buyer: AdminBuyer) => {
    try {
      const res = await regenerateBuyerInvite(buyer.id);
      setFeedback({
        type: 'success',
        message:
          res.message ||
          `An invitation email with setup instructions was sent to ${buyer.email}.`,
      });
      await loadData();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'Could not send invitation email.',
      });
    }
  };

  const handleConfirmToggleStatus = async () => {
    if (!confirmStatusBuyer) return;
    setToggling(true);
    try {
      const res = await toggleAdminBuyerStatus(
        confirmStatusBuyer.id,
        !confirmStatusBuyer.isActive
      );
      setFeedback({ type: 'success', message: res.message });
      setConfirmStatusBuyer(null);
      await loadData();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'Could not update buyer status.',
      });
    } finally {
      setToggling(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!confirmDeleteBuyer) return;
    setDeleting(true);
    try {
      const res = await deleteAdminBuyer(confirmDeleteBuyer.id);
      setFeedback({
        type: 'success',
        message:
          res.message ||
          `Buyer account "${confirmDeleteBuyer.fullName}" (${confirmDeleteBuyer.email}) was deleted successfully.`,
      });
      setConfirmDeleteBuyer(null);
      await loadData();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'Could not delete buyer account.',
      });
    } finally {
      setDeleting(false);
    }
  };

  const filteredBuyers = buyers.filter((b) => {
    const isDone = Boolean(b.isSetupComplete || b.setupStatus === 'done' || b.accountStatus === 'active');
    if (statusFilter === 'done' && !isDone) return false;
    if (statusFilter === 'not_done' && isDone) return false;
    if (statusFilter === 'active' && b.accountStatus !== 'active') return false;
    if (statusFilter === 'invited' && b.accountStatus !== 'invited') return false;
    if (statusFilter === 'deactivated' && b.accountStatus !== 'deactivated') return false;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      const hay = `${b.fullName} ${b.email} ${b.username} ${b.companyName} ${b.phone}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-neutral-950">
            Buyers
          </h1>
          <p className="mt-0.5 text-xs text-neutral-500">
            Create buyer accounts, send setup links, and manage mobile access.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center gap-1.5 rounded-full bg-neutral-950 px-4 py-2 text-xs font-medium text-white hover:bg-neutral-800"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Buyer
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

      {/* Search & Filter */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative min-w-[260px] flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email, username, or company..."
            className="w-full rounded-xl border border-neutral-200 bg-white py-2 pr-4 pl-10 text-xs text-neutral-900 focus:border-neutral-950 focus:outline-hidden"
          />
        </div>

        <select
          aria-label="Filter by account status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-xl border border-neutral-200 bg-white px-3.5 py-2 text-xs font-medium text-neutral-700 focus:border-neutral-950 focus:outline-hidden"
        >
          <option value="all">All accounts ({buyers.length})</option>
          <option value="done">Setup Done</option>
          <option value="not_done">Setup Not Done (Pending)</option>
          <option value="deactivated">Deactivated</option>
        </select>
      </div>

      {/* Buyers Table */}
      <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50/60 text-neutral-400">
                <th className="px-5 py-3 font-medium">Buyer</th>
                <th className="px-4 py-3 font-medium">Company &amp; Phone</th>
                <th className="px-4 py-3 font-medium">Setup Status</th>
                <th className="px-4 py-3 font-medium">Assigned Kiosks</th>
                <th className="px-5 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {loading && buyers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-neutral-400">
                    Loading...
                  </td>
                </tr>
              ) : filteredBuyers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-neutral-400">
                    No buyers found.
                  </td>
                </tr>
              ) : (
                filteredBuyers.map((buyer) => {
                  const isSetupDone = Boolean(
                    buyer.isSetupComplete ||
                    buyer.setupStatus === 'done' ||
                    buyer.accountStatus === 'active'
                  );

                  return (
                    <tr key={buyer.id} className="hover:bg-neutral-50/70">
                      <td className="px-5 py-3.5">
                        <p className="font-semibold text-neutral-950">
                          {buyer.fullName}
                        </p>
                        <p className="text-neutral-500">{buyer.email}</p>
                        <p className="font-mono text-[11px] text-neutral-400">
                          @{buyer.username}
                        </p>
                      </td>

                      <td className="px-4 py-3.5">
                        <p className="text-neutral-800">
                          {buyer.companyName || 'Independent'}
                        </p>
                        <p className="text-[11px] text-neutral-400">
                          {buyer.phone || 'No phone'}
                        </p>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="flex flex-col gap-1 items-start">
                          <StatusBadge
                            status={isSetupDone ? 'done' : 'not_done'}
                            type="setup"
                            size="sm"
                          />
                          {!buyer.isActive && (
                            <span className="inline-flex items-center rounded-md bg-neutral-100 px-1.5 py-0.5 text-[10px] font-medium text-neutral-500">
                              Deactivated
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        {buyer.assignedKiosks.length > 0 ? (
                          <div className="flex flex-col gap-1.5">
                            {buyer.assignedKiosks.length > 1 && (
                              <div className="flex items-center gap-1.5 mb-0.5">
                                <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 border border-sky-200 px-2 py-0.5 text-[10px] font-semibold text-sky-800">
                                  <Layers className="h-2.5 w-2.5" />
                                  Fleet ({buyer.assignedKiosks.length} Kiosks)
                                </span>
                              </div>
                            )}
                            {buyer.assignedKiosks.map((k) => {
                              const kioskUrl = getKioskLaunchUrl(k.id, k.launcherUrl);
                              return (
                                <div
                                  key={k.id}
                                  className="inline-flex items-center justify-between gap-2 rounded-lg border border-neutral-200 bg-neutral-50 px-2.5 py-1 text-xs"
                                >
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    <Monitor className="h-3.5 w-3.5 text-neutral-400 shrink-0" />
                                    <span className="font-mono font-medium text-neutral-900 truncate">
                                      {k.id}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1 shrink-0">
                                    <a
                                      href={kioskUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      title={`Launch Kiosk ${k.id} in Browser`}
                                      className="inline-flex items-center gap-1 rounded-md border border-neutral-200 bg-white px-2 py-0.5 text-[11px] font-medium text-neutral-700 shadow-2xs hover:bg-neutral-100"
                                    >
                                      <Play className="h-2.5 w-2.5 fill-emerald-600 text-emerald-600" />
                                      Launch
                                    </a>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        downloadKioskWindowsLauncher(k.id, buyer.fullName)
                                      }
                                      title={`Download Windows Launcher (.bat) for ${k.id}`}
                                      className="inline-flex items-center gap-1 rounded-md border border-neutral-200 bg-white px-2 py-0.5 text-[11px] font-medium text-neutral-700 shadow-2xs hover:bg-neutral-100"
                                    >
                                      <Download className="h-2.5 w-2.5 text-neutral-600" />
                                      .bat
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setTabletQrTarget({
                                          kioskId: k.id,
                                          kioskName: k.name,
                                          ownerName: buyer.fullName,
                                        })
                                      }
                                      title={`Scan QR Code to open ${k.id} on iPad / Tablet`}
                                      className="inline-flex items-center gap-1 rounded-md border border-neutral-200 bg-white px-2 py-0.5 text-[11px] font-medium text-petrol-700 shadow-2xs hover:bg-neutral-100"
                                    >
                                      <QrCode className="h-2.5 w-2.5" />
                                      Tablet QR
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <span className="text-neutral-400">None</span>
                        )}
                      </td>

                      <td className="px-5 py-3.5 text-right">
                        <div className="inline-flex flex-wrap items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => openDistributeModal(buyer)}
                            className="inline-flex items-center gap-1 rounded-full border border-sky-300 bg-sky-50/70 px-3 py-1 text-xs font-medium text-sky-800 hover:bg-sky-100 transition"
                            title={`Distribute kiosks to ${buyer.fullName}`}
                          >
                            <Layers className="h-3 w-3 text-sky-600" />
                            Distribute ({buyer.assignedKiosks.length})
                          </button>
                          {!isSetupDone && (
                            <button
                              type="button"
                              onClick={() => handleSendInvite(buyer)}
                              className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50/70 px-3 py-1 text-xs font-medium text-amber-900 hover:bg-amber-100 transition"
                              title="Resend invitation email with setup link"
                            >
                              <Mail className="h-3 w-3 text-amber-700" />
                              Resend Invite
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => openEditModal(buyer)}
                            className="rounded-full border border-neutral-200 px-3 py-1 text-xs font-medium text-neutral-700 hover:border-neutral-950"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmStatusBuyer(buyer)}
                            className="rounded-full border border-neutral-200 px-3 py-1 text-xs font-medium text-neutral-600 hover:border-neutral-950"
                          >
                            {buyer.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteBuyer(buyer)}
                            className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50/40 px-3 py-1 text-xs font-medium text-rose-700 hover:border-rose-400 hover:bg-rose-100 transition"
                            title={`Delete account for ${buyer.fullName} and release ${buyer.email}`}
                          >
                            <Trash2 className="h-3 w-3 text-rose-600" />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Buyer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl border border-neutral-200 bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
              <h2 className="font-display text-lg font-bold text-neutral-950">
                {editingBuyer ? 'Edit Buyer' : 'Add Buyer'}
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

            <form onSubmit={handleSaveBuyer} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-700">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Clara Reyes"
                  className="mt-1 w-full rounded-xl border border-neutral-200 px-3.5 py-2 text-xs"
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-neutral-700">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="clara@partner.ph"
                    className="mt-1 w-full rounded-xl border border-neutral-200 px-3.5 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-700">
                    Username (optional)
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="clarareyes"
                    className="mt-1 w-full rounded-xl border border-neutral-200 px-3.5 py-2 font-mono text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-neutral-700">
                    Company
                  </label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-neutral-200 px-3.5 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-700">
                    Phone
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-neutral-200 px-3.5 py-2 text-xs"
                  />
                </div>
              </div>

              {editingBuyer ? (
                <div className="rounded-xl border border-neutral-200 bg-neutral-50/70 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-semibold text-neutral-900">
                        Distributed Kiosks ({selectedKioskIds.length})
                      </h3>
                      <p className="text-[11px] text-neutral-500">
                        Select which kiosks this owner operates. Multiple kiosks can be assigned.
                      </p>
                    </div>
                    <Layers className="h-4 w-4 text-sky-600" />
                  </div>

                  <div className="max-h-56 overflow-y-auto space-y-1.5 rounded-lg border border-neutral-200 bg-white p-2">
                    {kiosks.map((k) => {
                      const isChecked = selectedKioskIds.includes(k.id);
                      const isOwnedByOther = k.owner && k.owner.buyerId !== editingBuyer.id;
                      return (
                        <label
                          key={k.id}
                          className={`flex cursor-pointer items-start gap-2.5 rounded-lg border p-2.5 text-xs transition ${
                            isChecked
                              ? 'border-neutral-950 bg-neutral-50'
                              : 'border-neutral-200 bg-white hover:border-neutral-300'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() =>
                              setSelectedKioskIds((prev) =>
                                prev.includes(k.id)
                                  ? prev.filter((id) => id !== k.id)
                                  : [...prev, k.id]
                              )
                            }
                            className="mt-0.5 h-4 w-4 rounded border-neutral-300 text-neutral-950"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <span className="font-mono text-[11px] font-semibold text-neutral-900">
                                {k.id}
                              </span>
                              {isOwnedByOther ? (
                                <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                                  Currently: {k.owner?.fullName}
                                </span>
                              ) : isChecked ? (
                                <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                                  Assigned
                                </span>
                              ) : null}
                            </div>
                            <p className="text-[11px] text-neutral-700 font-medium truncate">
                              {k.name}
                            </p>
                            <p className="text-[10px] text-neutral-400">
                              {k.city || k.location}
                            </p>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-neutral-200 bg-neutral-50/70 p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <label className="flex items-center gap-2 cursor-pointer font-medium text-xs text-neutral-900">
                        <input
                          type="checkbox"
                          checked={createDedicatedKiosk}
                          onChange={(e) => setCreateDedicatedKiosk(e.target.checked)}
                          className="h-4 w-4 rounded border-neutral-300 text-neutral-950 focus:ring-neutral-950"
                        />
                        Provision Dedicated Kiosk Terminals
                      </label>
                      <p className="mt-0.5 text-[11px] text-neutral-500">
                        Automatically create and distribute dedicated kiosks for this owner.
                      </p>
                    </div>
                    <Monitor className="h-4 w-4 text-neutral-400 mt-0.5 shrink-0" />
                  </div>

                  {createDedicatedKiosk && (
                    <div className="mt-2 space-y-3 border-t border-neutral-200/80 pt-3">
                      {/* Quantity pill selector: 1, 2, or 3 kiosks */}
                      <div>
                        <label className="block text-[11px] font-medium text-neutral-700 mb-1.5">
                          Number of Kiosks to Distribute
                        </label>
                        <div className="flex items-center gap-2">
                          {[1, 2, 3].map((num) => (
                            <button
                              key={num}
                              type="button"
                              onClick={() => setKioskCount(num)}
                              className={`rounded-full px-3.5 py-1 text-xs font-semibold transition ${
                                kioskCount === num
                                  ? 'bg-neutral-950 text-white'
                                  : 'border border-neutral-200 bg-white text-neutral-700 hover:border-neutral-400'
                              }`}
                            >
                              {num === 1 ? '1 Kiosk' : `${num} Kiosks (Fleet)`}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Kiosk #1 Details */}
                      <div className="rounded-lg border border-neutral-200 bg-white p-3 space-y-2">
                        <div className="flex items-center gap-1.5">
                          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-neutral-950 text-[9px] font-bold text-white">
                            1
                          </span>
                          <span className="text-[11px] font-semibold text-neutral-900">
                            Kiosk #1 {kioskCount > 1 ? '(Primary Station)' : ''}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                          <div>
                            <label className="block text-[10px] font-medium text-neutral-600">
                              Kiosk ID (auto if empty)
                            </label>
                            <input
                              type="text"
                              value={dedicatedKioskId}
                              onChange={(e) => setDedicatedKioskId(e.target.value)}
                              placeholder={
                                username || fullName
                                  ? `KIOSK-${(username || fullName).replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 8)}-01`
                                  : 'KIOSK-OWNER-01'
                              }
                              className="mt-0.5 w-full rounded-lg border border-neutral-200 bg-neutral-50 px-2.5 py-1.5 font-mono text-xs uppercase"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-medium text-neutral-600">
                              Display Name
                            </label>
                            <input
                              type="text"
                              value={dedicatedKioskName}
                              onChange={(e) => setDedicatedKioskName(e.target.value)}
                              placeholder={fullName ? `${fullName} — Station 1` : 'Station 1'}
                              className="mt-0.5 w-full rounded-lg border border-neutral-200 bg-neutral-50 px-2.5 py-1.5 text-xs"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                          <div>
                            <label className="block text-[10px] font-medium text-neutral-600">
                              City
                            </label>
                            <input
                              type="text"
                              value={dedicatedKioskCity}
                              onChange={(e) => setDedicatedKioskCity(e.target.value)}
                              placeholder="Zamboanga City"
                              className="mt-0.5 w-full rounded-lg border border-neutral-200 bg-neutral-50 px-2.5 py-1.5 text-xs"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-medium text-neutral-600">
                              Address / Branch
                            </label>
                            <input
                              type="text"
                              value={dedicatedKioskAddress}
                              onChange={(e) => setDedicatedKioskAddress(e.target.value)}
                              placeholder="Branch 1 Terminal"
                              className="mt-0.5 w-full rounded-lg border border-neutral-200 bg-neutral-50 px-2.5 py-1.5 text-xs"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Kiosk #2 Details (when kioskCount >= 2) */}
                      {kioskCount >= 2 && (
                        <div className="rounded-lg border border-sky-200 bg-sky-50/40 p-3 space-y-2">
                          <div className="flex items-center gap-1.5">
                            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-sky-600 text-[9px] font-bold text-white">
                              2
                            </span>
                            <span className="text-[11px] font-semibold text-sky-950">
                              Kiosk #2 (Secondary Station)
                            </span>
                          </div>
                          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                            <div>
                              <label className="block text-[10px] font-medium text-neutral-600">
                                Kiosk ID (auto if empty)
                              </label>
                              <input
                                type="text"
                                value={dedicatedKiosk2Id}
                                onChange={(e) => setDedicatedKiosk2Id(e.target.value)}
                                placeholder={
                                  username || fullName
                                    ? `KIOSK-${(username || fullName).replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 8)}-02`
                                    : 'KIOSK-OWNER-02'
                                }
                                className="mt-0.5 w-full rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5 font-mono text-xs uppercase"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-medium text-neutral-600">
                                Display Name
                              </label>
                              <input
                                type="text"
                                value={dedicatedKiosk2Name}
                                onChange={(e) => setDedicatedKiosk2Name(e.target.value)}
                                placeholder={fullName ? `${fullName} — Station 2` : 'Station 2'}
                                className="mt-0.5 w-full rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5 text-xs"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                            <div>
                              <label className="block text-[10px] font-medium text-neutral-600">
                                City
                              </label>
                              <input
                                type="text"
                                value={dedicatedKiosk2City}
                                onChange={(e) => setDedicatedKiosk2City(e.target.value)}
                                placeholder="Zamboanga City"
                                className="mt-0.5 w-full rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5 text-xs"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-medium text-neutral-600">
                                Address / Branch
                              </label>
                              <input
                                type="text"
                                value={dedicatedKiosk2Address}
                                onChange={(e) => setDedicatedKiosk2Address(e.target.value)}
                                placeholder="Branch 2 Terminal"
                                className="mt-0.5 w-full rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5 text-xs"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Assign from existing unassigned kiosks */}
                      {kiosks.length > 0 && (
                        <div className="pt-1">
                          <label className="block text-[11px] font-medium text-neutral-700 mb-1">
                            Also distribute from existing registered kiosks ({selectedKioskIds.length} selected):
                          </label>
                          <div className="max-h-36 overflow-y-auto space-y-1 rounded-lg border border-neutral-200 bg-white p-2">
                            {kiosks.map((k) => {
                              const isChecked = selectedKioskIds.includes(k.id);
                              return (
                                <label
                                  key={k.id}
                                  className="flex cursor-pointer items-center gap-2 rounded p-1.5 hover:bg-neutral-50 text-xs"
                                >
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() =>
                                      setSelectedKioskIds((prev) =>
                                        prev.includes(k.id)
                                          ? prev.filter((id) => id !== k.id)
                                          : [...prev, k.id]
                                      )
                                    }
                                    className="h-3.5 w-3.5 rounded border-neutral-300"
                                  />
                                  <span className="font-mono text-[11px] text-neutral-700">
                                    {k.id}
                                  </span>
                                  <span className="text-[11px] text-neutral-500 truncate flex-1">
                                    {k.name}
                                  </span>
                                  <span className="text-[10px] text-neutral-400">
                                    {k.owner ? `Owned by ${k.owner.fullName}` : 'Unassigned'}
                                  </span>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

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
                  {saving ? 'Saving...' : editingBuyer ? 'Save' : 'Create Owner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Distribute Kiosks Modal */}
      {distributeModalBuyer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl border border-neutral-200 bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
              <div>
                <h2 className="font-display text-lg font-bold text-neutral-950 flex items-center gap-2">
                  <Layers className="h-5 w-5 text-sky-600" />
                  Distribute Kiosks
                </h2>
                <p className="mt-0.5 text-xs text-neutral-500">
                  Assign multiple kiosks to <strong>{distributeModalBuyer.fullName}</strong> ({distributeModalBuyer.email})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDistributeModalBuyer(null)}
                className="rounded-full p-1 text-neutral-400 hover:bg-neutral-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-neutral-800">
                  Select Kiosks to Assign ({distributeKioskIds.length} Selected)
                </span>
                <button
                  type="button"
                  onClick={() => setDistributeNewOpen(!distributeNewOpen)}
                  className="inline-flex items-center gap-1 rounded-full border border-neutral-200 px-3 py-1 text-[11px] font-medium text-neutral-700 hover:border-neutral-950"
                >
                  <Plus className="h-3 w-3" />
                  {distributeNewOpen ? 'Hide New Terminal' : 'Add New Terminal'}
                </button>
              </div>

              {/* Inline Add New Terminal to this owner */}
              {distributeNewOpen && (
                <div className="rounded-xl border border-sky-200 bg-sky-50/50 p-3.5 space-y-2.5">
                  <p className="text-xs font-semibold text-sky-950">
                    Provision New Kiosk Directly to this Owner
                  </p>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <div>
                      <label className="block text-[10px] font-medium text-neutral-600">
                        Kiosk Name
                      </label>
                      <input
                        type="text"
                        value={newKioskName}
                        onChange={(e) => setNewKioskName(e.target.value)}
                        placeholder={`${distributeModalBuyer.fullName} — Station ${distributeKioskIds.length + 1}`}
                        className="mt-0.5 w-full rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-medium text-neutral-600">
                        Address / Mall
                      </label>
                      <input
                        type="text"
                        value={newKioskAddress}
                        onChange={(e) => setNewKioskAddress(e.target.value)}
                        placeholder="Commercial Wing"
                        className="mt-0.5 w-full rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5 text-xs"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={creatingNewKiosk || !newKioskName.trim()}
                    onClick={handleCreateAndDistributeNewKiosk}
                    className="rounded-full bg-neutral-950 px-3.5 py-1.5 text-[11px] font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
                  >
                    {creatingNewKiosk ? 'Provisioning...' : 'Provision & Assign'}
                  </button>
                </div>
              )}

              {/* Kiosks checklist */}
              <div className="max-h-64 overflow-y-auto space-y-1.5 rounded-xl border border-neutral-200 bg-neutral-50 p-2">
                {kiosks.map((k) => {
                  const isChecked = distributeKioskIds.includes(k.id);
                  const isOwnedByOther = k.owner && k.owner.buyerId !== distributeModalBuyer.id;
                  const isOwnedByThis = k.owner && k.owner.buyerId === distributeModalBuyer.id;

                  return (
                    <label
                      key={k.id}
                      className={`flex cursor-pointer items-start gap-2.5 rounded-xl border p-3 text-xs transition ${
                        isChecked
                          ? 'border-neutral-950 bg-white'
                          : 'border-neutral-200 bg-white hover:border-neutral-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() =>
                          setDistributeKioskIds((prev) =>
                            prev.includes(k.id)
                              ? prev.filter((id) => id !== k.id)
                              : [...prev, k.id]
                          )
                        }
                        className="mt-0.5 h-4 w-4 rounded border-neutral-300 text-neutral-950"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-mono text-[11px] font-bold text-neutral-900">
                            {k.id}
                          </span>
                          {isOwnedByThis ? (
                            <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              Currently Owned
                            </span>
                          ) : isOwnedByOther ? (
                            <span className="text-[10px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                              Owned by {k.owner?.fullName}
                            </span>
                          ) : (
                            <span className="text-[10px] text-neutral-400">
                              Unassigned
                            </span>
                          )}
                        </div>
                        <p className="font-semibold text-neutral-950 truncate mt-0.5">
                          {k.name}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[11px] text-neutral-500 truncate">
                            {k.city || k.location}
                          </span>
                          <StatusBadge status={k.status} type="kiosk" size="sm" />
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>

              {distributeKioskIds.length > 1 && (
                <div className="flex items-center gap-2 rounded-xl bg-sky-50 border border-sky-200 p-2.5 text-xs text-sky-900">
                  <Layers className="h-4 w-4 text-sky-600 shrink-0" />
                  <span>
                    Multi-kiosk fleet mode will activate in the mobile app for <strong>{distributeModalBuyer.fullName}</strong> ({distributeKioskIds.length} units).
                  </span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 border-t border-neutral-100 pt-3">
                <button
                  type="button"
                  onClick={() => setDistributeModalBuyer(null)}
                  className="rounded-full border border-neutral-200 px-4 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={distributing}
                  onClick={handleSaveDistribute}
                  className="rounded-full bg-neutral-950 px-5 py-2 text-xs font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
                >
                  {distributing ? 'Saving...' : `Save Distribution (${distributeKioskIds.length})`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        open={Boolean(confirmStatusBuyer)}
        title={
          confirmStatusBuyer?.isActive
            ? `Deactivate ${confirmStatusBuyer.fullName}?`
            : `Activate ${confirmStatusBuyer?.fullName}?`
        }
        description={
          confirmStatusBuyer?.isActive
            ? 'This revokes their mobile app access until reactivated.'
            : 'This restores their mobile app access.'
        }
        confirmLabel={confirmStatusBuyer?.isActive ? 'Deactivate' : 'Activate'}
        variant={confirmStatusBuyer?.isActive ? 'danger' : 'primary'}
        loading={toggling}
        onConfirm={handleConfirmToggleStatus}
        onCancel={() => setConfirmStatusBuyer(null)}
      />

      <ConfirmModal
        open={Boolean(confirmDeleteBuyer)}
        title={`Delete ${confirmDeleteBuyer?.fullName}?`}
        description={`This permanently deletes the buyer account and releases the email "${confirmDeleteBuyer?.email}". Any assigned kiosks will be unassigned. You will be able to invite or register this email address again.`}
        confirmLabel="Delete Account"
        variant="danger"
        loading={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmDeleteBuyer(null)}
      />

      <TabletQrModal
        open={Boolean(tabletQrTarget)}
        onClose={() => setTabletQrTarget(null)}
        kioskId={tabletQrTarget?.kioskId || ''}
        kioskName={tabletQrTarget?.kioskName}
        ownerName={tabletQrTarget?.ownerName}
      />
    </div>
  );
};
