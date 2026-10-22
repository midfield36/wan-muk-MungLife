import React, { useState, useEffect, useMemo } from 'react';
import { KoreanRegion, PlaceCategory, Place, PlaceReview } from '../../types';
import { KOREAN_REGIONS } from '../../data/koreanRegions';
import { fetchPlaces, fetchPlaceReviews, savePlaceReview } from '../../services/dbService';
import { useAuth } from '../../firebase/authContext';
import { InteractiveMap } from './InteractiveMap';
import {
  MapPin,
  Search,
  Filter,
  Phone,
  Navigation,
  Star,
  Clock,
  Car,
  Dog as DogIcon,
  CheckCircle2,
  AlertCircle,
  Heart,
  Share2,
  Layers,
  Map as MapIcon,
  List,
  Plus,
  Compass,
} from 'lucide-react';

interface PlacesScreenProps {
  selectedRegion: KoreanRegion;
  onSelectRegion: (reg: KoreanRegion) => void;
  onOpenAuth: () => void;
}

export const PlacesScreen: React.FC<PlacesScreenProps> = ({
  selectedRegion,
  onSelectRegion,
  onOpenAuth,
}) => {
  const { isLoggedIn, userProfile } = useAuth();
  const [places, setPlaces] = useState<Place[]>([]);
  const [category, setCategory] = useState<PlaceCategory>('all');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('전체');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [filterLargeDog, setFilterLargeDog] = useState(false);
  const [filterParking, setFilterParking] = useState(false);
  const [filterNightCare, setFilterNightCare] = useState(false);
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('munglife_fav_places') || '[]');
    } catch {
      return [];
    }
  });

  // User location GPS
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  // Review Modal State
  const [reviewModalPlace, setReviewModalPlace] = useState<Place | null>(null);
  const [reviewsList, setReviewsList] = useState<PlaceReview[]>([]);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewContent, setReviewContent] = useState('');
  const [reviewDogBreed, setReviewDogBreed] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  useEffect(() => {
    async function load() {
      const data = await fetchPlaces();
      setPlaces(data);
    }
    load();
  }, []);

  // Sync districts when region changes
  const districtList = useMemo(() => {
    const r = KOREAN_REGIONS.find(reg => reg.name === selectedRegion);
    return r ? r.districts : ['전체'];
  }, [selectedRegion]);

  useEffect(() => {
    setSelectedDistrict('전체');
  }, [selectedRegion]);

  // Request GPS
  const handleRequestLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('이 브라우저는 위치 서비스를 지원하지 않습니다.');
      return;
    }
    setIsLocating(true);
    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setIsLocating(false);
      },
      (error) => {
        setIsLocating(false);
        if (error.code === error.PERMISSION_DENIED) {
          setLocationError('위치 권한이 거부되었습니다. 아래에서 지역/시군구를 직접 선택해 검색하세요.');
        } else {
          setLocationError('위치 정보를 가져올 수 없습니다. 지역 선택 기능을 이용해 주세요.');
        }
      },
      { timeout: 8000 }
    );
  };

  // Distance calculator (Haversine Formula)
  const calculateDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radius of the Earth in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Toggle favorite
  const toggleFavorite = (placeId: string) => {
    const next = favorites.includes(placeId)
      ? favorites.filter(id => id !== placeId)
      : [...favorites, placeId];
    setFavorites(next);
    localStorage.setItem('munglife_fav_places', JSON.stringify(next));
  };

  // Open review modal
  const openReviews = async (place: Place) => {
    setReviewModalPlace(place);
    const revs = await fetchPlaceReviews(place.id);
    setReviewsList(revs);
  };

  // Submit review
  const handleAddReview = async () => {
    if (!reviewModalPlace) return;
    if (!isLoggedIn) {
      onOpenAuth();
      return;
    }
    if (!reviewContent.trim()) {
      alert('후기 내용을 입력해 주세요.');
      return;
    }
    setIsSubmittingReview(true);
    try {
      const newRev = await savePlaceReview({
        placeId: reviewModalPlace.id,
        userId: userProfile?.uid || 'user',
        userName: userProfile?.displayName || '보호자',
        userPhoto: userProfile?.photoURL,
        dogBreed: reviewDogBreed || '반려견',
        rating: reviewRating,
        content: reviewContent.trim(),
        visitDate: new Date().toISOString().split('T')[0],
      });
      setReviewsList([newRev, ...reviewsList]);
      setReviewContent('');
      setReviewDogBreed('');
      alert('후기가 성공적으로 등록되었습니다!');
    } catch (e) {
      console.error(e);
      alert('후기 저장 중 오류가 발생했습니다.');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Filtered places
  const filteredPlaces = useMemo(() => {
    return places.filter(place => {
      // Category filter
      if (category !== 'all' && place.category !== category) {
        if (category === 'hospital_24h' && !place.isEmergency && place.category !== 'hospital_24h') {
          return false;
        }
      }
      // Region filter
      if (selectedRegion !== '전체' && !place.city.includes(selectedRegion)) {
        return false;
      }
      // District filter
      if (selectedDistrict !== '전체' && !place.district.includes(selectedDistrict)) {
        return false;
      }
      // Large dog filter
      if (filterLargeDog && !place.largeDogAllowed) {
        return false;
      }
      // Parking filter
      if (filterParking && !place.parkingAvailable) {
        return false;
      }
      // Night care
      if (filterNightCare && !place.nightCare && !place.isEmergency) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          place.name.toLowerCase().includes(q) ||
          place.address.toLowerCase().includes(q) ||
          place.description.toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    }).map(p => {
      let distanceKm: number | null = null;
      if (userLocation) {
        distanceKm = calculateDistanceKm(userLocation.lat, userLocation.lng, p.lat, p.lng);
      }
      return { ...p, calculatedDistance: distanceKm };
    }).sort((a, b) => {
      if (a.calculatedDistance !== null && b.calculatedDistance !== null) {
        return a.calculatedDistance - b.calculatedDistance;
      }
      return b.rating - a.rating;
    });
  }, [
    places,
    category,
    selectedRegion,
    selectedDistrict,
    filterLargeDog,
    filterParking,
    filterNightCare,
    searchQuery,
    userLocation,
  ]);

  const categories = [
    { id: 'all', label: '전체', icon: '📍' },
    { id: 'hospital_24h', label: '24시 동물병원', icon: '🚨' },
    { id: 'hospital_general', label: '일반병원', icon: '🏥' },
    { id: 'hospital_night', label: '야간·휴일병원', icon: '🌙' },
    { id: 'park', label: '산책로·공원', icon: '🌳' },
    { id: 'cafe', label: '동반 카페', icon: '☕' },
    { id: 'restaurant', label: '동반 식당', icon: '🍽️' },
    { id: 'stay', label: '동반 숙소', icon: '🏡' },
    { id: 'salon', label: '미용·스파', icon: '✂️' },
    { id: 'playground', label: '놀이터·운동장', icon: '🎾' },
  ];

  return (
    <div className="space-y-5 pb-24">
      {/* Top Banner & Notice */}
      <div className="p-4 rounded-3xl bg-linear-to-r from-teal-50 to-emerald-50 border border-teal-200 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-extrabold text-stone-900 tracking-tight flex items-center gap-2">
              <span>내 주변 반려견 안심 장소 찾기</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-teal-600 text-white font-bold">
                전국 검증 정보
              </span>
            </h1>
            <p className="text-xs text-stone-600 mt-1">
              실제 등록된 병원, 카페, 산책로입니다. 로그인 없이도 전국 장소를 자유롭게 검색할 수 있습니다.
            </p>
          </div>

          <button
            onClick={handleRequestLocation}
            disabled={isLocating}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-xs transition-transform active:scale-95 shrink-0"
          >
            <Compass className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
            <span>{isLocating ? '위치 측정 중...' : '내 GPS 위치로 찾기'}</span>
          </button>
        </div>

        {locationError && (
          <div className="mt-2.5 p-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{locationError}</span>
          </div>
        )}

        {userLocation && (
          <div className="mt-2.5 p-2 rounded-xl bg-teal-100/70 border border-teal-200 text-teal-900 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-teal-700 shrink-0" />
            <span>GPS 위치 수신 성공! 가까운 거리 순서로 정렬되었습니다.</span>
          </div>
        )}
      </div>

      {/* Disclaimers Bar */}
      <div className="p-3 rounded-2xl bg-amber-50/80 border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
        <p className="leading-tight">
          <strong>방문 전 확인 안내:</strong> 반려견 동반 조건(체중·견종 규정), 영업시간 및 야간응급 진료 여부는 병원·업장 사정에 따라 변동될 수 있으므로 출발 전 꼭 전화로 확인해 주세요.
        </p>
      </div>

      {/* Search Bar & Region Filters */}
      <div className="p-4 rounded-3xl bg-white border border-stone-200 shadow-xs space-y-3">
        {/* Keyword Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="장소명, 주소(예: 마포, 분당, 해운대), 시설 검색"
            className="w-full pl-9 pr-4 py-2.5 rounded-2xl bg-stone-50 border border-stone-200 focus:outline-teal-500 focus:bg-white text-xs font-medium text-stone-800 placeholder:text-stone-400 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-stone-400 hover:text-stone-600 p-1"
            >
              ✕
            </button>
          )}
        </div>

        {/* Region & District Selectors */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {/* Region */}
          <div>
            <label className="block text-[11px] font-bold text-stone-500 mb-1">시/도</label>
            <select
              value={selectedRegion}
              onChange={(e) => onSelectRegion(e.target.value as KoreanRegion)}
              className="w-full py-2 px-2.5 rounded-xl bg-stone-50 border border-stone-200 text-xs font-semibold text-stone-800 focus:outline-teal-500"
            >
              {KOREAN_REGIONS.map(r => (
                <option key={r.name} value={r.name}>{r.name}</option>
              ))}
            </select>
          </div>

          {/* District */}
          <div>
            <label className="block text-[11px] font-bold text-stone-500 mb-1">시/군/구</label>
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="w-full py-2 px-2.5 rounded-xl bg-stone-50 border border-stone-200 text-xs font-semibold text-stone-800 focus:outline-teal-500"
            >
              {districtList.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          {/* Feature toggles */}
          <div className="col-span-2 flex items-center gap-1.5 flex-wrap pt-4">
            <button
              onClick={() => setFilterLargeDog(!filterLargeDog)}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                filterLargeDog
                  ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                  : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
              }`}
            >
              대형견 가능
            </button>
            <button
              onClick={() => setFilterParking(!filterParking)}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                filterParking
                  ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                  : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
              }`}
            >
              주차 가능
            </button>
            <button
              onClick={() => setFilterNightCare(!filterNightCare)}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                filterNightCare
                  ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                  : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
              }`}
            >
              야간/응급진료
            </button>
          </div>
        </div>
      </div>

      {/* Category Pills Slider */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setCategory(cat.id as PlaceCategory)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all shadow-2xs ${
              category === cat.id
                ? 'bg-stone-900 text-white shadow-md'
                : 'bg-white text-stone-700 border border-stone-200 hover:border-teal-400 hover:bg-teal-50/50'
            }`}
          >
            <span>{cat.icon}</span>
            <span>{cat.label}</span>
          </button>
        ))}
      </div>

      {/* View Switcher Bar */}
      <div className="flex items-center justify-between px-1">
        <div className="text-xs font-bold text-stone-700">
          검색 결과 <span className="text-teal-700">{filteredPlaces.length}</span>곳
        </div>

        <div className="flex items-center gap-1 p-1 rounded-xl bg-stone-100 border border-stone-200">
          <button
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'list'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            <List className="w-3.5 h-3.5" />
            <span>목록형</span>
          </button>
          <button
            onClick={() => setViewMode('map')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'map'
                ? 'bg-white text-teal-800 shadow-xs'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            <MapIcon className="w-3.5 h-3.5" />
            <span>지도보기</span>
          </button>
        </div>
      </div>

      {/* Real Interactive Map View */}
      {viewMode === 'map' && (
        <InteractiveMap
          places={filteredPlaces}
          userLocation={userLocation}
          onSelectPlace={openReviews}
        />
      )}

      {/* Places List Cards */}
      {filteredPlaces.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredPlaces.map(place => (
            <div
              key={place.id}
              className="p-4 rounded-3xl bg-white border border-stone-200 hover:border-teal-400 hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                {/* Image & Badges */}
                <div className="relative h-44 rounded-2xl overflow-hidden bg-stone-100 mb-3">
                  <img
                    src={place.photoUrl}
                    alt={place.name}
                    className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                  />
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 flex-wrap">
                    <span className="px-2.5 py-1 rounded-xl bg-black/70 backdrop-blur-md text-white text-[10px] font-bold">
                      {place.category === 'hospital_24h'
                        ? '24시 응급병원'
                        : place.category === 'hospital_night'
                        ? '야간진료'
                        : place.category === 'park'
                        ? '산책로/공원'
                        : place.category === 'cafe'
                        ? '반려견 카페'
                        : place.category === 'stay'
                        ? '반려견 숙소'
                        : place.category === 'salon'
                        ? '미용/스파'
                        : '반려견 시설'}
                    </span>
                    {place.isEmergency && (
                      <span className="px-2 py-0.5 rounded-xl bg-rose-600 text-white text-[10px] font-bold">
                        응급수술 가능
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => toggleFavorite(place.id)}
                    className="absolute top-2.5 right-2.5 p-2 rounded-xl bg-white/90 backdrop-blur-md text-stone-700 hover:text-rose-600 transition-colors shadow-xs"
                  >
                    <Heart
                      className={`w-4 h-4 ${
                        favorites.includes(place.id) ? 'fill-rose-600 text-rose-600' : ''
                      }`}
                    />
                  </button>
                </div>

                {/* Title & Rating */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-extrabold text-stone-900 text-base">{place.name}</h3>
                    <p className="text-xs text-stone-500 mt-0.5">{place.address}</p>
                  </div>
                  <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-xl border border-amber-200 shrink-0">
                    <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                    <span className="text-xs font-bold text-amber-900">{place.rating}</span>
                  </div>
                </div>

                {/* Features & Distance */}
                <div className="mt-3 flex items-center gap-2 flex-wrap text-[11px] text-stone-600">
                  {place.calculatedDistance != null && (
                    <span className="font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-lg border border-teal-200">
                      내 위치에서 {place.calculatedDistance.toFixed(1)} km
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-stone-400" />
                    {place.businessHours}
                  </span>
                  {place.parkingAvailable && (
                    <span className="flex items-center gap-0.5 text-stone-500">
                      <Car className="w-3.5 h-3.5 text-stone-400" /> 주차가능
                    </span>
                  )}
                  {place.largeDogAllowed && (
                    <span className="flex items-center gap-0.5 text-stone-500">
                      <DogIcon className="w-3.5 h-3.5 text-stone-400" /> 대형견가능
                    </span>
                  )}
                </div>

                {/* Description & Dog Policy */}
                <p className="text-xs text-stone-600 mt-2.5 leading-relaxed bg-stone-50 p-2.5 rounded-xl">
                  {place.description}
                </p>

                {place.dogPolicy && (
                  <p className="text-[11px] text-teal-800 mt-1.5 font-medium">
                    🐾 동반 규정: {place.dogPolicy}
                  </p>
                )}
              </div>

              {/* Action buttons */}
              <div className="mt-4 pt-3 border-t border-stone-100 grid grid-cols-3 gap-2">
                <a
                  href={`tel:${place.phone}`}
                  className="py-2 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold text-xs flex items-center justify-center gap-1 transition-colors"
                >
                  <Phone className="w-3.5 h-3.5 text-teal-600" />
                  <span>전화하기</span>
                </a>

                <a
                  href={`https://map.kakao.com/link/search/${encodeURIComponent(place.name)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs flex items-center justify-center gap-1 transition-colors"
                >
                  <Navigation className="w-3.5 h-3.5 text-stone-600" />
                  <span>길찾기</span>
                </a>

                <button
                  onClick={() => openReviews(place)}
                  className="py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs flex items-center justify-center gap-1 transition-colors"
                >
                  <Star className="w-3.5 h-3.5 text-amber-500" />
                  <span>후기 ({place.reviewCount})</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-8 rounded-3xl bg-white border border-stone-200 text-center space-y-2">
          <span className="text-3xl">🔍</span>
          <h3 className="font-bold text-stone-800 text-sm">일치하는 장소를 찾지 못했습니다</h3>
          <p className="text-xs text-stone-500 max-w-sm mx-auto">
            선택하신 필터 조건이나 지역을 '전체'로 넓혀 다시 검색해 보세요.
          </p>
          <button
            onClick={() => {
              setCategory('all');
              setSelectedDistrict('전체');
              setSearchQuery('');
              setFilterLargeDog(false);
              setFilterParking(false);
              setFilterNightCare(false);
            }}
            className="mt-3 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-xs"
          >
            검색 필터 초기화
          </button>
        </div>
      )}

      {/* Place Review Modal */}
      {reviewModalPlace && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[85vh] flex flex-col shadow-2xl border border-stone-200 overflow-hidden">
            <div className="p-4 border-b border-stone-100 flex items-center justify-between bg-stone-50">
              <div>
                <h3 className="font-bold text-stone-900 text-sm">{reviewModalPlace.name} 후기</h3>
                <p className="text-xs text-stone-500">실제 방문 보호자의 솔직한 후기</p>
              </div>
              <button
                onClick={() => setReviewModalPlace(null)}
                className="w-7 h-7 rounded-full bg-stone-200 text-stone-600 flex items-center justify-center text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4">
              {/* Write Review Form */}
              <div className="p-4 rounded-2xl bg-teal-50/50 border border-teal-100 space-y-3">
                <h4 className="font-bold text-xs text-stone-900 flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5 text-teal-600" />
                  <span>방문 후기 작성하기</span>
                </h4>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-stone-600">별점:</span>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setReviewRating(star)}
                        className="text-lg focus:outline-none"
                      >
                        <Star
                          className={`w-5 h-5 ${
                            star <= reviewRating
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-stone-300'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <input
                  type="text"
                  placeholder="함께 방문한 반려견 품종 (예: 말티즈, 골든 리트리버)"
                  value={reviewDogBreed}
                  onChange={(e) => setReviewDogBreed(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-stone-200 text-xs text-stone-800"
                />

                <textarea
                  rows={3}
                  placeholder="시설의 청결도, 직원 친절도, 주차 및 반려견 편의시설 정보를 적어주세요."
                  value={reviewContent}
                  onChange={(e) => setReviewContent(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-stone-200 text-xs text-stone-800 focus:outline-teal-500"
                />

                <button
                  onClick={handleAddReview}
                  disabled={isSubmittingReview}
                  className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-xs transition-colors"
                >
                  {isSubmittingReview ? '등록 중...' : '후기 등록하기'}
                </button>
              </div>

              {/* Reviews List */}
              <div className="space-y-2.5">
                <h4 className="font-bold text-xs text-stone-700">
                  전체 후기 ({reviewsList.length})
                </h4>
                {reviewsList.length > 0 ? (
                  reviewsList.map(rev => (
                    <div
                      key={rev.id}
                      className="p-3 rounded-2xl bg-stone-50 border border-stone-100 space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-stone-800">{rev.userName}</span>
                          <span className="text-[10px] text-teal-700 px-1.5 py-0.5 rounded bg-teal-50 font-semibold">
                            {rev.dogBreed}
                          </span>
                        </div>
                        <div className="flex items-center text-amber-500 text-xs font-bold">
                          {'★'.repeat(rev.rating)}
                        </div>
                      </div>
                      <p className="text-xs text-stone-600 leading-relaxed">{rev.content}</p>
                      <span className="text-[10px] text-stone-400 block">{rev.visitDate}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-stone-400 text-center py-4">
                    아직 등록된 후기가 없습니다. 첫 번째 후기를 남겨보세요!
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
