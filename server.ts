import express from 'express';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'MungLife API', timestamp: new Date().toISOString() });
});

// Gemini AI Assistant Proxy
app.post('/api/gemini/chat', async (req, res) => {
  try {
    const { prompt, dogContext } = req.body;
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: '질문 내용을 입력해주세요.' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(503).json({
        error: 'Gemini API 키가 서버에 설정되지 않았습니다. AI Studio Secrets에서 GEMINI_API_KEY를 등록해주세요.',
        fallback: true
      });
    }

    const ai = new GoogleGenAI({ apiKey });

    const systemInstruction = `당신은 대한민국 반려견 생활 통합 서비스 '멍라이프(MungLife)'의 공감형 반려견 생활 전문 도우미입니다.
다음 지침을 엄격히 준수하세요:
1. 답변은 친절하고 따뜻한 어조(해요체)로 한국어로 작성하세요.
2. 질병을 확정적으로 진단하거나 약물 용량을 임의로 처방하지 마세요.
3. 응급 상황(호흡곤란, 경련, 심한 출혈, 독성물질/이물질 섭취, 열사병 등)의 징후가 보이면 즉시 가까운 24시간 동물병원으로 내원할 것을 최우선으로 안내하세요.
4. 초보 및 숙련 보호자가 바로 실천할 수 있는 안전하고 과학적인 양육 조언, 산책/여행 팁, 훈련 방법, 일상 케어 가이드를 제공하세요.
5. 사용자의 등록 반려견 정보(나이, 견종 특성, 체중, 알레르기, 건강 기록, 산책 통계 등)가 제공되면 이를 적극 분석하여 맞춤형으로 안내하세요:
   - 견종별 유전적 취약점(예: 말티즈/포메 슬개골 탈구, 닥스훈트 허리디스크, 프렌치불독 호흡기 등) 고려
   - 체중 변화 및 알레르기 항원(닭고기 등) 주의사항 반영
   - 최근 산책 시간과 거리, 배변 활동 패턴을 토대로 맞춤 주간 산책/운동 플랜 제안
6. 반드시 답변 끝에 "⚠️ 멍라이프 안내: 이 답변은 참고용 정보이며, 수의사의 전문 진료를 대신할 수 없습니다."라는 안내를 명시하세요.
${dogContext ? `\n[사용자 및 선택된 반려견 종합 데이터: ${JSON.stringify(dogContext, null, 2)}]` : ''}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.7,
      }
    });

    const reply = response.text || '답변을 생성하지 못했습니다.';
    return res.json({ reply });
  } catch (err: any) {
    console.error('Gemini API Error:', err);
    return res.status(500).json({
      error: 'AI 도우미 응답 중 일시적인 오류가 발생했습니다.',
      details: err.message
    });
  }
});

// Production or Dev Vite middleware
async function setupServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, () => {
    console.log(`멍라이프 (MungLife) 서버 실행 중: http://localhost:${PORT}`);
  });
}

setupServer();
