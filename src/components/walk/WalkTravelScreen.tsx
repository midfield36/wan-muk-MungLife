import React, { useState, useEffect, useRef } from 'react';
import { KoreanRegion, WalkRecord, WalkPoint, TravelChecklist, TravelChecklistItem, Place, Dog } from '../../types';
import { useAuth } from '../../firebase/authContext';
import {
  fetchWalks,
  saveWalk,
  removeWalk,
  fetchTravelChecklist,
  saveTravelChecklist,
  fetchPlaces,
  fetchDogs,
} from '../../services/dbService';
import {
  Footprints,
  Play,
  Pause,
  Square,
  MapPin,
  CheckSquare,
  Square as SquareIcon,
  Plus,
  Trash2,
  Calendar,
  Compass,
  AlertCircle,
  Clock,
  Sparkles,
  Luggage,
  TreePine,
  Hotel,
  Coffee,
  Info,
  X,
} from 'lucide-react';

interface WalkTravelScreenProps {
  initialSubView?: string;
  selectedRegion: KoreanRegion;
  onOpenAuth: () => void;
}

export const WalkTravelScreen: React.FC<WalkTravelScreenProps> = ({
  initialSubView = 'tracker',
  selectedRegion,
  onOpenAuth,
}) => {
  const { isLoggedIn, userProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<'tracker' | 'parks' | 'travel' | 'checklist'>('tracker');

  // Walk Tracker State
  const [isWalking, setIsWalking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [distanceMeters, setDistanceMeters] = useState(0);
  const [pathPoints, setPathPoints] = useState<WalkPoint[]>([]);
  const [peeCount, setPeeCount] = useState(0);
  const [pooCount, setPooCount] = useState(0);
  const [walkMemo, setWalkMemo] = useState('');
  const [dogName, setDogName] = useState('우리강아지');
  const [userDogs, setUserDogs] = useState<Dog[]>([]);
  const [selectedDogId, setSelectedDogId] = useState<string>('');
  const [walksHistory, setWalksHistory] = useState<WalkRecord[]>([]);
  const [selectedWalkDetail, setSelectedWalkDetail] = useState<WalkRecord | null>(null);

  // Watch position id ref
  const watchIdRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Save walk modal
  const [showSaveWalkModal, setShowSaveWalkModal] = useState(false);
  const [savedWalkPhoto, setSavedWalkPhoto] = useState('');

  // Checklist state
  const [checklist, setChecklist] = useState<TravelChecklist | null>(null);
  const [newChecklistText, setNewChecklistText] = useState('');
  const [checklistCategory, setChecklistCategory] = useState<'essential' | 'health' | 'hygiene' | 'comfort'>('essential');

  // Recommended parks & travel spots
  const [allPlaces, setAllPlaces] = useState<Place[]>([]);

  useEffect(() => {
    if (initialSubView === 'tracker') setActiveTab('tracker');
    if (initialSubView === 'history') setActiveTab('tracker');
  }, [initialSubView]);

  useEffect(() => {
    async function loadData() {
      const places = await fetchPlaces();
      setAllPlaces(places);

      if (isLoggedIn && userProfile) {
        const history = await fetchWalks(userProfile.uid);
        setWalksHistory(history);

        const chk = await fetchTravelChecklist(userProfile.uid);
        setChecklist(chk);

        const dogs = await fetchDogs(userProfile.uid);
        setUserDogs(dogs);
        if (dogs.length > 0) {
          setDogName(dogs[0].name);
          setSelectedDogId(dogs[0].id);
        }
      }
    }
    loadData();
  }, [isLoggedIn, userProfile]);

  // Walk Timer Interval
  useEffect(() => {
    let timer: any = null;
    if (isWalking && !isPaused) {
      timer = setInterval(() => {
        setSeconds(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(timer);
    }
    return () => clearInterval(timer);
  }, [isWalking, isPaused]);

  // Start Walk with GPS
  const handleStartWalk = () => {
    if (!isLoggedIn) {
      onOpenAuth();
      return;
    }
    setIsWalking(true);
    setIsPaused(false);
    setSeconds(0);
    setDistanceMeters(0);
    setPathPoints([]);
    setPeeCount(0);
    setPooCount(0);
    setWalkMemo('');

    if (navigator.geolocation) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          const newPoint: WalkPoint = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            timestamp: Date.now(),
          };
          setPathPoints(prev => {
            if (prev.length > 0) {
              const last = prev[prev.length - 1];
              // Haversine approx
              const R = 6371e3;
              const φ1 = (last.lat * Math.PI) / 180;
              const φ2 = (newPoint.lat * Math.PI) / 180;
              const Δφ = ((newPoint.lat - last.lat) * Math.PI) / 180;
              const Δλ = ((newPoint.lng - last.lng) * Math.PI) / 180;
              const a =
                Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
                Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
              const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
              const d = R * c;
              if (d > 2 && d < 100) {
                setDistanceMeters(dm => Math.round(dm + d));
              }
            }
            return [...prev, newPoint];
          });
        },
        (err) => {
          console.warn('Geolocation watch error', err);
        },
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
      );
    }
  };

  const handlePauseResume = () => {
    setIsPaused(!isPaused);
  };

  const handleStopWalk = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsWalking(false);
    setIsPaused(false);
    setShowSaveWalkModal(true);
  };

  // Draw Path on Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Grid lines
    ctx.strokeStyle = '#f1f5f9';
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += 30) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += 30) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    if (pathPoints.length < 2) {
      // Draw centered idle pulse
      ctx.fillStyle = '#38B2A6';
      ctx.beginPath();
      ctx.arc(canvas.width / 2, canvas.height / 2, 8, 0, 2 * Math.PI);
      ctx.fill();
      return;
    }

    // Normalize coordinates to canvas
    const lats = pathPoints.map(p => p.lat);
    const lngs = pathPoints.map(p => p.lng);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    const latDiff = maxLat - minLat || 0.0001;
    const lngDiff = maxLng - minLng || 0.0001;

    ctx.strokeStyle = '#0d9488';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();

    pathPoints.forEach((p, idx) => {
      const x = 30 + ((p.lng - minLng) / lngDiff) * (canvas.width - 60);
      const y = canvas.height - (30 + ((p.lat - minLat) / latDiff) * (canvas.height - 60));
      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // End point marker
    const lastP = pathPoints[pathPoints.length - 1];
    const endX = 30 + ((lastP.lng - minLng) / lngDiff) * (canvas.width - 60);
    const endY = canvas.height - (30 + ((lastP.lat - minLat) / latDiff) * (canvas.height - 60));
    ctx.fillStyle = '#e11d48';
    ctx.beginPath();
    ctx.arc(endX, endY, 6, 0, 2 * Math.PI);
    ctx.fill();
  }, [pathPoints]);

  // Save Finished Walk
  const handleSaveWalkRecord = async () => {
    if (!userProfile) return;
    const durationMinutes = Math.max(1, Math.round(seconds / 60));
    const finalDistance = distanceMeters > 0 ? distanceMeters : Math.round(durationMinutes * 65); // approx fallback

    const matchedDog = userDogs.find(d => d.id === selectedDogId);
    const chosenDogName = matchedDog ? matchedDog.name : (dogName.trim() || '우리강아지');
    const chosenDogId = matchedDog ? matchedDog.id : 'dog-main';

    try {
      const saved = await saveWalk({
        dogId: chosenDogId,
        dogName: chosenDogName,
        ownerId: userProfile.uid,
        startTime: new Date(Date.now() - seconds * 1000).toISOString(),
        endTime: new Date().toISOString(),
        durationMinutes,
        distanceMeters: finalDistance,
        path: pathPoints,
        memo: walkMemo.trim() || undefined,
        photoUrl: savedWalkPhoto.trim() || undefined,
        peeCount,
        pooCount,
      });

      setWalksHistory([saved, ...walksHistory]);
      setShowSaveWalkModal(false);
      setWalkMemo('');
      setSavedWalkPhoto('');
      alert('산책 기록이 성공적으로 저장되었습니다!');
    } catch (e) {
      console.error(e);
      alert('저장 중 오류가 발생했습니다.');
    }
  };

  const handleDeleteWalk = async (walkId: string) => {
    if (!confirm('이 산책 기록을 삭제하시겠습니까?')) return;
    if (!userProfile) return;
    await removeWalk(walkId, userProfile.uid);
    setWalksHistory(walksHistory.filter(w => w.id !== walkId));
  };

  // Checklist Actions
  const handleToggleCheck = async (itemId: string) => {
    if (!checklist) return;
    const nextItems = checklist.items.map(it =>
      it.id === itemId ? { ...it, checked: !it.checked } : it
    );
    const updated = { ...checklist, items: nextItems };
    setChecklist(updated);
    await saveTravelChecklist(updated);
  };

  const handleAddChecklistItem = async () => {
    if (!newChecklistText.trim() || !checklist) return;
    const newItem: TravelChecklistItem = {
      id: `chk_${Date.now()}`,
      text: newChecklistText.trim(),
      category: checklistCategory,
      checked: false,
    };
    const updated = { ...checklist, items: [...checklist.items, newItem] };
    setChecklist(updated);
    setNewChecklistText('');
    await saveTravelChecklist(updated);
  };

  const handleDeleteChecklistItem = async (itemId: string) => {
    if (!checklist) return;
    const updated = { ...checklist, items: checklist.items.filter(it => it.id !== itemId) };
    setChecklist(updated);
    await saveTravelChecklist(updated);
  };

  // Recommended parks
  const recommendedParks = allPlaces.filter(p => p.category === 'park');
  const petTravelSpots = allPlaces.filter(p => p.category === 'stay' || p.category === 'cafe');

  return (
    <div className="space-y-5 pb-24">
      {/* Top Banner */}
      <div className="p-5 rounded-3xl bg-linear-to-r from-emerald-600 to-teal-700 text-white shadow-xl shadow-teal-900/10">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-white/20 backdrop-blur-md">
            <Footprints className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight">산책 · 여행</h1>
            <p className="text-xs text-teal-100 mt-0.5">
              실시간 GPS 산책 경로 기록, 추천 산책 코스, 반려견 여행 체크리스트
            </p>
          </div>
        </div>

        {/* 4 Tabs */}
        <div className="mt-5 grid grid-cols-4 gap-1.5 bg-black/20 p-1.5 rounded-2xl backdrop-blur-xs text-center">
          <button
            onClick={() => setActiveTab('tracker')}
            className={`py-2 px-1 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'tracker'
                ? 'bg-white text-emerald-800 shadow-md'
                : 'text-teal-100 hover:text-white'
            }`}
          >
            🦮 산책 기록
          </button>
          <button
            onClick={() => setActiveTab('parks')}
            className={`py-2 px-1 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'parks'
                ? 'bg-white text-emerald-800 shadow-md'
                : 'text-teal-100 hover:text-white'
            }`}
          >
            🌳 추천 산책로
          </button>
          <button
            onClick={() => setActiveTab('travel')}
            className={`py-2 px-1 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'travel'
                ? 'bg-white text-emerald-800 shadow-md'
                : 'text-teal-100 hover:text-white'
            }`}
          >
            🏡 동반 여행지
          </button>
          <button
            onClick={() => setActiveTab('checklist')}
            className={`py-2 px-1 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'checklist'
                ? 'bg-white text-emerald-800 shadow-md'
                : 'text-teal-100 hover:text-white'
            }`}
          >
            🎒 짐 체크리스트
          </button>
        </div>
      </div>

      {/* TAB 1: 실시간 GPS 산책 기록 */}
      {activeTab === 'tracker' && (
        <div className="space-y-4 animate-in fade-in">
          {/* Tracker Dashboard */}
          <div className="p-5 rounded-3xl bg-white border border-stone-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <h3 className="font-bold text-stone-900 text-sm">
                  {dogName}와의 실시간 산책 기록
                </h3>
              </div>
              <span className="text-[11px] text-stone-400 font-medium">GPS 기반 거리 측정</span>
            </div>

            {/* Metrics Counter */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-3 rounded-2xl bg-stone-50 border border-stone-100">
                <span className="text-[10px] text-stone-400 block font-semibold">산책 시간</span>
                <span className="text-2xl font-black font-mono text-stone-900">
                  {String(Math.floor(seconds / 60)).padStart(2, '0')}:
                  {String(seconds % 60).padStart(2, '0')}
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-stone-50 border border-stone-100">
                <span className="text-[10px] text-stone-400 block font-semibold">이동 거리</span>
                <span className="text-2xl font-black font-mono text-teal-700">
                  {(distanceMeters / 1000).toFixed(2)} <span className="text-xs font-normal">km</span>
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-stone-50 border border-stone-100">
                <span className="text-[10px] text-stone-400 block font-semibold">소변 횟수</span>
                <div className="flex items-center justify-center gap-2 mt-1">
                  <span className="text-lg font-bold text-stone-800">{peeCount}회</span>
                  {isWalking && (
                    <button
                      onClick={() => setPeeCount(c => c + 1)}
                      className="w-6 h-6 rounded-lg bg-teal-100 text-teal-800 font-bold text-xs"
                    >
                      +
                    </button>
                  )}
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-stone-50 border border-stone-100">
                <span className="text-[10px] text-stone-400 block font-semibold">배변 횟수</span>
                <div className="flex items-center justify-center gap-2 mt-1">
                  <span className="text-lg font-bold text-stone-800">{pooCount}회</span>
                  {isWalking && (
                    <button
                      onClick={() => setPooCount(c => c + 1)}
                      className="w-6 h-6 rounded-lg bg-amber-100 text-amber-800 font-bold text-xs"
                    >
                      +
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Visual Canvas Path */}
            <div className="relative rounded-2xl overflow-hidden bg-stone-50 border border-stone-200">
              <canvas
                ref={canvasRef}
                width={600}
                height={220}
                className="w-full h-44 object-cover"
              />
              <div className="absolute top-2 left-2 px-2 py-0.5 rounded-lg bg-white/80 backdrop-blur-xs text-[10px] text-stone-500 font-medium">
                {isWalking
                  ? `경로 추적 중 (포인트: ${pathPoints.length}개)`
                  : '산책을 시작하면 경로가 실시간 시각화됩니다.'}
              </div>
            </div>

            {/* Walk Control Buttons */}
            <div className="pt-2">
              {!isWalking ? (
                <button
                  onClick={handleStartWalk}
                  className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm shadow-md shadow-emerald-600/25 flex items-center justify-center gap-2 transition-transform active:scale-98"
                >
                  <Play className="w-5 h-5 fill-current" />
                  <span>산책 시작하기 (GPS 연결)</span>
                </button>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={handlePauseResume}
                    className={`py-3.5 rounded-2xl font-bold text-sm shadow-xs flex items-center justify-center gap-2 transition-colors ${
                      isPaused
                        ? 'bg-teal-600 hover:bg-teal-700 text-white'
                        : 'bg-amber-500 hover:bg-amber-600 text-white'
                    }`}
                  >
                    {isPaused ? <Play className="w-4 h-4 fill-current" /> : <Pause className="w-4 h-4" />}
                    <span>{isPaused ? '산책 재개' : '일시정지'}</span>
                  </button>

                  <button
                    onClick={handleStopWalk}
                    className="py-3.5 rounded-2xl bg-stone-900 hover:bg-black text-white font-bold text-sm shadow-xs flex items-center justify-center gap-2 transition-colors"
                  >
                    <Square className="w-4 h-4 fill-current" />
                    <span>산책 종료 및 저장</span>
                  </button>
                </div>
              )}
            </div>

            <p className="text-[11px] text-stone-400 text-center leading-normal">
              * 브라우저 특성상 화면이 꺼지면 백그라운드 위치 추적이 일시 제한될 수 있습니다. 이동 거리는 오차 보정 기술이 적용됩니다.
            </p>
          </div>

          {/* Past Walks History */}
          <div className="p-5 rounded-3xl bg-white border border-stone-200 shadow-xs space-y-3">
            <h3 className="font-bold text-stone-900 text-sm">
              지난 산책 기록 ({walksHistory.length}회)
            </h3>

            {walksHistory.length > 0 ? (
              <div className="space-y-2.5">
                {walksHistory.map(w => (
                  <div
                    key={w.id}
                    onClick={() => setSelectedWalkDetail(w)}
                    className="p-3.5 rounded-2xl bg-stone-50 hover:bg-teal-50/50 border border-stone-100 hover:border-teal-200 flex items-center justify-between gap-3 cursor-pointer transition-all"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-teal-800">{w.dogName}</span>
                        <span className="text-[11px] text-stone-400">
                          {w.startTime.split('T')[0]}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center gap-3 text-xs text-stone-600">
                        <span>⏱️ {w.durationMinutes}분</span>
                        <span>📏 {(w.distanceMeters / 1000).toFixed(2)} km</span>
                        {w.peeCount !== undefined && <span>💧 {w.peeCount}</span>}
                        {w.pooCount !== undefined && <span>💩 {w.pooCount}</span>}
                      </div>
                      {w.memo && (
                        <p className="text-[11px] text-stone-500 mt-1 italic line-clamp-1">"{w.memo}"</p>
                      )}
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteWalk(w.id);
                        }}
                        className="p-1.5 text-stone-400 hover:text-rose-600 transition-colors"
                        title="기록 삭제"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-stone-400 text-center py-4">
                아직 저장된 산책 기록이 없습니다. 산책 시작 버튼을 눌러보세요!
              </p>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: 추천 산책 장소 */}
      {activeTab === 'parks' && (
        <div className="space-y-4 animate-in fade-in">
          <div className="p-4 rounded-3xl bg-white border border-stone-200 shadow-xs">
            <h3 className="font-bold text-stone-900 text-sm">
              전국 반려견 추천 산책로 & 공원
            </h3>
            <p className="text-xs text-stone-500 mt-1">
              목줄 2m 규정 준수, 그늘 쉼터 및 급수 시설 여부가 검증된 공원입니다.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recommendedParks.map(park => (
              <div
                key={park.id}
                className="p-4 rounded-3xl bg-white border border-stone-200 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="h-40 rounded-2xl overflow-hidden bg-stone-100 mb-3">
                    <img
                      src={park.photoUrl}
                      alt={park.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <h4 className="font-extrabold text-stone-900 text-base">{park.name}</h4>
                    <span className="text-xs font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md">
                      {park.city} {park.district}
                    </span>
                  </div>
                  <p className="text-xs text-stone-500 mt-0.5">{park.address}</p>
                  <p className="text-xs text-stone-600 mt-2 bg-stone-50 p-2.5 rounded-xl leading-relaxed">
                    {park.description}
                  </p>
                  <div className="mt-2 text-[11px] font-semibold text-teal-800">
                    📜 이용 규정: {park.dogPolicy || '목줄 필수 착용 및 배변봉투 지참'}
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-stone-100 flex gap-2">
                  <a
                    href={`https://map.kakao.com/link/search/${encodeURIComponent(park.name)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-2 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold text-xs flex items-center justify-center gap-1"
                  >
                    <Compass className="w-3.5 h-3.5" />
                    <span>카카오맵 위치 확인</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: 동반 여행지 */}
      {activeTab === 'travel' && (
        <div className="space-y-4 animate-in fade-in">
          <div className="p-4 rounded-3xl bg-white border border-stone-200 shadow-xs">
            <h3 className="font-bold text-stone-900 text-sm">반려견 동반 숙소 및 명소</h3>
            <p className="text-xs text-stone-500 mt-1">
              독채 펜션, 펫 리조트, 오션뷰 카페 등 함께 떠나기 좋은 검증 여행지
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {petTravelSpots.map(spot => (
              <div
                key={spot.id}
                className="p-4 rounded-3xl bg-white border border-stone-200 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="h-40 rounded-2xl overflow-hidden bg-stone-100 mb-3">
                    <img
                      src={spot.photoUrl}
                      alt={spot.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <h4 className="font-extrabold text-stone-900 text-base">{spot.name}</h4>
                    <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
                      {spot.category === 'stay' ? '반려견 숙소' : '동반 카페'}
                    </span>
                  </div>
                  <p className="text-xs text-stone-500 mt-0.5">{spot.address}</p>
                  <p className="text-xs text-stone-600 mt-2 bg-stone-50 p-2.5 rounded-xl leading-relaxed">
                    {spot.description}
                  </p>
                  {spot.dogPolicy && (
                    <p className="text-[11px] text-teal-800 mt-1.5 font-medium">
                      🐾 동반 조건: {spot.dogPolicy}
                    </p>
                  )}
                </div>

                <div className="mt-3 pt-3 border-t border-stone-100 flex gap-2">
                  <a
                    href={`tel:${spot.phone}`}
                    className="flex-1 py-2 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold text-xs flex items-center justify-center gap-1"
                  >
                    <span>예약 문의</span>
                  </a>
                  <a
                    href={`https://map.kakao.com/link/search/${encodeURIComponent(spot.name)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs flex items-center justify-center gap-1"
                  >
                    <span>길찾기</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: 여행 준비물 체크리스트 */}
      {activeTab === 'checklist' && checklist && (
        <div className="space-y-4 animate-in fade-in">
          <div className="p-5 rounded-3xl bg-white border border-stone-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-stone-900 text-sm flex items-center gap-2">
                  <Luggage className="w-4 h-4 text-emerald-600" />
                  <span>반려견 여행 준비물 필수 체크리스트</span>
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  안전하고 편안한 여행을 위해 빠짐없이 챙겼는지 체크하세요 (자동 저장).
                </p>
              </div>

              <span className="text-xs font-bold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-xl">
                {checklist.items.filter(i => i.checked).length} / {checklist.items.length} 준비 완료
              </span>
            </div>

            {/* Add Custom Item */}
            <div className="flex gap-2 pt-2">
              <input
                type="text"
                placeholder="새 준비물 추가 (예: 휴대용 선풍기, 멀미약)"
                value={newChecklistText}
                onChange={(e) => setNewChecklistText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddChecklistItem()}
                className="flex-1 px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs"
              />
              <button
                onClick={handleAddChecklistItem}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs"
              >
                추가
              </button>
            </div>

            {/* Checklist Items */}
            <div className="pt-2 space-y-2">
              {checklist.items.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleToggleCheck(item.id)}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    item.checked
                      ? 'bg-emerald-50/50 border-emerald-200 text-emerald-900'
                      : 'bg-stone-50/70 border-stone-200 text-stone-800 hover:bg-stone-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {item.checked ? (
                      <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <SquareIcon className="w-4 h-4 text-stone-400 shrink-0" />
                    )}
                    <span
                      className={`text-xs font-medium ${
                        item.checked ? 'line-through text-stone-400' : 'text-stone-800'
                      }`}
                    >
                      {item.text}
                    </span>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteChecklistItem(item.id);
                    }}
                    className="text-stone-300 hover:text-rose-500 p-1"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Save Walk Modal */}
      {showSaveWalkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl border border-stone-200 space-y-3">
            <h3 className="font-bold text-stone-900 text-sm">산책 기록 저장하기</h3>
            <p className="text-xs text-stone-500">
              오늘 산책 시간: {Math.round(seconds / 60)}분 · 거리:{' '}
              {(distanceMeters / 1000).toFixed(2)} km
            </p>

            <div className="space-y-2 text-xs">
              {userDogs.length > 0 && (
                <div>
                  <label className="block font-bold text-stone-700 mb-1">함께 산책한 반려견</label>
                  <select
                    value={selectedDogId}
                    onChange={(e) => {
                      setSelectedDogId(e.target.value);
                      const d = userDogs.find(x => x.id === e.target.value);
                      if (d) setDogName(d.name);
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200"
                  >
                    {userDogs.map(d => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.breed})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block font-bold text-stone-700 mb-1">오늘의 산책 일기 / 메모</label>
                <textarea
                  rows={3}
                  placeholder="날씨, 오늘 만난 친구 강아지, 컨디션 등"
                  value={walkMemo}
                  onChange={(e) => setWalkMemo(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">산책 사진 URL (선택)</label>
                <input
                  type="text"
                  placeholder="https://..."
                  value={savedWalkPhoto}
                  onChange={(e) => setSavedWalkPhoto(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setShowSaveWalkModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-stone-100 text-stone-700 font-bold"
                >
                  취소
                </button>
                <button
                  onClick={handleSaveWalkRecord}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs"
                >
                  기록 저장
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Walk Detail View Modal */}
      {selectedWalkDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl border border-stone-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
                  <Footprints className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-extrabold text-stone-900 text-sm">
                    {selectedWalkDetail.dogName}의 산책 일지
                  </h3>
                  <p className="text-[11px] text-stone-400">
                    {selectedWalkDetail.startTime.split('T')[0]} {selectedWalkDetail.startTime.split('T')[1]?.substring(0, 5)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedWalkDetail(null)}
                className="w-7 h-7 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 flex items-center justify-center text-xs font-bold transition-colors"
              >
                ✕
              </button>
            </div>

            {selectedWalkDetail.photoUrl && (
              <div className="h-44 rounded-2xl overflow-hidden bg-stone-100 border border-stone-100">
                <img
                  src={selectedWalkDetail.photoUrl}
                  alt="산책 사진"
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 text-center text-xs">
              <div className="p-3 rounded-2xl bg-stone-50 border border-stone-100">
                <span className="text-[11px] text-stone-500 font-bold block">산책 시간</span>
                <span className="text-base font-extrabold text-stone-800">
                  {selectedWalkDetail.durationMinutes}분
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-stone-50 border border-stone-100">
                <span className="text-[11px] text-stone-500 font-bold block">이동 거리</span>
                <span className="text-base font-extrabold text-emerald-700">
                  {(selectedWalkDetail.distanceMeters / 1000).toFixed(2)} km
                </span>
              </div>
            </div>

            <div className="flex items-center justify-around p-2.5 rounded-2xl bg-amber-50/60 border border-amber-100 text-xs text-amber-900 font-bold">
              <span>💧 소변: {selectedWalkDetail.peeCount ?? 0}회</span>
              <span>💩 배변: {selectedWalkDetail.pooCount ?? 0}회</span>
              <span>📍 GPS 경로점: {selectedWalkDetail.path?.length ?? 0}개</span>
            </div>

            {selectedWalkDetail.memo && (
              <div className="p-3 rounded-2xl bg-stone-50 text-xs text-stone-700 leading-relaxed border border-stone-100">
                <p className="font-bold text-[11px] text-stone-500 mb-0.5">산책 메모</p>
                <p>{selectedWalkDetail.memo}</p>
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <button
                onClick={() => {
                  const id = selectedWalkDetail.id;
                  setSelectedWalkDetail(null);
                  handleDeleteWalk(id);
                }}
                className="py-2.5 px-4 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs flex items-center justify-center gap-1 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" /> 삭제
              </button>
              <button
                onClick={() => setSelectedWalkDetail(null)}
                className="flex-1 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs transition-colors shadow-xs"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
