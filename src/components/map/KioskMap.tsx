import React, { useEffect } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  useMapEvents,
} from 'react-leaflet';
import L from 'leaflet';
import { MapPin, Clock } from 'lucide-react';
import { KioskOperatingStatus } from '../../types';
import { StatusBadge } from '../common/StatusBadge';

export interface MapKioskItem {
  id: string;
  name: string;
  address: string;
  city: string;
  location: string;
  latitude: number | null;
  longitude: number | null;
  hasValidCoordinates: boolean;
  status: KioskOperatingStatus;
  operatingHours?: string;
  currentActivity?: string;
  ownerName?: string | null;
}

interface KioskMapProps {
  kiosks: MapKioskItem[];
  selectedKioskId?: string | null;
  onSelectKiosk?: (kiosk: MapKioskItem) => void;
  onViewDetails?: (kiosk: MapKioskItem) => void;
  heightClass?: string;
  pickerMode?: boolean;
  pickedCoords?: { lat: number; lng: number } | null;
  onPickCoordinates?: (lat: number, lng: number) => void;
}

function createStatusIcon(status: KioskOperatingStatus, isSelected: boolean) {
  let bg = '#10B981';
  let ring = 'rgba(16, 185, 129, 0.25)';

  if (status === 'busy') {
    bg = '#0284C7';
    ring = 'rgba(2, 132, 199, 0.25)';
  } else if (status === 'maintenance') {
    bg = '#F59E0B';
    ring = 'rgba(245, 158, 11, 0.25)';
  } else if (status === 'error') {
    bg = '#E11D48';
    ring = 'rgba(225, 29, 72, 0.25)';
  } else if (status === 'offline') {
    bg = '#737373';
    ring = 'rgba(115, 115, 115, 0.2)';
  }

  const size = isSelected ? 32 : 24;
  const border = isSelected ? '3px solid #0A0A0A' : '2.5px solid #FFFFFF';

  const html = `
    <div style="
      display: flex;
      align-items: center;
      justify-content: center;
      width: ${size}px;
      height: ${size}px;
      border-radius: 9999px;
      background: ${bg};
      border: ${border};
      box-shadow: 0 0 0 5px ${ring}, 0 4px 10px rgba(0,0,0,0.2);
      transition: all 0.2s ease;
    ">
      <div style="width: 6px; height: 6px; border-radius: 9999px; background: #ffffff;"></div>
    </div>
  `;

  return L.divIcon({
    className: 'kix-custom-pin',
    html,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
}

const pickedLocationIcon = L.divIcon({
  className: 'kix-custom-pin',
  html: `
    <div style="
      display: flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      border-radius: 9999px;
      background: #0A0A0A;
      border: 3px solid #FFFFFF;
      box-shadow: 0 4px 12px rgba(0,0,0,0.35);
    ">
      <div style="width: 8px; height: 8px; border-radius: 9999px; background: #FFFFFF;"></div>
    </div>
  `,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

function MapViewportController({
  selectedKiosk,
  pickedCoords,
}: {
  selectedKiosk: MapKioskItem | null;
  pickedCoords?: { lat: number; lng: number } | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (
      selectedKiosk &&
      selectedKiosk.hasValidCoordinates &&
      selectedKiosk.latitude !== null &&
      selectedKiosk.longitude !== null
    ) {
      map.flyTo([selectedKiosk.latitude, selectedKiosk.longitude], 15, {
        duration: 0.8,
      });
    }
  }, [map, selectedKiosk]);

  useEffect(() => {
    if (pickedCoords && Number.isFinite(pickedCoords.lat) && Number.isFinite(pickedCoords.lng)) {
      map.flyTo([pickedCoords.lat, pickedCoords.lng], Math.max(map.getZoom(), 14), {
        duration: 0.6,
      });
    }
  }, [map, pickedCoords]);

  return null;
}

function MapClickPicker({
  enabled,
  onPick,
}: {
  enabled?: boolean;
  onPick?: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      if (enabled && onPick) {
        onPick(
          Number(e.latlng.lat.toFixed(6)),
          Number(e.latlng.lng.toFixed(6))
        );
      }
    },
  });
  return null;
}

export const KioskMap: React.FC<KioskMapProps> = ({
  kiosks,
  selectedKioskId,
  onSelectKiosk,
  onViewDetails,
  heightClass = 'h-[540px]',
  pickerMode = false,
  pickedCoords = null,
  onPickCoordinates,
}) => {
  const mappableKiosks = kiosks.filter(
    (k) =>
      k.hasValidCoordinates &&
      k.latitude !== null &&
      k.longitude !== null &&
      Number.isFinite(Number(k.latitude)) &&
      Number.isFinite(Number(k.longitude))
  );

  const missingCoordsCount = kiosks.length - mappableKiosks.length;

  const selectedKiosk =
    mappableKiosks.find((k) => k.id === selectedKioskId) || null;

  const defaultCenter: [number, number] =
    pickedCoords && Number.isFinite(pickedCoords.lat) && Number.isFinite(pickedCoords.lng)
      ? [pickedCoords.lat, pickedCoords.lng]
      : mappableKiosks.length > 0
      ? [Number(mappableKiosks[0].latitude), Number(mappableKiosks[0].longitude)]
      : [14.5995, 121.0244];

  return (
    <div className={`relative w-full overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-100 ${heightClass}`}>
      <MapContainer
        center={defaultCenter}
        zoom={12}
        scrollWheelZoom={true}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapViewportController
          selectedKiosk={selectedKiosk}
          pickedCoords={pickedCoords}
        />

        <MapClickPicker enabled={pickerMode} onPick={onPickCoordinates} />

        {mappableKiosks.map((kiosk) => {
          const isSelected = kiosk.id === selectedKioskId;
          return (
            <Marker
              key={kiosk.id}
              position={[Number(kiosk.latitude), Number(kiosk.longitude)]}
              icon={createStatusIcon(kiosk.status, isSelected)}
              eventHandlers={{
                click: () => {
                  if (onSelectKiosk) onSelectKiosk(kiosk);
                },
              }}
            >
              <Popup>
                <div className="min-w-[220px] max-w-[260px] space-y-2 text-neutral-900">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[11px] font-medium text-neutral-500">
                      {kiosk.id}
                    </span>
                    <StatusBadge status={kiosk.status} type="kiosk" size="sm" />
                  </div>

                  <div>
                    <h4 className="font-display text-sm font-bold text-neutral-950">
                      {kiosk.name}
                    </h4>
                    <p className="mt-0.5 flex items-start gap-1 text-xs text-neutral-600">
                      <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-neutral-400" />
                      <span>
                        {kiosk.address}
                        {kiosk.city ? `, ${kiosk.city}` : ''}
                      </span>
                    </p>
                  </div>

                  {kiosk.operatingHours && (
                    <div className="flex items-center gap-1.5 text-[11px] text-neutral-500">
                      <Clock className="h-3.5 w-3.5 text-neutral-400" />
                      <span>{kiosk.operatingHours}</span>
                    </div>
                  )}

                  {kiosk.ownerName && (
                    <div className="rounded-lg bg-neutral-50 px-2.5 py-1.5 text-[11px] text-neutral-600">
                      Owner: <strong className="text-neutral-900">{kiosk.ownerName}</strong>
                    </div>
                  )}

                  {onViewDetails && (
                    <button
                      type="button"
                      onClick={() => onViewDetails(kiosk)}
                      className="mt-1 flex w-full items-center justify-center rounded-full bg-neutral-950 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-neutral-800"
                    >
                      View details
                    </button>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}

        {pickerMode &&
          pickedCoords &&
          Number.isFinite(pickedCoords.lat) &&
          Number.isFinite(pickedCoords.lng) && (
            <Marker
              position={[pickedCoords.lat, pickedCoords.lng]}
              icon={pickedLocationIcon}
            />
          )}
      </MapContainer>

      <div className="pointer-events-none absolute right-3 bottom-3 left-3 z-[400] flex flex-wrap items-center justify-between gap-2">
        <div className="pointer-events-auto flex flex-wrap items-center gap-3 rounded-full border border-neutral-200 bg-white/95 px-3.5 py-1.5 text-[11px] font-medium text-neutral-700 shadow-xs backdrop-blur-xs">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500" /> Online
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-sky-500" /> In Use
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-amber-500" /> Maintenance
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-neutral-400" /> Offline
          </span>
        </div>

        {!pickerMode && missingCoordsCount > 0 && (
          <div className="pointer-events-auto rounded-full border border-neutral-200 bg-white/95 px-3.5 py-1.5 text-[11px] font-medium text-neutral-600 shadow-xs">
            {missingCoordsCount} {missingCoordsCount === 1 ? 'location' : 'locations'} without map pin
          </div>
        )}

        {pickerMode && (
          <div className="pointer-events-auto rounded-full bg-neutral-950 px-3.5 py-1.5 text-[11px] font-medium text-white shadow-xs">
            Click map to set coordinates
          </div>
        )}
      </div>
    </div>
  );
};
