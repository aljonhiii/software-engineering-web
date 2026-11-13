import React, { useState, useEffect } from 'react';
import { X, Tablet, Copy, Check, ExternalLink, RefreshCw, Wifi, Smartphone, Globe } from 'lucide-react';
import QRCode from 'qrcode';
import { fetchLauncherNetworkInfo, getKioskLaunchUrl } from '../../api/client';

interface TabletQrModalProps {
  open: boolean;
  onClose: () => void;
  kioskId: string;
  kioskName?: string;
  ownerName?: string;
}

export const TabletQrModal: React.FC<TabletQrModalProps> = ({
  open,
  onClose,
  kioskId,
  kioskName,
  ownerName,
}) => {
  const [targetMode, setTargetMode] = useState<'expo' | 'web'>('expo');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [lanIp, setLanIp] = useState<string>('192.168.1.4');
  const [kioskPort, setKioskPort] = useState<string>('8081');
  const [copied, setCopied] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  const cleanId = (kioskId || 'KIOSK-01-MAIN').trim().toUpperCase();

  const activeTargetUrl =
    targetMode === 'expo'
      ? `exp://${lanIp}:${kioskPort}/--/?kioskId=${encodeURIComponent(cleanId)}`
      : `http://${lanIp}:3000/api/launcher/kiosk?kioskId=${encodeURIComponent(cleanId)}`;

  useEffect(() => {
    if (!open) return;
    let isMounted = true;
    setLoading(true);

    fetchLauncherNetworkInfo()
      .then((info) => {
        if (isMounted) {
          if (info.primaryIp) setLanIp(info.primaryIp);
          if (info.lanKioskUrl) {
            try {
              const u = new URL(info.lanKioskUrl);
              if (u.port) setKioskPort(u.port);
            } catch {}
          }
        }
      })
      .catch(() => {
        // Fallback to current LAN IP
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    QRCode.toDataURL(activeTargetUrl, {
      width: 260,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('Failed to generate QR code', err));
  }, [activeTargetUrl, open]);

  if (!open) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(activeTargetUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/50 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-neutral-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="rounded-xl bg-petrol-50 p-2 text-petrol-700">
              <Tablet className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-display text-base font-bold text-neutral-950">
                Scan to Test on Tablet
              </h3>
              <p className="text-xs text-neutral-500">
                Run dedicated kiosk on iPad or Android Tablet
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Mode Selector Tabs (Expo Go Native vs Web Browser) */}
        <div className="mt-4 grid grid-cols-2 gap-1 rounded-xl bg-neutral-100 p-1 text-xs font-medium">
          <button
            type="button"
            onClick={() => setTargetMode('expo')}
            className={`flex items-center justify-center gap-1.5 rounded-lg py-1.5 transition ${
              targetMode === 'expo'
                ? 'bg-white font-semibold text-neutral-950 shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <Smartphone className="h-3.5 w-3.5" />
            Expo Go App
          </button>
          <button
            type="button"
            onClick={() => setTargetMode('web')}
            className={`flex items-center justify-center gap-1.5 rounded-lg py-1.5 transition ${
              targetMode === 'web'
                ? 'bg-white font-semibold text-neutral-950 shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <Globe className="h-3.5 w-3.5" />
            Web Browser
          </button>
        </div>

        {/* Machine Identity Badges */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-neutral-200 bg-neutral-50 px-3.5 py-2 text-xs">
          <div>
            <span className="text-[11px] text-neutral-400 block">Kiosk Terminal ID</span>
            <span className="font-mono font-bold text-neutral-950">{cleanId}</span>
          </div>
          {ownerName && (
            <div className="text-right">
              <span className="text-[11px] text-neutral-400 block">Assigned Owner</span>
              <span className="font-medium text-neutral-800">{ownerName}</span>
            </div>
          )}
        </div>

        {/* QR Code Container */}
        <div className="mt-3 flex flex-col items-center justify-center rounded-2xl border border-neutral-200 bg-neutral-50/50 p-4">
          {qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt={`QR Code for ${cleanId}`}
              className="h-48 w-48 rounded-xl border border-neutral-200 bg-white p-2 shadow-xs"
            />
          ) : (
            <div className="flex h-48 w-48 items-center justify-center rounded-xl bg-neutral-100 text-xs text-neutral-400">
              Generating QR Code...
            </div>
          )}

          <div className="mt-2.5 flex items-center gap-1.5 text-[11px] font-medium text-emerald-700">
            <Wifi className="h-3.5 w-3.5" />
            <span>
              {targetMode === 'expo'
                ? 'Scan inside Expo Go app on your tablet'
                : 'Scan with tablet camera &bull; Opens in browser'}
            </span>
          </div>
        </div>

        {/* Target URL Bar */}
        <div className="mt-3">
          <div className="flex items-center justify-between text-[11px] text-neutral-500 mb-1">
            <span>{targetMode === 'expo' ? 'Expo Go Link' : 'Tablet Web Link'}</span>
            {loading && (
              <span className="flex items-center gap-1 text-neutral-400">
                <RefreshCw className="h-2.5 w-2.5 animate-spin" /> Detecting LAN IP
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-neutral-50 p-2 text-xs">
            <input
              type="text"
              readOnly
              value={activeTargetUrl}
              className="w-full bg-transparent font-mono text-[11px] text-neutral-800 outline-hidden"
            />
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-neutral-300 bg-white px-2.5 py-1 text-[11px] font-medium text-neutral-700 hover:bg-neutral-50"
            >
              {copied ? (
                <>
                  <Check className="h-3 w-3 text-emerald-600" /> Copied
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3" /> Copy
                </>
              )}
            </button>
          </div>
        </div>

        {/* Mode-specific Instructions */}
        <div className="mt-3 rounded-xl border border-petrol-100 bg-petrol-50/50 p-3 text-[11px] text-petrol-900 leading-relaxed">
          {targetMode === 'expo' ? (
            <>
              <p className="font-semibold text-petrol-950 mb-0.5">Testing in Expo Go (Native Tablet App):</p>
              <ol className="list-decimal list-inside space-y-0.5 text-petrol-800">
                <li>Make sure tablet and computer are on the same Wi-Fi.</li>
                <li>Open the <strong>Expo Go</strong> app on your tablet.</li>
                <li>Scan this QR code &mdash; it loads Shoeclean with Machine ID <strong>{cleanId}</strong>!</li>
              </ol>
            </>
          ) : (
            <>
              <p className="font-semibold text-petrol-950 mb-0.5">Testing in Web Browser (No install):</p>
              <ol className="list-decimal list-inside space-y-0.5 text-petrol-800">
                <li>Make sure tablet and computer are on the same Wi-Fi.</li>
                <li>Scan this QR code with the tablet's native camera.</li>
                <li>Tap the popup banner to run Shoeclean in full touch mode!</li>
              </ol>
            </>
          )}
        </div>

        {/* Footer actions */}
        <div className="mt-4 flex items-center justify-between border-t border-neutral-100 pt-3">
          <a
            href={
              targetMode === 'expo'
                ? activeTargetUrl
                : getKioskLaunchUrl(cleanId)
            }
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-xs font-medium text-petrol-700 hover:underline"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Open on this machine
          </a>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-neutral-950 px-5 py-1.5 text-xs font-medium text-white hover:bg-neutral-800"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
