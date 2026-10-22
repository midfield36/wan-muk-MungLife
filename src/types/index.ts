export type KoreanRegion =
  | '전체'
  | '서울'
  | '경기'
  | '인천'
  | '부산'
  | '대구'
  | '광주'
  | '대전'
  | '울산'
  | '세종'
  | '강원'
  | '충북'
  | '충남'
  | '전북'
  | '전남'
  | '경북'
  | '경남'
  | '제주';

export type PlaceCategory =
  | 'all'
  | 'hospital_24h'
  | 'hospital_general'
  | 'hospital_night'
  | 'park'
  | 'cafe'
  | 'restaurant'
  | 'stay'
  | 'salon'
  | 'playground';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  termsAgreed: boolean;
  termsAgreedAt?: string;
  privacyAgreed: boolean;
  role: 'user' | 'admin';
  createdAt: string;
}

export type DogGender = 'male' | 'female' | 'neutered_male' | 'spayed_female';

export interface Dog {
  id: string;
  ownerId: string;
  familyIds?: string[];
  name: string;
  breed: string;
  gender: DogGender;
  birthDate?: string;
  weight?: number;
  neutered: boolean;
  allergies?: string;
  notes?: string;
  photoUrl?: string;
  createdAt: string;
  updatedAt?: string;
}

export type HealthRecordType = 'vaccine' | 'hospital' | 'exam' | 'weight' | 'medicine' | 'allergy';

export interface HealthRecord {
  id: string;
  dogId: string;
  ownerId: string;
  type: HealthRecordType;
  title: string;
  date: string;
  hospitalName?: string;
  cost?: number;
  nextDueDate?: string;
  weightKg?: number;
  notes?: string;
  photoUrl?: string;
  createdAt: string;
}

export interface Reminder {
  id: string;
  dogId: string;
  ownerId: string;
  title: string;
  date: string;
  time: string;
  type: 'vaccine' | 'medicine' | 'checkup' | 'grooming' | 'custom';
  isCompleted: boolean;
  memo?: string;
  createdAt: string;
}

export interface WalkPoint {
  lat: number;
  lng: number;
  timestamp: number;
}

export interface WalkRecord {
  id: string;
  dogId: string;
  dogName: string;
  ownerId: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  distanceMeters: number;
  path?: WalkPoint[];
  memo?: string;
  photoUrl?: string;
  peeCount?: number;
  pooCount?: number;
  createdAt: string;
}

export type MissingDogStatus = 'searching' | 'found';

export interface MissingDog {
  id: string;
  ownerId: string;
  dogName: string;
  breed: string;
  gender: string;
  size: '소형' | '중형' | '대형';
  color: string;
  characteristics: string;
  missingDate: string;
  missingCity: string;
  missingDistrict: string;
  missingAddress: string;
  contactName: string;
  contactChannel: string; // e.g. "멍라이프 안심제보톡" or "보호자 제보 전달"
  photoUrl: string;
  status: MissingDogStatus;
  reward?: string;
  notes?: string;
  createdAt: string;
}

export interface MissingDogReport {
  id: string;
  missingDogId: string;
  reporterId: string;
  reporterName: string;
  reporterContact?: string;
  spottedDate: string;
  spottedLocation: string;
  description: string;
  photoUrl?: string;
  createdAt: string;
}

export type CommunityCategory =
  | 'news' // 동네 소식
  | 'walk_meet' // 산책 모임
  | 'review' // 장소 방문 후기
  | 'qna' // 반려견 질문
  | 'daily' // 반려견 일상
  | 'tips'; // 유용한 정보

export interface CommunityPost {
  id: string;
  authorId: string;
  authorName: string;
  authorPhoto?: string;
  category: CommunityCategory;
  title: string;
  content: string;
  photoUrl?: string;
  likesCount: number;
  commentsCount: number;
  likedBy?: string[];
  createdAt: string;
  updatedAt?: string;
}

export interface PostComment {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  authorPhoto?: string;
  content: string;
  createdAt: string;
}

export interface Place {
  id: string;
  name: string;
  category: PlaceCategory;
  city: string;
  district: string;
  address: string;
  lat: number;
  lng: number;
  phone: string;
  businessHours: string;
  isEmergency?: boolean;
  nightCare?: boolean;
  parkingAvailable: boolean;
  largeDogAllowed: boolean;
  description: string;
  dogPolicy?: string;
  photoUrl?: string;
  rating: number;
  reviewCount: number;
  verifiedAt: string;
}

export interface PlaceReview {
  id: string;
  placeId: string;
  userId: string;
  userName: string;
  userPhoto?: string;
  dogBreed?: string;
  rating: number;
  content: string;
  visitDate: string;
  photoUrl?: string;
  createdAt: string;
}

export interface TravelChecklistItem {
  id: string;
  text: string;
  category: 'essential' | 'health' | 'hygiene' | 'comfort' | 'other';
  checked: boolean;
}

export interface TravelChecklist {
  id: string;
  userId: string;
  title: string;
  destination?: string;
  items: TravelChecklistItem[];
  createdAt: string;
  updatedAt: string;
}

export interface ModerationReport {
  id: string;
  reporterId: string;
  targetType: 'post' | 'comment' | 'missing' | 'place';
  targetId: string;
  reason: string;
  status: 'pending' | 'reviewed' | 'dismissed';
  createdAt: string;
}

export interface EmergencyActionItem {
  id: string;
  title: string;
  severity: 'critical' | 'high' | 'moderate';
  summary: string;
  symptoms: string[];
  safeActions: string[];
  prohibitedActions: string[];
  hospitalUrgency: string;
}
