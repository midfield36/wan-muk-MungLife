import React, { useState, useEffect } from 'react';
import { KoreanRegion, Place, MissingDog, MissingDogReport } from '../../types';
import { EMERGENCY_GUIDES } from '../../data/emergencyGuides';
import { KOREAN_REGIONS } from '../../data/koreanRegions';
import {
  fetchPlaces,
  fetchMissingDogs,
  saveMissingDog,
  updateMissingDog,
  deleteMissingDog,
  updateMissingDogStatus,
  fetchMissingDogReports,
  saveMissingDogReport,
  submitReport,
} from '../../services/dbService';
import { useAuth } from '../../firebase/authContext';
import {
  AlertTriangle,
  Phone,
  Navigation,
  Search,
  Plus,
  ShieldCheck,
  Eye,
  CheckCircle,
  FileWarning,
  Clock,
  MapPin,
  Camera,
  HeartHandshake,
  Info,
  ChevronRight,
  Share2,
  Trash2,
  Edit2,
} from 'lucide-react';

interface EmergencyScreenProps {
  selectedRegion: KoreanRegion;
  onSelectRegion: (reg: KoreanRegion) => void;
  onOpenAuth: () => void;
}

export const EmergencyScreen: React.FC<EmergencyScreenProps> = ({
  selectedRegion,
  onSelectRegion,
  onOpenAuth,
}) => {
  const { isLoggedIn, userProfile, isAdmin } = useAuth();
  const [subTab, setSubTab] = useState<'hospitals' | 'missing' | 'guides'>('hospitals');

  // Emergency hospitals
  const [hospitals, setHospitals] = useState<Place[]>([]);
  const [hospitalQuery, setHospitalQuery] = useState('');

  // Missing dogs
  const [missingDogs, setMissingDogs] = useState<MissingDog[]>([]);
  const [missingFilter, setMissingFilter] = useState<'all' | 'searching' | 'found'>('searching');
  const [selectedMissingDog, setSelectedMissingDog] = useState<MissingDog | null>(null);
  const [sightingReports, setSightingReports] = useState<MissingDogReport[]>([]);

  // Missing dog creation modal
  const [showCreateMissingModal, setShowCreateMissingModal] = useState(false);
  const [missingName, setMissingName] = useState('');
  const [missingBreed, setMissingBreed] = useState('');
  const [missingGender, setMissingGender] = useState('수컷');
  const [missingSize, setMissingSize] = useState<'소형' | '중형' | '대형'>('중형');
  const [missingColor, setMissingColor] = useState('');
  const [missingDate, setMissingDate] = useState('');
  const [missingCity, setMissingCity] = useState<string>(selectedRegion === '전체' ? '서울' : selectedRegion);
  const [missingDistrict, setMissingDistrict] = useState('');
  const [missingAddress, setMissingAddress] = useState('');
  const [missingCharacteristics, setMissingCharacteristics] = useState('');
  const [missingContactChannel, setMissingContactChannel] = useState('멍라이프 안심제보톡');
  const [missingPhotoUrl, setMissingPhotoUrl] = useState('');
  const [missingReward, setMissingReward] = useState('');
  const [isSubmittingMissing, setIsSubmittingMissing] = useState(false);
  const [editingMissingDogId, setEditingMissingDogId] = useState<string | null>(null);

  // Sighting tip modal
  const [showTipModal, setShowTipModal] = useState(false);
  const [tipSpottedDate, setTipSpottedDate] = useState('');
  const [tipSpottedLocation, setTipSpottedLocation] = useState('');
  const [tipDescription, setTipDescription] = useState('');
  const [tipPhotoUrl, setTipPhotoUrl] = useState('');
  const [isSubmittingTip, setIsSubmittingTip] = useState(false);

  // Report abuse state
  const [reportSuccess, setReportSuccess] = useState(false);

  useEffect(() => {
    async function load() {
      const places = await fetchPlaces();
      setHospitals(places.filter(p => p.category === 'hospital_24h' || p.isEmergency || p.nightCare));
      const dogs = await fetchMissingDogs();
      setMissingDogs(dogs);
    }
    load();
  }, []);

  // Filtered hospitals
  const filteredHospitals = hospitals.filter(h => {
    if (selectedRegion !== '전체' && !h.city.includes(selectedRegion)) return false;
    if (hospitalQuery.trim()) {
      const q = hospitalQuery.toLowerCase();
      return (
        h.name.toLowerCase().includes(q) ||
        h.address.toLowerCase().includes(q) ||
        h.district.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Filtered missing dogs
  const filteredMissingDogs = missingDogs.filter(dog => {
    if (missingFilter !== 'all' && dog.status !== missingFilter) return false;
    if (selectedRegion !== '전체' && !dog.missingCity.includes(selectedRegion)) return false;
    return true;
  });

  // Open missing dog details
  const handleOpenMissingDetail = async (dog: MissingDog) => {
    setSelectedMissingDog(dog);
    const tips = await fetchMissingDogReports(dog.id);
    setSightingReports(tips);
  };

  const handleStartEditMissing = (dog: MissingDog) => {
    setEditingMissingDogId(dog.id);
    setMissingName(dog.dogName);
    setMissingBreed(dog.breed);
    setMissingGender(dog.gender);
    setMissingSize(dog.size);
    setMissingColor(dog.color);
    setMissingDate(dog.missingDate);
    setMissingCity(dog.missingCity);
    setMissingDistrict(dog.missingDistrict);
    setMissingAddress(dog.missingAddress);
    setMissingCharacteristics(dog.characteristics);
    setMissingContactChannel(dog.contactChannel);
    setMissingPhotoUrl(dog.photoUrl);
    setMissingReward(dog.reward || '');
    setShowCreateMissingModal(true);
  };

  const handleDeleteMissing = async (dogId: string) => {
    if (!confirm('정말 이 실종견 신고를 삭제하시겠습니까?')) return;
    await deleteMissingDog(dogId);
    setMissingDogs(missingDogs.filter(d => d.id !== dogId));
    if (selectedMissingDog?.id === dogId) setSelectedMissingDog(null);
    alert('실종 신고가 삭제되었습니다.');
  };

  // Submit missing dog alert (Create or Update)
  const handleCreateMissing = async () => {
    if (!isLoggedIn) {
      onOpenAuth();
      return;
    }
    if (!missingName.trim() || !missingBreed.trim() || !missingDate.trim()) {
      alert('반려견 이름, 품종, 실종 일시를 모두 입력해 주세요.');
      return;
    }

    setIsSubmittingMissing(true);
    try {
      if (editingMissingDogId) {
        await updateMissingDog(editingMissingDogId, {
          dogName: missingName.trim(),
          breed: missingBreed.trim(),
          gender: missingGender,
          size: missingSize,
          color: missingColor.trim(),
          characteristics: missingCharacteristics.trim(),
          missingDate: missingDate.trim(),
          missingCity,
          missingDistrict: missingDistrict.trim(),
          missingAddress: missingAddress.trim(),
          contactChannel: missingContactChannel.trim(),
          photoUrl: missingPhotoUrl.trim() || undefined,
          reward: missingReward.trim() || undefined,
        });

        const updated = missingDogs.map(d =>
          d.id === editingMissingDogId
            ? {
                ...d,
                dogName: missingName.trim(),
                breed: missingBreed.trim(),
                gender: missingGender,
                size: missingSize,
                color: missingColor.trim(),
                characteristics: missingCharacteristics.trim(),
                missingDate: missingDate.trim(),
                missingCity,
                missingDistrict: missingDistrict.trim(),
                missingAddress: missingAddress.trim(),
                contactChannel: missingContactChannel.trim(),
                photoUrl: missingPhotoUrl.trim() || d.photoUrl,
                reward: missingReward.trim() || undefined,
              }
            : d
        );
        setMissingDogs(updated);
        if (selectedMissingDog?.id === editingMissingDogId) {
          setSelectedMissingDog({
            ...selectedMissingDog,
            dogName: missingName.trim(),
            breed: missingBreed.trim(),
            gender: missingGender,
            size: missingSize,
            color: missingColor.trim(),
            characteristics: missingCharacteristics.trim(),
            missingDate: missingDate.trim(),
            missingCity,
            missingDistrict: missingDistrict.trim(),
            missingAddress: missingAddress.trim(),
            contactChannel: missingContactChannel.trim(),
            photoUrl: missingPhotoUrl.trim() || selectedMissingDog.photoUrl,
            reward: missingReward.trim() || undefined,
          });
        }
        alert('실종견 정보가 성공적으로 수정되었습니다.');
      } else {
        const newAlert = await saveMissingDog({
          ownerId: userProfile?.uid || 'user',
          dogName: missingName.trim(),
          breed: missingBreed.trim(),
          gender: missingGender,
          size: missingSize,
          color: missingColor.trim() || '특징 참조',
          characteristics: missingCharacteristics.trim() || '특징 없음',
          missingDate: missingDate.trim(),
          missingCity: missingCity,
          missingDistrict: missingDistrict.trim() || '인근',
          missingAddress: missingAddress.trim() || `${missingCity} ${missingDistrict}`,
          contactName: userProfile?.displayName || '보호자',
          contactChannel: missingContactChannel.trim() || '멍라이프 안심제보톡',
          photoUrl:
            missingPhotoUrl.trim() ||
            'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=600&q=80',
          status: 'searching',
          reward: missingReward.trim(),
        });
        setMissingDogs([newAlert, ...missingDogs]);
        alert('실종견 신고가 안전하게 등록되었습니다. 주변 보호자들에게 알림이 전송됩니다.');
      }

      setShowCreateMissingModal(false);
      setEditingMissingDogId(null);
    } catch (e) {
      console.error(e);
      alert('저장 중 오류가 발생했습니다.');
    } finally {
      setIsSubmittingMissing(false);
    }
  };

  // Submit sighting tip
  const handleCreateTip = async () => {
    if (!selectedMissingDog) return;
    if (!isLoggedIn) {
      onOpenAuth();
      return;
    }
    if (!tipSpottedLocation.trim() || !tipDescription.trim()) {
      alert('목격 위치와 상황 설명을 입력해 주세요.');
      return;
    }
    setIsSubmittingTip(true);
    try {
      const newTip = await saveMissingDogReport({
        missingDogId: selectedMissingDog.id,
        reporterId: userProfile?.uid || 'user',
        reporterName: userProfile?.displayName || '익명 제보자',
        spottedDate: tipSpottedDate.trim() || new Date().toLocaleString('ko-KR'),
        spottedLocation: tipSpottedLocation.trim(),
        description: tipDescription.trim(),
        photoUrl: tipPhotoUrl.trim() || undefined,
      });
      setSightingReports([newTip, ...sightingReports]);
      setShowTipModal(false);
      setTipSpottedLocation('');
      setTipDescription('');
      setTipPhotoUrl('');
      alert('소중한 목격 제보가 보호자에게 안전하게 전달되었습니다. 감사합니다!');
    } catch (e) {
      console.error(e);
      alert('제보 전송 중 오류가 발생했습니다.');
    } finally {
      setIsSubmittingTip(false);
    }
  };

  // Mark found
  const handleMarkFound = async (dogId: string) => {
    if (!confirm('이 반려견을 찾음 완료 처리하시겠습니까?')) return;
    await updateMissingDogStatus(dogId, 'found');
    setMissingDogs(missingDogs.map(d => (d.id === dogId ? { ...d, status: 'found' } : d)));
    if (selectedMissingDog?.id === dogId) {
      setSelectedMissingDog({ ...selectedMissingDog, status: 'found' });
    }
    alert('발견 완료 처리되었습니다. 축하합니다!');
  };

  // Report improper post
  const handleReportAbuse = async (targetId: string) => {
    if (!isLoggedIn) {
      onOpenAuth();
      return;
    }
    const reason = prompt('신고 사유를 간단히 입력해 주세요 (허위 신고, 스팸 등):');
    if (!reason) return;
    await submitReport({
      reporterId: userProfile?.uid || 'user',
      targetType: 'missing',
      targetId,
      reason,
    });
    setReportSuccess(true);
    setTimeout(() => setReportSuccess(false), 3000);
    alert('신고가 접수되었습니다. 운영팀에서 신속히 검토하겠습니다.');
  };

  return (
    <div className="space-y-5 pb-24">
      {/* Top Emergency Red Header Banner */}
      <div className="p-5 rounded-3xl bg-linear-to-br from-red-600 via-rose-600 to-rose-700 text-white shadow-xl shadow-rose-900/15">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-white/20 backdrop-blur-md">
            <AlertTriangle className="w-7 h-7 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-white text-rose-700 text-[10px] font-extrabold uppercase">
                EMERGENCY CARE
              </span>
              <h1 className="text-xl font-extrabold tracking-tight">긴급도움 센터</h1>
            </div>
            <p className="text-xs text-rose-100 mt-1">
              골든타임을 지키는 24시 긴급 동물병원, 안심 실종견 신고·제보, 응급행동 가이드
            </p>
          </div>
        </div>

        {/* 3 Sub-tabs switcher */}
        <div className="mt-5 grid grid-cols-3 gap-2 bg-black/20 p-1.5 rounded-2xl backdrop-blur-xs">
          <button
            onClick={() => setSubTab('hospitals')}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition-all ${
              subTab === 'hospitals'
                ? 'bg-white text-rose-700 shadow-md'
                : 'text-rose-100 hover:text-white hover:bg-white/10'
            }`}
          >
            🏥 긴급 동물병원
          </button>
          <button
            onClick={() => setSubTab('missing')}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition-all ${
              subTab === 'missing'
                ? 'bg-white text-rose-700 shadow-md'
                : 'text-rose-100 hover:text-white hover:bg-white/10'
            }`}
          >
            📢 실종견 신고·제보
          </button>
          <button
            onClick={() => setSubTab('guides')}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition-all ${
              subTab === 'guides'
                ? 'bg-white text-rose-700 shadow-md'
                : 'text-rose-100 hover:text-white hover:bg-white/10'
            }`}
          >
            🩺 응급행동 안내
          </button>
        </div>
      </div>

      {/* Mandatory Medical Disclaimer Banner */}
      <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
        <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong>수의사 진료 안내:</strong> 이 안내는 수의사의 진료를 대신하지 않습니다. 긴급한 상황에서는 즉시 동물병원에 전화하여 진료 가능 여부를 확인하고 내원하세요.
        </div>
      </div>

      {/* SUB-TAB 1: 긴급 동물병원 찾기 */}
      {subTab === 'hospitals' && (
        <div className="space-y-4 animate-in fade-in">
          {/* Search & Region Filter Bar */}
          <div className="p-4 rounded-3xl bg-white border border-stone-200 shadow-xs flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={hospitalQuery}
                onChange={(e) => setHospitalQuery(e.target.value)}
                placeholder="병원명 또는 구/동 검색 (예: 청담, 송파, 분당)"
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs text-stone-800 focus:outline-rose-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={selectedRegion}
                onChange={(e) => onSelectRegion(e.target.value as KoreanRegion)}
                className="py-2 px-3 rounded-xl bg-stone-50 border border-stone-200 text-xs font-bold text-stone-800"
              >
                {KOREAN_REGIONS.map(r => (
                  <option key={r.name} value={r.name}>{r.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Hospitals List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {filteredHospitals.map(hosp => (
              <div
                key={hosp.id}
                className="p-4 rounded-3xl bg-white border border-stone-200 hover:border-rose-400 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="px-2 py-0.5 rounded-md bg-rose-600 text-white text-[10px] font-bold">
                          24시 응급
                        </span>
                        <span className="text-[11px] font-semibold text-stone-500">
                          {hosp.city} {hosp.district}
                        </span>
                      </div>
                      <h3 className="font-extrabold text-stone-900 text-base mt-1">{hosp.name}</h3>
                      <p className="text-xs text-stone-500 mt-0.5">{hosp.address}</p>
                    </div>
                  </div>

                  <div className="mt-2.5 p-2 rounded-xl bg-stone-50 text-[11px] text-stone-600 space-y-1">
                    <p className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                      <span>{hosp.businessHours}</span>
                    </p>
                    <p className="text-stone-700 font-medium">💡 {hosp.description}</p>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-stone-100 grid grid-cols-2 gap-2">
                  <a
                    href={`tel:${hosp.phone}`}
                    className="py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-rose-600/20 transition-transform active:scale-95"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>전화로 연결 ({hosp.phone})</span>
                  </a>

                  <a
                    href={`https://map.kakao.com/link/search/${encodeURIComponent(hosp.name)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs flex items-center justify-center gap-1 transition-colors"
                  >
                    <Navigation className="w-3.5 h-3.5 text-stone-600" />
                    <span>카카오맵 길찾기</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-TAB 2: 실종견 신고 및 제보 */}
      {subTab === 'missing' && (
        <div className="space-y-4 animate-in fade-in">
          {/* Action Header */}
          <div className="p-4 rounded-3xl bg-white border border-stone-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-bold text-stone-900 text-sm flex items-center gap-2">
                <span>주변 실종견 안심 제보 센터</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 font-bold">
                  개인정보 안심보호 적용
                </span>
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                보호자의 실제 연락처는 안전하게 보호되며, 대략적인 실종 구역 중심으로 표시됩니다.
              </p>
            </div>

            <button
              onClick={() => {
                if (!isLoggedIn) onOpenAuth();
                else setShowCreateMissingModal(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-600/20 flex items-center justify-center gap-1.5 transition-transform active:scale-95 shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>실종견 신고 등록하기</span>
            </button>
          </div>

          {/* Filter Status */}
          <div className="flex items-center gap-2">
            {[
              { id: 'searching', label: '🚨 애타게 찾고 있어요' },
              { id: 'found', label: '🎉 무사히 찾았어요' },
              { id: 'all', label: '전체 보기' },
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setMissingFilter(f.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  missingFilter === f.id
                    ? 'bg-stone-900 text-white shadow-xs'
                    : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Missing Dogs Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {filteredMissingDogs.map(dog => (
              <div
                key={dog.id}
                className="p-4 rounded-3xl bg-white border border-stone-200 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="relative h-48 rounded-2xl overflow-hidden bg-stone-100 mb-3">
                    <img
                      src={dog.photoUrl}
                      alt={dog.dogName}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2.5 left-2.5">
                      <span
                        className={`px-2.5 py-1 rounded-xl text-xs font-extrabold shadow-md ${
                          dog.status === 'searching'
                            ? 'bg-rose-600 text-white animate-pulse'
                            : 'bg-emerald-600 text-white'
                        }`}
                      >
                        {dog.status === 'searching' ? '🚨 실종 신고' : '🎉 발견 완료'}
                      </span>
                    </div>

                    {dog.reward && (
                      <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-lg bg-amber-500 text-white text-[10px] font-bold shadow-xs">
                        {dog.reward}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <h3 className="font-extrabold text-stone-900 text-base">{dog.dogName}</h3>
                    <span className="text-xs text-stone-500 font-semibold">
                      {dog.breed} · {dog.size}
                    </span>
                  </div>

                  <div className="mt-2 space-y-1 text-xs text-stone-600">
                    <p className="flex items-center gap-1 text-rose-700 font-semibold">
                      <Clock className="w-3.5 h-3.5 shrink-0" />
                      <span>실종일시: {dog.missingDate}</span>
                    </p>
                    <p className="flex items-center gap-1 text-stone-600">
                      <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                      <span>{dog.missingAddress}</span>
                    </p>
                  </div>

                  <p className="mt-2.5 p-2 rounded-xl bg-stone-50 text-[11px] text-stone-600 line-clamp-2">
                    {dog.characteristics}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleOpenMissingDetail(dog)}
                    className="flex-1 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs flex items-center justify-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>상세보기 & 제보</span>
                  </button>

                  {(userProfile?.uid === dog.ownerId || isAdmin) && (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => handleStartEditMissing(dog)}
                        className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold"
                        title="신고 수정"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteMissing(dog.id)}
                        className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold"
                        title="신고 삭제"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      {dog.status === 'searching' && (
                        <button
                          onClick={() => handleMarkFound(dog.id)}
                          className="px-2.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs whitespace-nowrap"
                          title="발견 완료 처리"
                        >
                          찾음완료
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-TAB 3: 응급행동 안내 가이드 (7가지 핵심 응급상황) */}
      {subTab === 'guides' && (
        <div className="space-y-4 animate-in fade-in">
          <div className="p-4 rounded-3xl bg-white border border-stone-200 shadow-xs">
            <h2 className="font-bold text-stone-900 text-base">
              주요 반려견 7대 응급상황 대처 프로토콜
            </h2>
            <p className="text-xs text-stone-500 mt-1">
              검증된 수의학 지침을 바탕으로 제작되었습니다. 임의로 민간요법이나 사람 약을 먹이지 마세요.
            </p>
          </div>

          <div className="space-y-3">
            {EMERGENCY_GUIDES.map((guide) => (
              <details
                key={guide.id}
                className="group p-5 rounded-3xl bg-white border border-stone-200 shadow-xs transition-all open:border-rose-400 open:shadow-md"
              >
                <summary className="flex items-center justify-between cursor-pointer list-none">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-lg ${
                        guide.severity === 'critical'
                          ? 'bg-rose-100 text-rose-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {guide.severity === 'critical' ? '🚨' : '⚠️'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            guide.severity === 'critical'
                              ? 'bg-rose-100 text-rose-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {guide.severity === 'critical' ? '최고 위험 (즉시 내원)' : '고위험'}
                        </span>
                        <h3 className="font-bold text-stone-900 text-sm sm:text-base">
                          {guide.title}
                        </h3>
                      </div>
                      <p className="text-xs text-stone-500 mt-0.5 line-clamp-1">{guide.summary}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-stone-400 group-open:rotate-90 transition-transform" />
                </summary>

                <div className="mt-4 pt-4 border-t border-stone-100 space-y-4 text-xs">
                  {/* Urgency note */}
                  <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 font-bold leading-relaxed">
                    {guide.hospitalUrgency}
                  </div>

                  {/* Danger Symptoms */}
                  <div>
                    <h4 className="font-bold text-stone-800 text-xs mb-1.5 flex items-center gap-1.5 text-rose-700">
                      <span>⚠️ 의심 및 위험 신호</span>
                    </h4>
                    <ul className="list-disc pl-5 space-y-1 text-stone-600">
                      {guide.symptoms.map((s, idx) => (
                        <li key={idx}>{s}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Safe First Aid */}
                  <div className="p-3.5 rounded-2xl bg-teal-50/60 border border-teal-100">
                    <h4 className="font-bold text-teal-900 text-xs mb-1.5 flex items-center gap-1.5">
                      <CheckCircle className="w-4 h-4 text-teal-600" />
                      <span>즉시 취할 수 있는 안전한 응급 조치</span>
                    </h4>
                    <ul className="list-disc pl-5 space-y-1 text-teal-950">
                      {guide.safeActions.map((a, idx) => (
                        <li key={idx}>{a}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Prohibited Actions */}
                  <div className="p-3.5 rounded-2xl bg-stone-100 border border-stone-200">
                    <h4 className="font-bold text-stone-800 text-xs mb-1.5 flex items-center gap-1.5 text-rose-600">
                      <span>⛔ 절대 피해야 하는 위험 행동</span>
                    </h4>
                    <ul className="list-disc pl-5 space-y-1 text-stone-600">
                      {guide.prohibitedActions.map((p, idx) => (
                        <li key={idx}>{p}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </details>
            ))}
          </div>
        </div>
      )}

      {/* Missing Dog Detail Modal */}
      {selectedMissingDog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl border border-stone-200 overflow-hidden">
            <div className="p-4 border-b border-stone-100 flex items-center justify-between bg-stone-50">
              <div className="flex items-center gap-2">
                <span className="text-xl">📢</span>
                <h3 className="font-bold text-stone-900 text-sm">
                  {selectedMissingDog.dogName} 실종 신고 상세정보
                </h3>
              </div>
              <button
                onClick={() => setSelectedMissingDog(null)}
                className="w-7 h-7 rounded-full bg-stone-200 text-stone-600 flex items-center justify-center text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4">
              <div className="h-56 rounded-2xl overflow-hidden bg-stone-100">
                <img
                  src={selectedMissingDog.photoUrl}
                  alt={selectedMissingDog.dogName}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-extrabold text-stone-900">
                    {selectedMissingDog.dogName}
                  </h4>
                  <span
                    className={`px-3 py-1 rounded-xl text-xs font-bold ${
                      selectedMissingDog.status === 'searching'
                        ? 'bg-rose-100 text-rose-700'
                        : 'bg-emerald-100 text-emerald-700'
                    }`}
                  >
                    {selectedMissingDog.status === 'searching' ? '수색 중' : '발견 완료'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs bg-stone-50 p-3 rounded-2xl">
                  <div>
                    <span className="text-stone-400 block text-[10px]">품종</span>
                    <strong className="text-stone-800">{selectedMissingDog.breed}</strong>
                  </div>
                  <div>
                    <span className="text-stone-400 block text-[10px]">성별 / 체구</span>
                    <strong className="text-stone-800">
                      {selectedMissingDog.gender} / {selectedMissingDog.size}
                    </strong>
                  </div>
                  <div>
                    <span className="text-stone-400 block text-[10px]">털 색상</span>
                    <strong className="text-stone-800">{selectedMissingDog.color}</strong>
                  </div>
                  <div>
                    <span className="text-stone-400 block text-[10px]">실종 일시</span>
                    <strong className="text-stone-800">{selectedMissingDog.missingDate}</strong>
                  </div>
                  <div className="col-span-2">
                    <span className="text-stone-400 block text-[10px]">실종 추정 구역</span>
                    <strong className="text-stone-800">{selectedMissingDog.missingAddress}</strong>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-100">
                  <span className="text-[10px] font-bold text-amber-800 block mb-1">
                    외모 특징 및 당부 사항
                  </span>
                  <p className="text-xs text-stone-700 leading-relaxed">
                    {selectedMissingDog.characteristics}
                  </p>
                </div>

                {/* Privacy Safe Contact Channel */}
                <div className="p-3 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-teal-900 block">안심 제보 소통 채널</span>
                    <span className="text-[11px] text-teal-700">
                      {selectedMissingDog.contactChannel} (보호자 직접 연결)
                    </span>
                  </div>
                  <ShieldCheck className="w-5 h-5 text-teal-600" />
                </div>
              </div>

              {/* Sighting reports list */}
              <div className="space-y-2 pt-2 border-t border-stone-100">
                <div className="flex items-center justify-between">
                  <h5 className="font-bold text-xs text-stone-800">
                    목격 제보 내역 ({sightingReports.length}건)
                  </h5>
                  <button
                    onClick={() => {
                      if (!isLoggedIn) onOpenAuth();
                      else setShowTipModal(true);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-xs"
                  >
                    + 목격 제보하기
                  </button>
                </div>

                {sightingReports.length > 0 ? (
                  sightingReports.map(tip => (
                    <div
                      key={tip.id}
                      className="p-3 rounded-2xl bg-stone-50 border border-stone-100 space-y-1 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-stone-800">{tip.reporterName}</span>
                        <span className="text-[10px] text-stone-400">{tip.spottedDate}</span>
                      </div>
                      <p className="text-stone-600">📍 목격 위치: {tip.spottedLocation}</p>
                      <p className="text-stone-800 font-medium">{tip.description}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-stone-400 text-center py-3">
                    아직 등록된 목격 제보가 없습니다. 비슷한 아이를 보셨다면 제보를 남겨주세요.
                  </p>
                )}
              </div>

              {/* Abuse Report Button */}
              <div className="pt-2 text-right">
                <button
                  onClick={() => handleReportAbuse(selectedMissingDog.id)}
                  className="text-[11px] text-stone-400 hover:text-rose-600 flex items-center gap-1 ml-auto"
                >
                  <FileWarning className="w-3.5 h-3.5" />
                  <span>허위 또는 부적절한 신고 제보하기</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Missing Dog Modal */}
      {showCreateMissingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl border border-stone-200 overflow-hidden">
            <div className="p-4 border-b border-stone-100 flex items-center justify-between bg-stone-50">
              <h3 className="font-bold text-stone-900 text-sm">
                {editingMissingDogId ? '실종견 신고 정보 수정' : '실종견 신고서 작성'}
              </h3>
              <button
                onClick={() => {
                  setShowCreateMissingModal(false);
                  setEditingMissingDogId(null);
                }}
                className="w-7 h-7 rounded-full bg-stone-200 text-stone-600 flex items-center justify-center text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-3 text-xs">
              <div>
                <label className="block font-bold text-stone-700 mb-1">반려견 이름 *</label>
                <input
                  type="text"
                  placeholder="예: 몽이"
                  value={missingName}
                  onChange={(e) => setMissingName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 focus:outline-rose-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">품종 *</label>
                  <input
                    type="text"
                    placeholder="예: 시바견, 말티즈"
                    value={missingBreed}
                    onChange={(e) => setMissingBreed(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-700 mb-1">체구</label>
                  <select
                    value={missingSize}
                    onChange={(e) => setMissingSize(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200"
                  >
                    <option value="소형">소형 (10kg 미만)</option>
                    <option value="중형">중형 (10~25kg)</option>
                    <option value="대형">대형 (25kg 이상)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">털 색상</label>
                  <input
                    type="text"
                    placeholder="예: 갈색, 흰색 섞임"
                    value={missingColor}
                    onChange={(e) => setMissingColor(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-700 mb-1">성별</label>
                  <input
                    type="text"
                    placeholder="예: 수컷 (중성화 완료)"
                    value={missingGender}
                    onChange={(e) => setMissingGender(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">실종 날짜와 시간 *</label>
                <input
                  type="text"
                  placeholder="예: 2025년 3월 15일 오후 3시경"
                  value={missingDate}
                  onChange={(e) => setMissingDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">실종 시/도</label>
                  <select
                    value={missingCity}
                    onChange={(e) => setMissingCity(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200"
                  >
                    {KOREAN_REGIONS.filter(r => r.name !== '전체').map(r => (
                      <option key={r.name} value={r.name}>{r.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-stone-700 mb-1">시/군/구</label>
                  <input
                    type="text"
                    placeholder="예: 마포구, 분당구"
                    value={missingDistrict}
                    onChange={(e) => setMissingDistrict(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">상세 실종 위치 (대략적인 랜드마크)</label>
                <input
                  type="text"
                  placeholder="예: 월드컵경기장 2번 출구 평화의공원 둘레길"
                  value={missingAddress}
                  onChange={(e) => setMissingAddress(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">사진 URL (온라인 이미지)</label>
                <input
                  type="text"
                  placeholder="https://..."
                  value={missingPhotoUrl}
                  onChange={(e) => setMissingPhotoUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">외모 특징 및 주의점</label>
                <textarea
                  rows={2}
                  placeholder="하네스 착용 여부, 꼬리 모양, 성격(겁이 많음 등)"
                  value={missingCharacteristics}
                  onChange={(e) => setMissingCharacteristics(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200"
                />
              </div>

              <div className="p-3 rounded-2xl bg-teal-50 border border-teal-200 text-teal-900 text-[11px]">
                🔒 보호자 실제 전화번호는 스팸 방지를 위해 공개되지 않으며, 멍라이프 안심 제보함을 통해 안전하게 연결됩니다.
              </div>

              <button
                onClick={handleCreateMissing}
                disabled={isSubmittingMissing}
                className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition-colors"
              >
                {isSubmittingMissing
                  ? '저장 중...'
                  : editingMissingDogId
                  ? '수정 내용 저장하기'
                  : '실종 신고 즉시 등록'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sighting Tip Modal */}
      {showTipModal && selectedMissingDog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl border border-stone-200">
            <h3 className="font-bold text-stone-900 text-sm mb-1">
              {selectedMissingDog.dogName} 목격 제보 작성
            </h3>
            <p className="text-xs text-stone-500 mb-3">
              보호자에게 소중한 단서가 됩니다.
            </p>

            <div className="space-y-2.5 text-xs">
              <div>
                <label className="block font-bold text-stone-700 mb-1">목격 일시</label>
                <input
                  type="text"
                  placeholder="예: 오늘 오후 2시경"
                  value={tipSpottedDate}
                  onChange={(e) => setTipSpottedDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">목격 위치 *</label>
                <input
                  type="text"
                  placeholder="예: 마포구청 인근 횡단보도 앞"
                  value={tipSpottedLocation}
                  onChange={(e) => setTipSpottedLocation(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">상황 설명 *</label>
                <textarea
                  rows={3}
                  placeholder="이동 방향, 하네스 착용 여부, 건강 상태 등"
                  value={tipDescription}
                  onChange={(e) => setTipDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setShowTipModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-stone-100 text-stone-700 font-bold"
                >
                  취소
                </button>
                <button
                  onClick={handleCreateTip}
                  disabled={isSubmittingTip}
                  className="flex-1 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold shadow-xs"
                >
                  {isSubmittingTip ? '전송 중...' : '제보 전달'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
