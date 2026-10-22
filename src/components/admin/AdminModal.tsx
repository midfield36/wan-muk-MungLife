import React, { useState, useEffect } from 'react';
import { ModerationReport, MissingDog, CommunityPost, Place } from '../../types';
import {
  fetchReports,
  updateReportStatus,
  fetchMissingDogs,
  updateMissingDogStatus,
  fetchPosts,
  deletePost,
  fetchPlaces,
} from '../../services/dbService';
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle,
  FileText,
  Users,
  MapPin,
  Trash2,
  ExternalLink,
} from 'lucide-react';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminModal: React.FC<AdminModalProps> = ({ isOpen, onClose }) => {
  const [reports, setReports] = useState<ModerationReport[]>([]);
  const [missingDogs, setMissingDogs] = useState<MissingDog[]>([]);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [places, setPlaces] = useState<Place[]>([]);
  const [adminTab, setAdminTab] = useState<'stats' | 'reports' | 'missing' | 'posts'>('stats');

  useEffect(() => {
    async function load() {
      const r = await fetchReports();
      setReports(r);
      const m = await fetchMissingDogs();
      setMissingDogs(m);
      const p = await fetchPosts();
      setPosts(p);
      const pl = await fetchPlaces();
      setPlaces(pl);
    }
    if (isOpen) load();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleResolveReport = async (reportId: string, status: 'reviewed' | 'dismissed') => {
    await updateReportStatus(reportId, status);
    setReports(reports.map(r => (r.id === reportId ? { ...r, status } : r)));
    alert(`신고가 ${status === 'reviewed' ? '조치 완료' : '반려'}되었습니다.`);
  };

  const handleToggleMissingStatus = async (dogId: string, current: string) => {
    const next = current === 'searching' ? 'found' : 'searching';
    await updateMissingDogStatus(dogId, next as any);
    setMissingDogs(missingDogs.map(d => (d.id === dogId ? { ...d, status: next as any } : d)));
  };

  const handleDeleteCommunityPost = async (postId: string) => {
    if (!confirm('운영자 권한으로 이 게시글을 영구 삭제하시겠습니까?')) return;
    await deletePost(postId);
    setPosts(posts.filter(p => p.id !== postId));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-stone-200 overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-stone-100 flex items-center justify-between bg-stone-900 text-white">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-600 text-white">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base">
                멍라이프 서비스 운영 & 관리자 센터
              </h3>
              <p className="text-[11px] text-stone-400">
                관리자 계정: midfield36@gmail.com (모니터링 및 클린 서비스 관리)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-300 flex items-center justify-center text-xs font-bold"
          >
            ✕
          </button>
        </div>

        {/* Admin Tabs */}
        <div className="flex border-b border-stone-200 bg-stone-50 px-4 pt-2 gap-2 text-xs font-bold">
          <button
            onClick={() => setAdminTab('stats')}
            className={`pb-2.5 px-3 border-b-2 transition-all ${
              adminTab === 'stats'
                ? 'border-purple-600 text-purple-700'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            📊 서비스 통계
          </button>
          <button
            onClick={() => setAdminTab('reports')}
            className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 ${
              adminTab === 'reports'
                ? 'border-purple-600 text-purple-700'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <span>🚨 신고 접수함</span>
            {reports.filter(r => r.status === 'pending').length > 0 && (
              <span className="w-2 h-2 rounded-full bg-rose-600"></span>
            )}
          </button>
          <button
            onClick={() => setAdminTab('missing')}
            className={`pb-2.5 px-3 border-b-2 transition-all ${
              adminTab === 'missing'
                ? 'border-purple-600 text-purple-700'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            📢 실종견 관리
          </button>
          <button
            onClick={() => setAdminTab('posts')}
            className={`pb-2.5 px-3 border-b-2 transition-all ${
              adminTab === 'posts'
                ? 'border-purple-600 text-purple-700'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            💬 커뮤니티 관리
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* STATS */}
          {adminTab === 'stats' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 rounded-2xl bg-purple-50 border border-purple-100 text-center">
                  <span className="text-[10px] text-purple-700 font-bold block">검증 장소</span>
                  <strong className="text-xl font-black text-purple-900">{places.length}개소</strong>
                </div>
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100 text-center">
                  <span className="text-[10px] text-rose-700 font-bold block">실종견 신고</span>
                  <strong className="text-xl font-black text-rose-900">
                    {missingDogs.length}건
                  </strong>
                </div>
                <div className="p-4 rounded-2xl bg-teal-50 border border-teal-100 text-center">
                  <span className="text-[10px] text-teal-700 font-bold block">커뮤니티 글</span>
                  <strong className="text-xl font-black text-teal-900">{posts.length}개</strong>
                </div>
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100 text-center">
                  <span className="text-[10px] text-amber-700 font-bold block">미처리 신고</span>
                  <strong className="text-xl font-black text-amber-900">
                    {reports.filter(r => r.status === 'pending').length}건
                  </strong>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200">
                <h4 className="font-bold text-stone-800 mb-2">시스템 보안 및 운영 상태</h4>
                <ul className="space-y-1 text-stone-600 text-xs">
                  <li>✅ Firebase Authentication (Google OAuth) 연동 완료</li>
                  <li>✅ Cloud Firestore 보안 규칙 8개 축 Hardened 배포 완료</li>
                  <li>✅ 위치정보 보호법 준수 (실종견 보호자 연락처 비공개 중개)</li>
                  <li>✅ Gemini AI 생활 도우미 서버 사이드 보안 프록시 가동 중</li>
                </ul>
              </div>
            </div>
          )}

          {/* REPORTS */}
          {adminTab === 'reports' && (
            <div className="space-y-3">
              <h4 className="font-bold text-stone-800">
                접수된 불량 게시글 및 신고 ({reports.length}건)
              </h4>
              {reports.length > 0 ? (
                reports.map(rep => (
                  <div
                    key={rep.id}
                    className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-rose-700">신고 대상: [{rep.targetType}] {rep.targetId}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          rep.status === 'pending'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-stone-200 text-stone-600'
                        }`}
                      >
                        {rep.status}
                      </span>
                    </div>
                    <p className="text-stone-800">신고 사유: {rep.reason}</p>
                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        onClick={() => handleResolveReport(rep.id, 'reviewed')}
                        className="px-3 py-1 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs"
                      >
                        조치 완료 처리
                      </button>
                      <button
                        onClick={() => handleResolveReport(rep.id, 'dismissed')}
                        className="px-3 py-1 rounded-xl bg-stone-200 hover:bg-stone-300 text-stone-700 font-bold text-xs"
                      >
                        반려
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-stone-400 text-center py-6">접수된 신고가 없습니다. 깨끗한 상태입니다!</p>
              )}
            </div>
          )}

          {/* MISSING DOGS */}
          {adminTab === 'missing' && (
            <div className="space-y-3">
              <h4 className="font-bold text-stone-800">
                실종견 신고 목록 관리 ({missingDogs.length}건)
              </h4>
              <div className="space-y-2">
                {missingDogs.map(dog => (
                  <div
                    key={dog.id}
                    className="p-3 rounded-2xl bg-stone-50 border border-stone-200 flex items-center justify-between gap-3"
                  >
                    <div>
                      <strong className="text-stone-900">{dog.dogName}</strong> ({dog.breed}) · {dog.missingCity} {dog.missingDistrict}
                      <span className="block text-[11px] text-stone-500">
                        상태: {dog.status === 'searching' ? '수색 중' : '발견 완료'}
                      </span>
                    </div>
                    <button
                      onClick={() => handleToggleMissingStatus(dog.id, dog.status)}
                      className="px-3 py-1 rounded-xl bg-stone-200 hover:bg-stone-300 text-stone-800 font-bold text-xs"
                    >
                      상태 변경
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* POSTS */}
          {adminTab === 'posts' && (
            <div className="space-y-3">
              <h4 className="font-bold text-stone-800">커뮤니티 게시글 모니터링</h4>
              <div className="space-y-2">
                {posts.map(post => (
                  <div
                    key={post.id}
                    className="p-3 rounded-2xl bg-stone-50 border border-stone-200 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <strong className="text-stone-900 block truncate">{post.title}</strong>
                      <span className="text-[11px] text-stone-500">
                        작성자: {post.authorName} · 댓글 {post.commentsCount}
                      </span>
                    </div>
                    <button
                      onClick={() => handleDeleteCommunityPost(post.id)}
                      className="px-2.5 py-1 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold text-xs shrink-0 flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> 삭제
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
