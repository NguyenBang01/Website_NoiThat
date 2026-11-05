import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Navigation, Loader2, Check, AlertCircle, Search, Layers } from 'lucide-react';

interface ShippingMapPickerProps {
  lat: number | null;
  lng: number | null;
  addressText?: string;
  onChange: (lat: number, lng: number) => void;
  className?: string;
}

declare global {
  interface Window {
    google?: any;
  }
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
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const [isLocating, setIsLocating] = useState(false);
  const [geoError, setGeoError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [mapEngine, setMapEngine] = useState<'google' | 'leaflet'>('google');

  // Mặc định là TP. Hồ Chí Minh nếu chưa có tọa độ
  const currentLat = lat || 10.7769;
  const currentLng = lng || 106.7009;

  const apiKey = (import.meta.env.PUBLIC_GOOGLE_MAPS_API_KEY as string) || '';

  // 1. Khởi tạo Google Maps
  useEffect(() => {
    let isCancelled = false;

    const loadGoogleMaps = async () => {
      if (typeof window === 'undefined') return;

      if (!window.google?.maps) {
        await new Promise<void>((resolve, reject) => {
          if (document.getElementById('google-maps-storefront-sdk')) {
            const checkTimer = setInterval(() => {
              if (window.google?.maps) {
                clearInterval(checkTimer);
                resolve();
              }
            }, 100);
            return;
          }

          const script = document.createElement('script');
          script.id = 'google-maps-storefront-sdk';
          const keyParam = apiKey ? `&key=${encodeURIComponent(apiKey)}` : '';
          script.src = `https://maps.googleapis.com/maps/api/js?v=weekly${keyParam}&libraries=places,geometry&language=vi`;
          script.async = true;
          script.defer = true;
          script.onload = () => resolve();
          script.onerror = () => reject(new Error('Lỗi tải Google Maps.'));
          document.head.appendChild(script);
        }).catch((err) => {
          console.warn('Google Maps không khả dụng, chuyển sang chế độ dự phòng:', err);
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
          zoom: 16,
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

        // Tạo custom marker giao hàng màu xanh ngọc (Emerald) sang trọng
        const marker = new window.google.maps.Marker({
          position: center,
          map,
          draggable: true,
          animation: window.google.maps.Animation.DROP,
          title: 'Địa chỉ giao hàng của bạn',
          icon: {
            path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
            fillColor: '#047857',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2,
            scale: 2,
            anchor: new window.google.maps.Point(12, 22),
          },
        });

        // Kéo thả ghim để chọn điểm giao hàng
        marker.addListener('dragend', () => {
          const pos = marker.getPosition();
          if (pos) {
            const newLat = Number(pos.lat().toFixed(6));
            const newLng = Number(pos.lng().toFixed(6));
            onChangeRef.current(newLat, newLng);
          }
        });

        // Bấm trực tiếp vào bản đồ để chuyển ghim
        map.addListener('click', (e: any) => {
          if (!e.latLng) return;
          const newLat = Number(e.latLng.lat().toFixed(6));
          const newLng = Number(e.latLng.lng().toFixed(6));
          marker.setPosition(e.latLng);
          onChangeRef.current(newLat, newLng);
        });

        mapInstanceRef.current = map;
        markerRef.current = marker;
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
  }, [mapEngine]);

  // Cập nhật vị trí ghim khi props lat/lng thay đổi từ bên ngoài
  useEffect(() => {
    if (markerRef.current && mapInstanceRef.current && window.google?.maps && mapEngine === 'google' && lat && lng) {
      const pos = markerRef.current.getPosition();
      if (pos) {
        const diffLat = Math.abs(pos.lat() - lat);
        const diffLng = Math.abs(pos.lng() - lng);
        if (diffLat > 0.0001 || diffLng > 0.0001) {
          const newLatLng = new window.google.maps.LatLng(lat, lng);
          markerRef.current.setPosition(newLatLng);
          mapInstanceRef.current.panTo(newLatLng);
        }
      }
    }
  }, [lat, lng, mapEngine]);

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

      const marker = L.marker([currentLat, currentLng], { draggable: true }).addTo(map);
      marker.on('dragend', () => {
        const p = marker.getLatLng();
        onChangeRef.current(Number(p.lat.toFixed(6)), Number(p.lng.toFixed(6)));
      });

      map.on('click', (e: any) => {
        marker.setLatLng(e.latlng);
        onChangeRef.current(Number(e.latlng.lat.toFixed(6)), Number(e.latlng.lng.toFixed(6)));
      });

      mapInstanceRef.current = map;
      markerRef.current = marker;
    });

    return () => {
      isCancelled = true;
    };
  }, [mapEngine]);

  // Tìm kiếm địa chỉ trên Google Maps
  const handleSearchAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setGeoError('');

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

            if (mapInstanceRef.current && markerRef.current) {
              markerRef.current.setPosition(loc);
              mapInstanceRef.current.setCenter(loc);
              mapInstanceRef.current.setZoom(16);
            }
          } else {
            setGeoError('Không tìm thấy địa chỉ này trên bản đồ Google Maps.');
          }
        });
      } else {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery.trim())}&countrycodes=vn&limit=1`);
        const data = await res.json();
        setIsSearching(false);
        if (data && data[0]) {
          const newLat = Number(parseFloat(data[0].lat).toFixed(6));
          const newLng = Number(parseFloat(data[0].lon).toFixed(6));
          onChange(newLat, newLng);
          if (mapInstanceRef.current && markerRef.current && window.google?.maps) {
            const pos = new window.google.maps.LatLng(newLat, newLng);
            markerRef.current.setPosition(pos);
            mapInstanceRef.current.panTo(pos);
          }
        } else {
          setGeoError('Không tìm thấy địa chỉ.');
        }
      }
    } catch {
      setIsSearching(false);
      setGeoError('Lỗi tra cứu vị trí địa chỉ.');
    }
  };

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

        if (mapInstanceRef.current && markerRef.current && window.google?.maps && mapEngine === 'google') {
          const pos = new window.google.maps.LatLng(newLat, newLng);
          markerRef.current.setPosition(pos);
          mapInstanceRef.current.panTo(pos);
          mapInstanceRef.current.setZoom(16);
        }
        setIsLocating(false);
      },
      (err) => {
        setIsLocating(false);
        if (err.code === err.PERMISSION_DENIED) {
          setGeoError('Bạn đã từ chối quyền truy cập vị trí. Vui lòng kéo ghim trên Google Maps để chọn.');
        } else {
          setGeoError('Không thể lấy vị trí hiện tại. Vui lòng bấm chọn trên bản đồ.');
        }
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  return (
    <div className={`space-y-2.5 ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <label className="text-xs font-semibold text-stone-800 flex items-center gap-1.5">
          <MapPin className="w-4 h-4 text-emerald-700" />
          <span>Vị trí giao hàng trên bản đồ Google Maps (Ghim điểm chính xác)</span>
          <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">
            Google Maps
          </span>
        </label>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Nút chuyển đổi loại bản đồ nếu muốn */}
          <button
            type="button"
            onClick={() => setMapEngine(mapEngine === 'google' ? 'leaflet' : 'google')}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-stone-600 bg-stone-100 hover:bg-stone-200 rounded-lg transition cursor-pointer"
            title="Đổi nguồn bản đồ"
          >
            <Layers className="w-3 h-3 text-stone-500" />
            <span>{mapEngine === 'google' ? 'OpenStreetMap' : 'Google Maps'}</span>
          </button>

          <button
            type="button"
            onClick={handleUseCurrentLocation}
            disabled={isLocating}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 transition-colors cursor-pointer"
          >
            {isLocating ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-700" />
            ) : (
              <Navigation className="w-3.5 h-3.5 text-emerald-700" />
            )}
            <span>Dùng vị trí hiện tại của tôi</span>
          </button>
        </div>
      </div>

      {/* Tìm địa chỉ trên bản đồ */}
      <form onSubmit={handleSearchAddress} className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm số nhà, tên đường trên Google Maps..."
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-stone-200 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 bg-white"
          />
          <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-2.5" />
        </div>
        <button
          type="submit"
          disabled={isSearching || !searchQuery.trim()}
          className="px-3 py-1.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 rounded-xl transition cursor-pointer shrink-0"
        >
          {isSearching ? 'Đang tìm...' : 'Tìm ghim'}
        </button>
      </form>

      {geoError && (
        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 animate-in fade-in">
          <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
          <span>{geoError}</span>
        </div>
      )}

      {/* Container bản đồ Google Maps */}
      <div className="relative rounded-2xl overflow-hidden border border-stone-200 shadow-2xs">
        <div ref={mapContainerRef} className="h-64 sm:h-72 w-full z-10 bg-stone-100" />

        {/* Hướng dẫn thao tác ghim */}
        <div className="absolute bottom-2 left-2 z-20 pointer-events-none bg-stone-900/80 backdrop-blur-xs text-white text-[10px] px-2.5 py-1 rounded-md flex items-center gap-1.5 shadow-xs">
          <Check className="w-3 h-3 text-emerald-400" />
          <span>Bấm hoặc kéo ghim xanh trên Google Maps để điều chỉnh điểm giao hàng</span>
        </div>
      </div>

      {lat && lng && (
        <div className="text-[11px] text-stone-500 font-mono flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span>Tọa độ đã chọn:</span>
            <span className="bg-stone-100 px-2 py-0.5 rounded text-stone-800 font-semibold border border-stone-200">
              {lat.toFixed(5)}, {lng.toFixed(5)}
            </span>
          </div>
          <span className="text-stone-400 not-italic font-sans text-[10px]">
            Hỗ trợ xem Vệ tinh & Đường phố
          </span>
        </div>
      )}
    </div>
  );
};