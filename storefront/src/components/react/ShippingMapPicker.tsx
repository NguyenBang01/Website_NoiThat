import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Navigation, Loader2, Check, AlertCircle } from 'lucide-react';

interface ShippingMapPickerProps {
  lat: number | null;
  lng: number | null;
  addressText?: string;
  onChange: (lat: number, lng: number) => void;
  className?: string;
}

export const ShippingMapPicker: React.FC<ShippingMapPickerProps> = ({
  lat,
  lng,
  addressText = '',
  onChange,
  className = '',
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  const [isLocating, setIsLocating] = useState(false);
  const [geoError, setGeoError] = useState('');
  const [isMapReady, setIsMapReady] = useState(false);

  // Mặc định là TP. Hồ Chí Minh nếu chưa có tọa độ
  const currentLat = lat || 10.7769;
  const currentLng = lng || 106.7009;

  useEffect(() => {
    // Đảm bảo CSS của Leaflet được nhúng
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    let isMounted = true;

    // Load Leaflet động phía client
    import('leaflet').then((L) => {
      if (!isMounted || !mapContainerRef.current) return;

      // Tránh khởi tạo trùng lặp
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
      }

      // Tạo icon ghim vị trí SVG hiện đại
      const customIcon = L.divIcon({
        className: 'custom-leaflet-marker',
        html: `
          <div style="position:relative; transform: translate(-50%, -100%);">
            <div style="
              background: #047857;
              width: 38px;
              height: 38px;
              border-radius: 50% 50% 50% 0;
              transform: rotate(-45deg);
              border: 3px solid #ffffff;
              box-shadow: 0 4px 12px rgba(0,0,0,0.3);
              display: flex;
              align-items: center;
              justify-content: center;
            ">
              <div style="
                width: 12px;
                height: 12px;
                background: #ffffff;
                border-radius: 50%;
                transform: rotate(45deg);
              "></div>
            </div>
            <div style="
              position: absolute;
              bottom: -6px;
              left: 50%;
              transform: translateX(-50%);
              width: 14px;
              height: 5px;
              background: rgba(0,0,0,0.25);
              border-radius: 50%;
              filter: blur(1px);
            "></div>
          </div>
        `,
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      });

      const map = L.map(mapContainerRef.current, {
        center: [currentLat, currentLng],
        zoom: 15,
        scrollWheelZoom: 'center',
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      // Thêm Marker có thể kéo thả
      const marker = L.marker([currentLat, currentLng], {
        draggable: true,
        icon: customIcon,
      }).addTo(map);

      // Khi người dùng kéo thả marker
      marker.on('dragend', () => {
        const position = marker.getLatLng();
        onChange(Number(position.lat.toFixed(6)), Number(position.lng.toFixed(6)));
      });

      // Khi người dùng bấm trực tiếp vào bất kỳ vị trí nào trên bản đồ
      map.on('click', (e: any) => {
        const { lat: clickLat, lng: clickLng } = e.latlng;
        marker.setLatLng([clickLat, clickLng]);
        onChange(Number(clickLat.toFixed(6)), Number(clickLng.toFixed(6)));
      });

      mapInstanceRef.current = map;
      markerRef.current = marker;
      setIsMapReady(true);
    });

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Cập nhật vị trí marker khi props lat, lng thay đổi từ bên ngoài
  useEffect(() => {
    if (markerRef.current && mapInstanceRef.current && lat && lng) {
      const currentPos = markerRef.current.getLatLng();
      if (Math.abs(currentPos.lat - lat) > 0.0001 || Math.abs(currentPos.lng - lng) > 0.0001) {
        markerRef.current.setLatLng([lat, lng]);
        mapInstanceRef.current.setView([lat, lng], mapInstanceRef.current.getZoom(), {
          animate: true,
        });
      }
    }
  }, [lat, lng]);

  // Nút "Dùng vị trí hiện tại" qua HTML5 Geolocation API
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setGeoError('Trình duyệt của bạn không hỗ trợ định vị GPS.');
      return;
    }

    setIsLocating(true);
    setGeoError('');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newLat = Number(position.coords.latitude.toFixed(6));
        const newLng = Number(position.coords.longitude.toFixed(6));
        onChange(newLat, newLng);

        if (mapInstanceRef.current && markerRef.current) {
          markerRef.current.setLatLng([newLat, newLng]);
          mapInstanceRef.current.setView([newLat, newLng], 16, { animate: true });
        }
        setIsLocating(false);
      },
      (err) => {
        setIsLocating(false);
        if (err.code === err.PERMISSION_DENIED) {
          setGeoError('Bạn đã từ chối quyền truy cập vị trí. Vui lòng kéo ghim trên bản đồ để chọn.');
        } else {
          setGeoError('Không thể lấy vị trí hiện tại. Vui lòng chọn trên bản đồ.');
        }
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <label className="text-xs font-semibold text-stone-700 flex items-center gap-1.5">
          <MapPin className="w-4 h-4 text-emerald-700" />
          <span>Vị trí giao hàng trên bản đồ (Ghim điểm chính xác)</span>
        </label>

        <button
          type="button"
          onClick={handleUseCurrentLocation}
          disabled={isLocating}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 transition-colors cursor-pointer self-start sm:self-auto"
        >
          {isLocating ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-700" />
          ) : (
            <Navigation className="w-3.5 h-3.5 text-emerald-700" />
          )}
          <span>Dùng vị trí hiện tại của tôi</span>
        </button>
      </div>

      {geoError && (
        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 animate-in fade-in">
          <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
          <span>{geoError}</span>
        </div>
      )}

      {/* Container bản đồ */}
      <div className="relative rounded-2xl overflow-hidden border border-stone-200/90 shadow-2xs">
        <div ref={mapContainerRef} className="h-56 w-full z-10 bg-stone-100" />

        {/* Hướng dẫn thao tác ghim */}
        <div className="absolute bottom-2 left-2 z-20 pointer-events-none bg-stone-900/80 backdrop-blur-xs text-white text-[10px] px-2.5 py-1 rounded-md flex items-center gap-1.5 shadow-xs">
          <Check className="w-3 h-3 text-emerald-400" />
          <span>Bấm hoặc kéo ghim xanh để điều chỉnh điểm giao hàng</span>
        </div>
      </div>

      {lat && lng && (
        <div className="text-[11px] text-stone-500 font-mono flex items-center gap-2">
          <span>Tọa độ đã chọn:</span>
          <span className="bg-stone-100 px-2 py-0.5 rounded text-stone-700 font-semibold">
            {lat.toFixed(5)}, {lng.toFixed(5)}
          </span>
        </div>
      )}
    </div>
  );
};
