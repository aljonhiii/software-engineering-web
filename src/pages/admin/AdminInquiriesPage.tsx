import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  RefreshCw,
  Mail,
  Phone,
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
  Trash2,
  MessageSquare,
  Sparkles,
} from 'lucide-react';
import {
  fetchAdminInquiries,
  updateAdminInquiryStatus,
  deleteAdminInquiry,
} from '../../api/client';
import { CustomerInquiry } from '../../types';
import { ConfirmModal } from '../../components/common/ConfirmModal';

export const AdminInquiriesPage: React.FC = () => {
  const [inquiries, setInquiries] = useState<CustomerInquiry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<CustomerInquiry | null>(null);
  const [deleting, setDeleting] = useState<boolean>(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadInquiries = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchAdminInquiries();
      if (res.success) {
        setInquiries(res.inquiries);
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'Could not load customer inquiries.',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInquiries();
  }, [loadInquiries]);

  const handleStatusChange = async (
    id: string,
    newStatus: 'pending' | 'contacted' | 'completed' | 'cancelled'
  ) => {
    setUpdatingId(id);
    try {
      const res = await updateAdminInquiryStatus(id, newStatus);
      if (res.success) {
        setInquiries((prev) =>
          prev.map((item) => (item.id === id ? res.inquiry : item))
        );
        setFeedback({
          type: 'success',
          message: `Inquiry ${id} status updated to ${newStatus}.`,
        });
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'Could not update inquiry status.',
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await deleteAdminInquiry(deleteTarget.id);
      if (res.success) {
        setInquiries((prev) => prev.filter((item) => item.id !== deleteTarget.id));
        setFeedback({ type: 'success', message: 'Inquiry deleted successfully.' });
        setDeleteTarget(null);
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'Could not delete inquiry.',
      });
    } finally {
      setDeleting(false);
    }
  };

  const filteredInquiries = inquiries.filter((item) => {
    if (statusFilter !== 'all' && item.status !== statusFilter) return false;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      const hay = `${item.id} ${item.fullName} ${item.email} ${item.phone} ${item.preferredLocation} ${item.inquiryType} ${item.message || ''}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  const pendingCount = inquiries.filter((i) => i.status === 'pending').length;
  const contactedCount = inquiries.filter((i) => i.status === 'contacted').length;
  const completedCount = inquiries.filter((i) => i.status === 'completed').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl font-bold text-neutral-950">
              Orders &amp; Inquiries
            </h1>
            {pendingCount > 0 && (
              <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-800">
                {pendingCount} new
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-neutral-500">
            Customer shoe cleaning requests, machine placements, and Zamboanga franchise inquiries.
          </p>
        </div>

        <button
          type="button"
          onClick={loadInquiries}
          className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-4 py-2 text-xs font-medium text-neutral-700 hover:border-neutral-950 transition"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
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
            &times;
          </button>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-neutral-200 bg-white p-4">
          <span className="text-xs text-neutral-400 font-medium">Total Requests</span>
          <p className="font-display mt-1 text-2xl font-bold text-neutral-950">
            {inquiries.length}
          </p>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4">
          <span className="text-xs text-amber-700 font-medium">Pending Action</span>
          <p className="font-display mt-1 text-2xl font-bold text-amber-950">
            {pendingCount}
          </p>
        </div>
        <div className="rounded-2xl border border-sky-200 bg-sky-50/50 p-4">
          <span className="text-xs text-sky-700 font-medium">Contacted</span>
          <p className="font-display mt-1 text-2xl font-bold text-sky-950">
            {contactedCount}
          </p>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4">
          <span className="text-xs text-emerald-700 font-medium">Completed</span>
          <p className="font-display mt-1 text-2xl font-bold text-emerald-950">
            {completedCount}
          </p>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative min-w-[260px] flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search customer, phone, email, or Zamboanga location..."
            className="w-full rounded-xl border border-neutral-200 bg-white py-2 pr-4 pl-10 text-xs text-neutral-900 focus:border-neutral-950 focus:outline-hidden"
          />
        </div>

        <select
          aria-label="Filter inquiries by status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-xl border border-neutral-200 bg-white px-3.5 py-2 text-xs font-medium text-neutral-700 focus:border-neutral-950 focus:outline-hidden"
        >
          <option value="all">All statuses ({inquiries.length})</option>
          <option value="pending">Pending ({pendingCount})</option>
          <option value="contacted">Contacted ({contactedCount})</option>
          <option value="completed">Completed ({completedCount})</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Inquiries Cards List */}
      <div className="space-y-3">
        {loading && inquiries.length === 0 ? (
          <div className="rounded-2xl border border-neutral-200 bg-white p-12 text-center text-xs text-neutral-400">
            Loading inquiries...
          </div>
        ) : filteredInquiries.length === 0 ? (
          <div className="rounded-2xl border border-neutral-200 bg-white p-12 text-center text-xs text-neutral-400">
            No customer order requests found.
          </div>
        ) : (
          filteredInquiries.map((inq) => {
            const isPending = inq.status === 'pending';
            const isContacted = inq.status === 'contacted';
            const isCompleted = inq.status === 'completed';

            return (
              <div
                key={inq.id}
                className={`rounded-2xl border bg-white p-5 transition shadow-2xs ${
                  isPending
                    ? 'border-amber-300 ring-2 ring-amber-100'
                    : 'border-neutral-200 hover:border-neutral-300'
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] font-semibold text-neutral-400">
                        {inq.id}
                      </span>
                      <span
                        className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                          isPending
                            ? 'bg-amber-100 text-amber-900'
                            : isContacted
                            ? 'bg-sky-100 text-sky-900'
                            : isCompleted
                            ? 'bg-emerald-100 text-emerald-900'
                            : 'bg-neutral-100 text-neutral-600'
                        }`}
                      >
                        {inq.status}
                      </span>
                      <span className="text-[11px] text-neutral-400">
                        {new Date(inq.createdAt).toLocaleString('en-PH', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}
                      </span>
                    </div>

                    <h2 className="font-display mt-1 text-base font-bold text-neutral-950">
                      {inq.fullName}
                    </h2>
                  </div>

                  {/* Status Actions */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    {isPending && (
                      <button
                        type="button"
                        disabled={updatingId === inq.id}
                        onClick={() => handleStatusChange(inq.id, 'contacted')}
                        className="rounded-full bg-sky-600 px-3 py-1 text-xs font-medium text-white hover:bg-sky-700 disabled:opacity-50"
                      >
                        Mark Contacted
                      </button>
                    )}
                    {(isPending || isContacted) && (
                      <button
                        type="button"
                        disabled={updatingId === inq.id}
                        onClick={() => handleStatusChange(inq.id, 'completed')}
                        className="rounded-full bg-emerald-700 px-3 py-1 text-xs font-medium text-white hover:bg-emerald-800 disabled:opacity-50"
                      >
                        Mark Completed
                      </button>
                    )}
                    {isCompleted && (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Resolved
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() => setDeleteTarget(inq)}
                      className="rounded-full p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-rose-600"
                      title="Delete inquiry"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Details Grid */}
                <div className={`mt-4 grid grid-cols-1 gap-2.5 rounded-xl border border-neutral-100 bg-neutral-50/60 p-3.5 text-xs ${inq.preferredLocation ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}>
                  <div className="flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5 text-neutral-400 shrink-0" />
                    <div>
                      <p className="text-[10px] text-neutral-400">Phone</p>
                      <a
                        href={`tel:${inq.phone}`}
                        className="font-mono font-medium text-neutral-900 hover:underline"
                      >
                        {inq.phone}
                      </a>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 text-neutral-400 shrink-0" />
                    <div>
                      <p className="text-[10px] text-neutral-400">Email</p>
                      <a
                        href={`mailto:${inq.email}`}
                        className="font-mono font-medium text-neutral-900 hover:underline"
                      >
                        {inq.email}
                      </a>
                    </div>
                  </div>

                  {Boolean(inq.preferredLocation) && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 text-neutral-400 shrink-0" />
                      <div>
                        <p className="text-[10px] text-neutral-400">Location</p>
                        <p className="font-medium text-neutral-900">
                          {inq.preferredLocation}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Optional Service / Quantity Tags */}
                {(inq.inquiryType || inq.estimatedPairs) && (
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                    {inq.inquiryType && inq.inquiryType !== 'General Inquiry' && (
                      <span className="rounded-md border border-neutral-200 bg-white px-2.5 py-0.5 font-medium text-neutral-700">
                        {inq.inquiryType}
                      </span>
                    )}
                    {inq.estimatedPairs && (
                      <span className="rounded-md border border-neutral-200 bg-white px-2.5 py-0.5 text-neutral-600">
                        Quantity: <strong>{inq.estimatedPairs}</strong>
                      </span>
                    )}
                  </div>
                )}

                {inq.message && (
                  <div className="mt-3 rounded-xl border border-neutral-200 bg-white p-3 text-xs text-neutral-700 leading-relaxed">
                    <p className="font-semibold text-neutral-900 mb-0.5">Customer Message:</p>
                    {inq.message}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Delete Customer Request?"
        description={`This will permanently remove the inquiry from ${deleteTarget?.fullName} (${deleteTarget?.id}).`}
        confirmLabel="Delete"
        variant="danger"
        loading={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};
