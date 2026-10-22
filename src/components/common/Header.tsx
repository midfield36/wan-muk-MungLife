import React, { useState } from 'react';
import { KoreanRegion } from '../../types';
import { KOREAN_REGIONS } from '../../data/koreanRegions';
import { useAuth } from '../../firebase/authContext';
import {
  MapPin,
  Bell,
  Sparkles,
  AlertTriangle,
  User,
  ShieldCheck,
  LogOut,
  ChevronDown,
  Check,
} from 'lucide-react';

interface HeaderProps {
  selectedRegion: KoreanRegion;
  onSelectRegion: (region: KoreanRegion) => void;
  onOpenEmergency: () => void;
  onOpenAi: () => void;
  onOpenAuth: () => void;
  onOpenAdmin: () => void;
  onOpenTerms: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  selectedRegion,
  onSelectRegion,
  onOpenEmergency,
  onOpenAi,
  onOpenAuth,
  onOpenAdmin,
  onOpenTerms,
  activeTab,
  setActiveTab,
}) => {
  const { isLoggedIn, userProfile, isAdmin, logout } = useAuth();
  const [showRegionDropdown, setShowRegionDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-2">
        {/* Logo & Slogan */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('home')}>
          <div className="w-10 h-10 rounded-2xl bg-teal-600 flex items-center justify-center text-white shadow-md shadow-teal-600/20 transition-transform active:scale-95">
            <span className="text-xl">🐶</span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-bold tracking-tight text-stone-900">멍라이프</span>
              <span className="text-xs px-1.5 py-0.5 rounded-full bg-teal-50 text-teal-700 font-semibold border border-teal-200">
                MungLife
              </span>
            </div>
            <p className="text-[11px] text-stone-500 hidden sm:block">우리 강아지와 함께하는 모든 순간</p>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1">
          {[
            { id: 'home', label: '홈' },
            { id: 'places', label: '주변찾기' },
            { id: 'emergency', label: '긴급도움', highlight: true },
            { id: 'dog', label: '우리강아지' },
            { id: 'walk', label: '산책·여행' },
            { id: 'community', label: '이야기나눔' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                activeTab === item.id
                  ? item.highlight
                    ? 'bg-rose-50 text-rose-700 font-semibold'
                    : 'bg-teal-50 text-teal-800 font-semibold'
                  : item.highlight
                  ? 'text-rose-600 hover:bg-rose-50/50'
                  : 'text-stone-600 hover:bg-stone-100'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* Right Action Tools */}
        <div className="flex items-center gap-2">
          {/* Region Selector */}
          <div className="relative">
            <button
              onClick={() => setShowRegionDropdown(!showRegionDropdown)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-stone-200 hover:border-teal-500 bg-stone-50 hover:bg-white text-xs font-medium text-stone-700 transition-colors shadow-2xs"
            >
              <MapPin className="w-3.5 h-3.5 text-teal-600 shrink-0" />
              <span className="font-semibold text-stone-800">{selectedRegion}</span>
              <ChevronDown className="w-3 h-3 text-stone-400" />
            </button>

            {showRegionDropdown && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowRegionDropdown(false)}
                />
                <div className="absolute right-0 mt-2 w-56 max-h-72 overflow-y-auto bg-white rounded-2xl shadow-xl border border-stone-200 z-50 p-2 grid grid-cols-2 gap-1 animate-in fade-in zoom-in-95">
                  <div className="col-span-2 text-[11px] font-bold text-stone-400 px-2 py-1 uppercase">
                    지역 선택 (전국)
                  </div>
                  {KOREAN_REGIONS.map((reg) => (
                    <button
                      key={reg.name}
                      onClick={() => {
                        onSelectRegion(reg.name);
                        setShowRegionDropdown(false);
                      }}
                      className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        selectedRegion === reg.name
                          ? 'bg-teal-600 text-white font-semibold'
                          : 'text-stone-700 hover:bg-stone-100'
                      }`}
                    >
                      <span>{reg.name}</span>
                      {selectedRegion === reg.name && <Check className="w-3.5 h-3.5" />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* AI Companion Button */}
          <button
            onClick={onOpenAi}
            title="AI 반려견 생활 도우미"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-semibold shadow-2xs transition-all active:scale-95"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span className="hidden sm:inline">AI 도우미</span>
          </button>

          {/* Emergency 24h Vet Quick Button */}
          <button
            onClick={onOpenEmergency}
            title="24시 긴급 동물병원 찾기"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/25 transition-transform active:scale-95"
          >
            <AlertTriangle className="w-3.5 h-3.5 animate-pulse" />
            <span>긴급 24시</span>
          </button>

          {/* In-app Notification Bell */}
          <button
            onClick={() => setShowNotificationModal(true)}
            className="relative p-2 rounded-xl text-stone-600 hover:bg-stone-100 transition-colors"
            title="알림 센터"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-teal-500 ring-2 ring-white"></span>
          </button>

          {/* User Auth / Profile */}
          <div className="relative">
            {isLoggedIn ? (
              <button
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                className="flex items-center gap-2 p-1 pl-2 rounded-xl border border-stone-200 hover:border-teal-500 bg-white transition-colors"
              >
                <span className="text-xs font-semibold text-stone-800 max-w-[80px] truncate hidden md:inline">
                  {userProfile?.displayName || '보호자'}
                </span>
                <div className="w-7 h-7 rounded-lg overflow-hidden bg-teal-100 border border-teal-200 flex items-center justify-center">
                  {userProfile?.photoURL ? (
                    <img src={userProfile.photoURL} alt="프로필" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-4 h-4 text-teal-700" />
                  )}
                </div>
              </button>
            ) : (
              <button
                onClick={onOpenAuth}
                className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-xs transition-transform active:scale-95"
              >
                로그인
              </button>
            )}

            {showUserDropdown && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowUserDropdown(false)} />
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-stone-200 z-50 p-2 animate-in fade-in">
                  <div className="px-3 py-2 border-b border-stone-100">
                    <p className="text-xs font-bold text-stone-900">{userProfile?.displayName}</p>
                    <p className="text-[11px] text-stone-500 truncate">{userProfile?.email}</p>
                    {isAdmin && (
                      <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-100 text-purple-700">
                        <ShieldCheck className="w-3 h-3" /> 관리자 계정
                      </span>
                    )}
                  </div>

                  <div className="py-1">
                    <button
                      onClick={() => {
                        setActiveTab('dog');
                        setShowUserDropdown(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-stone-700 hover:bg-stone-50 flex items-center justify-between"
                    >
                      <span>내 반려견 관리</span>
                      <span className="text-stone-400">🐶</span>
                    </button>
                    {isAdmin && (
                      <button
                        onClick={() => {
                          onOpenAdmin();
                          setShowUserDropdown(false);
                        }}
                        className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-purple-700 hover:bg-purple-50 flex items-center justify-between"
                      >
                        <span>운영 관리자 센터</span>
                        <ShieldCheck className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => {
                        onOpenTerms();
                        setShowUserDropdown(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-stone-600 hover:bg-stone-50"
                    >
                      이용약관 및 개인정보처리
                    </button>
                  </div>

                  <div className="pt-1 border-t border-stone-100">
                    <button
                      onClick={() => {
                        logout();
                        setShowUserDropdown(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-rose-600 hover:bg-rose-50 flex items-center gap-1.5"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>로그아웃</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* In-App Notification Modal */}
      {showNotificationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl border border-stone-200">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-teal-600" />
                <h3 className="font-bold text-stone-900">멍라이프 알림함</h3>
              </div>
              <button
                onClick={() => setShowNotificationModal(false)}
                className="text-stone-400 hover:text-stone-600 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>
            <div className="py-4 space-y-2.5">
              <div className="p-3 rounded-2xl bg-teal-50 border border-teal-100 flex items-start gap-3">
                <span className="text-xl">💉</span>
                <div>
                  <h4 className="text-xs font-bold text-teal-900">심장사상충 예방 일정</h4>
                  <p className="text-[11px] text-teal-700 mt-0.5">
                    다가오는 투약일이 4월 1일입니다. 잊지 말고 챙겨주세요!
                  </p>
                  <span className="text-[10px] text-teal-600 mt-1 block">우리강아지 건강수첩 알림</span>
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-amber-50 border border-amber-100 flex items-start gap-3">
                <span className="text-xl">☀️</span>
                <div>
                  <h4 className="text-xs font-bold text-amber-900">오늘의 반려견 산책 지수</h4>
                  <p className="text-[11px] text-amber-700 mt-0.5">
                    기온과 미세먼지가 산책하기에 좋습니다. 물통과 배변봉투를 챙겨보세요!
                  </p>
                  <span className="text-[10px] text-amber-600 mt-1 block">멍라이프 라이프 케어</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowNotificationModal(false)}
              className="w-full py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold transition-colors"
            >
              닫기
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
