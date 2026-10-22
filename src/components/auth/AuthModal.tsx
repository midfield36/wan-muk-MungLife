import React from 'react';
import { useAuth } from '../../firebase/authContext';
import { ShieldCheck, Sparkles, Check, AlertCircle } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  reasonMessage?: string;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, reasonMessage }) => {
  const { loginWithGoogle, loginDemo, authError, clearAuthError } = useAuth();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-stone-200 text-center relative">
        <button
          onClick={() => {
            clearAuthError();
            onClose();
          }}
          className="absolute top-4 right-4 text-stone-400 hover:text-stone-600 text-sm font-bold w-7 h-7 rounded-full bg-stone-100 flex items-center justify-center"
        >
          ✕
        </button>

        {/* Mascot / Icon */}
        <div className="w-16 h-16 mx-auto mb-4 rounded-3xl bg-teal-50 border border-teal-200 flex items-center justify-center text-3xl shadow-md shadow-teal-600/10">
          🐶
        </div>

        <h3 className="text-xl font-bold text-stone-900 tracking-tight">멍라이프 로그인</h3>
        <p className="text-xs text-stone-500 mt-1">우리 강아지와 함께하는 모든 순간, 멍라이프</p>

        {reasonMessage && (
          <div className="mt-3 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium text-left flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
            <span>{reasonMessage}</span>
          </div>
        )}

        {authError && (
          <div className="mt-3 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs text-left">
            {authError}
          </div>
        )}

        {/* Feature bullets */}
        <div className="my-5 p-3.5 rounded-2xl bg-stone-50 border border-stone-100 text-left space-y-2 text-xs text-stone-700">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-teal-600 shrink-0" />
            <span>내 반려견 맞춤 건강수첩 & 접종 알림</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-teal-600 shrink-0" />
            <span>GPS 실시간 산책 기록 & 코스 저장</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-teal-600 shrink-0" />
            <span>실종견 안심 제보 & 커뮤니티 나눔</span>
          </div>
        </div>

        {/* Buttons */}
        <div className="space-y-2.5">
          <button
            onClick={async () => {
              try {
                await loginWithGoogle();
                onClose();
              } catch (e) {
                // error handled in auth context
              }
            }}
            className="w-full py-3 px-4 rounded-2xl bg-white border border-stone-300 hover:border-stone-400 text-stone-800 font-bold text-sm flex items-center justify-center gap-3 shadow-xs hover:shadow-sm transition-all active:scale-98"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Google 계정으로 계속하기</span>
          </button>

          <button
            onClick={() => {
              loginDemo();
              onClose();
            }}
            className="w-full py-2.5 px-4 rounded-2xl bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-teal-600" />
            <span>원클릭 체험 계정으로 시작하기 (빠른 검증)</span>
          </button>
        </div>

        <p className="text-[10px] text-stone-400 mt-4 leading-normal">
          로그인 시 멍라이프의 <span className="underline">서비스 이용약관</span> 및{' '}
          <span className="underline">개인정보처리방침</span>에 동의하게 됩니다.
        </p>
      </div>
    </div>
  );
};
