import React, { useState, useEffect } from 'react';
import { KoreanRegion } from './types';
import { AuthProvider, useAuth } from './firebase/authContext';
import { testConnection } from './firebase/config';
import { Header } from './components/common/Header';
import { BottomNav } from './components/common/BottomNav';
import { HomeScreen } from './components/home/HomeScreen';
import { PlacesScreen } from './components/places/PlacesScreen';
import { EmergencyScreen } from './components/emergency/EmergencyScreen';
import { DogProfileScreen } from './components/dog/DogProfileScreen';
import { WalkTravelScreen } from './components/walk/WalkTravelScreen';
import { CommunityScreen } from './components/community/CommunityScreen';
import { AiAssistantModal } from './components/ai/AiAssistantModal';
import { AuthModal } from './components/auth/AuthModal';
import { AdminModal } from './components/admin/AdminModal';
import { TermsModal } from './components/common/TermsModal';
import { WifiOff, AlertTriangle, ShieldCheck } from 'lucide-react';

function MainAppContent() {
  const { isLoggedIn, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('home');
  const [subView, setSubView] = useState<string | undefined>(undefined);
  const [selectedRegion, setSelectedRegion] = useState<KoreanRegion>('전체');

  // Modal controls
  const [showAiModal, setShowAiModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [authReasonMessage, setAuthReasonMessage] = useState<string | undefined>(undefined);

  // Offline detection
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    // Test Firestore connection on boot
    testConnection();

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleNavigate = (tab: string, sub?: string) => {
    setActiveTab(tab);
    setSubView(sub);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenAuthWithMessage = (msg?: string) => {
    setAuthReasonMessage(msg);
    setShowAuthModal(true);
  };

  return (
    <div className="min-h-screen bg-[#F0F6FA] text-[#253238] flex flex-col selection:bg-teal-100 selection:text-teal-900">
      {/* Offline Alert Banner */}
      {!isOnline && (
        <div className="bg-amber-600 text-white px-4 py-2 text-xs font-bold flex flex-wrap items-center justify-between gap-2 sticky top-0 z-50 shadow-md">
          <div className="flex items-center gap-2">
            <WifiOff className="w-4 h-4 animate-bounce shrink-0" />
            <span>오프라인 상태입니다. 저장된 로컬 캐시 데이터로 동작 중입니다.</span>
          </div>
          <button
            onClick={() => handleNavigate('emergency', 'hospitals')}
            className="px-2.5 py-1 rounded-lg bg-rose-700 hover:bg-rose-800 text-white font-extrabold text-[11px] flex items-center gap-1 shadow-xs transition-colors shrink-0"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>🚨 24시 응급병원/응급처치 열기 (오프라인 지원)</span>
          </button>
        </div>
      )}

      {/* Top Header */}
      <Header
        selectedRegion={selectedRegion}
        onSelectRegion={setSelectedRegion}
        onOpenEmergency={() => handleNavigate('emergency')}
        onOpenAi={() => setShowAiModal(true)}
        onOpenAuth={() => handleOpenAuthWithMessage()}
        onOpenAdmin={() => setShowAdminModal(true)}
        onOpenTerms={() => setShowTermsModal(true)}
        activeTab={activeTab}
        setActiveTab={(t) => handleNavigate(t)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 pt-5">
        {activeTab === 'home' && (
          <HomeScreen
            selectedRegion={selectedRegion}
            onNavigate={handleNavigate}
            onOpenAi={() => setShowAiModal(true)}
            onOpenAuth={() => handleOpenAuthWithMessage('반려견 건강 기록과 일정을 보관하려면 로그인하세요.')}
          />
        )}

        {activeTab === 'places' && (
          <PlacesScreen
            selectedRegion={selectedRegion}
            onSelectRegion={setSelectedRegion}
            onOpenAuth={() => handleOpenAuthWithMessage('장소 방문 후기를 작성하려면 로그인이 필요합니다.')}
          />
        )}

        {activeTab === 'emergency' && (
          <EmergencyScreen
            selectedRegion={selectedRegion}
            onSelectRegion={setSelectedRegion}
            initialSubTab={subView as any}
            onOpenAuth={() => handleOpenAuthWithMessage('실종견 신고 및 목격 제보를 작성하려면 로그인이 필요합니다.')}
          />
        )}

        {activeTab === 'dog' && (
          <DogProfileScreen
            initialSubTab={subView}
            onOpenAuth={() => handleOpenAuthWithMessage('내 반려견의 건강수첩과 백신 일정을 저장하려면 로그인하세요.')}
          />
        )}

        {activeTab === 'walk' && (
          <WalkTravelScreen
            initialSubView={subView}
            selectedRegion={selectedRegion}
            onOpenAuth={() => handleOpenAuthWithMessage('산책 경로 및 준비물 체크리스트를 저장하려면 로그인하세요.')}
          />
        )}

        {activeTab === 'community' && (
          <CommunityScreen
            onOpenAuth={() => handleOpenAuthWithMessage('커뮤니티 글 작성 및 댓글, 좋아요를 위해 로그인하세요.')}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-stone-200 bg-white/80 backdrop-blur-xs py-8 px-4 text-center text-xs text-stone-500 hidden lg:block">
        <div className="max-w-4xl mx-auto space-y-2">
          <div className="flex items-center justify-center gap-4 text-xs font-medium text-stone-600">
            <button onClick={() => setShowTermsModal(true)} className="hover:text-teal-700">
              서비스 이용약관
            </button>
            <span>·</span>
            <button onClick={() => setShowTermsModal(true)} className="hover:text-teal-700 font-bold">
              개인정보처리방침
            </button>
            <span>·</span>
            <button onClick={() => handleNavigate('emergency')} className="hover:text-rose-600">
              24시 동물병원 응급안내
            </button>
            {isAdmin && (
              <>
                <span>·</span>
                <button onClick={() => setShowAdminModal(true)} className="text-purple-700 font-bold hover:underline">
                  운영 관리자 센터
                </button>
              </>
            )}
          </div>
          <p className="text-[11px] text-stone-400">
            멍라이프(MungLife) © 2025. 우리 강아지와 함께하는 모든 순간. 대한민국 전국 반려견 생활 통합 서비스
          </p>
        </div>
      </footer>

      {/* Mobile Bottom Navigation */}
      <BottomNav activeTab={activeTab} setActiveTab={(t) => handleNavigate(t)} />

      {/* Global Modals */}
      <AiAssistantModal isOpen={showAiModal} onClose={() => setShowAiModal(false)} />
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        reasonMessage={authReasonMessage}
      />
      <AdminModal isOpen={showAdminModal} onClose={() => setShowAdminModal(false)} />
      <TermsModal isOpen={showTermsModal} onClose={() => setShowTermsModal(false)} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainAppContent />
    </AuthProvider>
  );
}
