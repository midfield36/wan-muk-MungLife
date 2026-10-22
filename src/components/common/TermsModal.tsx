import React, { useState } from 'react';
import { Shield, FileText, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../firebase/authContext';

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TermsModal: React.FC<TermsModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'terms' | 'privacy'>('terms');
  const { userProfile, agreeTermsAndPrivacy } = useAuth();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-stone-200 overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-stone-200 flex items-center justify-between bg-stone-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-teal-100 text-teal-700">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-stone-900 text-base">멍라이프 약관 및 개인정보 처리방침</h3>
              <p className="text-xs text-stone-500">투명하고 안전한 반려견 라이프 케어 서비스를 약속합니다.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-200 hover:bg-stone-300 flex items-center justify-center text-stone-600 text-sm font-bold transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-stone-200 bg-white px-5 pt-3 gap-2">
          <button
            onClick={() => setActiveTab('terms')}
            className={`pb-3 px-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'terms'
                ? 'border-teal-600 text-teal-700'
                : 'border-transparent text-stone-400 hover:text-stone-700'
            }`}
          >
            <FileText className="w-4 h-4" />
            서비스 이용약관
          </button>
          <button
            onClick={() => setActiveTab('privacy')}
            className={`pb-3 px-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'privacy'
                ? 'border-teal-600 text-teal-700'
                : 'border-transparent text-stone-400 hover:text-stone-700'
            }`}
          >
            <Shield className="w-4 h-4" />
            개인정보 처리방침
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs text-stone-600 leading-relaxed">
          {activeTab === 'terms' ? (
            <>
              <h4 className="text-sm font-bold text-stone-800">제1조 (목적)</h4>
              <p>
                본 약관은 멍라이프(MungLife, 이하 "서비스")가 제공하는 반려견 건강수첩, 주변 장소 검색, 긴급 도움, 산책 기록, 커뮤니티 등의 제반 서비스 이용과 관련하여 회사와 이용자 간의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.
              </p>

              <h4 className="text-sm font-bold text-stone-800">제2조 (수의사 진료 안내 및 면책)</h4>
              <p className="p-3 rounded-xl bg-amber-50 text-amber-900 border border-amber-200 font-medium">
                ⚠️ 본 서비스 내의 응급행동 안내, AI 도우미 답변, 장소 영업시간 및 반려견 동반 조건은 정보 제공을 위한 참고용 자료이며, 수의사의 전문적인 진단 및 진료를 대신할 수 없습니다. 응급 상황 시에는 반드시 인근 동물병원에 즉시 연락하거나 내원해야 합니다.
              </p>

              <h4 className="text-sm font-bold text-stone-800">제3조 (실종견 신고 및 위치정보 안심보호)</h4>
              <p>
                1. 실종견 등록 시 보호자의 실제 개인 전화번호는 스팸 및 2차 피해 방지를 위해 안심 제보 채널을 통해 우선 중개됩니다.
                <br />
                2. 실종 위치는 보호자가 지정한 대략적인 읍/면/동 또는 인근 랜드마크 범위로 표시되어 안전을 보호합니다.
              </p>

              <h4 className="text-sm font-bold text-stone-800">제4조 (커뮤니티 및 건전한 서비스 이용)</h4>
              <p>
                허위 정보, 상업적 스팸 광고, 혐오 표현, 동물 학대 관련 게시글 등은 운영자에 의해 사전 고지 없이 삭제 및 이용 제한 조치될 수 있습니다.
              </p>
            </>
          ) : (
            <>
              <h4 className="text-sm font-bold text-stone-800">1. 수집하는 개인정보 항목</h4>
              <ul className="list-disc pl-5 space-y-1">
                <li>필수 항목: 이메일, 닉네임, 프로필 사진 (Google 로그인 연동)</li>
                <li>선택 항목: 반려견 정보(이름, 품종, 생일, 몸무게, 접종 및 건강 기록, 산책 경로 GPS)</li>
                <li>서비스 이용 과정에서 생성되는 정보: 접속 로그, 장소 리뷰, 커뮤니티 작성글 및 댓글</li>
              </ul>

              <h4 className="text-sm font-bold text-stone-800">2. 개인정보의 수집 및 이용 목적</h4>
              <ul className="list-disc pl-5 space-y-1">
                <li>반려견 건강수첩, 맞춤형 접종/투약 알림 제공</li>
                <li>실시간 GPS 기반 산책 거리 및 시간 기록</li>
                <li>실종견 등록 및 목격 제보 안전 중개</li>
                <li>회원 식별 및 부정 이용 방지</li>
              </ul>

              <h4 className="text-sm font-bold text-stone-800">3. 개인정보의 보유 및 파기</h4>
              <p>
                이용자가 회원 탈퇴를 요청하거나 개인정보 삭제를 요구하는 경우 지체 없이 해당 정보를 영구 파기합니다. 단, 관계 법령에 따라 보존 의무가 있는 항목은 법정 기간 동안 안전하게 보관됩니다.
              </p>

              <div className="p-3 rounded-xl bg-teal-50 border border-teal-200 text-teal-800 text-[11px]">
                <div className="flex items-center gap-1.5 font-bold mb-1">
                  <CheckCircle2 className="w-4 h-4 text-teal-600" />
                  개인정보 안심 원칙
                </div>
                반려견의 건강 기록과 산책 일지는 오직 보호자 본인(및 지정한 가족 공동관리자)에게만 안전하게 격리되어 저장됩니다.
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-stone-200 bg-stone-50 flex items-center justify-between">
          <div className="text-xs text-stone-500">
            {userProfile?.termsAgreed ? (
              <span className="text-teal-700 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> 이미 동의 완료된 계정입니다.
              </span>
            ) : (
              <span>약관에 동의하시면 모든 기능을 자유롭게 이용하실 수 있습니다.</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {!userProfile?.termsAgreed && (
              <button
                onClick={async () => {
                  await agreeTermsAndPrivacy();
                  onClose();
                }}
                className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-sm transition-colors"
              >
                약관에 동의합니다
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-stone-200 hover:bg-stone-300 text-stone-800 font-semibold text-xs transition-colors"
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
