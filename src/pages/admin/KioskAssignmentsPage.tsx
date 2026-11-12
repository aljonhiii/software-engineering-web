import React, { useState, useEffect, useCallback } from 'react';
import { X } from 'lucide-react';
import {
  fetchAdminAssignments,
  fetchAdminBuyers,
  fetchAdminKiosks,
  assignKiosksToBuyer,
  unassignKiosk,
  ApiError,
} from '../../api/client';
import {
  KioskAssignmentRecord,
  AdminBuyer,
  AdminKiosk,
} from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { ConfirmModal } from '../../components/common/ConfirmModal';

export const KioskAssignmentsPage: React.FC = () => {
  const [assignments, setAssignments] = useState<KioskAssignmentRecord[]>([]);
  const [buyers, setBuyers] = useState<AdminBuyer[]>([]);
  const [kiosks, setKiosks] = useState<AdminKiosk[]>([]);

  const [selectedBuyerId, setSelectedBuyerId] = useState<string>('');
  const [selectedKioskIds, setSelectedKioskIds] = useState<string[]>([]);
  const [notes, setNotes] = useState<string>('');

  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [conflictPrompt, setConflictPrompt] = useState<{
    message: string;
    conflicts: any[];
  } | null>(null);

  const [unassignTarget, setUnassignTarget] = useState<KioskAssignmentRecord | null>(null);
  const [removing, setRemoving] = useState<boolean>(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [aRes, bRes, kRes] = await Promise.all([
        fetchAdminAssignments(),
        fetchAdminBuyers(),
        fetchAdminKiosks(),
      ]);
      if (aRes.success) setAssignments(aRes.assignments);
      if (bRes.success) {
        setBuyers(bRes.buyers);
        if (!selectedBuyerId && bRes.buyers.length > 0) {
          setSelectedBuyerId(bRes.buyers[0].id);
        }
      }
      if (kRes.success) setKiosks(kRes.kiosks);
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'Could not load assignments.',
      });
    } finally {
      setLoading(false);
    }
  }, [selectedBuyerId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const executeAssignment = async (allowTransfer: boolean) => {
    if (!selectedBuyerId || selectedKioskIds.length === 0) {
      setFeedback({
        type: 'error',
        message: 'Select a buyer and at least one kiosk.',
      });
      return;
    }

    setSubmitting(true);
    try {
      const res = await assignKiosksToBuyer({
        buyerId: selectedBuyerId,
        kioskIds: selectedKioskIds,
        allowTransfer,
        notes: notes.trim() || undefined,
      });
      setFeedback({ type: 'success', message: res.message });
      setSelectedKioskIds([]);
      setNotes('');
      setConflictPrompt(null);
      await loadData();
    } catch (err: any) {
      if (err instanceof ApiError && err.status === 409 && err.conflicts) {
        setConflictPrompt({
          message: err.message,
          conflicts: err.conflicts,
        });
      } else {
        setFeedback({
          type: 'error',
          message: err.message || 'Could not assign kiosks.',
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmUnassign = async () => {
    if (!unassignTarget) return;
    setRemoving(true);
    try {
      const res = await unassignKiosk(unassignTarget.kioskId);
      setFeedback({ type: 'success', message: res.message });
      setUnassignTarget(null);
      await loadData();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'Could not remove assignment.',
      });
    } finally {
      setRemoving(false);
    }
  };

  const toggleKioskSelection = (id: string) => {
    setSelectedKioskIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-neutral-950">
          Assignments
        </h1>
        <p className="mt-0.5 text-xs text-neutral-500">
          Assign kiosks to buyers or transfer ownership.
        </p>
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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Form */}
        <div className="lg:col-span-5">
          <div className="rounded-2xl border border-neutral-200 bg-white p-5 space-y-4">
            <h2 className="font-display text-base font-bold text-neutral-950">
              Assign Kiosks
            </h2>

            <div>
              <label className="block text-xs font-medium text-neutral-700">
                Buyer
              </label>
              <select
                aria-label="Select Buyer"
                value={selectedBuyerId}
                onChange={(e) => setSelectedBuyerId(e.target.value)}
                className="mt-1 w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-2 text-xs text-neutral-900 focus:border-neutral-950 focus:outline-hidden"
              >
                {buyers.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.fullName} ({b.email})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-700">
                Kiosks ({selectedKioskIds.length} selected)
              </label>
              <div className="mt-1.5 max-h-64 space-y-1.5 overflow-y-auto rounded-xl border border-neutral-200 bg-neutral-50 p-2">
                {kiosks.map((k) => {
                  const isChecked = selectedKioskIds.includes(k.id);
                  const isAlreadyOwnedBySelected =
                    k.owner?.buyerId === selectedBuyerId;
                  const isOwnedByOther =
                    k.owner && k.owner.buyerId !== selectedBuyerId;

                  return (
                    <label
                      key={k.id}
                      className={`flex cursor-pointer items-start gap-2.5 rounded-xl border p-3 text-xs transition ${
                        isChecked
                          ? 'border-neutral-950 bg-white'
                          : 'border-neutral-200 bg-white hover:border-neutral-400'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleKioskSelection(k.id)}
                        className="mt-0.5 h-4 w-4 rounded border-neutral-300"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[11px] text-neutral-400">
                            {k.id}
                          </span>
                          {isAlreadyOwnedBySelected ? (
                            <span className="text-[11px] text-emerald-700">
                              Already owned
                            </span>
                          ) : isOwnedByOther ? (
                            <span className="text-[11px] text-amber-700">
                              Owned by {k.owner?.fullName}
                            </span>
                          ) : (
                            <span className="text-[11px] text-neutral-400">
                              Unassigned
                            </span>
                          )}
                        </div>
                        <p className="font-semibold text-neutral-950">{k.name}</p>
                        <p className="text-[11px] text-neutral-500">{k.city}</p>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-700">
                Notes (optional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional note"
                className="mt-1 w-full rounded-xl border border-neutral-200 px-3.5 py-2 text-xs"
              />
            </div>

            <button
              type="button"
              disabled={submitting || selectedKioskIds.length === 0}
              onClick={() => executeAssignment(false)}
              className="w-full rounded-full bg-neutral-950 py-2.5 text-xs font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
            >
              {submitting
                ? 'Saving...'
                : `Assign (${selectedKioskIds.length})`}
            </button>
          </div>
        </div>

        {/* Right Table & Buyer Summary */}
        <div className="space-y-6 lg:col-span-7">
          <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
            <div className="border-b border-neutral-100 px-5 py-4">
              <h2 className="font-display text-base font-bold text-neutral-950">
                Active Assignments ({assignments.length})
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-neutral-200 bg-neutral-50/60 text-neutral-400">
                    <th className="px-5 py-3 font-medium">Kiosk</th>
                    <th className="px-4 py-3 font-medium">Buyer</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Notes</th>
                    <th className="px-5 py-3 text-right font-medium">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {loading && assignments.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-10 text-center text-neutral-400">
                        Loading...
                      </td>
                    </tr>
                  ) : assignments.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-10 text-center text-neutral-400">
                        No active assignments.
                      </td>
                    </tr>
                  ) : (
                    assignments.map((a) => (
                      <tr key={a.kioskId} className="hover:bg-neutral-50/70">
                        <td className="px-5 py-3.5">
                          <span className="font-mono text-[11px] text-neutral-400">
                            {a.kioskId}
                          </span>
                          <p className="font-semibold text-neutral-950">
                            {a.kioskName}
                          </p>
                        </td>

                        <td className="px-4 py-3.5">
                          <p className="font-medium text-neutral-950">
                            {a.buyerName}
                          </p>
                          <p className="text-[11px] text-neutral-400">
                            {a.buyerEmail}
                          </p>
                        </td>

                        <td className="px-4 py-3.5">
                          <StatusBadge
                            status={a.kioskStatus}
                            type="kiosk"
                            size="sm"
                          />
                        </td>

                        <td className="px-4 py-3.5 text-neutral-500">
                          {a.notes || '-'}
                        </td>

                        <td className="px-5 py-3.5 text-right">
                          <button
                            type="button"
                            onClick={() => setUnassignTarget(a)}
                            className="rounded-full border border-neutral-200 px-3 py-1 text-xs font-medium text-neutral-600 hover:border-neutral-950"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-white p-5">
            <h3 className="font-display text-base font-bold text-neutral-950">
              Kiosks by Buyer
            </h3>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {buyers.map((b) => (
                <div
                  key={b.id}
                  className="rounded-xl border border-neutral-200 p-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-semibold text-neutral-950">
                        {b.fullName}
                      </p>
                      <p className="text-[11px] text-neutral-400">{b.email}</p>
                    </div>
                    <span className="font-mono text-xs text-neutral-500">
                      {b.assignedKiosks.length}
                    </span>
                  </div>

                  {b.assignedKiosks.length > 0 ? (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {b.assignedKiosks.map((k) => (
                        <span
                          key={k.id}
                          className="rounded-md border border-neutral-200 bg-neutral-50 px-2 py-0.5 font-mono text-[10px] text-neutral-700"
                        >
                          {k.id}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-2 text-[11px] text-neutral-400">
                      No kiosks assigned
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <ConfirmModal
        open={Boolean(conflictPrompt)}
        title="Transfer Kiosk Ownership"
        description={
          conflictPrompt?.message ||
          'Selected kiosk is already assigned to another buyer. Transfer ownership?'
        }
        confirmLabel="Transfer"
        variant="warning"
        loading={submitting}
        onConfirm={() => executeAssignment(true)}
        onCancel={() => setConflictPrompt(null)}
      />

      <ConfirmModal
        open={Boolean(unassignTarget)}
        title={`Remove ${unassignTarget?.kioskId}?`}
        description={`This revokes ${unassignTarget?.buyerName}'s access to ${unassignTarget?.kioskName} in the mobile app.`}
        confirmLabel="Remove"
        variant="danger"
        loading={removing}
        onConfirm={handleConfirmUnassign}
        onCancel={() => setUnassignTarget(null)}
      />
    </div>
  );
};
