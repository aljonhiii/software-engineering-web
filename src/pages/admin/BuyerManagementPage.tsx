import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Copy, Check, ExternalLink, X } from 'lucide-react';
import {
  fetchAdminBuyers,
  fetchAdminKiosks,
  createAdminBuyer,
  updateAdminBuyer,
  toggleAdminBuyerStatus,
  regenerateBuyerInvite,
} from '../../api/client';
import { AdminBuyer, AdminKiosk } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { ConfirmModal } from '../../components/common/ConfirmModal';

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
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState<boolean>(false);

  const [inviteModalData, setInviteModalData] = useState<{
    buyerName: string;
    buyerEmail: string;
    setupUrl: string;
    expiresAt: string;
  } | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  const [confirmStatusBuyer, setConfirmStatusBuyer] = useState<AdminBuyer | null>(null);
  const [toggling, setToggling] = useState<boolean>(false);

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
    setSelectedKioskIds([]);
    setFormError(null);
    setIsModalOpen(true);
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
        });
        setFeedback({ type: 'success', message: res.message });
        setIsModalOpen(false);
        await loadData();
      } else {
        const res = await createAdminBuyer({
          fullName: fullName.trim(),
          email: email.trim(),
          username: username.trim() || undefined,
          phone: phone.trim(),
          companyName: companyName.trim(),
          kioskIds: selectedKioskIds,
        });
        setFeedback({ type: 'success', message: res.message });
        setIsModalOpen(false);
        await loadData();

        const fullSetupUrl = `${window.location.origin}${res.invitation.setupPath}`;
        setCopied(false);
        setInviteModalData({
          buyerName: res.buyer.fullName,
          buyerEmail: res.buyer.email,
          setupUrl: fullSetupUrl,
          expiresAt: res.invitation.expiresAt,
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
      const fullSetupUrl = `${window.location.origin}${res.invitation.setupPath}`;
      setCopied(false);
      setInviteModalData({
        buyerName: buyer.fullName,
        buyerEmail: buyer.email,
        setupUrl: fullSetupUrl,
        expiresAt: res.invitation.expiresAt,
      });
      await loadData();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'Could not generate invite link.',
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

  const copyInviteLink = async () => {
    if (!inviteModalData) return;
    try {
      await navigator.clipboard.writeText(inviteModalData.setupUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Ignore
    }
  };

  const unassignedKiosks = kiosks.filter((k) => !k.owner);

  const filteredBuyers = buyers.filter((b) => {
    if (statusFilter !== 'all' && b.accountStatus !== statusFilter) return false;
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
          <option value="active">Active</option>
          <option value="invited">Invited</option>
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
                <th className="px-4 py-3 font-medium">Status</th>
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
                filteredBuyers.map((buyer) => (
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
                      <StatusBadge
                        status={buyer.accountStatus}
                        type="account"
                        size="sm"
                      />
                    </td>

                    <td className="px-4 py-3.5">
                      {buyer.assignedKiosks.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {buyer.assignedKiosks.map((k) => (
                            <span
                              key={k.id}
                              className="rounded-md border border-neutral-200 bg-neutral-50 px-2 py-0.5 font-mono text-[11px] text-neutral-800"
                            >
                              {k.id}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-neutral-400">None</span>
                      )}
                    </td>

                    <td className="px-5 py-3.5 text-right">
                      <div className="inline-flex flex-wrap items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleSendInvite(buyer)}
                          className="rounded-full border border-neutral-200 px-3 py-1 text-xs font-medium text-neutral-800 hover:border-neutral-950"
                        >
                          Setup Link
                        </button>
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
                      </div>
                    </td>
                  </tr>
                ))
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

              {!editingBuyer && (
                <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3.5">
                  <p className="text-xs font-medium text-neutral-700">
                    Assign available kiosks (optional)
                  </p>
                  {unassignedKiosks.length === 0 ? (
                    <p className="mt-1 text-xs text-neutral-400">
                      All kiosks are currently assigned.
                    </p>
                  ) : (
                    <div className="mt-2 max-h-36 space-y-1.5 overflow-y-auto">
                      {unassignedKiosks.map((k) => {
                        const checked = selectedKioskIds.includes(k.id);
                        return (
                          <label
                            key={k.id}
                            className="flex cursor-pointer items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs"
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedKioskIds([...selectedKioskIds, k.id]);
                                } else {
                                  setSelectedKioskIds(
                                    selectedKioskIds.filter((id) => id !== k.id)
                                  );
                                }
                              }}
                              className="h-4 w-4 rounded border-neutral-300"
                            />
                            <span className="font-mono text-neutral-500">
                              {k.id}
                            </span>
                            <span className="font-medium text-neutral-900">
                              {k.name}
                            </span>
                          </label>
                        );
                      })}
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
                  {saving ? 'Saving...' : editingBuyer ? 'Save' : 'Create & Get Link'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Setup Link Modal */}
      {inviteModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-display text-lg font-bold text-neutral-950">
                  Invitation Link Ready
                </h3>
                <p className="mt-0.5 text-xs text-neutral-500">
                  Send this one-time password setup link to {inviteModalData.buyerName}.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setInviteModalData(null)}
                className="rounded-full p-1 text-neutral-400 hover:bg-neutral-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 rounded-xl border border-neutral-200 bg-neutral-50 p-3.5 text-xs">
              <p className="break-all font-mono text-[11px] text-neutral-800">
                {inviteModalData.setupUrl}
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={copyInviteLink}
                  className="inline-flex items-center gap-1.5 rounded-full bg-neutral-950 px-4 py-1.5 text-xs font-medium text-white hover:bg-neutral-800"
                >
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5" /> Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" /> Copy link
                    </>
                  )}
                </button>

                <a
                  href={inviteModalData.setupUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-4 py-1.5 text-xs font-medium text-neutral-700 hover:border-neutral-950"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Open page
                </a>
              </div>
            </div>

            <div className="mt-5 flex justify-end border-t border-neutral-100 pt-4">
              <button
                type="button"
                onClick={() => setInviteModalData(null)}
                className="rounded-full bg-neutral-950 px-4 py-1.5 text-xs font-medium text-white"
              >
                Done
              </button>
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
    </div>
  );
};
