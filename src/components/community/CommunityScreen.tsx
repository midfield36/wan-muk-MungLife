import React, { useState, useEffect } from 'react';
import {
  CommunityCategory,
  CommunityPost,
  PostComment,
  TradeType,
  TradeStatus,
  ItemCondition,
} from '../../types';
import { useAuth } from '../../firebase/authContext';
import {
  fetchPosts,
  savePost,
  updatePost,
  updatePostTradeStatus,
  deletePost,
  togglePostLike,
  fetchComments,
  saveComment,
  deleteComment,
  submitReport,
} from '../../services/dbService';
import {
  Search,
  Plus,
  Heart,
  MessageCircle,
  Trash2,
  Edit2,
  ShieldAlert,
  UserX,
  Tag,
  Calendar,
  DollarSign,
  MapPin,
  Clock,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

interface CommunityScreenProps {
  onOpenAuth: () => void;
}

export const CommunityScreen: React.FC<CommunityScreenProps> = ({ onOpenAuth }) => {
  const { isLoggedIn, userProfile, isAdmin } = useAuth();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<CommunityCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPost, setSelectedPost] = useState<CommunityPost | null>(null);
  const [comments, setComments] = useState<PostComment[]>([]);
  const [newCommentText, setNewCommentText] = useState('');

  const [editingPostId, setEditingPostId] = useState<string | null>(null);

  // Write post modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [postCategory, setPostCategory] = useState<CommunityCategory>('daily');
  const [postTitle, setPostTitle] = useState('');
  const [postContent, setPostContent] = useState('');
  const [postPhotoUrl, setPostPhotoUrl] = useState('');
  const [isSubmittingPost, setIsSubmittingPost] = useState(false);

  // Secondhand trade state
  const [postTradeType, setPostTradeType] = useState<TradeType>('sell');
  const [postPrice, setPostPrice] = useState<number | ''>('');
  const [postItemCondition, setPostItemCondition] = useState<ItemCondition>('like_new');
  const [postNeighborhood, setPostNeighborhood] = useState('');

  // Pet care state
  const [postCareStartDate, setPostCareStartDate] = useState('');
  const [postCareEndDate, setPostCareEndDate] = useState('');
  const [postCareCompensation, setPostCareCompensation] = useState('');
  const [postIsUrgentCare, setPostIsUrgentCare] = useState(false);
  const [postDogSize, setPostDogSize] = useState<'소형' | '중형' | '대형'>('소형');

  // Blocked users
  const [blockedUserIds, setBlockedUserIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('munglife_blocked_users') || '[]');
    } catch {
      return [];
    }
  });

  useEffect(() => {
    async function load() {
      const data = await fetchPosts();
      setPosts(data);
    }
    load();
  }, []);

  const handleOpenPostDetail = async (post: CommunityPost) => {
    setSelectedPost(post);
    const comms = await fetchComments(post.id);
    setComments(comms);
  };

  const handleStartEditPost = (post: CommunityPost) => {
    setEditingPostId(post.id);
    setPostCategory(post.category);
    setPostTitle(post.title);
    setPostContent(post.content);
    setPostPhotoUrl(post.photoUrl || '');
    setPostTradeType(post.tradeType || 'sell');
    setPostPrice(post.price !== undefined ? post.price : '');
    setPostItemCondition(post.itemCondition || 'like_new');
    setPostNeighborhood(post.neighborhood || '');
    setPostCareStartDate(post.careStartDate || '');
    setPostCareEndDate(post.careEndDate || '');
    setPostCareCompensation(post.careCompensation || '');
    setPostIsUrgentCare(!!post.isUrgentCare);
    setPostDogSize(post.dogSize || '소형');
    setShowCreateModal(true);
  };

  const handleCreateOrUpdatePost = async () => {
    if (!isLoggedIn) {
      onOpenAuth();
      return;
    }
    if (!postTitle.trim() || !postContent.trim()) {
      alert('제목과 내용을 모두 입력해 주세요.');
      return;
    }

    setIsSubmittingPost(true);
    try {
      const basePayload = {
        category: postCategory,
        title: postTitle.trim(),
        content: postContent.trim(),
        photoUrl: postPhotoUrl.trim() || undefined,
        tradeType: postCategory === 'used' ? postTradeType : undefined,
        price: postCategory === 'used' ? (postTradeType === 'share' ? 0 : Number(postPrice) || 0) : undefined,
        itemCondition: postCategory === 'used' ? postItemCondition : undefined,
        tradeStatus: postCategory === 'used' ? ('trading' as TradeStatus) : undefined,
        neighborhood: (postCategory === 'used' || postCategory === 'care') ? postNeighborhood.trim() || undefined : undefined,
        careStartDate: postCategory === 'care' ? postCareStartDate.trim() || undefined : undefined,
        careEndDate: postCategory === 'care' ? postCareEndDate.trim() || undefined : undefined,
        careCompensation: postCategory === 'care' ? postCareCompensation.trim() || undefined : undefined,
        isUrgentCare: postCategory === 'care' ? postIsUrgentCare : undefined,
        dogSize: postCategory === 'care' ? postDogSize : undefined,
      };

      if (editingPostId) {
        await updatePost(editingPostId, basePayload);

        const updatedList = posts.map(p =>
          p.id === editingPostId
            ? {
                ...p,
                ...basePayload,
                updatedAt: new Date().toISOString(),
              }
            : p
        );
        setPosts(updatedList);
        if (selectedPost?.id === editingPostId) {
          setSelectedPost({
            ...selectedPost,
            ...basePayload,
          });
        }
        alert('게시글이 수정되었습니다.');
      } else {
        const newP = await savePost({
          authorId: userProfile?.uid || 'user',
          authorName: userProfile?.displayName || '보호자',
          authorPhoto: userProfile?.photoURL,
          ...basePayload,
        });

        setPosts([newP, ...posts]);
        alert('게시글이 성공적으로 등록되었습니다!');
      }

      setShowCreateModal(false);
      setEditingPostId(null);
      setPostTitle('');
      setPostContent('');
      setPostPhotoUrl('');
      setPostPrice('');
      setPostNeighborhood('');
      setPostCareStartDate('');
      setPostCareEndDate('');
      setPostCareCompensation('');
      setPostIsUrgentCare(false);
    } catch (e) {
      console.error(e);
      alert('게시글 저장 중 오류가 발생했습니다.');
    } finally {
      setIsSubmittingPost(false);
    }
  };

  const handleToggleTradeStatus = async (postId: string, currentStatus?: TradeStatus) => {
    const nextStatus: TradeStatus =
      currentStatus === 'trading'
        ? 'reserved'
        : currentStatus === 'reserved'
        ? 'completed'
        : 'trading';

    await updatePostTradeStatus(postId, nextStatus);

    setPosts(posts.map(p => (p.id === postId ? { ...p, tradeStatus: nextStatus } : p)));
    if (selectedPost?.id === postId) {
      setSelectedPost({ ...selectedPost, tradeStatus: nextStatus });
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm('정말 이 게시글을 삭제하시겠습니까?')) return;
    await deletePost(postId);
    setPosts(posts.filter(p => p.id !== postId));
    if (selectedPost?.id === postId) setSelectedPost(null);
  };

  const handleDeleteComment = async (commentId: string, postId: string) => {
    if (!confirm('댓글을 삭제하시겠습니까?')) return;
    await deleteComment(commentId, postId);
    setComments(comments.filter(c => c.id !== commentId));
    setPosts(
      posts.map(p => (p.id === postId ? { ...p, commentsCount: Math.max(0, p.commentsCount - 1) } : p))
    );
  };

  const handleToggleLike = async (postId: string) => {
    if (!isLoggedIn) {
      onOpenAuth();
      return;
    }
    const result = await togglePostLike(postId, userProfile?.uid || 'user');
    setPosts(posts.map(p => (p.id === postId ? { ...p, likesCount: result.likesCount } : p)));
    if (selectedPost?.id === postId) {
      setSelectedPost({ ...selectedPost, likesCount: result.likesCount });
    }
  };

  const handleAddComment = async () => {
    if (!selectedPost) return;
    if (!isLoggedIn) {
      onOpenAuth();
      return;
    }
    if (!newCommentText.trim()) return;

    try {
      const c = await saveComment({
        postId: selectedPost.id,
        authorId: userProfile?.uid || 'user',
        authorName: userProfile?.displayName || '보호자',
        authorPhoto: userProfile?.photoURL,
        content: newCommentText.trim(),
      });
      setComments([...comments, c]);
      setNewCommentText('');
      setPosts(
        posts.map(p =>
          p.id === selectedPost.id ? { ...p, commentsCount: p.commentsCount + 1 } : p
        )
      );
    } catch (e) {
      console.error(e);
    }
  };

  const handleReportPost = async (targetId: string) => {
    if (!isLoggedIn) {
      onOpenAuth();
      return;
    }
    const reason = prompt('신고 사유를 작성해 주세요 (스팸, 욕설, 혐오 표현, 개인정보 노출 등):');
    if (!reason) return;
    await submitReport({
      reporterId: userProfile?.uid || 'user',
      targetType: 'post',
      targetId,
      reason,
    });
    alert('신고가 접수되었습니다. 운영자 검토 후 조치됩니다.');
  };

  const handleBlockUser = (authorId: string, authorName: string) => {
    if (!confirm(`${authorName} 님을 차단하시겠습니까? 이 사용자의 글이 더 이상 표시되지 않습니다.`)) {
      return;
    }
    const next = [...blockedUserIds, authorId];
    setBlockedUserIds(next);
    localStorage.setItem('munglife_blocked_users', JSON.stringify(next));
    if (selectedPost?.authorId === authorId) setSelectedPost(null);
    alert('차단 완료되었습니다.');
  };

  // Filtered posts
  const filteredPosts = posts.filter(post => {
    if (blockedUserIds.includes(post.authorId)) return false;
    if (selectedCategory !== 'all' && post.category !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        post.title.toLowerCase().includes(q) ||
        post.content.toLowerCase().includes(q) ||
        (post.neighborhood && post.neighborhood.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const categories = [
    { id: 'all', label: '전체' },
    { id: 'used', label: '🎁 반려용품 중고/나눔' },
    { id: 'care', label: '🤝 동네 임시돌봄 SOS' },
    { id: 'walk_meet', label: '🦮 산책 모임' },
    { id: 'news', label: '📢 동네 소식' },
    { id: 'review', label: '⭐ 장소 후기' },
    { id: 'qna', label: '❓ 반려견 질문' },
    { id: 'daily', label: '🐾 반려견 일상' },
    { id: 'tips', label: '💡 유용한 정보' },
  ];

  return (
    <div className="space-y-5 pb-24">
      {/* Top Banner & Action */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white border border-stone-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-extrabold text-stone-900 tracking-tight flex items-center gap-2">
            <span>이야기나눔 커뮤니티</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 font-bold">
              지역 밀착형 안심 광장
            </span>
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            동네 소식, 산책 친구, 반려용품 중고/무료나눔, 임시돌봄 품앗이까지 이웃 보호자와 함께해요.
          </p>
        </div>

        <button
          onClick={() => {
            if (!isLoggedIn) onOpenAuth();
            else setShowCreateModal(true);
          }}
          className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md shadow-teal-600/20 flex items-center justify-center gap-1.5 transition-transform active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>이야기/나눔 등록</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="게시글 제목, 내용, 또는 동네명 검색 (예: 연남동, 하네스, 돌봄)"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 rounded-2xl bg-white border border-stone-200 text-xs text-stone-800 placeholder:text-stone-400 focus:outline-teal-500 shadow-xs"
        />
      </div>

      {/* Categories Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id as any)}
            className={`px-3.5 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all shadow-2xs ${
              selectedCategory === cat.id
                ? 'bg-stone-900 text-white shadow-xs'
                : 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-50'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Posts List */}
      <div className="space-y-3">
        {filteredPosts.length > 0 ? (
          filteredPosts.map(post => (
            <div
              key={post.id}
              onClick={() => handleOpenPostDetail(post)}
              className="p-5 rounded-3xl bg-white border border-stone-200 hover:border-teal-300 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
            >
              <div>
                {/* Author row & category pill */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full overflow-hidden bg-stone-100 shrink-0">
                      {post.authorPhoto ? (
                        <img src={post.authorPhoto} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-teal-100 flex items-center justify-center text-[10px] font-bold text-teal-800">
                          {post.authorName[0]}
                        </div>
                      )}
                    </div>
                    <div>
                      <span className="font-bold text-xs text-stone-800">{post.authorName}</span>
                      <span className="text-[10px] text-stone-400 ml-1.5">
                        {post.createdAt.split('T')[0]}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    {post.neighborhood && (
                      <span className="text-[10px] text-stone-500 bg-stone-100 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                        <MapPin className="w-3 h-3 text-stone-400" />
                        {post.neighborhood}
                      </span>
                    )}

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        post.category === 'used'
                          ? 'bg-emerald-100 text-emerald-800'
                          : post.category === 'care'
                          ? 'bg-purple-100 text-purple-800'
                          : post.category === 'walk_meet'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-teal-50 text-teal-800'
                      }`}
                    >
                      {post.category === 'used'
                        ? '용품 중고/나눔'
                        : post.category === 'care'
                        ? '임시돌봄 SOS'
                        : post.category === 'news'
                        ? '동네 소식'
                        : post.category === 'walk_meet'
                        ? '산책 모임'
                        : post.category === 'review'
                        ? '장소 후기'
                        : post.category === 'qna'
                        ? '질문'
                        : post.category === 'tips'
                        ? '꿀팁'
                        : '일상'}
                    </span>
                  </div>
                </div>

                {/* Used Item Specific Highlights */}
                {post.category === 'used' && (
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span
                      className={`px-2.5 py-1 rounded-xl text-xs font-extrabold ${
                        post.tradeType === 'share' || post.price === 0
                          ? 'bg-emerald-600 text-white'
                          : 'bg-stone-900 text-amber-300'
                      }`}
                    >
                      {post.tradeType === 'share' || post.price === 0
                        ? '🎁 무료 나눔'
                        : `${post.price?.toLocaleString()}원`}
                    </span>

                    <span
                      className={`px-2 py-0.5 rounded-lg text-[11px] font-bold ${
                        post.tradeStatus === 'completed'
                          ? 'bg-stone-200 text-stone-500 line-through'
                          : post.tradeStatus === 'reserved'
                          ? 'bg-amber-100 text-amber-900'
                          : 'bg-teal-100 text-teal-900'
                      }`}
                    >
                      {post.tradeStatus === 'completed'
                        ? '거래완료'
                        : post.tradeStatus === 'reserved'
                        ? '예약중'
                        : '판매/나눔중'}
                    </span>

                    {post.itemCondition && (
                      <span className="text-[10px] text-stone-500 bg-stone-100 px-2 py-0.5 rounded-lg">
                        {post.itemCondition === 'new'
                          ? '미개봉 새상품'
                          : post.itemCondition === 'like_new'
                          ? '거의 새것'
                          : '사용감 있음'}
                      </span>
                    )}
                  </div>
                )}

                {/* Care Request Specific Highlights */}
                {post.category === 'care' && (
                  <div className="mb-2.5 p-2.5 rounded-2xl bg-purple-50/80 border border-purple-100 space-y-1 text-xs">
                    <div className="flex flex-wrap items-center gap-2">
                      {post.isUrgentCare && (
                        <span className="px-2 py-0.5 rounded-md bg-rose-600 text-white text-[10px] font-extrabold animate-pulse">
                          🚨 긴급
                        </span>
                      )}
                      <span className="font-bold text-purple-950 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-purple-600" />
                        돌봄 기간: {post.careStartDate || '일정 협의'} ~ {post.careEndDate || ''}
                      </span>
                      {post.dogSize && (
                        <span className="text-purple-700 font-semibold">• {post.dogSize}견</span>
                      )}
                    </div>
                    {post.careCompensation && (
                      <p className="text-stone-700 font-medium">
                        💰 사례/조건: <strong>{post.careCompensation}</strong>
                      </p>
                    )}
                  </div>
                )}

                <h3 className="font-bold text-stone-900 text-sm">{post.title}</h3>
                <p className="text-xs text-stone-600 mt-1 line-clamp-2 leading-relaxed">
                  {post.content}
                </p>

                {post.photoUrl && (
                  <div className="mt-3 h-48 rounded-2xl overflow-hidden bg-stone-100">
                    <img
                      src={post.photoUrl}
                      alt={post.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>

              {/* Bottom interaction bar */}
              <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-400">
                <div className="flex items-center gap-4">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleLike(post.id);
                    }}
                    className="flex items-center gap-1 hover:text-rose-600 font-semibold"
                  >
                    <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
                    <span>{post.likesCount}</span>
                  </button>

                  <span className="flex items-center gap-1">
                    <MessageCircle className="w-4 h-4 text-blue-500" />
                    <span>{post.commentsCount}</span>
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {/* Status Toggle for Author on Used items */}
                  {post.category === 'used' && userProfile?.uid === post.authorId && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleTradeStatus(post.id, post.tradeStatus);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 text-[11px] font-bold border border-teal-200 transition-colors"
                      title="거래 상태 변경"
                    >
                      상태: {post.tradeStatus === 'completed' ? '거래완료' : post.tradeStatus === 'reserved' ? '예약중' : '판매/나눔중'} ▾
                    </button>
                  )}

                  {(userProfile?.uid === post.authorId || isAdmin) && (
                    <div className="flex items-center gap-1.5">
                      {userProfile?.uid === post.authorId && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartEditPost(post);
                          }}
                          className="p-1 hover:text-teal-600 text-stone-400"
                          title="수정"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeletePost(post.id);
                        }}
                        className="p-1 hover:text-rose-600 text-stone-400"
                        title="삭제"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="p-8 rounded-3xl bg-white border border-stone-200 text-center space-y-2">
            <span className="text-3xl">💬</span>
            <h3 className="font-bold text-stone-800 text-sm">게시글이 없습니다</h3>
            <p className="text-xs text-stone-500">
              첫 번째 이야기를 작성하거나 동네 이웃과 따뜻한 나눔을 시작해 보세요!
            </p>
          </div>
        )}
      </div>

      {/* Post Detail & Comments Modal */}
      {selectedPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl border border-stone-200 overflow-hidden">
            <div className="p-4 border-b border-stone-100 flex items-center justify-between bg-stone-50">
              <span className="text-xs font-bold text-teal-800">
                {selectedPost.authorName} 님의 {selectedPost.category === 'used' ? '나눔/중고 글' : selectedPost.category === 'care' ? '임시돌봄 요청' : '이야기'}
              </span>
              <button
                onClick={() => setSelectedPost(null)}
                className="w-7 h-7 rounded-full bg-stone-200 text-stone-600 flex items-center justify-center text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4">
              <div>
                {/* Meta block for used/care */}
                {selectedPost.category === 'used' && (
                  <div className="mb-3 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-base font-extrabold text-stone-900">
                          {selectedPost.tradeType === 'share' || selectedPost.price === 0
                            ? '🎁 무료 나눔'
                            : `${selectedPost.price?.toLocaleString()}원`}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-md bg-white border border-emerald-200 text-emerald-800 font-bold">
                          {selectedPost.tradeStatus === 'completed'
                            ? '거래완료'
                            : selectedPost.tradeStatus === 'reserved'
                            ? '예약중'
                            : '거래중'}
                        </span>
                      </div>
                      <div className="text-[11px] text-stone-500 mt-1 flex items-center gap-2">
                        {selectedPost.itemCondition && (
                          <span>
                            상태:{' '}
                            {selectedPost.itemCondition === 'new'
                              ? '미개봉'
                              : selectedPost.itemCondition === 'like_new'
                              ? '거의새것'
                              : '중고'}
                          </span>
                        )}
                        {selectedPost.neighborhood && <span>📍 {selectedPost.neighborhood}</span>}
                      </div>
                    </div>

                    {userProfile?.uid === selectedPost.authorId && (
                      <button
                        onClick={() => handleToggleTradeStatus(selectedPost.id, selectedPost.tradeStatus)}
                        className="px-3 py-1.5 rounded-xl bg-teal-600 text-white font-bold text-xs shadow-xs"
                      >
                        상태 전환
                      </button>
                    )}
                  </div>
                )}

                {selectedPost.category === 'care' && (
                  <div className="mb-3 p-3.5 rounded-2xl bg-purple-50 border border-purple-100 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-purple-900 text-sm">🤝 임시돌봄 상세 요강</span>
                      {selectedPost.isUrgentCare && (
                        <span className="px-2 py-0.5 rounded bg-rose-600 text-white text-[10px] font-bold animate-pulse">
                          긴급 SOS
                        </span>
                      )}
                    </div>
                    <p className="text-stone-700">
                      📅 일정: <strong>{selectedPost.careStartDate} ~ {selectedPost.careEndDate}</strong>
                    </p>
                    <p className="text-stone-700">
                      💰 조건: <strong>{selectedPost.careCompensation || '협의'}</strong>
                    </p>
                    {selectedPost.neighborhood && (
                      <p className="text-stone-700">
                        📍 위치: <strong>{selectedPost.neighborhood}</strong>
                      </p>
                    )}
                  </div>
                )}

                <h3 className="text-base font-extrabold text-stone-900">{selectedPost.title}</h3>
                <p className="text-xs text-stone-700 mt-2 whitespace-pre-wrap leading-relaxed">
                  {selectedPost.content}
                </p>

                {selectedPost.photoUrl && (
                  <div className="mt-3 rounded-2xl overflow-hidden bg-stone-100">
                    <img src={selectedPost.photoUrl} alt="" className="w-full object-cover" />
                  </div>
                )}
              </div>

              {/* Likes & Reporting Controls */}
              <div className="flex items-center justify-between pt-2 border-t border-stone-100 text-xs">
                <button
                  onClick={() => handleToggleLike(selectedPost.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 text-rose-700 font-bold"
                >
                  <Heart className="w-4 h-4 fill-current" />
                  <span>좋아요 ({selectedPost.likesCount})</span>
                </button>

                <div className="flex items-center gap-2">
                  {userProfile?.uid === selectedPost.authorId && (
                    <button
                      onClick={() => handleStartEditPost(selectedPost)}
                      className="text-stone-500 hover:text-teal-700 text-[11px] flex items-center gap-1 font-semibold"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>수정</span>
                    </button>
                  )}
                  <button
                    onClick={() => handleReportPost(selectedPost.id)}
                    className="text-stone-400 hover:text-rose-600 text-[11px] flex items-center gap-1"
                  >
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>신고</span>
                  </button>
                  {userProfile?.uid !== selectedPost.authorId && (
                    <button
                      onClick={() => handleBlockUser(selectedPost.authorId, selectedPost.authorName)}
                      className="text-stone-400 hover:text-stone-700 text-[11px] flex items-center gap-1"
                    >
                      <UserX className="w-3.5 h-3.5" />
                      <span>작성자 차단</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Comments Section */}
              <div className="pt-2 border-t border-stone-100 space-y-2.5">
                <h4 className="font-bold text-xs text-stone-800">댓글 ({comments.length})</h4>

                <div className="space-y-2">
                  {comments.map(c => (
                    <div key={c.id} className="p-3 rounded-2xl bg-stone-50 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-stone-800">{c.authorName}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-stone-400">
                            {c.createdAt.split('T')[0]}
                          </span>
                          {(userProfile?.uid === c.authorId || isAdmin) && (
                            <button
                              onClick={() => handleDeleteComment(c.id, selectedPost.id)}
                              className="text-stone-300 hover:text-rose-600 p-0.5"
                              title="댓글 삭제"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                      <p className="text-stone-700">{c.content}</p>
                    </div>
                  ))}
                </div>

                {/* Comment Input */}
                <div className="flex gap-2 pt-2">
                  <input
                    type="text"
                    placeholder={
                      isLoggedIn ? '따뜻한 댓글을 남겨보세요...' : '댓글을 쓰려면 로그인하세요'
                    }
                    disabled={!isLoggedIn}
                    value={newCommentText}
                    onChange={(e) => setNewCommentText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                    className="flex-1 px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs"
                  />
                  <button
                    onClick={handleAddComment}
                    disabled={!isLoggedIn || !newCommentText.trim()}
                    className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:bg-stone-300 text-white font-bold text-xs shadow-xs"
                  >
                    등록
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Post Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl border border-stone-200 overflow-hidden">
            <div className="p-4 border-b border-stone-100 flex items-center justify-between bg-stone-50">
              <h3 className="font-bold text-stone-900 text-sm">
                {editingPostId ? '이야기/나눔 수정' : '새 이야기/나눔 등록'}
              </h3>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingPostId(null);
                }}
                className="w-7 h-7 rounded-full bg-stone-200 text-stone-600 flex items-center justify-center text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-stone-700 mb-1">게시판 카테고리</label>
                <select
                  value={postCategory}
                  onChange={(e) => setPostCategory(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 font-bold"
                >
                  <option value="daily">🐾 반려견 일상</option>
                  <option value="used">🎁 반려용품 중고거래 / 무료나눔</option>
                  <option value="care">🤝 동네 임시돌봄 SOS / 산책품앗이</option>
                  <option value="walk_meet">🦮 산책 모임</option>
                  <option value="news">📢 동네 소식</option>
                  <option value="review">⭐ 장소 방문 후기</option>
                  <option value="qna">❓ 반려견 질문</option>
                  <option value="tips">💡 유용한 정보 공유</option>
                </select>
              </div>

              {/* Conditional Fields for USED */}
              {postCategory === 'used' && (
                <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-3">
                  <span className="font-bold text-emerald-900 block text-xs">
                    🎁 중고거래 / 나눔 정보 입력
                  </span>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-bold text-stone-700 mb-1">거래 유형</label>
                      <select
                        value={postTradeType}
                        onChange={(e) => setPostTradeType(e.target.value as TradeType)}
                        className="w-full px-3 py-2 rounded-xl bg-white border border-stone-200"
                      >
                        <option value="sell">판매</option>
                        <option value="share">무료 나눔 (0원)</option>
                        <option value="buy">구해요</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-stone-700 mb-1">
                        가격 (원) {postTradeType === 'share' && '(나눔은 0원)'}
                      </label>
                      <input
                        type="number"
                        placeholder="예: 15000"
                        disabled={postTradeType === 'share'}
                        value={postTradeType === 'share' ? 0 : postPrice}
                        onChange={(e) => setPostPrice(e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-xl bg-white border border-stone-200 disabled:bg-stone-100"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-bold text-stone-700 mb-1">물품 상태</label>
                      <select
                        value={postItemCondition}
                        onChange={(e) => setPostItemCondition(e.target.value as ItemCondition)}
                        className="w-full px-3 py-2 rounded-xl bg-white border border-stone-200"
                      >
                        <option value="new">미개봉 새상품</option>
                        <option value="like_new">거의 새것</option>
                        <option value="used">사용감 있음</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-stone-700 mb-1">거래 동네</label>
                      <input
                        type="text"
                        placeholder="예: 서울 마포구 연남동"
                        value={postNeighborhood}
                        onChange={(e) => setPostNeighborhood(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-white border border-stone-200"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Conditional Fields for CARE */}
              {postCategory === 'care' && (
                <div className="p-3.5 rounded-2xl bg-purple-50/70 border border-purple-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-purple-900 block text-xs">
                      🤝 임시돌봄 / 산책품앗이 정보
                    </span>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={postIsUrgentCare}
                        onChange={(e) => setPostIsUrgentCare(e.target.checked)}
                        className="w-3.5 h-3.5 text-rose-600 rounded"
                      />
                      <span className="text-[11px] font-extrabold text-rose-700">🚨 긴급 SOS</span>
                    </label>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-bold text-stone-700 mb-1">돌봄 시작일</label>
                      <input
                        type="date"
                        value={postCareStartDate}
                        onChange={(e) => setPostCareStartDate(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-white border border-stone-200"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-stone-700 mb-1">돌봄 종료일</label>
                      <input
                        type="date"
                        value={postCareEndDate}
                        onChange={(e) => setPostCareEndDate(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-white border border-stone-200"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-bold text-stone-700 mb-1">반려견 체구</label>
                      <select
                        value={postDogSize}
                        onChange={(e) => setPostDogSize(e.target.value as any)}
                        className="w-full px-3 py-2 rounded-xl bg-white border border-stone-200"
                      >
                        <option value="소형">소형견 (10kg 미만)</option>
                        <option value="중형">중형견 (10~25kg)</option>
                        <option value="대형">대형견 (25kg 이상)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-stone-700 mb-1">동네/지역</label>
                      <input
                        type="text"
                        placeholder="예: 서울 송파구 잠실동"
                        value={postNeighborhood}
                        onChange={(e) => setPostNeighborhood(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-white border border-stone-200"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-stone-700 mb-1">사례비 또는 품앗이 조건</label>
                    <input
                      type="text"
                      placeholder="예: 사례비 1일 3만원 또는 향후 돌봄 맞교환"
                      value={postCareCompensation}
                      onChange={(e) => setPostCareCompensation(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-stone-200"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block font-bold text-stone-700 mb-1">제목 *</label>
                <input
                  type="text"
                  placeholder="제목을 입력하세요"
                  value={postTitle}
                  onChange={(e) => setPostTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">내용 *</label>
                <textarea
                  rows={4}
                  placeholder="따뜻하고 유익한 이야기를 나눠주세요."
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">사진 URL (선택)</label>
                <input
                  type="text"
                  placeholder="https://..."
                  value={postPhotoUrl}
                  onChange={(e) => setPostPhotoUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200"
                />
              </div>

              <button
                onClick={handleCreateOrUpdatePost}
                disabled={isSubmittingPost}
                className="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md transition-colors"
              >
                {isSubmittingPost
                  ? '저장 중...'
                  : editingPostId
                  ? '수정 완료'
                  : '게시글 등록하기'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
