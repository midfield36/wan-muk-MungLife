import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase/config';
import {
  Dog,
  HealthRecord,
  Reminder,
  WalkRecord,
  MissingDog,
  MissingDogReport,
  CommunityPost,
  PostComment,
  Place,
  PlaceReview,
  TravelChecklist,
  ModerationReport,
} from '../types';
import { VERIFIED_PLACES } from '../data/verifiedPlaces';

// Seed sample dogs for first time or demo
const SEED_DOGS: Dog[] = [
  {
    id: 'seed-dog-1',
    ownerId: 'demo-user-munglife',
    name: '뽀삐',
    breed: '말티즈',
    gender: 'neutered_male',
    birthDate: '2021-04-15',
    weight: 3.8,
    neutered: true,
    allergies: '닭고기, 옥수수 글루텐',
    notes: '슬개골 탈구 1기 관리 중, 귓병 주의',
    photoUrl: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=600&q=80',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'seed-dog-2',
    ownerId: 'demo-user-munglife',
    name: '초코',
    breed: '푸들',
    gender: 'female',
    birthDate: '2022-09-01',
    weight: 4.5,
    neutered: true,
    allergies: '없음',
    notes: '사교성이 좋고 산책을 매우 좋아함',
    photoUrl: 'https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&w=600&q=80',
    createdAt: new Date().toISOString(),
  },
];

const SEED_HEALTH_RECORDS: HealthRecord[] = [
  {
    id: 'hr-001',
    dogId: 'seed-dog-1',
    ownerId: 'demo-user-munglife',
    type: 'vaccine',
    title: '광견병 + 종합백신(DHPPL) 5차',
    date: '2024-11-20',
    hospitalName: '24시 청담우리동물병원',
    cost: 55000,
    nextDueDate: '2025-11-20',
    notes: '체온 정상, 주사 부위 이상 무. 내년 추가 접종 예정.',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'hr-002',
    dogId: 'seed-dog-1',
    ownerId: 'demo-user-munglife',
    type: 'exam',
    title: '정기 건강검진 및 슬개골 방사선',
    date: '2024-12-15',
    hospitalName: '24시 청담우리동물병원',
    cost: 180000,
    nextDueDate: '2025-06-15',
    weightKg: 3.8,
    notes: '좌측 슬개골 1기 유지 중, 체중 4kg 이하 유지 권고. 관절영양제 복용 권장.',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'hr-003',
    dogId: 'seed-dog-1',
    ownerId: 'demo-user-munglife',
    type: 'medicine',
    title: '심장사상충 예방약(하트가드) 투약',
    date: '2025-03-01',
    hospitalName: '가정 복용',
    cost: 12000,
    nextDueDate: '2025-04-01',
    notes: '매월 1일 정기 복용',
    createdAt: new Date().toISOString(),
  },
];

const SEED_REMINDERS: Reminder[] = [
  {
    id: 'rem-001',
    dogId: 'seed-dog-1',
    ownerId: 'demo-user-munglife',
    title: '심장사상충 예방약 투약',
    date: '2025-04-01',
    time: '09:00',
    type: 'medicine',
    isCompleted: false,
    memo: '식후 간식과 함께 투약',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'rem-002',
    dogId: 'seed-dog-1',
    ownerId: 'demo-user-munglife',
    title: '정기 치아 스케일링 예약',
    date: '2025-04-20',
    time: '14:00',
    type: 'checkup',
    isCompleted: false,
    memo: '오전 금식 필요',
    createdAt: new Date().toISOString(),
  },
];

const SEED_WALKS: WalkRecord[] = [
  {
    id: 'walk-001',
    dogId: 'seed-dog-1',
    dogName: '뽀삐',
    ownerId: 'demo-user-munglife',
    startTime: '2025-03-10T17:30:00',
    endTime: '2025-03-10T18:15:00',
    durationMinutes: 45,
    distanceMeters: 2450,
    memo: '한강공원 저녁 산책. 날씨 선선하고 강아지 친구들 많이 만남!',
    peeCount: 4,
    pooCount: 1,
    createdAt: new Date().toISOString(),
  },
];

const SEED_MISSING_DOGS: MissingDog[] = [
  {
    id: 'missing-001',
    ownerId: 'user-009',
    dogName: '몽이',
    breed: '시바견 (적색)',
    gender: '수컷(중성화 O)',
    size: '중형',
    color: '갈색과 흰색',
    characteristics: '빨간색 하네스 착용, 겁이 많아 큰 소리로 부르면 도망칠 수 있습니다. 꼬리가 돌돌 말려있음.',
    missingDate: '2025-03-12 오후 4시경',
    missingCity: '서울',
    missingDistrict: '마포구',
    missingAddress: '월드컵경기장역 2번 출구 인근 평화의공원 둘레길',
    contactName: '보호자',
    contactChannel: '멍라이프 안심제보톡 (보호자 전달)',
    photoUrl: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&w=600&q=80',
    status: 'searching',
    reward: '사례금 50만원',
    notes: '비가 오는 날이라 풀숲이나 지하 주차장 쪽에 숨어있을 가능성이 있습니다.',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'missing-002',
    ownerId: 'user-010',
    dogName: '구름이',
    breed: '비숑 프리제',
    gender: '암컷',
    size: '소형',
    color: '흰색',
    characteristics: '노란색 스카프를 두르고 있음, 사람을 아주 잘 따릅니다. 칩 등록 완료.',
    missingDate: '2025-03-08 오전 10시',
    missingCity: '경기',
    missingDistrict: '성남시 분당구',
    missingAddress: '율동공원 호수 산책로 B구역',
    contactName: '보호자',
    contactChannel: '멍라이프 안심제보톡',
    photoUrl: 'https://images.unsplash.com/photo-1591769225440-811ad7d6eab2?auto=format&fit=crop&w=600&q=80',
    status: 'found',
    notes: '친절하신 주민분의 제보로 당일 무사히 가족의 품으로 돌아왔습니다! 감사합니다.',
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
];

const SEED_POSTS: CommunityPost[] = [
  {
    id: 'post-001',
    authorId: 'user-001',
    authorName: '한강산책러',
    authorPhoto: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
    category: 'walk_meet',
    title: '이번 주말 마포 평화의공원 주말 모닝 산책 같이해요!',
    content: '토요일 오전 9시 30분에 평화의공원 반려견 놀이터 앞에서 소형견/중형견 위주로 산책 모임 하실 분 계실까요? 서로 간식도 나누고 매너 산책해요 :) 댓글 남겨주세요!',
    photoUrl: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=600&q=80',
    likesCount: 18,
    commentsCount: 6,
    likedBy: [],
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
  {
    id: 'post-002',
    authorId: 'user-002',
    authorName: '보더콜리맘',
    authorPhoto: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
    category: 'review',
    title: '가평 어반힐스 펫풀빌라 솔직 후기 (대형견 가능!)',
    content: '대형견 데리고 갈 수 있는 펜션 찾기 정말 어려웠는데, 개별 펜스랑 잔디마당이 너무 잘 되어있어서 목줄 없이 신나게 뛰놀았어요! 펫 드라이룸도 있어서 목욕시키기도 편했네요. 추천합니다.',
    photoUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80',
    likesCount: 34,
    commentsCount: 12,
    likedBy: [],
    createdAt: new Date(Date.now() - 3600000 * 18).toISOString(),
  },
  {
    id: 'post-003',
    authorId: 'user-003',
    authorName: '수의사친구',
    authorPhoto: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=150&q=80',
    category: 'tips',
    title: '봄철 산책 시 진드기 예방 및 산책 후 3분 체크리스트',
    content: '날씨가 따뜻해지면서 풀밭에 진드기가 급증하고 있습니다.\n\n1. 산책 전 외부구충제(프론트라인/브라벡토 등) 주기 확인\n2. 산책 후 발바닥, 귀 안쪽, 서혜부(사타구니) 빗질하며 검은 점 살피기\n3. 진드기 발견 시 핀셋으로 피부에 밀착시켜 수직으로 당겨 빼야 주둥이가 남지 않습니다.\n\n모두 안전한 봄 산책 되세요!',
    likesCount: 62,
    commentsCount: 9,
    likedBy: [],
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
];

const SEED_COMMENTS: PostComment[] = [
  {
    id: 'comm-001',
    postId: 'post-001',
    authorId: 'user-004',
    authorName: '푸들이네',
    content: '저희 푸들도 참여하고 싶어요! 3살인데 조금 소심해서 천천히 인사 나누면 좋겠어요.',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 'comm-002',
    postId: 'post-001',
    authorId: 'user-005',
    authorName: '초코보호자',
    content: '오 저도 마포 주민인데 참여할게요! 물그릇 챙겨가겠습니다 ㅎㅎ',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
];

const DEFAULT_TRAVEL_CHECKLIST_ITEMS = [
  { id: 'chk-1', text: '목줄 및 하네스 (인식표 부착)', category: 'essential' as const, checked: true },
  { id: 'chk-2', text: '배변봉투 & 물티슈', category: 'hygiene' as const, checked: true },
  { id: 'chk-3', text: '휴대용 물통 & 접이식 물그릇', category: 'essential' as const, checked: true },
  { id: 'chk-4', text: '사료 (식사 횟수 + 1회분 여유)', category: 'essential' as const, checked: false },
  { id: 'chk-5', text: '평소 먹는 간식', category: 'comfort' as const, checked: false },
  { id: 'chk-6', text: '복용 중인 약 & 비상약', category: 'health' as const, checked: false },
  { id: 'chk-7', text: '예방접종 증명서 / 동물등록증', category: 'health' as const, checked: false },
  { id: 'chk-8', text: '차량용 카시트 또는 이동장', category: 'essential' as const, checked: false },
  { id: 'chk-9', text: '반려견 전용 수건 & 발세정제', category: 'hygiene' as const, checked: false },
  { id: 'chk-10', text: '애착 장난감 또는 담요', category: 'comfort' as const, checked: false },
  { id: 'chk-11', text: '매너밸트 / 기저귀 (실내 카페/숙소 필수)', category: 'hygiene' as const, checked: false },
];

// Local storage helper
function getLocal<T>(key: string, defaultValue: T): T {
  try {
    const val = localStorage.getItem(`munglife_${key}`);
    return val ? JSON.parse(val) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function setLocal<T>(key: string, value: T): void {
  try {
    localStorage.setItem(`munglife_${key}`, JSON.stringify(value));
  } catch (e) {
    console.warn('localStorage save failed', e);
  }
}

/* ==============================================================
   DOGS SERVICE
============================================================== */
export async function fetchDogs(userId: string): Promise<Dog[]> {
  try {
    const q = query(collection(db, 'dogs'), where('ownerId', '==', userId));
    const snap = await getDocs(q);
    const docs = snap.docs.map(d => ({ id: d.id, ...d.data() } as Dog));
    if (docs.length > 0) {
      setLocal(`dogs_${userId}`, docs);
      return docs;
    }
  } catch (error) {
    console.warn('Firestore fetchDogs fallback to local:', error);
  }
  const cached = getLocal<Dog[]>(`dogs_${userId}`, []);
  if (cached.length === 0 && userId.includes('demo')) {
    setLocal(`dogs_${userId}`, SEED_DOGS);
    return SEED_DOGS;
  }
  return cached;
}

export async function saveDog(dog: Omit<Dog, 'id' | 'createdAt'> & { id?: string }): Promise<Dog> {
  const isUpdate = !!dog.id;
  const dogId = dog.id || `dog_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const fullDog: Dog = {
    ...dog,
    id: dogId,
    createdAt: (dog as any).createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Firestore attempt
  try {
    const docRef = doc(db, 'dogs', dogId);
    await setDoc(docRef, fullDog);
  } catch (error) {
    console.warn('Firestore saveDog error, saving locally:', error);
  }

  // Local sync
  const current = getLocal<Dog[]>(`dogs_${dog.ownerId}`, []);
  const updated = isUpdate
    ? current.map(d => (d.id === dogId ? fullDog : d))
    : [fullDog, ...current];
  setLocal(`dogs_${dog.ownerId}`, updated);

  return fullDog;
}

export async function removeDog(dogId: string, ownerId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'dogs', dogId));
  } catch (error) {
    console.warn('Firestore removeDog error, deleting locally:', error);
  }
  const current = getLocal<Dog[]>(`dogs_${ownerId}`, []);
  setLocal(`dogs_${ownerId}`, current.filter(d => d.id !== dogId));
}

/* ==============================================================
   HEALTH RECORDS SERVICE
============================================================== */
export async function fetchHealthRecords(dogId: string, ownerId: string): Promise<HealthRecord[]> {
  try {
    const q = query(
      collection(db, 'healthRecords'),
      where('dogId', '==', dogId),
      where('ownerId', '==', ownerId)
    );
    const snap = await getDocs(q);
    const docs = snap.docs.map(d => ({ id: d.id, ...d.data() } as HealthRecord));
    if (docs.length > 0) {
      setLocal(`health_${dogId}`, docs);
      return docs;
    }
  } catch (error) {
    console.warn('Firestore fetchHealthRecords fallback to local:', error);
  }
  const cached = getLocal<HealthRecord[]>(`health_${dogId}`, []);
  if (cached.length === 0 && dogId.includes('seed')) {
    setLocal(`health_${dogId}`, SEED_HEALTH_RECORDS);
    return SEED_HEALTH_RECORDS;
  }
  return cached;
}

export async function saveHealthRecord(record: Omit<HealthRecord, 'id' | 'createdAt'> & { id?: string }): Promise<HealthRecord> {
  const isUpdate = !!record.id;
  const id = record.id || `hr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const fullRecord: HealthRecord = {
    ...record,
    id,
    createdAt: (record as any).createdAt || new Date().toISOString(),
  };

  try {
    await setDoc(doc(db, 'healthRecords', id), fullRecord);
  } catch (error) {
    console.warn('Firestore saveHealthRecord error:', error);
  }

  const current = getLocal<HealthRecord[]>(`health_${record.dogId}`, []);
  const updated = isUpdate
    ? current.map(r => (r.id === id ? fullRecord : r))
    : [fullRecord, ...current];
  setLocal(`health_${record.dogId}`, updated);
  return fullRecord;
}

export async function removeHealthRecord(recordId: string, dogId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'healthRecords', recordId));
  } catch (error) {
    console.warn('Firestore removeHealthRecord error:', error);
  }
  const current = getLocal<HealthRecord[]>(`health_${dogId}`, []);
  setLocal(`health_${dogId}`, current.filter(r => r.id !== recordId));
}

/* ==============================================================
   REMINDERS SERVICE
============================================================== */
export async function fetchReminders(dogId: string, ownerId: string): Promise<Reminder[]> {
  try {
    const q = query(
      collection(db, 'reminders'),
      where('dogId', '==', dogId),
      where('ownerId', '==', ownerId)
    );
    const snap = await getDocs(q);
    const docs = snap.docs.map(d => ({ id: d.id, ...d.data() } as Reminder));
    if (docs.length > 0) {
      setLocal(`reminders_${dogId}`, docs);
      return docs;
    }
  } catch (error) {
    console.warn('Firestore fetchReminders fallback to local:', error);
  }
  const cached = getLocal<Reminder[]>(`reminders_${dogId}`, []);
  if (cached.length === 0 && dogId.includes('seed')) {
    setLocal(`reminders_${dogId}`, SEED_REMINDERS);
    return SEED_REMINDERS;
  }
  return cached;
}

export async function saveReminder(reminder: Omit<Reminder, 'id' | 'createdAt'> & { id?: string }): Promise<Reminder> {
  const id = reminder.id || `rem_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const fullReminder: Reminder = {
    ...reminder,
    id,
    createdAt: (reminder as any).createdAt || new Date().toISOString(),
  };

  try {
    await setDoc(doc(db, 'reminders', id), fullReminder);
  } catch (error) {
    console.warn('Firestore saveReminder error:', error);
  }

  const current = getLocal<Reminder[]>(`reminders_${reminder.dogId}`, []);
  const exists = current.some(r => r.id === id);
  const updated = exists ? current.map(r => (r.id === id ? fullReminder : r)) : [fullReminder, ...current];
  setLocal(`reminders_${reminder.dogId}`, updated);
  return fullReminder;
}

export async function toggleReminderStatus(reminderId: string, dogId: string, completed: boolean): Promise<void> {
  try {
    await updateDoc(doc(db, 'reminders', reminderId), { isCompleted: completed });
  } catch (error) {
    console.warn('Firestore toggleReminderStatus error:', error);
  }
  const current = getLocal<Reminder[]>(`reminders_${dogId}`, []);
  setLocal(
    `reminders_${dogId}`,
    current.map(r => (r.id === reminderId ? { ...r, isCompleted: completed } : r))
  );
}

export async function removeReminder(reminderId: string, dogId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'reminders', reminderId));
  } catch (error) {
    console.warn('Firestore removeReminder error:', error);
  }
  const current = getLocal<Reminder[]>(`reminders_${dogId}`, []);
  setLocal(`reminders_${dogId}`, current.filter(r => r.id !== reminderId));
}

/* ==============================================================
   WALKS SERVICE
============================================================== */
export async function fetchWalks(ownerId: string): Promise<WalkRecord[]> {
  try {
    const q = query(collection(db, 'walks'), where('ownerId', '==', ownerId));
    const snap = await getDocs(q);
    const docs = snap.docs.map(d => ({ id: d.id, ...d.data() } as WalkRecord));
    if (docs.length > 0) {
      setLocal(`walks_${ownerId}`, docs);
      return docs;
    }
  } catch (error) {
    console.warn('Firestore fetchWalks fallback to local:', error);
  }
  const cached = getLocal<WalkRecord[]>(`walks_${ownerId}`, []);
  if (cached.length === 0 && ownerId.includes('demo')) {
    setLocal(`walks_${ownerId}`, SEED_WALKS);
    return SEED_WALKS;
  }
  return cached;
}

export async function saveWalk(walk: Omit<WalkRecord, 'id' | 'createdAt'>): Promise<WalkRecord> {
  const id = `walk_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const fullWalk: WalkRecord = {
    ...walk,
    id,
    createdAt: new Date().toISOString(),
  };

  try {
    await setDoc(doc(db, 'walks', id), fullWalk);
  } catch (error) {
    console.warn('Firestore saveWalk error:', error);
  }

  const current = getLocal<WalkRecord[]>(`walks_${walk.ownerId}`, []);
  setLocal(`walks_${walk.ownerId}`, [fullWalk, ...current]);
  return fullWalk;
}

export async function removeWalk(walkId: string, ownerId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'walks', walkId));
  } catch (error) {
    console.warn('Firestore removeWalk error:', error);
  }
  const current = getLocal<WalkRecord[]>(`walks_${ownerId}`, []);
  setLocal(`walks_${ownerId}`, current.filter(w => w.id !== walkId));
}

/* ==============================================================
   MISSING DOGS & SIGHTING REPORTS
============================================================== */
export async function fetchMissingDogs(): Promise<MissingDog[]> {
  try {
    const snap = await getDocs(collection(db, 'missingDogs'));
    const docs = snap.docs.map(d => ({ id: d.id, ...d.data() } as MissingDog));
    if (docs.length > 0) {
      setLocal('missing_dogs', docs);
      return docs;
    }
  } catch (error) {
    console.warn('Firestore fetchMissingDogs fallback:', error);
  }
  const cached = getLocal<MissingDog[]>('missing_dogs', []);
  if (cached.length === 0) {
    setLocal('missing_dogs', SEED_MISSING_DOGS);
    return SEED_MISSING_DOGS;
  }
  return cached;
}

export async function saveMissingDog(report: Omit<MissingDog, 'id' | 'createdAt'>): Promise<MissingDog> {
  const id = `missing_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const full: MissingDog = {
    ...report,
    id,
    createdAt: new Date().toISOString(),
  };

  try {
    await setDoc(doc(db, 'missingDogs', id), full);
  } catch (error) {
    console.warn('Firestore saveMissingDog error:', error);
  }

  const current = getLocal<MissingDog[]>('missing_dogs', SEED_MISSING_DOGS);
  const updated = [full, ...current];
  setLocal('missing_dogs', updated);
  return full;
}

export async function updateMissingDogStatus(id: string, status: 'searching' | 'found'): Promise<void> {
  try {
    await updateDoc(doc(db, 'missingDogs', id), { status });
  } catch (error) {
    console.warn('Firestore updateMissingDogStatus error:', error);
  }
  const current = getLocal<MissingDog[]>('missing_dogs', SEED_MISSING_DOGS);
  setLocal(
    'missing_dogs',
    current.map(m => (m.id === id ? { ...m, status } : m))
  );
}

export async function saveMissingDogReport(report: Omit<MissingDogReport, 'id' | 'createdAt'>): Promise<MissingDogReport> {
  const id = `tip_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const full: MissingDogReport = {
    ...report,
    id,
    createdAt: new Date().toISOString(),
  };
  try {
    await setDoc(doc(db, 'missingDogReports', id), full);
  } catch (error) {
    console.warn('Firestore saveMissingDogReport error:', error);
  }
  const current = getLocal<MissingDogReport[]>(`tips_${report.missingDogId}`, []);
  setLocal(`tips_${report.missingDogId}`, [full, ...current]);
  return full;
}

export async function fetchMissingDogReports(missingDogId: string): Promise<MissingDogReport[]> {
  try {
    const q = query(collection(db, 'missingDogReports'), where('missingDogId', '==', missingDogId));
    const snap = await getDocs(q);
    const docs = snap.docs.map(d => ({ id: d.id, ...d.data() } as MissingDogReport));
    if (docs.length > 0) return docs;
  } catch (error) {
    console.warn('Firestore fetchMissingDogReports fallback:', error);
  }
  return getLocal<MissingDogReport[]>(`tips_${missingDogId}`, []);
}

/* ==============================================================
   COMMUNITY POSTS & COMMENTS
============================================================== */
export async function fetchPosts(): Promise<CommunityPost[]> {
  try {
    const snap = await getDocs(collection(db, 'communityPosts'));
    const docs = snap.docs.map(d => ({ id: d.id, ...d.data() } as CommunityPost));
    if (docs.length > 0) {
      setLocal('community_posts', docs);
      return docs;
    }
  } catch (error) {
    console.warn('Firestore fetchPosts fallback:', error);
  }
  const cached = getLocal<CommunityPost[]>('community_posts', []);
  if (cached.length === 0) {
    setLocal('community_posts', SEED_POSTS);
    return SEED_POSTS;
  }
  return cached;
}

export async function savePost(post: Omit<CommunityPost, 'id' | 'createdAt' | 'likesCount' | 'commentsCount'>): Promise<CommunityPost> {
  const id = `post_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const full: CommunityPost = {
    ...post,
    id,
    likesCount: 0,
    commentsCount: 0,
    likedBy: [],
    createdAt: new Date().toISOString(),
  };
  try {
    await setDoc(doc(db, 'communityPosts', id), full);
  } catch (error) {
    console.warn('Firestore savePost error:', error);
  }
  const current = getLocal<CommunityPost[]>('community_posts', SEED_POSTS);
  setLocal('community_posts', [full, ...current]);
  return full;
}

export async function updatePost(postId: string, updates: Partial<Pick<CommunityPost, 'title' | 'content' | 'category' | 'photoUrl'>>): Promise<void> {
  try {
    await updateDoc(doc(db, 'communityPosts', postId), {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.warn('Firestore updatePost error:', error);
  }
  const current = getLocal<CommunityPost[]>('community_posts', SEED_POSTS);
  setLocal(
    'community_posts',
    current.map(p => (p.id === postId ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p))
  );
}

export async function deletePost(postId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'communityPosts', postId));
  } catch (error) {
    console.warn('Firestore deletePost error:', error);
  }
  const current = getLocal<CommunityPost[]>('community_posts', SEED_POSTS);
  setLocal('community_posts', current.filter(p => p.id !== postId));
}

export async function deleteMissingDog(dogId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'missingDogs', dogId));
  } catch (error) {
    console.warn('Firestore deleteMissingDog error:', error);
  }
  const current = getLocal<MissingDog[]>('missing_dogs', SEED_MISSING_DOGS);
  setLocal('missing_dogs', current.filter(d => d.id !== dogId));
}

export async function updateMissingDog(dogId: string, updates: Partial<MissingDog>): Promise<void> {
  try {
    await updateDoc(doc(db, 'missingDogs', dogId), updates);
  } catch (error) {
    console.warn('Firestore updateMissingDog error:', error);
  }
  const current = getLocal<MissingDog[]>('missing_dogs', SEED_MISSING_DOGS);
  setLocal('missing_dogs', current.map(d => (d.id === dogId ? { ...d, ...updates } : d)));
}

export async function togglePostLike(postId: string, userId: string): Promise<{ likesCount: number; isLiked: boolean }> {
  const current = getLocal<CommunityPost[]>('community_posts', SEED_POSTS);
  const target = current.find(p => p.id === postId);
  if (!target) return { likesCount: 0, isLiked: false };

  const likedBy = target.likedBy || [];
  const isLiked = likedBy.includes(userId);
  const nextLikedBy = isLiked ? likedBy.filter(uid => uid !== userId) : [...likedBy, userId];
  const nextCount = Math.max(0, isLiked ? target.likesCount - 1 : target.likesCount + 1);

  try {
    await updateDoc(doc(db, 'communityPosts', postId), {
      likesCount: nextCount,
      likedBy: nextLikedBy,
    });
  } catch (error) {
    console.warn('Firestore togglePostLike error:', error);
  }

  setLocal(
    'community_posts',
    current.map(p => (p.id === postId ? { ...p, likesCount: nextCount, likedBy: nextLikedBy } : p))
  );

  return { likesCount: nextCount, isLiked: !isLiked };
}

export async function fetchComments(postId: string): Promise<PostComment[]> {
  try {
    const q = query(collection(db, 'comments'), where('postId', '==', postId));
    const snap = await getDocs(q);
    const docs = snap.docs.map(d => ({ id: d.id, ...d.data() } as PostComment));
    if (docs.length > 0) return docs;
  } catch (error) {
    console.warn('Firestore fetchComments fallback:', error);
  }
  const cached = getLocal<PostComment[]>(`comments_${postId}`, []);
  if (cached.length === 0 && postId === 'post-001') {
    setLocal(`comments_${postId}`, SEED_COMMENTS);
    return SEED_COMMENTS;
  }
  return cached;
}

export async function saveComment(comment: Omit<PostComment, 'id' | 'createdAt'>): Promise<PostComment> {
  const id = `comm_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const full: PostComment = {
    ...comment,
    id,
    createdAt: new Date().toISOString(),
  };

  try {
    await setDoc(doc(db, 'comments', id), full);
  } catch (error) {
    console.warn('Firestore saveComment error:', error);
  }

  const current = getLocal<PostComment[]>(`comments_${comment.postId}`, []);
  setLocal(`comments_${comment.postId}`, [...current, full]);

  // Increment comments count on post
  const posts = getLocal<CommunityPost[]>('community_posts', SEED_POSTS);
  setLocal(
    'community_posts',
    posts.map(p => (p.id === comment.postId ? { ...p, commentsCount: p.commentsCount + 1 } : p))
  );

  return full;
}

export async function deleteComment(commentId: string, postId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'comments', commentId));
  } catch (error) {
    console.warn('Firestore deleteComment error:', error);
  }
  const current = getLocal<PostComment[]>(`comments_${postId}`, []);
  setLocal(`comments_${postId}`, current.filter(c => c.id !== commentId));

  const posts = getLocal<CommunityPost[]>('community_posts', SEED_POSTS);
  setLocal(
    'community_posts',
    posts.map(p => (p.id === postId ? { ...p, commentsCount: Math.max(0, p.commentsCount - 1) } : p))
  );
}

/* ==============================================================
   PLACES & REVIEWS
============================================================== */
export async function fetchPlaces(): Promise<Place[]> {
  try {
    const snap = await getDocs(collection(db, 'places'));
    const customPlaces = snap.docs.map(d => ({ id: d.id, ...d.data() } as Place));
    const merged = [...VERIFIED_PLACES];
    customPlaces.forEach(cp => {
      if (!merged.some(p => p.id === cp.id)) merged.push(cp);
    });
    return merged;
  } catch (error) {
    console.warn('Firestore fetchPlaces fallback:', error);
  }
  return VERIFIED_PLACES;
}

export async function fetchPlaceReviews(placeId: string): Promise<PlaceReview[]> {
  try {
    const q = query(collection(db, 'reviews'), where('placeId', '==', placeId));
    const snap = await getDocs(q);
    const docs = snap.docs.map(d => ({ id: d.id, ...d.data() } as PlaceReview));
    if (docs.length > 0) return docs;
  } catch (error) {
    console.warn('Firestore fetchPlaceReviews fallback:', error);
  }
  return getLocal<PlaceReview[]>(`reviews_${placeId}`, []);
}

export async function savePlaceReview(review: Omit<PlaceReview, 'id' | 'createdAt'>): Promise<PlaceReview> {
  const id = `rev_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const full: PlaceReview = {
    ...review,
    id,
    createdAt: new Date().toISOString(),
  };
  try {
    await setDoc(doc(db, 'reviews', id), full);
  } catch (error) {
    console.warn('Firestore savePlaceReview error:', error);
  }
  const current = getLocal<PlaceReview[]>(`reviews_${review.placeId}`, []);
  setLocal(`reviews_${review.placeId}`, [full, ...current]);
  return full;
}

/* ==============================================================
   TRAVEL CHECKLIST SERVICE
============================================================== */
export async function fetchTravelChecklist(userId: string): Promise<TravelChecklist> {
  try {
    const docSnap = await getDoc(doc(db, 'travelChecklists', userId));
    if (docSnap.exists()) {
      return docSnap.data() as TravelChecklist;
    }
  } catch (error) {
    console.warn('Firestore fetchTravelChecklist fallback:', error);
  }

  const cached = getLocal<TravelChecklist | null>(`checklist_${userId}`, null);
  if (cached) return cached;

  const initial: TravelChecklist = {
    id: userId,
    userId,
    title: '우리 강아지 여행 준비물',
    items: DEFAULT_TRAVEL_CHECKLIST_ITEMS,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  setLocal(`checklist_${userId}`, initial);
  return initial;
}

export async function saveTravelChecklist(checklist: TravelChecklist): Promise<void> {
  try {
    await setDoc(doc(db, 'travelChecklists', checklist.userId), {
      ...checklist,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.warn('Firestore saveTravelChecklist error:', error);
  }
  setLocal(`checklist_${checklist.userId}`, checklist);
}

/* ==============================================================
   MODERATION & REPORTS
============================================================== */
export async function submitReport(report: Omit<ModerationReport, 'id' | 'createdAt' | 'status'>): Promise<void> {
  const id = `rep_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const full: ModerationReport = {
    ...report,
    id,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };
  try {
    await setDoc(doc(db, 'reports', id), full);
  } catch (error) {
    console.warn('Firestore submitReport error:', error);
  }
  const current = getLocal<ModerationReport[]>('reports', []);
  setLocal('reports', [full, ...current]);
}

export async function fetchReports(): Promise<ModerationReport[]> {
  try {
    const snap = await getDocs(collection(db, 'reports'));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as ModerationReport));
  } catch (error) {
    console.warn('Firestore fetchReports fallback:', error);
  }
  return getLocal<ModerationReport[]>('reports', []);
}

export async function updateReportStatus(reportId: string, status: 'reviewed' | 'dismissed'): Promise<void> {
  try {
    await updateDoc(doc(db, 'reports', reportId), { status });
  } catch (error) {
    console.warn('Firestore updateReportStatus error:', error);
  }
  const current = getLocal<ModerationReport[]>('reports', []);
  setLocal(
    'reports',
    current.map(r => (r.id === reportId ? { ...r, status } : r))
  );
}
