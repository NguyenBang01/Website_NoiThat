import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Navigation, RotateCcw, Search, Layers, AlertCircle } from 'lucide-react';

interface WarehouseMapPickerProps {
  lat: number;
  lng: number;
  onChange: (lat: number, lng: number) => void;
  disabled?: boolean;
}

declare global {
  interface Window {
    google?: any;
    __GOOGLE_MAPS_CALLBACK__?: () => void;
  }
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
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const [isLocating, setIsLocating] = useState(false);
  const [mapError, setMapError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [mapEngine, setMapEngine] = useState<'google' | 'leaflet'>('google');

  const currentLat = Number.isFinite(lat) && lat !== 0 ? lat : 10.7769;
  const currentLng = Number.isFinite(lng) && lng !== 0 ? lng : 106.7009;

  const apiKey = (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string) || '';

  // 1. Tải và khởi tạo Google Maps
  useEffect(() => {
    let isCancelled = false;

    const loadGoogleMaps = async () => {
      if (typeof window === 'undefined') return;

      if (!window.google?.maps) {
        await new Promise<void>((resolve, reject) => {
          if (document.getElementById('google-maps-sdk')) {
            const checkTimer = setInterval(() => {
              if (window.google?.maps) {
                clearInterval(checkTimer);
                resolve();
              }
            }, 100);
            return;
          }

          const script = document.createElement('script');
          script.id = 'google-maps-sdk';
          const keyParam = apiKey ? `&key=${encodeURIComponent(apiKey)}` : '';
          script.src = `https://maps.googleapis.com/maps/api/js?v=weekly${keyParam}&libraries=places,geometry&language=vi`;
          script.async = true;
          script.defer = true;
          script.onload = () => resolve();
          script.onerror = () => reject(new Error('Không thể tải Google Maps API.'));
          document.head.appendChild(script);
        }).catch((err) => {
          console.warn('Lỗi nạp Google Maps, chuyển sang chế độ dự phòng:', err);
          if (!isCancelled) {
            setMapEngine('leaflet');
          }
        });
      }

      if (isCancelled || !mapContainerRef.current || !window.google?.maps) return;

      try {
        const center = { lat: currentLat, lng: currentLng };

        const map = new window.google.maps.Map(mapContainerRef.current, {
          center,
          zoom: 15,
          mapTypeId: window.google.maps.MapTypeId.ROADMAP,
          mapTypeControl: true,
          mapTypeControlOptions: {
            style: window.google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
            position: window.google.maps.ControlPosition.TOP_RIGHT,
          },
          zoomControl: true,
          streetViewControl: false,
          fullscreenControl: true,
        });

        // Tạo custom marker biểu tượng kho hàng màu xanh ngọc (Emerald)
        const marker = new window.google.maps.Marker({
          position: center,
          map,
          draggable: !disabled,
          animation: window.google.maps.Animation.DROP,
          title: 'Vị trí kho hàng xuất phát',
          icon: {
            path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
            fillColor: '#059669',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2,
            scale: 2,
            anchor: new window.google.maps.Point(12, 22),
          },
        });

        // Info window hiển thị khi hover hoặc click ghim
        const infoWindow = new window.google.maps.InfoWindow({
          content: `
            <div style="font-family:sans-serif;padding:4px 6px;font-size:12px;color:#1c1917;">
              <strong style="color:#059669;font-size:13px;display:block;margin-bottom:2px;">Kho hàng xuất phát</strong>
              <span>Kéo ghim hoặc bấm vào bản đồ Google Maps để cập nhật tọa độ tính cước.</span>
            </div>
          `,
        });
        infoWindow.open(map, marker);

        // Kéo thả ghim
        marker.addListener('dragend', () => {
          const pos = marker.getPosition();
          if (pos) {
            const newLat = Number(pos.lat().toFixed(6));
            const newLng = Number(pos.lng().toFixed(6));
            onChangeRef.current(newLat, newLng);
          }
        });

        // Nhấp vào bất kỳ đâu trên bản đồ Google Maps
        map.addListener('click', (e: any) => {
          if (disabled || !e.latLng) return;
          const newLat = Number(e.latLng.lat().toFixed(6));
          const newLng = Number(e.latLng.lng().toFixed(6));
          marker.setPosition(e.latLng);
          onChangeRef.current(newLat, newLng);
        });

        mapInstanceRef.current = map;
        markerInstanceRef.current = marker;
      } catch (err: any) {
        console.warn('Lỗi khởi tạo Google Maps:', err);
        if (!isCancelled) {
          setMapEngine('leaflet');
        }
      }
    };

    if (mapEngine === 'google') {
      loadGoogleMaps();
    }

    return () => {
      isCancelled = true;
    };
  }, [mapEngine, disabled]);

  // Cập nhật vị trí ghim khi props lat/lng thay đổi
  useEffect(() => {
    if (markerInstanceRef.current && mapInstanceRef.current && window.google?.maps && mapEngine === 'google') {
      const pos = markerInstanceRef.current.getPosition();
      if (pos) {
        const diffLat = Math.abs(pos.lat() - currentLat);
        const diffLng = Math.abs(pos.lng() - currentLng);
        if (diffLat > 0.0001 || diffLng > 0.0001) {
          const newLatLng = new window.google.maps.LatLng(currentLat, currentLng);
          markerInstanceRef.current.setPosition(newLatLng);
          mapInstanceRef.current.panTo(newLatLng);
        }
      }
    }
  }, [currentLat, currentLng, mapEngine]);

  // Khởi tạo fallback Leaflet nếu cần
  useEffect(() => {
    if (mapEngine !== 'leaflet') return;
    let isCancelled = false;

    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    import('leaflet').then((LModule) => {
      const L = LModule.default;
      if (isCancelled || !mapContainerRef.current) return;

      mapContainerRef.current.innerHTML = '';
      const map = L.map(mapContainerRef.current).setView([currentLat, currentLng], 15);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(map);

      const marker = L.marker([currentLat, currentLng], { draggable: !disabled }).addTo(map);
      marker.on('dragend', () => {
        const p = marker.getLatLng();
        onChangeRef.current(Number(p.lat.toFixed(6)), Number(p.lng.toFixed(6)));
      });

      map.on('click', (e: any) => {
        if (disabled) return;
        marker.setLatLng(e.latlng);
        onChangeRef.current(Number(e.latlng.lat.toFixed(6)), Number(e.latlng.lng.toFixed(6)));
      });

      mapInstanceRef.current = map;
      markerInstanceRef.current = marker;
    });

    return () => {
      isCancelled = true;
    };
  }, [mapEngine, disabled]);

  // Tìm kiếm địa chỉ bằng Google Geocoder
  const handleSearchAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setMapError('');

    try {
      if (window.google?.maps?.Geocoder) {
        const geocoder = new window.google.maps.Geocoder();
        geocoder.geocode({ address: searchQuery.trim(), componentRestrictions: { country: 'VN' } }, (results: any, status: any) => {
          setIsSearching(false);
          if (status === 'OK' && results && results[0]) {
            const loc = results[0].geometry.location;
            const newLat = Number(loc.lat().toFixed(6));
            const newLng = Number(loc.lng().toFixed(6));
            onChange(newLat, newLng);

            if (mapInstanceRef.current && markerInstanceRef.current) {
              markerInstanceRef.current.setPosition(loc);
              mapInstanceRef.current.setCenter(loc);
              mapInstanceRef.current.setZoom(16);
            }
          } else {
            setMapError('Không tìm thấy địa chỉ này trên bản đồ Google Maps.');
          }
        });
      } else {
        // Fallback geocoding qua Nominatim
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery.trim())}&countrycodes=vn&limit=1`);
        const data = await res.json();
        setIsSearching(false);
        if (data && data[0]) {
          const newLat = Number(parseFloat(data[0].lat).toFixed(6));
          const newLng = Number(parseFloat(data[0].lon).toFixed(6));
          onChange(newLat, newLng);
          if (mapInstanceRef.current && markerInstanceRef.current && window.google?.maps) {
            const pos = new window.google.maps.LatLng(newLat, newLng);
            markerInstanceRef.current.setPosition(pos);
            mapInstanceRef.current.panTo(pos);
          }
        } else {
          setMapError('Không tìm thấy địa chỉ.');
        }
      }
    } catch (err: any) {
      setIsSearching(false);
      setMapError('Lỗi khi tra cứu địa chỉ.');
    }
  };

  // Định vị GPS hiện tại
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

        if (mapInstanceRef.current && markerInstanceRef.current && window.google?.maps && mapEngine === 'google') {
          const pos = new window.google.maps.LatLng(newLat, newLng);
          markerInstanceRef.current.setPosition(pos);
          mapInstanceRef.current.panTo(pos);
          mapInstanceRef.current.setZoom(16);
        }
      },
      (error) => {
        setIsLocating(false);
        alert(`Không thể lấy vị trí: ${error.message}`);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Đặt về Showroom Q.1
  const handleResetToDefault = () => {
    const defaultLat = 10.7769;
    const defaultLng = 106.7009;
    onChange(defaultLat, defaultLng);

    if (mapInstanceRef.current && markerInstanceRef.current && window.google?.maps && mapEngine === 'google') {
      const pos = new window.google.maps.LatLng(defaultLat, defaultLng);
      markerInstanceRef.current.setPosition(pos);
      mapInstanceRef.current.panTo(pos);
      mapInstanceRef.current.setZoom(15);
    }
  };

  return (
    <div className="space-y-3">
      {/* Thanh công cụ phía trên bản đồ */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2 text-xs text-stone-700">
          <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            Tọa độ kho:{' '}
            <strong className="font-mono text-stone-900 bg-stone-100 px-2 py-0.5 rounded border border-stone-200">
              {currentLat.toFixed(5)}, {currentLng.toFixed(5)}
            </strong>
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            Google Maps
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Nút chuyển đổi loại bản đồ */}
          <button
            type="button"
            onClick={() => setMapEngine(mapEngine === 'google' ? 'leaflet' : 'google')}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-stone-600 bg-stone-100 hover:bg-stone-200 rounded-lg transition cursor-pointer"
            title="Đổi nhà cung cấp bản đồ"
          >
            <Layers className="w-3.5 h-3.5 text-stone-500" />
            <span>{mapEngine === 'google' ? 'Dùng OpenStreetMap' : 'Dùng Google Maps'}</span>
          </button>

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
            <span>Showroom Q.1</span>
          </button>
        </div>
      </div>

      {/* Ô tìm kiếm địa chỉ nhanh trên Google Maps */}
      <form onSubmit={handleSearchAddress} className="flex gap-2">
        <div className="relative flex-1">
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm địa chỉ kho trên Google Maps (ví dụ: 615 Âu Cơ, Tân Phú)..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 bg-white"
          />
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
        </div>
        <button
          type="submit"
          disabled={isSearching || !searchQuery.trim()}
          className="px-4 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 rounded-xl transition cursor-pointer shrink-0"
        >
          {isSearching ? 'Đang tìm...' : 'Tìm vị trí'}
        </button>
      </form>

      {mapError && (
        <div className="p-2.5 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
          <span>{mapError}</span>
        </div>
      )}

      {/* Khung hiển thị Google Maps */}
      <div
        ref={mapContainerRef}
        className="w-full h-72 sm:h-84 rounded-2xl border border-stone-200 overflow-hidden shadow-inner z-0 bg-stone-100"
        style={{ minHeight: '300px' }}
      />

      <div className="flex items-center justify-between text-[11px] text-stone-500 italic">
        <span>* Nhấn vào bản đồ Google Maps hoặc kéo ghim tròn màu xanh lá để cập nhật tọa độ xuất phát tính cước.</span>
        <span className="font-sans not-italic text-stone-400">Hỗ trợ chế độ Vệ tinh & Đường phố</span>
      </div>
    </div>
  );
};