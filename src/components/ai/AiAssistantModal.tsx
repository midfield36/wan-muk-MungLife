import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Send,
  Bot,
  User,
  Info,
  RefreshCw,
  Activity,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '../../firebase/authContext';
import { Dog, HealthRecord, WalkRecord, Reminder } from '../../types';
import {
  fetchDogs,
  fetchHealthRecords,
  fetchWalks,
  fetchReminders,
} from '../../services/dbService';

interface AiAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}

export const AiAssistantModal: React.FC<AiAssistantModalProps> = ({ isOpen, onClose }) => {
  const { userProfile } = useAuth();
  const [dogs, setDogs] = useState<Dog[]>([]);
  const [selectedDogId, setSelectedDogId] = useState<string>('general');
  const [healthRecords, setHealthRecords] = useState<HealthRecord[]>([]);
  const [walks, setWalks] = useState<WalkRecord[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: '안녕하세요! 멍라이프 AI 반려견 생활 도우미입니다. 🐾\n\n등록하신 우리 아이(반려견)를 선택하시면 건강 기록과 산책 통계를 바탕으로 꼭 맞춘 맞춤형 건강 관리, 산책 플랜, 행동 교정 가이드를 제공해 드려요!\n\n궁금한 점이 있다면 아래 추천 질문을 누르시거나 직접 물어보세요.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  // Load dogs on mount / modal open
  useEffect(() => {
    if (!isOpen) return;
    async function loadDogs() {
      const ownerId = userProfile?.uid || 'demo-user-munglife';
      try {
        const dogList = await fetchDogs(ownerId);
        setDogs(dogList);
        if (dogList.length > 0 && selectedDogId === 'general') {
          setSelectedDogId(dogList[0].id);
        }
      } catch (err) {
        console.warn('Failed to load dogs for AI context', err);
      }
    }
    loadDogs();
  }, [isOpen, userProfile]);

  // Load selected dog's health & walk stats
  useEffect(() => {
    if (selectedDogId === 'general') {
      setHealthRecords([]);
      setWalks([]);
      setReminders([]);
      return;
    }

    async function loadDogDetails() {
      const ownerId = userProfile?.uid || 'demo-user-munglife';
      try {
        const [hrs, wks, rems] = await Promise.all([
          fetchHealthRecords(selectedDogId, ownerId),
          fetchWalks(ownerId),
          fetchReminders(selectedDogId, ownerId),
        ]);
        setHealthRecords(hrs);
        setWalks(wks.filter(w => w.dogId === selectedDogId));
        setReminders(rems.filter(r => !r.isCompleted));
      } catch (err) {
        console.warn('Failed to load dog details for AI', err);
      }
    }
    loadDogDetails();
  }, [selectedDogId, userProfile]);

  if (!isOpen) return null;

  const currentDog = dogs.find(d => d.id === selectedDogId);

  // Calculate walk stats
  const totalWalkCount = walks.length;
  const avgDuration = totalWalkCount > 0
    ? Math.round(walks.reduce((acc, w) => acc + w.durationMinutes, 0) / totalWalkCount)
    : 0;
  const avgDistance = totalWalkCount > 0
    ? Math.round(walks.reduce((acc, w) => acc + w.distanceMeters, 0) / totalWalkCount)
    : 0;

  // Dynamic personalized quick questions
  const getPersonalizedPrompts = () => {
    if (!currentDog) {
      return [
        '🐶 초보 보호자 기초 접종 주기가 어떻게 되나요?',
        '🦮 산책 중 풀이나 흙을 먹으려 하는데 괜찮을까요?',
        '🎒 반려견과 1박 2일 여행 필수 준비물 추천해줘',
        '🦴 강아지가 먹으면 안 되는 위험한 음식과 대처법',
        '🐾 슬개골 탈구 예방을 위한 집안 환경 조성법',
      ];
    }

    const prompts = [
      `🏃 ${currentDog.name} 맞춤 1주일 산책 & 활동량 계획 짜줘`,
      `🥗 ${currentDog.name}(${currentDog.weight ? currentDog.weight + 'kg' : currentDog.breed}) 건강 체중 & 식단 조언`,
      `🩺 ${currentDog.name} 최근 건강기록 분석 및 다음 병원 체크리스트`,
      `🦴 ${currentDog.breed} 견종 특성에 맞춘 실내 관절 운동 & 놀이법`,
    ];

    if (currentDog.allergies && currentDog.allergies !== '없음') {
      prompts.push(`⚠️ ${currentDog.allergies} 알레르기 대체 간식과 안전한 사료 가이드`);
    }

    return prompts;
  };

  const handleSend = async (questionText?: string) => {
    const textToSend = questionText || input;
    if (!textToSend.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: `u_${Date.now()}`,
      sender: 'user',
      text: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    if (!questionText) setInput('');
    setLoading(true);

    // Build rich context payload
    const dogContext = currentDog
      ? {
          name: currentDog.name,
          breed: currentDog.breed,
          gender: currentDog.gender,
          birthDate: currentDog.birthDate,
          weightKg: currentDog.weight,
          neutered: currentDog.neutered,
          allergies: currentDog.allergies,
          specialNotes: currentDog.notes,
          recentHealthRecords: healthRecords.slice(0, 5).map(h => ({
            type: h.type,
            title: h.title,
            date: h.date,
            hospital: h.hospitalName,
            notes: h.notes,
            nextDueDate: h.nextDueDate,
          })),
          walkStats: {
            recordedWalksCount: totalWalkCount,
            avgDurationMinutes: avgDuration,
            avgDistanceMeters: avgDistance,
            recentWalkMemos: walks.slice(0, 3).map(w => w.memo).filter(Boolean),
          },
          pendingReminders: reminders.map(r => ({
            title: r.title,
            date: r.date,
            memo: r.memo,
          })),
        }
      : undefined;

    try {
      const res = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: textToSend.trim(),
          dogContext,
        }),
      });

      const data = await res.json();
      const replyText =
        data.reply ||
        data.error ||
        '죄송합니다. 현재 AI 도우미 서버 연결에 지연이 발생했습니다. 잠시 후 다시 시도해 주세요.';

      const aiMsg: ChatMessage = {
        id: `ai_${Date.now()}`,
        sender: 'ai',
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      console.error('Chat error', err);
      const errorMsg: ChatMessage = {
        id: `err_${Date.now()}`,
        sender: 'ai',
        text: '네트워크 연결 상태를 확인해 주세요. 긴급한 의료 상담은 상단 [긴급 24시] 메뉴를 통해 인근 동물병원에 직접 전화 문의하시기 바랍니다.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full h-[88vh] flex flex-col shadow-2xl border border-stone-200 overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-stone-100 flex items-center justify-between bg-linear-to-r from-amber-50 to-teal-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-amber-100 text-amber-800">
              <Sparkles className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-extrabold text-stone-900 text-sm">멍라이프 AI 맞춤 도우미</h3>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-200 text-amber-900 font-bold">
                  Gemini API
                </span>
              </div>
              <p className="text-[11px] text-stone-500">
                건강기록 및 산책 패턴 연동 실시간 맞춤 상담
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-200 hover:bg-stone-300 text-stone-600 flex items-center justify-center text-xs font-bold transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Pet Selection Dropdown Bar */}
        <div className="px-4 py-2 bg-stone-100/80 border-b border-stone-200 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5 font-bold text-stone-700">
            <span>🐾 상담 반려견 선택:</span>
          </div>

          <div className="relative">
            <select
              value={selectedDogId}
              onChange={(e) => setSelectedDogId(e.target.value)}
              className="pl-3 pr-7 py-1 rounded-xl bg-white border border-stone-300 text-xs font-bold text-stone-800 shadow-2xs focus:outline-teal-500 cursor-pointer appearance-none"
            >
              <option value="general">🌐 전체 일반 양육 상담</option>
              {dogs.map(d => (
                <option key={d.id} value={d.id}>
                  🐾 {d.name} ({d.breed}, {d.weight ? `${d.weight}kg` : '체중미입력'})
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-stone-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Selected Pet Health & Walk Context Snippet */}
        {currentDog && (
          <div className="px-4 py-2 bg-teal-50/70 border-b border-teal-100 text-[11px] text-teal-950 flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="font-extrabold flex items-center gap-1 text-teal-800">
              <Activity className="w-3.5 h-3.5 text-teal-600" />
              {currentDog.name} 프로필 연동됨
            </span>
            <span>• 품종: {currentDog.breed}</span>
            {currentDog.weight && <span>• 체중: {currentDog.weight}kg</span>}
            {currentDog.allergies && currentDog.allergies !== '없음' && (
              <span className="text-amber-800 font-bold">• 알레르기: {currentDog.allergies}</span>
            )}
            {totalWalkCount > 0 && (
              <span className="text-stone-600">
                • 최근 산책 {totalWalkCount}회 (평균 {avgDuration}분 / {avgDistance}m)
              </span>
            )}
          </div>
        )}

        {/* Disclaimer Bar */}
        <div className="px-4 py-1.5 bg-amber-50 border-b border-amber-200 text-amber-900 text-[11px] flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-amber-700 shrink-0" />
          <span>AI 답변은 양육 참고용이며 진단이나 처방이 아닙니다. 응급 시 즉시 병원에 내원하세요.</span>
        </div>

        {/* Chat History */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-stone-50/50">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex items-start gap-2.5 ${
                m.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
              }`}
            >
              <div
                className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 ${
                  m.sender === 'user'
                    ? 'bg-stone-800 text-white'
                    : 'bg-teal-600 text-white shadow-xs'
                }`}
              >
                {m.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div
                className={`max-w-[85%] p-3.5 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap shadow-2xs ${
                  m.sender === 'user'
                    ? 'bg-teal-600 text-white rounded-tr-none'
                    : 'bg-white text-stone-800 border border-stone-200 rounded-tl-none'
                }`}
              >
                {m.text}
                <span
                  className={`block text-[9px] mt-1.5 ${
                    m.sender === 'user' ? 'text-teal-200 text-right' : 'text-stone-400'
                  }`}
                >
                  {m.timestamp}
                </span>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-stone-400 text-xs py-2 bg-white/80 p-3 rounded-2xl border border-stone-100">
              <RefreshCw className="w-4 h-4 animate-spin text-teal-600 shrink-0" />
              <span>
                {currentDog ? `${currentDog.name}의 건강 & 산책 기록을 분석하여 답변 중...` : '멍라이프 AI가 답변을 작성하고 있습니다...'}
              </span>
            </div>
          )}
        </div>

        {/* Smart Personalized Suggestion Chips */}
        <div className="p-2 border-t border-stone-100 bg-white overflow-x-auto flex gap-1.5 scrollbar-none">
          {getPersonalizedPrompts().map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(q)}
              className="text-[11px] px-2.5 py-1.5 rounded-xl bg-teal-50/70 hover:bg-teal-100 text-teal-900 whitespace-nowrap transition-colors border border-teal-200/60 shrink-0 font-medium active:scale-95"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3 border-t border-stone-200 bg-white flex items-center gap-2">
          <input
            type="text"
            placeholder={
              currentDog
                ? `${currentDog.name}에 관해 궁금한 점을 질문해보세요...`
                : '반려견에 대한 궁금증을 물어보세요...'
            }
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            className="flex-1 px-4 py-2.5 rounded-2xl bg-stone-50 border border-stone-200 text-xs text-stone-800 focus:outline-teal-500 shadow-inner"
          />
          <button
            onClick={() => handleSend()}
            disabled={loading || !input.trim()}
            className="p-2.5 rounded-2xl bg-teal-600 hover:bg-teal-700 disabled:bg-stone-300 text-white shadow-xs transition-colors shrink-0 active:scale-95"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
