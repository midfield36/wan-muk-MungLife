import React, { useState } from 'react';
import { Sparkles, Send, Bot, User, AlertCircle, Info, RefreshCw } from 'lucide-react';
import { useAuth } from '../../firebase/authContext';

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

const SAMPLE_QUESTIONS = [
  '🐶 초보 보호자인데 생후 3개월 강아지 기초 접종 주기가 어떻게 되나요?',
  '🦮 강아지가 산책 중 풀이나 흙을 뜯어먹으려 하는데 괜찮을까요?',
  '🎒 반려견과 1박 2일 여행 갈 때 꼭 챙겨야 할 필수품 추천해줘',
  '🦴 강아지가 먹으면 절대 안 되는 위험한 음식과 대처법 알려줘',
  '🐾 슬개골 탈구를 예방하기 위한 집안 환경 조성 팁은?',
];

export const AiAssistantModal: React.FC<AiAssistantModalProps> = ({ isOpen, onClose }) => {
  const { userProfile } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: '안녕하세요! 멍라이프 AI 반려견 생활 도우미입니다. 🐾\n\n초보 보호자 가이드부터 산책/여행 준비물, 행동 교정, 건강 관리 상식까지 무엇이든 편하게 물어보세요!\n\n⚠️ 본 AI 안내는 수의사의 전문 진료를 대신하지 않으며, 응급 상황 발생 시에는 즉시 동물병원으로 연락하셔야 합니다.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

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

    try {
      const res = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: textToSend.trim(),
          dogContext: userProfile ? { owner: userProfile.displayName } : undefined,
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
      <div className="bg-white rounded-3xl max-w-lg w-full h-[85vh] flex flex-col shadow-2xl border border-stone-200 overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-stone-100 flex items-center justify-between bg-linear-to-r from-amber-50 to-teal-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-amber-100 text-amber-800">
              <Sparkles className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-extrabold text-stone-900 text-sm">멍라이프 AI 생활 도우미</h3>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-200 text-amber-900 font-bold">
                  Gemini API
                </span>
              </div>
              <p className="text-[11px] text-stone-500">24시간 언제나 물어보는 반려견 케어 비서</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-200 hover:bg-stone-300 text-stone-600 flex items-center justify-center text-xs font-bold"
          >
            ✕
          </button>
        </div>

        {/* Disclaimer Bar */}
        <div className="px-4 py-2 bg-amber-100/60 border-b border-amber-200 text-amber-950 text-[11px] flex items-center gap-2">
          <Info className="w-3.5 h-3.5 text-amber-700 shrink-0" />
          <span>AI 답변은 양육 참고용이며 진단이나 처방이 아닙니다.</span>
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
                className={`max-w-[82%] p-3.5 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap shadow-2xs ${
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
            <div className="flex items-center gap-2 text-stone-400 text-xs py-2">
              <RefreshCw className="w-4 h-4 animate-spin text-teal-600" />
              <span>멍라이프 AI가 답변을 작성하고 있습니다...</span>
            </div>
          )}
        </div>

        {/* Suggestion Chips */}
        <div className="p-2 border-t border-stone-100 bg-white overflow-x-auto flex gap-1.5 scrollbar-none">
          {SAMPLE_QUESTIONS.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(q)}
              className="text-[11px] px-2.5 py-1.5 rounded-xl bg-stone-100 hover:bg-teal-50 hover:text-teal-800 text-stone-700 whitespace-nowrap transition-colors border border-stone-200 shrink-0"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3 border-t border-stone-200 bg-white flex items-center gap-2">
          <input
            type="text"
            placeholder="반려견에 대한 궁금증을 물어보세요..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            className="flex-1 px-4 py-2.5 rounded-2xl bg-stone-50 border border-stone-200 text-xs text-stone-800 focus:outline-teal-500"
          />
          <button
            onClick={() => handleSend()}
            disabled={loading || !input.trim()}
            className="p-2.5 rounded-2xl bg-teal-600 hover:bg-teal-700 disabled:bg-stone-300 text-white shadow-xs transition-colors shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
