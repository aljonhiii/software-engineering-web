import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { ArrowLeft, Eye, EyeOff, Monitor, Download, Play, QrCode, CheckCircle2, Check } from 'lucide-react';
import {
  verifyInvitationToken,
  completeBuyerAccountSetup,
  downloadKioskWindowsLauncher,
  getKioskLaunchUrl,
} from '../../api/client';
import { BuyerInvitationInfo } from '../../types';
import { TabletQrModal } from '../../components/common/TabletQrModal';

export const BuyerSetupPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';

  const [invitation, setInvitation] = useState<BuyerInvitationInfo | null>(null);
  const [verifying, setVerifying] = useState<boolean>(true);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [isAlreadyDone, setIsAlreadyDone] = useState<boolean>(false);

  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [completed, setCompleted] = useState<boolean>(false);
  const [tabletQrTarget, setTabletQrTarget] = useState<{
    kioskId: string;
    kioskName?: string;
    ownerName?: string;
  } | null>(null);

  useEffect(() => {
    async function checkToken() {
      if (!token) {
        setVerifyError('Open the invitation link sent to your email.');
        setVerifying(false);
        return;
      }

      try {
        const res = await verifyInvitationToken(token);
        if (res.success && res.invitation) {
          setInvitation(res.invitation);
        }
      } catch (err: any) {
        const msg = String(err.message || '');
        if (
          msg.toLowerCase().includes('already') ||
          msg.toLowerCase().includes('completed') ||
          err.code === 'INVALID_OR_USED' ||
          err.code === 'ALREADY_COMPLETED'
        ) {
          setIsAlreadyDone(true);
        } else {
          setVerifyError(
            err.message || 'This invitation link is invalid or expired.'
          );
        }
      } finally {
        setVerifying(false);
      }
    }
    checkToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (password.length < 6) {
      setSubmitError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setSubmitError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await completeBuyerAccountSetup(token, password);
      if (res.success) {
        setCompleted(true);
      }
    } catch (err: any) {
      setSubmitError(err.message || 'Could not complete setup.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-neutral-50 text-neutral-950">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-2.5">
            <img
              src="/kixcleen-logo.png"
              alt="KixCleen"
              className="h-8 w-8 rounded-lg object-contain"
            />
            <span className="font-display text-base font-bold tracking-[0.12em] uppercase">
              KixCleen
            </span>
          </Link>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 px-4 py-1.5 text-xs font-medium text-neutral-700 hover:border-neutral-950"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to site
          </Link>
        </div>
      </header>

      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-6 sm:p-8">
          <h1 className="font-display text-2xl font-bold text-neutral-950">
            Activate Buyer Account
          </h1>
          <p className="mt-1 text-xs text-neutral-500">
            Set your password for the KixCleen Monitoring mobile app.
          </p>

          <div className="mt-6">
            {verifying ? (
              <div className="py-8 text-center text-xs text-neutral-500">
                Checking invitation link...
              </div>
            ) : isAlreadyDone ? (
              <div className="space-y-4">
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 text-xs text-emerald-950">
                  <div className="flex items-center gap-2 font-semibold text-emerald-900">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    Setup Already Completed (Done)
                  </div>
                  <p className="mt-1 text-emerald-800 leading-relaxed">
                    This account setup has already been completed and is active. You can log into the KixCleen Monitoring Mobile App directly with your credentials.
                  </p>
                </div>
                <Link
                  to="/"
                  className="inline-flex w-full items-center justify-center rounded-full bg-neutral-950 px-5 py-2.5 text-xs font-medium text-white hover:bg-neutral-800"
                >
                  Return to Home
                </Link>
              </div>
            ) : verifyError ? (
              <div className="space-y-4">
                <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 text-xs text-neutral-600">
                  {verifyError}
                </div>
                <Link
                  to="/"
                  className="inline-flex w-full items-center justify-center rounded-full bg-neutral-950 px-5 py-2.5 text-xs font-medium text-white hover:bg-neutral-800"
                >
                  Return home
                </Link>
              </div>
            ) : completed && invitation ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300 bg-emerald-100/70 px-3 py-0.5 text-xs font-bold text-emerald-900">
                    <Check className="h-3 w-3 text-emerald-700" />
                    Setup Done
                  </span>
                </div>
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-900">
                  Your account is active. You can now sign in on the KixCleen mobile app.
                </div>

                <div className="rounded-xl border border-neutral-200 p-4 text-xs space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Email</span>
                    <span className="font-mono font-medium text-neutral-900">
                      {invitation.email}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Username</span>
                    <span className="font-mono font-medium text-neutral-900">
                      {invitation.username}
                    </span>
                  </div>
                </div>

                {/* Connected Kiosks */}
                {invitation.assignedKiosks && invitation.assignedKiosks.length > 0 ? (
                  <div className="rounded-xl border border-neutral-200 bg-neutral-50/70 p-4 text-xs space-y-3">
                    <div className="flex items-center gap-1.5 font-semibold text-neutral-900">
                      <Monitor className="h-4 w-4 text-neutral-700" />
                      Your Dedicated Kiosk
                    </div>
                    <p className="text-[11px] text-neutral-500">
                      Orders placed on this kiosk terminal will instantly sync to your mobile monitoring app.
                    </p>

                    <div className="space-y-2">
                      {invitation.assignedKiosks.map((k) => {
                        const kioskUrl = getKioskLaunchUrl(k.id, k.launcherUrl);
                        return (
                          <div
                            key={k.id}
                            className="rounded-lg border border-neutral-200 bg-white p-3 space-y-2"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-mono font-bold text-neutral-950">
                                {k.id}
                              </span>
                              <span className="text-[11px] text-neutral-500">
                                {k.name || 'Dedicated Kiosk'}
                              </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 pt-1">
                              <a
                                href={kioskUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 rounded-full bg-neutral-950 px-3.5 py-1.5 text-[11px] font-medium text-white hover:bg-neutral-800"
                              >
                                <Play className="h-3 w-3 fill-white" />
                                Launch Kiosk
                              </a>

                              <button
                                type="button"
                                onClick={() =>
                                  downloadKioskWindowsLauncher(k.id, invitation.fullName)
                                }
                                className="inline-flex items-center gap-1.5 rounded-full border border-neutral-300 bg-white px-3.5 py-1.5 text-[11px] font-medium text-neutral-800 hover:bg-neutral-50"
                              >
                                <Download className="h-3 w-3 text-neutral-600" />
                                Download Windows Launcher (.bat)
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  setTabletQrTarget({
                                    kioskId: k.id,
                                    kioskName: k.name,
                                    ownerName: invitation.fullName,
                                  })
                                }
                                className="inline-flex items-center gap-1.5 rounded-full border border-petrol-300 bg-white px-3.5 py-1.5 text-[11px] font-medium text-petrol-800 hover:bg-petrol-50"
                              >
                                <QrCode className="h-3 w-3 text-petrol-700" />
                                Scan for Tablet
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : invitation.assignedKioskIds && invitation.assignedKioskIds.length > 0 ? (
                  <div className="rounded-xl border border-neutral-200 bg-neutral-50/70 p-4 text-xs space-y-3">
                    <div className="flex items-center gap-1.5 font-semibold text-neutral-900">
                      <Monitor className="h-4 w-4 text-neutral-700" />
                      Your Dedicated Kiosk
                    </div>
                    <div className="space-y-2">
                      {invitation.assignedKioskIds.map((kId) => {
                        const kioskUrl = getKioskLaunchUrl(kId);
                        return (
                          <div
                            key={kId}
                            className="rounded-lg border border-neutral-200 bg-white p-3 space-y-2"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-mono font-bold text-neutral-950">
                                {kId}
                              </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 pt-1">
                              <a
                                href={kioskUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 rounded-full bg-neutral-950 px-3.5 py-1.5 text-[11px] font-medium text-white hover:bg-neutral-800"
                              >
                                <Play className="h-3 w-3 fill-white" />
                                Launch Kiosk
                              </a>

                              <button
                                type="button"
                                onClick={() =>
                                  downloadKioskWindowsLauncher(kId, invitation.fullName)
                                }
                                className="inline-flex items-center gap-1.5 rounded-full border border-neutral-300 bg-white px-3.5 py-1.5 text-[11px] font-medium text-neutral-800 hover:bg-neutral-50"
                              >
                                <Download className="h-3 w-3 text-neutral-600" />
                                Download Windows Launcher (.bat)
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  setTabletQrTarget({
                                    kioskId: kId,
                                    ownerName: invitation.fullName,
                                  })
                                }
                                className="inline-flex items-center gap-1.5 rounded-full border border-petrol-300 bg-white px-3.5 py-1.5 text-[11px] font-medium text-petrol-800 hover:bg-petrol-50"
                              >
                                <QrCode className="h-3 w-3 text-petrol-700" />
                                Scan for Tablet
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : null}

                <Link
                  to="/"
                  className="inline-flex w-full items-center justify-center rounded-full bg-neutral-950 px-5 py-2.5 text-xs font-medium text-white hover:bg-neutral-800"
                >
                  Back to KixCleen
                </Link>
              </div>
            ) : (
              invitation && (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3.5 text-xs space-y-1">
                    <p className="font-semibold text-neutral-950">
                      {invitation.fullName}
                    </p>
                    <p className="font-mono text-neutral-600">{invitation.email}</p>
                    {invitation.assignedKioskIds.length > 0 && (
                      <p className="text-neutral-500">
                        Kiosks: {invitation.assignedKioskIds.join(', ')}
                      </p>
                    )}
                  </div>

                  {submitError && (
                    <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
                      {submitError}
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-medium text-neutral-700">
                      New password
                    </label>
                    <div className="relative mt-1">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        minLength={6}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="At least 6 characters"
                        className="w-full rounded-xl border border-neutral-200 px-3.5 py-2.5 pr-10 text-sm focus:border-neutral-950 focus:outline-hidden"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute top-1/2 right-3 -translate-y-1/2 text-neutral-400 hover:text-neutral-700"
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-neutral-700">
                      Confirm password
                    </label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat password"
                      className="mt-1 w-full rounded-xl border border-neutral-200 px-3.5 py-2.5 text-sm focus:border-neutral-950 focus:outline-hidden"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full rounded-full bg-neutral-950 py-3 text-xs font-medium text-white transition hover:bg-neutral-800 disabled:opacity-50"
                  >
                    {submitting ? 'Saving...' : 'Activate account'}
                  </button>
                </form>
              )
            )}
          </div>
        </div>
      </div>

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
