import React, { useEffect, useState } from 'react';
import { KoreanRegion, Place, Reminder, WalkRecord, CommunityPost, Dog } from '../../types';
import { useAuth } from '../../firebase/authContext';
import { fetchPlaces, fetchReminders, fetchWalks, fetchPosts, fetchDogs } from '../../services/dbService';
import {
  MapPin,
  AlertTriangle,
  Heart,
  Footprints,
  MessageSquare,
  Sparkles,
  Phone,
  Clock,
  Calendar,
  ChevronRight,
  ShieldAlert,
  ArrowRight,
  Plus,
} from 'lucide-react';

interface HomeScreenProps {
  selectedRegion: KoreanRegion;
  onNavigate: (tab: string, subView?: string) => void;
  onOpenAi: () => void;
  onOpenAuth: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  selectedRegion,
  onNavigate,
  onOpenAi,
  onOpenAuth,
}) => {
  const { isLoggedIn, userProfile } = useAuth();
  const [places, setPlaces] = useState<Place[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [recentWalk, setRecentWalk] = useState<WalkRecord | null>(null);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [activeDog, setActiveDog] = useState<Dog | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const allPlaces = await fetchPlaces();
        setPlaces(allPlaces);

        const allPosts = await fetchPosts();
        setPosts(allPosts.slice(0, 3));

        if (isLoggedIn && userProfile) {
          const dogs = await fetchDogs(userProfile.uid);
          if (dogs.length > 0) {
            setActiveDog(dogs[0]);
            const rems = await fetchReminders(dogs[0].id, userProfile.uid);
            setReminders(rems.filter(r => !r.isCompleted).slice(0, 2));
          }
          const walks = await fetchWalks(userProfile.uid);
          if (walks.length > 0) {
            setRecentWalk(walks[0]);
          }
        }
      } catch (err) {
        console.warn('Failed to load home data', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [isLoggedIn, userProfile]);

  // Filter nearby 24h emergency hospitals
  const emergencyHospitals = places.filter(p => {
    const isHospital = p.category === 'hospital_24h' || p.isEmergency;
    if (selectedRegion === '전체') return isHospital;
    return isHospital && p.city.includes(selectedRegion);
  });

  // Filter nearby general places in selected region
  const nearbyPlaces = places
    .filter(p => selectedRegion === '전체' || p.city.includes(selectedRegion))
    .slice(0, 3);

  return (
    <div className="space-y-6 pb-20">
      {/* Hero Welcome Banner */}
      <section className="relative overflow-hidden rounded-3xl bg-linear-to-br from-teal-700 via-teal-600 to-emerald-600 text-white p-6 sm:p-8 shadow-xl shadow-teal-900/10">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-teal-50 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>우리 강아지와 함께하는 모든 순간</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight">
            오늘도 우리 강아지와 <br className="hidden sm:inline" />
            <span className="text-amber-200">행복한 하루!</span> 🐾
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-teal-100 leading-relaxed max-w-lg">
            {activeDog
              ? `${activeDog.name}(${activeDog.breed})와 함께하는 건강하고 즐거운 일상을 멍라이프가 지원합니다.`
              : '주변 동물병원, 산책길 찾기부터 건강수첩과 실종견 안심 제보까지 모두 연결되어 있어요.'}
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => onNavigate('walk', 'tracker')}
              className="px-4 py-2.5 rounded-xl bg-white text-teal-800 hover:bg-teal-50 font-bold text-xs shadow-md transition-all active:scale-95 flex items-center gap-1.5"
            >
              <Footprints className="w-4 h-4 text-teal-600" />
              <span>산책 시작하기</span>
            </button>
            <button
              onClick={onOpenAi}
              className="px-4 py-2.5 rounded-xl bg-teal-800/60 hover:bg-teal-800 border border-teal-400/40 text-white font-bold text-xs backdrop-blur-xs transition-all active:scale-95 flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>AI에게 양육 질문하기</span>
            </button>
          </div>
        </div>

        {/* Decorative background paw */}
        <div className="absolute -right-6 -bottom-8 opacity-15 text-white pointer-events-none text-9xl">
          🐾
        </div>
      </section>

      {/* Emergency Alert Banner (Top Urgent Action) */}
      <section className="p-4 rounded-2xl bg-linear-to-r from-rose-500 to-red-600 text-white shadow-lg shadow-rose-600/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-white/20 backdrop-blur-md shrink-0">
            <AlertTriangle className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-white text-rose-700 text-[10px] font-extrabold uppercase">
                EMERGENCY
              </span>
              <h3 className="font-extrabold text-sm sm:text-base">24시 긴급 동물병원 & 응급 가이드</h3>
            </div>
            <p className="text-xs text-rose-100 mt-0.5">
              야간·휴일 위급 상황 시 즉시 연결되는 병원과 골든타임 응급 처치법을 확인하세요.
            </p>
          </div>
        </div>
        <button
          onClick={() => onNavigate('emergency')}
          className="self-stretch sm:self-auto px-4 py-2.5 rounded-xl bg-white hover:bg-rose-50 text-rose-700 font-bold text-xs shadow-md shrink-0 flex items-center justify-center gap-1 transition-transform active:scale-95"
        >
          <span>병원 찾기 & 전화</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </section>

      {/* 5 Core Feature Cards Grid */}
      <section>
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="text-base font-bold text-stone-900 tracking-tight">핵심 서비스 바로가기</h2>
          <span className="text-xs text-stone-500 font-medium">5대 필수 기능</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {/* 1. 주변찾기 */}
          <div
            onClick={() => onNavigate('places')}
            className="group p-4 rounded-3xl bg-teal-600 hover:bg-teal-700 border border-teal-500/60 shadow-md hover:shadow-xl transition-all duration-200 cursor-pointer flex flex-col justify-between text-white active:scale-98"
          >
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-xs text-white flex items-center justify-center text-2xl group-hover:scale-110 transition-transform mb-3 shadow-2xs">
              🏥
            </div>
            <div>
              <span className="text-[11px] font-bold text-teal-100">01. 주변찾기</span>
              <h3 className="font-extrabold text-white text-sm mt-0.5">지도 기반 장소</h3>
              <p className="text-[11px] text-teal-50/90 mt-1 line-clamp-2 leading-relaxed">
                24시 병원, 동반 카페, 산책로, 펫호텔
              </p>
            </div>
            <div className="mt-3 flex items-center text-[11px] font-bold text-teal-100 group-hover:text-white transition-colors">
              <span>장소 둘러보기</span>
              <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* 2. 긴급도움 */}
          <div
            onClick={() => onNavigate('emergency')}
            className="group p-4 rounded-3xl bg-teal-600 hover:bg-teal-700 border border-teal-500/60 shadow-md hover:shadow-xl transition-all duration-200 cursor-pointer flex flex-col justify-between text-white active:scale-98 relative overflow-hidden"
          >
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-xs text-white flex items-center justify-center text-2xl group-hover:scale-110 transition-transform mb-3 shadow-2xs">
              🚨
            </div>
            <div>
              <span className="text-[11px] font-extrabold text-amber-200">02. 긴급도움</span>
              <h3 className="font-extrabold text-white text-sm mt-0.5">실종견 & 응급병원</h3>
              <p className="text-[11px] text-teal-50/90 mt-1 line-clamp-2 leading-relaxed">
                야간 진료, 안심 실종 신고 및 목격 제보
              </p>
            </div>
            <div className="mt-3 flex items-center text-[11px] font-bold text-amber-200 group-hover:text-white transition-colors">
              <span>긴급 지원</span>
              <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* 3. 우리강아지 */}
          <div
            onClick={() => onNavigate('dog')}
            className="group p-4 rounded-3xl bg-teal-600 hover:bg-teal-700 border border-teal-500/60 shadow-md hover:shadow-xl transition-all duration-200 cursor-pointer flex flex-col justify-between text-white active:scale-98"
          >
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-xs text-white flex items-center justify-center text-2xl group-hover:scale-110 transition-transform mb-3 shadow-2xs">
              📋
            </div>
            <div>
              <span className="text-[11px] font-bold text-teal-100">03. 우리강아지</span>
              <h3 className="font-extrabold text-white text-sm mt-0.5">건강수첩 & 일정</h3>
              <p className="text-[11px] text-teal-50/90 mt-1 line-clamp-2 leading-relaxed">
                백신 접종일정, 체중 기록, 투약 알림
              </p>
            </div>
            <div className="mt-3 flex items-center text-[11px] font-bold text-teal-100 group-hover:text-white transition-colors">
              <span>건강 관리</span>
              <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* 4. 산책·여행 */}
          <div
            onClick={() => onNavigate('walk')}
            className="group p-4 rounded-3xl bg-teal-600 hover:bg-teal-700 border border-teal-500/60 shadow-md hover:shadow-xl transition-all duration-200 cursor-pointer flex flex-col justify-between text-white active:scale-98"
          >
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-xs text-white flex items-center justify-center text-2xl group-hover:scale-110 transition-transform mb-3 shadow-2xs">
              🦮
            </div>
            <div>
              <span className="text-[11px] font-bold text-teal-100">04. 산책·여행</span>
              <h3 className="font-extrabold text-white text-sm mt-0.5">GPS 산책 & 체크리스트</h3>
              <p className="text-[11px] text-teal-50/90 mt-1 line-clamp-2 leading-relaxed">
                거리 측정, 추천 산책로, 여행 짐싸기
              </p>
            </div>
            <div className="mt-3 flex items-center text-[11px] font-bold text-teal-100 group-hover:text-white transition-colors">
              <span>기록 및 계획</span>
              <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* 5. 이야기나눔 */}
          <div
            onClick={() => onNavigate('community')}
            className="group p-4 rounded-3xl bg-teal-600 hover:bg-teal-700 border border-teal-500/60 shadow-md hover:shadow-xl transition-all duration-200 cursor-pointer flex flex-col justify-between text-white active:scale-98 col-span-2 md:col-span-1"
          >
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-xs text-white flex items-center justify-center text-2xl group-hover:scale-110 transition-transform mb-3 shadow-2xs">
              💬
            </div>
            <div>
              <span className="text-[11px] font-bold text-teal-100">05. 이야기나눔</span>
              <h3 className="font-extrabold text-white text-sm mt-0.5">보호자 커뮤니티</h3>
              <p className="text-[11px] text-teal-50/90 mt-1 line-clamp-2 leading-relaxed">
                동네 소식, 산책 친구 모임, 솔직 후기
              </p>
            </div>
            <div className="mt-3 flex items-center text-[11px] font-bold text-teal-100 group-hover:text-white transition-colors">
              <span>이야기 참여</span>
              <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </section>

      {/* Two Columns: Health Reminders & Recent Walk */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left: Upcoming Health & Medication Schedule */}
        <div className="p-5 rounded-3xl bg-white border border-stone-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-teal-600" />
                <h3 className="font-bold text-stone-900 text-sm">다가오는 건강 & 투약 일정</h3>
              </div>
              <button
                onClick={() => onNavigate('dog', 'reminders')}
                className="text-xs text-teal-700 hover:underline font-semibold"
              >
                전체보기
              </button>
            </div>

            {isLoggedIn ? (
              reminders.length > 0 ? (
                <div className="space-y-2">
                  {reminders.map(rem => (
                    <div
                      key={rem.id}
                      className="p-3 rounded-2xl bg-stone-50 border border-stone-100 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-xl">
                          {rem.type === 'vaccine' ? '💉' : rem.type === 'medicine' ? '💊' : '🩺'}
                        </span>
                        <div>
                          <h4 className="text-xs font-bold text-stone-800">{rem.title}</h4>
                          <p className="text-[11px] text-stone-500">
                            {rem.date} {rem.time}
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800">
                        예정
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-6 text-center text-xs text-stone-400">
                  <p>등록된 일정이 없습니다.</p>
                  <button
                    onClick={() => onNavigate('dog', 'reminders')}
                    className="mt-2 text-teal-600 font-bold hover:underline inline-flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> 새 일정 등록하기
                  </button>
                </div>
              )
            ) : (
              <div className="py-6 text-center text-xs text-stone-500 bg-stone-50 rounded-2xl p-4">
                <p>로그인하시면 반려견의 백신 접종일과 약 복용 일정을 관리할 수 있습니다.</p>
                <button
                  onClick={onOpenAuth}
                  className="mt-2 px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-xs"
                >
                  로그인하고 일정 등록
                </button>
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
            <span>현재 관리 반려견: <strong>{activeDog?.name || '미등록'}</strong></span>
            {activeDog && (
              <span className="text-teal-600 font-semibold">{activeDog.breed}</span>
            )}
          </div>
        </div>

        {/* Right: Recent Walk Tracker Overview */}
        <div className="p-5 rounded-3xl bg-white border border-stone-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Footprints className="w-4 h-4 text-emerald-600" />
                <h3 className="font-bold text-stone-900 text-sm">최근 산책 기록</h3>
              </div>
              <button
                onClick={() => onNavigate('walk', 'history')}
                className="text-xs text-emerald-700 hover:underline font-semibold"
              >
                기록함
              </button>
            </div>

            {recentWalk ? (
              <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-100 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-900">{recentWalk.dogName}와의 산책</span>
                  <span className="text-[11px] text-emerald-700">
                    {recentWalk.startTime.split('T')[0]}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-center py-1">
                  <div className="bg-white p-2 rounded-xl">
                    <span className="text-[10px] text-stone-400 block">산책 시간</span>
                    <span className="text-base font-extrabold text-stone-800">
                      {recentWalk.durationMinutes}분
                    </span>
                  </div>
                  <div className="bg-white p-2 rounded-xl">
                    <span className="text-[10px] text-stone-400 block">이동 거리</span>
                    <span className="text-base font-extrabold text-stone-800">
                      {(recentWalk.distanceMeters / 1000).toFixed(2)} km
                    </span>
                  </div>
                </div>
                {recentWalk.memo && (
                  <p className="text-[11px] text-stone-600 truncate bg-white/60 p-1.5 rounded-lg">
                    💭 {recentWalk.memo}
                  </p>
                )}
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-stone-400 bg-stone-50 rounded-2xl p-4">
                <p>아직 저장된 산책 기록이 없습니다.</p>
                <button
                  onClick={() => onNavigate('walk', 'tracker')}
                  className="mt-2 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs inline-flex items-center gap-1"
                >
                  <Footprints className="w-3.5 h-3.5" /> 산책 시작하기
                </button>
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
            <span>위치 권한 기반 실시간 GPS 기록 지원</span>
            <span className="text-emerald-700 font-semibold">거리 & 칼로리 계산</span>
          </div>
        </div>
      </div>

      {/* Nearby Places Section */}
      <section className="p-5 rounded-3xl bg-white border border-stone-200 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-teal-600" />
            <h3 className="font-bold text-stone-900 text-sm">
              [{selectedRegion}] 추천 반려견 장소
            </h3>
          </div>
          <button
            onClick={() => onNavigate('places')}
            className="text-xs text-teal-700 hover:underline font-semibold flex items-center gap-0.5"
          >
            <span>지도에서 더보기</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {nearbyPlaces.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {nearbyPlaces.map(place => (
              <div
                key={place.id}
                onClick={() => onNavigate('places')}
                className="p-3 rounded-2xl border border-stone-100 hover:border-teal-300 hover:shadow-xs transition-all cursor-pointer flex gap-3 bg-stone-50/50"
              >
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-stone-200 shrink-0">
                  <img
                    src={place.photoUrl}
                    alt={place.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-bold text-teal-700 px-1.5 py-0.5 rounded bg-teal-50">
                    {place.category === 'hospital_24h'
                      ? '24시 동물병원'
                      : place.category === 'park'
                      ? '산책로/공원'
                      : place.category === 'cafe'
                      ? '동반 카페'
                      : '반려견 시설'}
                  </span>
                  <h4 className="font-bold text-xs text-stone-900 truncate mt-1">{place.name}</h4>
                  <p className="text-[11px] text-stone-500 truncate">{place.address}</p>
                  <p className="text-[10px] text-amber-600 font-bold mt-0.5">
                    ★ {place.rating} ({place.reviewCount})
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-6 text-center text-xs text-stone-400">
            선택하신 지역에 등록된 장소가 없습니다. 지역을 변경해 보세요.
          </div>
        )}
      </section>

      {/* Recent Neighborhood Community Stories */}
      <section className="p-5 rounded-3xl bg-white border border-stone-200 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-blue-600" />
            <h3 className="font-bold text-stone-900 text-sm">최근 동네 이야기나눔</h3>
          </div>
          <button
            onClick={() => onNavigate('community')}
            className="text-xs text-blue-700 hover:underline font-semibold flex items-center gap-0.5"
          >
            <span>전체 글보기</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-2">
          {posts.map(post => (
            <div
              key={post.id}
              onClick={() => onNavigate('community')}
              className="p-3 rounded-2xl bg-stone-50/70 hover:bg-stone-100 transition-colors cursor-pointer flex items-center justify-between gap-3"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-blue-700 px-1.5 py-0.5 rounded bg-blue-50">
                    {post.category === 'walk_meet'
                      ? '산책모임'
                      : post.category === 'review'
                      ? '장소후기'
                      : post.category === 'tips'
                      ? '양육팁'
                      : '일상'}
                  </span>
                  <h4 className="text-xs font-bold text-stone-800 truncate">{post.title}</h4>
                </div>
                <p className="text-[11px] text-stone-500 truncate mt-1">{post.content}</p>
              </div>
              <div className="text-[10px] text-stone-400 shrink-0 text-right">
                <span>💬 {post.commentsCount}</span>
                <span className="ml-2">❤️ {post.likesCount}</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
