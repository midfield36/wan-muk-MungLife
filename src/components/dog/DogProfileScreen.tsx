import React, { useState, useEffect } from 'react';
import { Dog, HealthRecord, Reminder, DogGender, HealthRecordType } from '../../types';
import { useAuth } from '../../firebase/authContext';
import {
  fetchDogs,
  saveDog,
  removeDog,
  fetchHealthRecords,
  saveHealthRecord,
  removeHealthRecord,
  fetchReminders,
  saveReminder,
  toggleReminderStatus,
  removeReminder,
} from '../../services/dbService';
import {
  Heart,
  Plus,
  Calendar,
  Clock,
  Trash2,
  Edit2,
  Syringe,
  Pill,
  Scale,
  Activity,
  Users,
  Bell,
  CheckCircle2,
  AlertCircle,
  FileText,
  ChevronRight,
  Shield,
  Sparkles,
} from 'lucide-react';

interface DogProfileScreenProps {
  initialSubTab?: string;
  onOpenAuth: () => void;
}

export const DogProfileScreen: React.FC<DogProfileScreenProps> = ({
  initialSubTab = 'health',
  onOpenAuth,
}) => {
  const { isLoggedIn, userProfile } = useAuth();
  const [subTab, setSubTab] = useState<'profile' | 'health' | 'reminders' | 'family'>('health');
  const [dogs, setDogs] = useState<Dog[]>([]);
  const [activeDog, setActiveDog] = useState<Dog | null>(null);
  const [healthRecords, setHealthRecords] = useState<HealthRecord[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [recordFilter, setRecordFilter] = useState<HealthRecordType | 'all'>('all');
  const [loading, setLoading] = useState(true);

  // Dog Modal
  const [showDogModal, setShowDogModal] = useState(false);
  const [editingDogId, setEditingDogId] = useState<string | null>(null);
  const [dogName, setDogName] = useState('');
  const [dogBreed, setDogBreed] = useState('');
  const [dogGender, setDogGender] = useState<DogGender>('neutered_male');
  const [dogBirthDate, setDogBirthDate] = useState('');
  const [dogWeight, setDogWeight] = useState<string>('');
  const [dogNeutered, setDogNeutered] = useState(true);
  const [dogAllergies, setDogAllergies] = useState('');
  const [dogNotes, setDogNotes] = useState('');
  const [dogPhotoUrl, setDogPhotoUrl] = useState('');

  // Health Record Modal
  const [showHealthModal, setShowHealthModal] = useState(false);
  const [editingHealthRecordId, setEditingHealthRecordId] = useState<string | null>(null);
  const [healthType, setHealthType] = useState<HealthRecordType>('vaccine');
  const [healthTitle, setHealthTitle] = useState('');
  const [healthDate, setHealthDate] = useState(new Date().toISOString().split('T')[0]);
  const [healthHospital, setHealthHospital] = useState('');
  const [healthCost, setHealthCost] = useState('');
  const [healthNextDue, setHealthNextDue] = useState('');
  const [healthWeightKg, setHealthWeightKg] = useState('');
  const [healthNotes, setHealthNotes] = useState('');

  // Reminder Modal
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [remTitle, setRemTitle] = useState('');
  const [remDate, setRemDate] = useState(new Date().toISOString().split('T')[0]);
  const [remTime, setRemTime] = useState('09:00');
  const [remType, setRemType] = useState<'vaccine' | 'medicine' | 'checkup' | 'grooming' | 'custom'>('medicine');
  const [remMemo, setRemMemo] = useState('');

  // Browser notification permission state
  const [pushPermission, setPushPermission] = useState<NotificationPermission>(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default'
  );

  // Family invitation
  const [familyCode, setFamilyCode] = useState('MUNG-7842');
  const [inputFamilyCode, setInputFamilyCode] = useState('');
  const [familyMembers, setFamilyMembers] = useState<string[]>([
    '보호자 본인 (마스터 관리자)',
    '가족 구성원 1 (열람 및 기록 가능)',
  ]);

  useEffect(() => {
    if (initialSubTab === 'reminders') setSubTab('reminders');
  }, [initialSubTab]);

  useEffect(() => {
    async function loadDogs() {
      if (!isLoggedIn || !userProfile) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const dogList = await fetchDogs(userProfile.uid);
        setDogs(dogList);
        if (dogList.length > 0) {
          setActiveDog(dogList[0]);
        }
      } catch (err) {
        console.warn(err);
      } finally {
        setLoading(false);
      }
    }
    loadDogs();
  }, [isLoggedIn, userProfile]);

  useEffect(() => {
    async function loadDogDetails() {
      if (!activeDog || !userProfile) return;
      const records = await fetchHealthRecords(activeDog.id, userProfile.uid);
      setHealthRecords(records);
      const rems = await fetchReminders(activeDog.id, userProfile.uid);
      setReminders(rems);
    }
    loadDogDetails();
  }, [activeDog, userProfile]);

  // Handle Dog Save
  const handleSaveDog = async () => {
    if (!userProfile) return;
    if (!dogName.trim() || !dogBreed.trim()) {
      alert('반려견 이름과 품종을 입력해 주세요.');
      return;
    }

    try {
      const saved = await saveDog({
        id: editingDogId || undefined,
        ownerId: userProfile.uid,
        name: dogName.trim(),
        breed: dogBreed.trim(),
        gender: dogGender,
        birthDate: dogBirthDate,
        weight: dogWeight ? parseFloat(dogWeight) : undefined,
        neutered: dogNeutered,
        allergies: dogAllergies.trim(),
        notes: dogNotes.trim(),
        photoUrl:
          dogPhotoUrl.trim() ||
          'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=600&q=80',
      });

      const updatedDogs = editingDogId
        ? dogs.map(d => (d.id === saved.id ? saved : d))
        : [saved, ...dogs];
      setDogs(updatedDogs);
      setActiveDog(saved);
      setShowDogModal(false);
      resetDogForm();
      alert('반려견 정보가 안전하게 저장되었습니다!');
    } catch (e) {
      console.error(e);
      alert('저장 중 오류가 발생했습니다.');
    }
  };

  const handleEditDog = (dog: Dog) => {
    setEditingDogId(dog.id);
    setDogName(dog.name);
    setDogBreed(dog.breed);
    setDogGender(dog.gender);
    setDogBirthDate(dog.birthDate || '');
    setDogWeight(dog.weight ? String(dog.weight) : '');
    setDogNeutered(dog.neutered);
    setDogAllergies(dog.allergies || '');
    setDogNotes(dog.notes || '');
    setDogPhotoUrl(dog.photoUrl || '');
    setShowDogModal(true);
  };

  const handleDeleteDog = async (dogId: string) => {
    if (!confirm('정말 이 반려견 프로필을 삭제하시겠습니까? 관련된 건강 기록도 모두 삭제됩니다.')) {
      return;
    }
    if (!userProfile) return;
    await removeDog(dogId, userProfile.uid);
    const remaining = dogs.filter(d => d.id !== dogId);
    setDogs(remaining);
    setActiveDog(remaining.length > 0 ? remaining[0] : null);
  };

  const resetDogForm = () => {
    setEditingDogId(null);
    setDogName('');
    setDogBreed('');
    setDogBirthDate('');
    setDogWeight('');
    setDogAllergies('');
    setDogNotes('');
    setDogPhotoUrl('');
  };

  const resetHealthForm = () => {
    setEditingHealthRecordId(null);
    setHealthType('vaccine');
    setHealthTitle('');
    setHealthDate(new Date().toISOString().split('T')[0]);
    setHealthHospital('');
    setHealthCost('');
    setHealthNextDue('');
    setHealthWeightKg('');
    setHealthNotes('');
  };

  const handleStartEditHealthRecord = (rec: HealthRecord) => {
    setEditingHealthRecordId(rec.id);
    setHealthType(rec.type);
    setHealthTitle(rec.title);
    setHealthDate(rec.date);
    setHealthHospital(rec.hospitalName || '');
    setHealthCost(rec.cost ? String(rec.cost) : '');
    setHealthNextDue(rec.nextDueDate || '');
    setHealthWeightKg(rec.weightKg ? String(rec.weightKg) : '');
    setHealthNotes(rec.notes || '');
    setShowHealthModal(true);
  };

  // Handle Health Record Save
  const handleSaveHealthRecord = async () => {
    if (!activeDog || !userProfile) return;
    if (!healthTitle.trim() || !healthDate) {
      alert('항목명과 날짜를 입력해 주세요.');
      return;
    }

    try {
      const rec = await saveHealthRecord({
        id: editingHealthRecordId || undefined,
        dogId: activeDog.id,
        ownerId: userProfile.uid,
        type: healthType,
        title: healthTitle.trim(),
        date: healthDate,
        hospitalName: healthHospital.trim() || undefined,
        cost: healthCost ? parseInt(healthCost, 10) : undefined,
        nextDueDate: healthNextDue || undefined,
        weightKg: healthWeightKg ? parseFloat(healthWeightKg) : undefined,
        notes: healthNotes.trim() || undefined,
      });

      if (editingHealthRecordId) {
        setHealthRecords(healthRecords.map(r => (r.id === rec.id ? rec : r)));
      } else {
        setHealthRecords([rec, ...healthRecords]);
      }
      setShowHealthModal(false);
      resetHealthForm();
      alert(editingHealthRecordId ? '건강 기록이 수정되었습니다.' : '건강수첩에 기록되었습니다!');
    } catch (e) {
      console.error(e);
      alert('기록 중 오류가 발생했습니다.');
    }
  };

  const handleDeleteHealthRecord = async (recordId: string) => {
    if (!confirm('이 건강 기록을 삭제하시겠습니까?')) return;
    if (!activeDog) return;
    await removeHealthRecord(recordId, activeDog.id);
    setHealthRecords(healthRecords.filter(r => r.id !== recordId));
  };

  // Handle Reminder Save
  const handleSaveReminder = async () => {
    if (!activeDog || !userProfile) return;
    if (!remTitle.trim() || !remDate) {
      alert('일정 내용과 날짜를 입력해 주세요.');
      return;
    }

    try {
      const rem = await saveReminder({
        dogId: activeDog.id,
        ownerId: userProfile.uid,
        title: remTitle.trim(),
        date: remDate,
        time: remTime,
        type: remType,
        isCompleted: false,
        memo: remMemo.trim() || undefined,
      });

      setReminders([rem, ...reminders]);
      setShowReminderModal(false);
      setRemTitle('');
      setRemMemo('');
      alert('알림 일정이 추가되었습니다!');
    } catch (e) {
      console.error(e);
      alert('알림 저장 오류');
    }
  };

  const handleToggleReminder = async (rem: Reminder) => {
    if (!activeDog) return;
    const nextStatus = !rem.isCompleted;
    await toggleReminderStatus(rem.id, activeDog.id, nextStatus);
    setReminders(reminders.map(r => (r.id === rem.id ? { ...r, isCompleted: nextStatus } : r)));
  };

  const handleDeleteReminder = async (remId: string) => {
    if (!confirm('이 일정을 삭제하시겠습니까?')) return;
    if (!activeDog) return;
    await removeReminder(remId, activeDog.id);
    setReminders(reminders.filter(r => r.id !== remId));
  };

  // Request browser push notification
  const handleRequestPush = async () => {
    if (!('Notification' in window)) {
      alert('이 브라우저는 웹 푸시 알림을 지원하지 않습니다. 멍라이프 앱 내 알림함에서 확인 가능합니다.');
      return;
    }
    const perm = await Notification.requestPermission();
    setPushPermission(perm);
    if (perm === 'granted') {
      alert('알림 권한이 허용되었습니다! 백신 및 투약 알림이 정시에 안내됩니다.');
      new Notification('멍라이프 알림 설정 완료', {
        body: '우리 강아지 건강 관리 일정이 등록되었습니다.',
        icon: '🐶',
      });
    } else {
      alert('알림 권한이 거부되었습니다. 앱 내 알림 목록을 통해 일정을 확인해 주세요.');
    }
  };

  // Join family
  const handleJoinFamily = () => {
    if (!inputFamilyCode.trim()) {
      alert('가족 초대 코드를 입력해 주세요.');
      return;
    }
    setFamilyMembers([...familyMembers, `가족 구성원 (코드 ${inputFamilyCode.trim()} 인증)`]);
    setInputFamilyCode('');
    alert('가족 반려견 공동 관리 멤버로 연결되었습니다!');
  };

  // Filtered health records
  const filteredRecords = healthRecords.filter(r => {
    if (recordFilter === 'all') return true;
    return r.type === recordFilter;
  });

  if (!isLoggedIn) {
    return (
      <div className="p-8 rounded-3xl bg-white border border-stone-200 text-center space-y-4 max-w-md mx-auto my-8 shadow-xs">
        <div className="w-16 h-16 rounded-3xl bg-teal-50 border border-teal-200 text-3xl flex items-center justify-center mx-auto">
          🐶
        </div>
        <h2 className="text-lg font-bold text-stone-900">우리강아지 관리 센터</h2>
        <p className="text-xs text-stone-500 leading-relaxed">
          반려견의 건강수첩, 예방접종 및 약 복용 알림, 체중 관리, 가족 공동관리는 개인정보 보호를 위해 로그인이 필요합니다.
        </p>
        <button
          onClick={onOpenAuth}
          className="w-full py-3 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md shadow-teal-600/20 transition-all active:scale-95"
        >
          로그인하고 내 강아지 등록하기
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-24">
      {/* Top Dog Profile Switcher Bar */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white border border-stone-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Multi-dog list pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {dogs.map(dog => (
            <button
              key={dog.id}
              onClick={() => setActiveDog(dog)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-bold transition-all shrink-0 ${
                activeDog?.id === dog.id
                  ? 'bg-teal-600 text-white shadow-md shadow-teal-600/20 scale-102'
                  : 'bg-stone-50 text-stone-700 border border-stone-200 hover:bg-stone-100'
              }`}
            >
              <div className="w-6 h-6 rounded-full overflow-hidden bg-white/20 shrink-0">
                <img src={dog.photoUrl} alt={dog.name} className="w-full h-full object-cover" />
              </div>
              <span>{dog.name}</span>
            </button>
          ))}

          <button
            onClick={() => {
              resetDogForm();
              setShowDogModal(true);
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-2xl border border-dashed border-teal-300 bg-teal-50/50 hover:bg-teal-50 text-teal-700 font-bold text-xs shrink-0 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>새 강아지 등록</span>
          </button>
        </div>

        {activeDog && (
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => handleEditDog(activeDog)}
              className="px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold flex items-center gap-1"
            >
              <Edit2 className="w-3.5 h-3.5 text-stone-500" />
              <span>프로필 수정</span>
            </button>
            <button
              onClick={() => handleDeleteDog(activeDog.id)}
              className="p-1.5 rounded-xl text-stone-400 hover:text-rose-600 hover:bg-rose-50"
              title="삭제"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {activeDog ? (
        <>
          {/* Active Dog Quick Card */}
          <div className="p-5 rounded-3xl bg-linear-to-r from-amber-500/10 via-teal-500/10 to-teal-600/10 border border-teal-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-18 h-18 rounded-3xl overflow-hidden border-2 border-white shadow-md bg-white shrink-0">
                <img
                  src={activeDog.photoUrl}
                  alt={activeDog.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-extrabold text-stone-900">{activeDog.name}</h2>
                  <span className="px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 text-[10px] font-bold">
                    {activeDog.gender === 'neutered_male'
                      ? '중성화 남아'
                      : activeDog.gender === 'spayed_female'
                      ? '중성화 여아'
                      : activeDog.gender === 'male'
                      ? '남아'
                      : '여아'}
                  </span>
                </div>
                <p className="text-xs text-stone-600 mt-0.5">
                  {activeDog.breed} · {activeDog.weight ? `${activeDog.weight} kg` : '체중 미등록'}{' '}
                  · 생일 {activeDog.birthDate || '미등록'}
                </p>
                {activeDog.allergies && (
                  <p className="text-[11px] text-rose-600 font-semibold mt-1">
                    ⚠️ 알레르기 주의: {activeDog.allergies}
                  </p>
                )}
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-2 w-full md:w-auto text-center">
              <div className="p-2.5 rounded-2xl bg-white shadow-2xs border border-stone-100 min-w-[85px]">
                <span className="text-[10px] text-stone-400 block font-medium">건강 기록</span>
                <span className="text-sm font-extrabold text-stone-800">
                  {healthRecords.length}건
                </span>
              </div>
              <div className="p-2.5 rounded-2xl bg-white shadow-2xs border border-stone-100 min-w-[85px]">
                <span className="text-[10px] text-stone-400 block font-medium">예정된 일정</span>
                <span className="text-sm font-extrabold text-teal-700">
                  {reminders.filter(r => !r.isCompleted).length}건
                </span>
              </div>
              <div className="p-2.5 rounded-2xl bg-white shadow-2xs border border-stone-100 min-w-[85px]">
                <span className="text-[10px] text-stone-400 block font-medium">공동관리 가족</span>
                <span className="text-sm font-extrabold text-amber-600">
                  {familyMembers.length}명
                </span>
              </div>
            </div>
          </div>

          {/* Sub-tabs: 건강수첩, 일정&알림, 가족 공동관리 */}
          <div className="flex border-b border-stone-200 gap-4">
            <button
              onClick={() => setSubTab('health')}
              className={`pb-3 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-1.5 ${
                subTab === 'health'
                  ? 'border-teal-600 text-teal-700'
                  : 'border-transparent text-stone-400 hover:text-stone-700'
              }`}
            >
              <FileText className="w-4 h-4" />
              건강수첩
            </button>
            <button
              onClick={() => setSubTab('reminders')}
              className={`pb-3 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-1.5 ${
                subTab === 'reminders'
                  ? 'border-teal-600 text-teal-700'
                  : 'border-transparent text-stone-400 hover:text-stone-700'
              }`}
            >
              <Calendar className="w-4 h-4" />
              일정 및 알림
            </button>
            <button
              onClick={() => setSubTab('family')}
              className={`pb-3 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-1.5 ${
                subTab === 'family'
                  ? 'border-teal-600 text-teal-700'
                  : 'border-transparent text-stone-400 hover:text-stone-700'
              }`}
            >
              <Users className="w-4 h-4" />
              가족 공동관리
            </button>
          </div>

          {/* TAB 1: 건강수첩 */}
          {subTab === 'health' && (
            <div className="space-y-4 animate-in fade-in">
              {/* Actions & Filters */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
                  {[
                    { id: 'all', label: '전체' },
                    { id: 'vaccine', label: '💉 예방접종' },
                    { id: 'hospital', label: '🏥 병원방문' },
                    { id: 'exam', label: '🩺 진단/검사' },
                    { id: 'medicine', label: '💊 투약' },
                    { id: 'weight', label: '⚖️ 체중' },
                  ].map(f => (
                    <button
                      key={f.id}
                      onClick={() => setRecordFilter(f.id as any)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                        recordFilter === f.id
                          ? 'bg-stone-900 text-white shadow-2xs'
                          : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => {
                    resetHealthForm();
                    setShowHealthModal(true);
                  }}
                  className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-xs flex items-center justify-center gap-1.5 transition-transform active:scale-95 shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>건강 기록 추가</span>
                </button>
              </div>

              {/* Records List */}
              {filteredRecords.length > 0 ? (
                <div className="space-y-3">
                  {filteredRecords.map(rec => (
                    <div
                      key={rec.id}
                      className="p-4 rounded-3xl bg-white border border-stone-200 shadow-xs hover:border-teal-300 transition-all flex flex-col justify-between"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center text-lg shrink-0">
                            {rec.type === 'vaccine'
                              ? '💉'
                              : rec.type === 'hospital'
                              ? '🏥'
                              : rec.type === 'exam'
                              ? '🩺'
                              : rec.type === 'medicine'
                              ? '💊'
                              : '⚖️'}
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-teal-700 px-2 py-0.5 rounded-full bg-teal-50">
                              {rec.type === 'vaccine'
                                ? '예방접종'
                                : rec.type === 'hospital'
                                ? '병원방문'
                                : rec.type === 'exam'
                                ? '진단 및 검사'
                                : rec.type === 'medicine'
                                ? '투약기록'
                                : '체중측정'}
                            </span>
                            <h3 className="font-bold text-stone-900 text-sm mt-1">{rec.title}</h3>
                            <p className="text-xs text-stone-500 mt-0.5">
                              방문일: {rec.date} {rec.hospitalName ? `· ${rec.hospitalName}` : ''}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => handleStartEditHealthRecord(rec)}
                            className="p-1.5 text-stone-400 hover:text-teal-600 transition-colors"
                            title="수정"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteHealthRecord(rec.id)}
                            className="p-1.5 text-stone-400 hover:text-rose-600 transition-colors"
                            title="삭제"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {(rec.notes || rec.nextDueDate || rec.cost || rec.weightKg) && (
                        <div className="mt-3 p-3 rounded-2xl bg-stone-50 text-xs space-y-1 text-stone-600">
                          {rec.notes && <p className="leading-relaxed">{rec.notes}</p>}
                          <div className="flex flex-wrap gap-3 pt-1 text-[11px] font-semibold text-stone-500">
                            {rec.nextDueDate && (
                              <span className="text-teal-700">다음 예정일: {rec.nextDueDate}</span>
                            )}
                            {rec.cost && <span>진료비: {rec.cost.toLocaleString()}원</span>}
                            {rec.weightKg && <span>체중: {rec.weightKg} kg</span>}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 rounded-3xl bg-white border border-stone-200 text-center space-y-2">
                  <span className="text-3xl">📋</span>
                  <h3 className="font-bold text-stone-800 text-sm">건강 기록이 없습니다</h3>
                  <p className="text-xs text-stone-500">
                    첫 번째 예방접종이나 병원 검진 기록을 추가해 보세요.
                  </p>
                  <button
                    onClick={() => setShowHealthModal(true)}
                    className="mt-3 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-xs inline-flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> 기록 추가하기
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: 일정 및 알림 */}
          {subTab === 'reminders' && (
            <div className="space-y-4 animate-in fade-in">
              {/* Push Permission Notification Banner */}
              <div className="p-4 rounded-3xl bg-amber-50/80 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5">
                  <Bell className="w-5 h-5 text-amber-600 shrink-0" />
                  <div>
                    <h4 className="font-bold text-amber-900">브라우저 푸시 알림 상태</h4>
                    <p className="text-amber-700 text-[11px]">
                      {pushPermission === 'granted'
                        ? '알림이 켜져 있습니다. 정시에 푸시 알림이 발송됩니다.'
                        : '브라우저 푸시 권한을 허용하시면 약 복용과 접종 일정을 잊지 않게 알려드립니다.'}
                    </p>
                  </div>
                </div>
                {pushPermission !== 'granted' && (
                  <button
                    onClick={handleRequestPush}
                    className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shrink-0"
                  >
                    알림 권한 허용하기
                  </button>
                )}
              </div>

              {/* Header with Add Button */}
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-stone-900 text-sm">
                  {activeDog.name}의 예정 일정 ({reminders.length})
                </h3>
                <button
                  onClick={() => setShowReminderModal(true)}
                  className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-xs flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>새 일정 추가</span>
                </button>
              </div>

              {/* Reminders List */}
              {reminders.length > 0 ? (
                <div className="space-y-2.5">
                  {reminders.map(rem => (
                    <div
                      key={rem.id}
                      className={`p-4 rounded-3xl border transition-all flex items-center justify-between gap-3 ${
                        rem.isCompleted
                          ? 'bg-stone-50 border-stone-200 opacity-60'
                          : 'bg-white border-stone-200 shadow-xs hover:border-teal-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleToggleReminder(rem)}
                          className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors ${
                            rem.isCompleted
                              ? 'bg-teal-600 text-white'
                              : 'border-2 border-stone-300 hover:border-teal-500'
                          }`}
                        >
                          {rem.isCompleted && <CheckCircle2 className="w-4 h-4" />}
                        </button>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm">
                              {rem.type === 'medicine'
                                ? '💊'
                                : rem.type === 'vaccine'
                                ? '💉'
                                : rem.type === 'checkup'
                                ? '🩺'
                                : '🔔'}
                            </span>
                            <h4
                              className={`text-xs font-bold ${
                                rem.isCompleted
                                  ? 'line-through text-stone-400'
                                  : 'text-stone-800'
                              }`}
                            >
                              {rem.title}
                            </h4>
                          </div>
                          <p className="text-[11px] text-stone-500 mt-0.5">
                            {rem.date} {rem.time} {rem.memo ? `· ${rem.memo}` : ''}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeleteReminder(rem.id)}
                        className="p-1.5 text-stone-400 hover:text-rose-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 rounded-3xl bg-white border border-stone-200 text-center space-y-2">
                  <span className="text-3xl">⏰</span>
                  <h3 className="font-bold text-stone-800 text-sm">예정된 일정이 없습니다</h3>
                  <p className="text-xs text-stone-500">
                    약 복용 시간이나 백신 접종 일정을 추가해 보세요.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: 가족 공동관리 */}
          {subTab === 'family' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="p-5 rounded-3xl bg-white border border-stone-200 shadow-xs space-y-4">
                <div>
                  <h3 className="font-bold text-stone-900 text-sm flex items-center gap-2">
                    <Users className="w-4 h-4 text-teal-600" />
                    <span>가족 공동 관리 초대 및 연동</span>
                  </h3>
                  <p className="text-xs text-stone-500 mt-1">
                    같은 반려견을 돌보는 가족 구성원을 초대하여 건강 기록과 일정을 함께 확인하고 업데이트할 수 있습니다.
                  </p>
                </div>

                {/* My dog code */}
                <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-bold text-teal-700 block">
                      {activeDog.name}의 전용 가족 초대 코드
                    </span>
                    <strong className="text-lg font-mono tracking-widest text-teal-950">
                      {familyCode}
                    </strong>
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(familyCode);
                      alert('초대 코드가 복사되었습니다. 가족에게 공유해 주세요!');
                    }}
                    className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-xs"
                  >
                    초대 코드 복사하기
                  </button>
                </div>

                {/* Join other family */}
                <div className="pt-2">
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    다른 가족의 반려견 초대 코드 입력
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="예: MUNG-7842"
                      value={inputFamilyCode}
                      onChange={(e) => setInputFamilyCode(e.target.value)}
                      className="flex-1 px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-mono uppercase"
                    />
                    <button
                      onClick={handleJoinFamily}
                      className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs shadow-xs"
                    >
                      연결하기
                    </button>
                  </div>
                </div>

                {/* Members List */}
                <div className="pt-3 border-t border-stone-100 space-y-2">
                  <h4 className="font-bold text-xs text-stone-800">
                    현재 연결된 가족 ({familyMembers.length}명)
                  </h4>
                  <div className="space-y-1.5">
                    {familyMembers.map((member, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-2xl bg-stone-50 border border-stone-100 flex items-center justify-between text-xs"
                      >
                        <span className="font-semibold text-stone-800">{member}</span>
                        <span className="text-[10px] text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full font-bold">
                          공동 권한
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="p-8 rounded-3xl bg-white border border-stone-200 text-center space-y-3">
          <span className="text-4xl">🐶</span>
          <h3 className="font-bold text-stone-800 text-base">등록된 반려견이 없습니다</h3>
          <p className="text-xs text-stone-500 max-w-sm mx-auto">
            우리 소중한 강아지를 등록하고 맞춤형 건강수첩과 접종 일정을 시작해 보세요!
          </p>
          <button
            onClick={() => {
              resetDogForm();
              setShowDogModal(true);
            }}
            className="px-5 py-2.5 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md shadow-teal-600/20"
          >
            + 첫 반려견 등록하기
          </button>
        </div>
      )}

      {/* Add / Edit Dog Modal */}
      {showDogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full max-h-[90vh] flex flex-col shadow-2xl border border-stone-200 overflow-hidden">
            <div className="p-4 border-b border-stone-100 flex items-center justify-between bg-stone-50">
              <h3 className="font-bold text-stone-900 text-sm">
                {editingDogId ? '반려견 정보 수정' : '새 반려견 등록'}
              </h3>
              <button
                onClick={() => setShowDogModal(false)}
                className="w-7 h-7 rounded-full bg-stone-200 text-stone-600 flex items-center justify-center text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-3 text-xs">
              <div>
                <label className="block font-bold text-stone-700 mb-1">이름 *</label>
                <input
                  type="text"
                  placeholder="예: 뽀삐"
                  value={dogName}
                  onChange={(e) => setDogName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">품종 *</label>
                  <input
                    type="text"
                    placeholder="예: 말티즈, 포메라니안"
                    value={dogBreed}
                    onChange={(e) => setDogBreed(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-700 mb-1">성별</label>
                  <select
                    value={dogGender}
                    onChange={(e) => setDogGender(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200"
                  >
                    <option value="neutered_male">중성화 완료 남아</option>
                    <option value="spayed_female">중성화 완료 여아</option>
                    <option value="male">남아</option>
                    <option value="female">여아</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">생일 또는 추정 연월</label>
                  <input
                    type="date"
                    value={dogBirthDate}
                    onChange={(e) => setDogBirthDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-700 mb-1">체중 (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="예: 4.2"
                    value={dogWeight}
                    onChange={(e) => setDogWeight(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">사진 URL</label>
                <input
                  type="text"
                  placeholder="https://..."
                  value={dogPhotoUrl}
                  onChange={(e) => setDogPhotoUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">알레르기 (음식/환경)</label>
                <input
                  type="text"
                  placeholder="예: 닭고기, 옥수수 글루텐, 꽃가루"
                  value={dogAllergies}
                  onChange={(e) => setDogAllergies(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">특이사항 및 건강 주의점</label>
                <textarea
                  rows={2}
                  placeholder="슬개골 탈구 1기, 귓병 주의, 겁이 많음 등"
                  value={dogNotes}
                  onChange={(e) => setDogNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200"
                />
              </div>

              <button
                onClick={handleSaveDog}
                className="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md transition-colors"
              >
                저장하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Health Record Modal */}
      {showHealthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full max-h-[90vh] flex flex-col shadow-2xl border border-stone-200 overflow-hidden">
            <div className="p-4 border-b border-stone-100 flex items-center justify-between bg-stone-50">
              <h3 className="font-bold text-stone-900 text-sm">
                {editingHealthRecordId ? '건강 기록 수정' : '건강 기록 추가'}
              </h3>
              <button
                onClick={() => {
                  setShowHealthModal(false);
                  resetHealthForm();
                }}
                className="w-7 h-7 rounded-full bg-stone-200 text-stone-600 flex items-center justify-center text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-3 text-xs">
              <div>
                <label className="block font-bold text-stone-700 mb-1">기록 유형 *</label>
                <select
                  value={healthType}
                  onChange={(e) => setHealthType(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200"
                >
                  <option value="vaccine">예방접종 (광견병, 종합백신 등)</option>
                  <option value="hospital">동물병원 방문 및 진료</option>
                  <option value="exam">정기 검진 및 정밀 검사</option>
                  <option value="medicine">약 복용 / 구충제 투약</option>
                  <option value="weight">체중 측정</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">항목명 / 진료명 *</label>
                <input
                  type="text"
                  placeholder="예: DHPPL 종합백신 5차, 귀 진드기 치료"
                  value={healthTitle}
                  onChange={(e) => setHealthTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">날짜 *</label>
                  <input
                    type="date"
                    value={healthDate}
                    onChange={(e) => setHealthDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-700 mb-1">다음 예정일</label>
                  <input
                    type="date"
                    value={healthNextDue}
                    onChange={(e) => setHealthNextDue(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">방문 병원명</label>
                  <input
                    type="text"
                    placeholder="예: 24시 청담우리동물병원"
                    value={healthHospital}
                    onChange={(e) => setHealthHospital(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-700 mb-1">진료비 (원)</label>
                  <input
                    type="number"
                    placeholder="예: 45000"
                    value={healthCost}
                    onChange={(e) => setHealthCost(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200"
                  />
                </div>
              </div>

              {healthType === 'weight' && (
                <div>
                  <label className="block font-bold text-stone-700 mb-1">체중 (kg)</label>
                  <input
                    type="number"
                    step="0.05"
                    placeholder="예: 3.85"
                    value={healthWeightKg}
                    onChange={(e) => setHealthWeightKg(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200"
                  />
                </div>
              )}

              <div>
                <label className="block font-bold text-stone-700 mb-1">수의사 소견 및 메모</label>
                <textarea
                  rows={2}
                  placeholder="주사 부위 부작용 없음, 3일간 목욕 금지 등"
                  value={healthNotes}
                  onChange={(e) => setHealthNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200"
                />
              </div>

              <button
                onClick={handleSaveHealthRecord}
                className="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md transition-colors"
              >
                {editingHealthRecordId ? '수정 내용 저장' : '기록 저장'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Reminder Modal */}
      {showReminderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl border border-stone-200">
            <h3 className="font-bold text-stone-900 text-sm mb-3">새 알림 일정 등록</h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-stone-700 mb-1">알림 유형</label>
                <select
                  value={remType}
                  onChange={(e) => setRemType(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200"
                >
                  <option value="medicine">💊 약 복용</option>
                  <option value="vaccine">💉 예방접종</option>
                  <option value="checkup">🩺 정기 검진</option>
                  <option value="grooming">✂️ 미용 / 목욕</option>
                  <option value="custom">🔔 기타 일정</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">일정 제목 *</label>
                <input
                  type="text"
                  placeholder="예: 심장사상충 예방약 먹이기"
                  value={remTitle}
                  onChange={(e) => setRemTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">날짜 *</label>
                  <input
                    type="date"
                    value={remDate}
                    onChange={(e) => setRemDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-700 mb-1">시간</label>
                  <input
                    type="time"
                    value={remTime}
                    onChange={(e) => setRemTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">메모</label>
                <input
                  type="text"
                  placeholder="예: 식후 간식과 함께 투약"
                  value={remMemo}
                  onChange={(e) => setRemMemo(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setShowReminderModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-stone-100 text-stone-700 font-bold"
                >
                  취소
                </button>
                <button
                  onClick={handleSaveReminder}
                  className="flex-1 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold shadow-xs"
                >
                  등록
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
