import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Place } from '../../types';
import { Phone, Navigation, Star, Key, ExternalLink } from 'lucide-react';

interface InteractiveMapProps {
  places: Place[];
  userLocation: { lat: number; lng: number } | null;
  onSelectPlace: (place: Place) => void;
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  places,
  userLocation,
  onSelectPlace,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const [showApiGuide, setShowApiGuide] = useState(false);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Destroy existing if any
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    // Default center: User location or first place or Seoul City Hall
    const initialLat = userLocation?.lat || (places.length > 0 ? places[0].lat : 37.5665);
    const initialLng = userLocation?.lng || (places.length > 0 ? places[0].lng : 126.978);

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: userLocation ? 14 : 12,
      scrollWheelZoom: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    markersLayerRef.current = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update markers when places or userLocation change
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layer = markersLayerRef.current;
    if (!map || !layer) return;

    layer.clearLayers();

    // Add user GPS pin if available
    if (userLocation) {
      const userIcon = L.divIcon({
        className: 'custom-user-marker',
        html: `
          <div style="background-color: #0d9488; color: white; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 14px; border: 3px solid white; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.2);">
            📍
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 28],
      });

      L.marker([userLocation.lat, userLocation.lng], { icon: userIcon })
        .addTo(layer)
        .bindPopup(`<strong>내 현재 GPS 위치</strong>`);
    }

    const bounds = L.latLngBounds([]);
    if (userLocation) bounds.extend([userLocation.lat, userLocation.lng]);

    // Add place pins
    places.forEach((place) => {
      const isEmergency = place.category === 'hospital_24h' || place.isEmergency;
      const bgColor = isEmergency ? '#e11d48' : '#0d9488';
      const iconEmoji = isEmergency
        ? '🚨'
        : place.category === 'park'
        ? '🌳'
        : place.category === 'cafe'
        ? '☕'
        : place.category === 'stay'
        ? '🏡'
        : '🐾';

      const customIcon = L.divIcon({
        className: 'custom-place-marker',
        html: `
          <div style="background-color: ${bgColor}; color: white; width: 32px; height: 32px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 16px; border: 2px solid white; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.3); transform: translateY(-50%);">
            ${iconEmoji}
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const popupContent = document.createElement('div');
      popupContent.style.minWidth = '200px';
      popupContent.style.fontFamily = 'Pretendard, sans-serif';
      popupContent.innerHTML = `
        <div style="padding: 2px;">
          <div style="font-size: 10px; font-weight: bold; color: ${bgColor}; margin-bottom: 2px;">
            ${isEmergency ? '24시 응급 동물병원' : place.city + ' ' + place.district}
          </div>
          <div style="font-size: 13px; font-weight: bold; color: #1c1917; margin-bottom: 4px;">
            ${place.name}
          </div>
          <div style="font-size: 11px; color: #78716c; margin-bottom: 6px;">
            ${place.address}
          </div>
          <div style="font-size: 11px; color: #0d9488; font-weight: 600; margin-bottom: 8px;">
            ★ ${place.rating} (${place.reviewCount})
          </div>
          <div style="display: flex; gap: 6px;">
            <a href="tel:${place.phone}" style="flex: 1; text-align: center; background: #0d9488; color: white; padding: 5px; border-radius: 8px; font-size: 11px; text-decoration: none; font-weight: bold;">
              전화 연결
            </a>
            <a href="https://map.kakao.com/link/search/${encodeURIComponent(place.name)}" target="_blank" rel="noopener noreferrer" style="flex: 1; text-align: center; background: #f5f5f4; color: #292524; padding: 5px; border-radius: 8px; font-size: 11px; text-decoration: none; font-weight: bold;">
              카카오맵 길찾기
            </a>
          </div>
        </div>
      `;

      const marker = L.marker([place.lat, place.lng], { icon: customIcon })
        .addTo(layer)
        .bindPopup(popupContent);

      bounds.extend([place.lat, place.lng]);
    });

    if (places.length > 0) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
    }
  }, [places, userLocation]);

  return (
    <div className="space-y-3">
      {/* Map Header with API Guide Toggle */}
      <div className="flex items-center justify-between text-xs px-1">
        <span className="text-stone-600 font-medium">
          실시간 지도 표시: <strong>{places.length}개소</strong> (드래그 및 확대/축소 가능)
        </span>
        <button
          onClick={() => setShowApiGuide(!showApiGuide)}
          className="text-stone-500 hover:text-teal-700 flex items-center gap-1 font-semibold"
        >
          <Key className="w-3.5 h-3.5 text-amber-600" />
          <span>카카오/네이버 지도 API 설정 안내</span>
        </button>
      </div>

      {/* Map Container */}
      <div className="relative rounded-3xl overflow-hidden border border-stone-200 shadow-md">
        <div ref={mapContainerRef} className="w-full h-96 z-10" />

        {/* Legend */}
        <div className="absolute bottom-3 left-3 z-20 bg-white/95 backdrop-blur-md px-3 py-2 rounded-2xl shadow-md border border-stone-200 text-[11px] flex items-center gap-3">
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-rose-600 inline-block"></span>
            <span className="font-bold text-stone-700">24시 응급병원</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-teal-600 inline-block"></span>
            <span className="font-bold text-stone-700">공원·카페·숙소</span>
          </div>
        </div>
      </div>

      {/* Map API Key Configuration Modal / Drawer */}
      {showApiGuide && (
        <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 text-xs space-y-2 animate-in fade-in">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-stone-900 flex items-center gap-1.5">
              <span>카카오맵 / 네이버 지도 API 연동 안내</span>
            </h4>
            <button
              onClick={() => setShowApiGuide(false)}
              className="text-stone-400 hover:text-stone-600 text-xs"
            >
              닫기 ✕
            </button>
          </div>
          <p className="text-stone-600 leading-relaxed">
            현재 멍라이프는 API 키 발급 없이 전 세계에서 안정적으로 작동하는 <strong>OpenStreetMap 고정밀 타일 및 카카오맵 실시간 길찾기 링크</strong>를 즉시 제공하고 있습니다.
          </p>
          <div className="p-3 bg-white rounded-xl border border-stone-200 space-y-1 text-[11px] text-stone-700">
            <p className="font-bold text-teal-800">📌 상용 카카오맵 Javascript SDK를 교체 적용하려면:</p>
            <ol className="list-decimal pl-4 space-y-0.5">
              <li>카카오 개발자 콘솔(developers.kakao.com)에서 앱 등록 후 JavaScript 키 발급</li>
              <li>플랫폼 사이트 도메인에 Cloud Run 앱 도메인 등록</li>
              <li>`index.html` 상단에 `dapi.kakao.com/v2/maps/sdk.js?appkey=...` 스크립트 추가</li>
            </ol>
          </div>
        </div>
      )}
    </div>
  );
};
