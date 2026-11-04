import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Navigation, RotateCcw } from 'lucide-react';

interface WarehouseMapPickerProps {
  lat: number;
  lng: number;
  onChange: (lat: number, lng: number) => void;
  disabled?: boolean;
}

export const WarehouseMapPicker: React.FC<WarehouseMapPickerProps> = ({
  lat,
  lng,
  onChange,
  disabled = false,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerInstanceRef = useRef<any>(null);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const [isLocating, setIsLocating] = useState(false);
  const [mapError, setMapError] = useState('');

  const currentLat = Number.isFinite(lat) && lat !== 0 ? lat : 10.7769;
  const currentLng = Number.isFinite(lng) && lng !== 0 ? lng : 106.7009;

  useEffect(() => {
    let isCancelled = false;

    // Đảm bảo Leaflet CSS được thêm vào document
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
      link.crossOrigin = '';
      document.head.appendChild(link);
    }

    const initMap = async () => {
      try {
        const L = (await import('leaflet')).default;

        if (isCancelled || !mapContainerRef.current) return;

        if (!mapInstanceRef.current) {
          const map = L.map(mapContainerRef.current, {
            center: [currentLat, currentLng],
            zoom: 14,
            zoomControl: true,
          });

          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors',
            maxZoom: 19,
          }).addTo(map);

          // Tạo icon kho hàng đẹp màu xanh lá đậm / emerald
          const warehouseIcon = L.divIcon({
            className: 'custom-warehouse-pin',
            html: `
              <div style="display:flex;align-items:center;justify-content:center;width:38px;height:38px;background:#059669;color:white;border-radius:50%;border:3px solid white;box-shadow:0 4px 10px rgba(0,0,0,0.3);cursor:grab;">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
              </div>
            `,
            iconSize: [38, 38],
            iconAnchor: [19, 38],
            popupAnchor: [0, -38],
          });

          const marker = L.marker([currentLat, currentLng], {
            draggable: !disabled,
            icon: warehouseIcon,
          }).addTo(map);

          marker.bindPopup('<b>Kho hàng xuất phát</b><br>Kéo ghim hoặc bấm bản đồ để dời vị trí kho.').openPopup();

          marker.on('dragend', () => {
            const pos = marker.getLatLng();
            onChangeRef.current(Number(pos.lat.toFixed(6)), Number(pos.lng.toFixed(6)));
          });

          map.on('click', (e: any) => {
            if (disabled) return;
            const clickedLat = Number(e.latlng.lat.toFixed(6));
            const clickedLng = Number(e.latlng.lng.toFixed(6));
            marker.setLatLng([clickedLat, clickedLng]);
            onChangeRef.current(clickedLat, clickedLng);
          });

          mapInstanceRef.current = map;
          markerInstanceRef.current = marker;

          setTimeout(() => {
            map.invalidateSize();
          }, 200);
        } else {
          const map = mapInstanceRef.current;
          const marker = markerInstanceRef.current;
          if (map && marker) {
            marker.setLatLng([currentLat, currentLng]);
          }
        }
      } catch (err: any) {
        if (!isCancelled) {
          setMapError(err.message || 'Không thể tải bản đồ Leaflet');
        }
      }
    };

    initMap();

    return () => {
      isCancelled = true;
    };
  }, [disabled, currentLat, currentLng]);

  // Cập nhật marker khi lat/lng từ prop thay đổi
  useEffect(() => {
    if (markerInstanceRef.current && mapInstanceRef.current) {
      const curPos = markerInstanceRef.current.getLatLng();
      if (Math.abs(curPos.lat - currentLat) > 0.0001 || Math.abs(curPos.lng - currentLng) > 0.0001) {
        markerInstanceRef.current.setLatLng([currentLat, currentLng]);
        mapInstanceRef.current.panTo([currentLat, currentLng], { animate: true });
      }
    }
  }, [currentLat, currentLng]);

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Trình duyệt không hỗ trợ định vị GPS.');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLocating(false);
        const newLat = Number(position.coords.latitude.toFixed(6));
        const newLng = Number(position.coords.longitude.toFixed(6));
        onChange(newLat, newLng);
        if (mapInstanceRef.current && markerInstanceRef.current) {
          markerInstanceRef.current.setLatLng([newLat, newLng]);
          mapInstanceRef.current.setView([newLat, newLng], 15, { animate: true });
        }
      },
      (error) => {
        setIsLocating(false);
        alert(`Không thể lấy vị trí: ${error.message}`);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleResetToDefault = () => {
    const defaultLat = 10.7769;
    const defaultLng = 106.7009;
    onChange(defaultLat, defaultLng);
    if (mapInstanceRef.current && markerInstanceRef.current) {
      markerInstanceRef.current.setLatLng([defaultLat, defaultLng]);
      mapInstanceRef.current.setView([defaultLat, defaultLng], 14, { animate: true });
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs text-stone-600">
          <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            Tọa độ kho:{' '}
            <strong className="font-mono text-stone-800">
              {currentLat.toFixed(5)}, {currentLng.toFixed(5)}
            </strong>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleGetCurrentLocation}
            disabled={disabled || isLocating}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition disabled:opacity-50 cursor-pointer"
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>{isLocating ? 'Đang định vị...' : 'Vị trí hiện tại'}</span>
          </button>
          <button
            type="button"
            onClick={handleResetToDefault}
            disabled={disabled}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-600 bg-stone-100 hover:bg-stone-200 rounded-lg transition disabled:opacity-50 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Showroom Q.1 TP.HCM</span>
          </button>
        </div>
      </div>

      {mapError && (
        <div className="p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg">
          {mapError}
        </div>
      )}

      <div
        ref={mapContainerRef}
        className="w-full h-72 sm:h-80 rounded-xl border border-stone-200 overflow-hidden shadow-inner z-0"
        style={{ minHeight: '280px' }}
      />
      <p className="text-[11px] text-stone-500 italic">
        * Nhấn vào bản đồ hoặc kéo ghim tròn màu xanh lá để cập nhật tọa độ xuất phát tính cước.
      </p>
    </div>
  );
};
