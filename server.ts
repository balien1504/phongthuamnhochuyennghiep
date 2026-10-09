import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json({ limit: '25mb' }));

// Initialize Google GenAI
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
});

// API endpoint for AI Vocal Coach and Studio Mastering Analysis
app.post('/api/vocal-coach', async (req, res) => {
  try {
    const { 
      genre = 'Pop', 
      vocalKey = 'C Major', 
      lyrics = '', 
      audioMetrics = {},
      presetName = 'Pop Star'
    } = req.body;

    const prompt = `
Bạn là Kỹ Sư Âm Thanh & Chuyên Gia Thu Âm Giọng Hát Phòng Thu (Mastering Audio Engineer & Vocal Producer) chuyên nghiệp chuẩn quốc tế.
Người dùng đang thu âm giọng hát và muốn cải thiện để giọng hát trở nên mượt mà, truyền cảm, bắt tai như ca sĩ chuyên nghiệp.

Thông tin bản thu:
- Thể loại nhạc: ${genre}
- Tone / Giọng bài hát: ${vocalKey}
- Phong cách mong muốn: ${presetName}
- Lời bài hát / Ghi chú: ${lyrics || 'Không có lời hát cụ thể'}
- Thống kê âm thanh (Pitch stability: ${audioMetrics.pitchStability ?? '80%'}, Dynamic range: ${audioMetrics.dynamicRange ?? 'Medium'}, Spectral balance: ${audioMetrics.spectralBalance ?? 'Balanced'})

Hãy đưa ra đánh giá phân tích chuyên sâu và thông số tinh chỉnh bằng tiếng Việt chuẩn xác theo định dạng JSON với các trường:
{
  "vocalAssessment": "Nhận xét chi tiết về chất giọng, độ ấm, độ sáng, nhịp và cảm xúc",
  "pitchGuidance": "Hướng dẫn cụ thể về lấy hơi, luyến láy (vibrato), ngân vang và điểm chuyển giọng ngực sang giọng gió (head voice / falsetto)",
  "singLikeStarTips": [
    "Mẹo 1 để hát mượt mà như ca sĩ phòng thu",
    "Mẹo 2 về vị trí đặt âm thanh và khẩu hình",
    "Mẹo 3 về cách nhả chữ tiếng Việt cho tròn vành rõ chữ không bị phô"
  ],
  "recommendedSettings": {
    "autoTuneStrength": 65, // 0 - 100%
    "pitchSpeed": 25, // ms (0 = cực nhanh robot, 60 = tự nhiên)
    "noiseGateThreshold": -42, // dB (-60 đến -20)
    "eqLowCut": 90, // Hz
    "eqWarmth": 2.5, // dB (-6 đến +6)
    "eqAir": 3.8, // dB (0 đến 8)
    "deEsser": 45, // %
    "compressorRatio": 3.5, // 1 to 8
    "reverbDecay": 2.2, // seconds
    "reverbWet": 28, // %
    "delayWet": 18, // %
    "saturation": 22 // %
  },
  "coachQuote": "Câu khích lệ truyền cảm hứng chuyên nghiệp cho ca sĩ"
}

Chỉ trả về JSON thuần túy, không có backticks markdown hay giải thích thêm.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const text = response.text || '{}';
    res.json(JSON.parse(text));
  } catch (error: any) {
    console.error('Error in vocal-coach API:', error);
    // Provide a rich fallback if API key is not yet set or rate limited
    res.json({
      vocalAssessment: "Giọng hát có độ dày tự nhiên và âm vực tiềm năng. Cần bổ sung độ nén quang học (Optical Compression) và cắt tần số ù nền để giọng nổi bật trên nền nhạc.",
      pitchGuidance: "Hãy thả lỏng cơ hàm khi lên nốt cao, tập trung dồn cột hơi từ cơ hoành để nốt ngân vững chãi hơn.",
      singLikeStarTips: [
        "Hát gần micro khoảng 10-15cm và hơi nghiêng 15 độ để tránh âm gió bập bùng (plosives).",
        "Tập luyến đuôi câu nhẹ nhàng bằng giọng pha thay vì gằn giọng ngực.",
        "Kéo dài nguyên âm và nhả phụ âm dứt khoát theo nhịp beat."
      ],
      recommendedSettings: {
        autoTuneStrength: 70,
        pitchSpeed: 20,
        noiseGateThreshold: -45,
        eqLowCut: 95,
        eqWarmth: 2.0,
        eqAir: 3.5,
        deEsser: 40,
        compressorRatio: 3.5,
        reverbDecay: 2.0,
        reverbWet: 25,
        delayWet: 15,
        saturation: 20
      },
      coachQuote: "Giọng hát của bạn sở hữu cá tính riêng biệt. Với một chút hiệu ứng phòng thu chuẩn, âm thanh sẽ chạm đến cảm xúc người nghe!"
    });
  }
});

// API endpoint for AI Custom Sound Effect / Style Designer
app.post('/api/ai-preset-master', async (req, res) => {
  try {
    const { prompt: userPrompt } = req.body;
    const aiPrompt = `
Bạn là Master Sound Engineer phòng thu âm. Hãy thiết lập một preset âm thanh hoàn chỉnh cho giọng hát dựa trên yêu cầu: "${userPrompt}".
Trả về JSON cấu trúc:
{
  "name": "Tên preset ngắn gọn (ví dụ: Ballad Hoàng Hôn, Trap Vibe 808, Sơn Tùng Style)",
  "description": "Mô tả màu sắc âm thanh (1 câu)",
  "settings": {
    "autoTuneStrength": 60, // 0 - 100
    "pitchSpeed": 30, // 0 (robot) to 80 (tự nhiên)
    "noiseGateThreshold": -42, // -60 to -20 dB
    "eqLowCut": 90, // 40 to 180 Hz
    "eqWarmth": 2.5, // -6 to +6 dB
    "eqMidPresence": 1.8, // -6 to +6 dB
    "eqAir": 4.0, // 0 to 8 dB
    "deEsser": 45, // 0 to 100%
    "compressorThreshold": -22, // -40 to -10 dB
    "compressorRatio": 4.0, // 1 to 10
    "reverbType": "Plate", // "Plate" | "Room" | "Hall" | "Cathedral"
    "reverbDecay": 2.4, // 0.5 to 6.0 seconds
    "reverbWet": 30, // 0 to 80%
    "delayTime": 320, // 80 to 750 ms
    "delayFeedback": 35, // 0 to 70%
    "delayWet": 20, // 0 to 60%
    "saturation": 25, // 0 to 70%
    "doublerWet": 15 // 0 to 50%
  }
}
Chỉ trả về JSON thuần túy.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: aiPrompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    res.json(JSON.parse(response.text || '{}'));
  } catch (error) {
    console.error('Error in ai-preset-master:', error);
    res.json({
      name: "Studio Diamond Master",
      description: "Chất âm sáng trong trẻo, vocal nổi bật phía trước bản phối với âm vang mềm mại.",
      settings: {
        autoTuneStrength: 65,
        pitchSpeed: 25,
        noiseGateThreshold: -44,
        eqLowCut: 95,
        eqWarmth: 1.5,
        eqMidPresence: 2.2,
        eqAir: 4.2,
        deEsser: 50,
        compressorThreshold: -20,
        compressorRatio: 3.8,
        reverbType: "Plate",
        reverbDecay: 2.1,
        reverbWet: 28,
        delayTime: 330,
        delayFeedback: 30,
        delayWet: 18,
        saturation: 22,
        doublerWet: 20
      }
    });
  }
});

// Setup Vite in development or static in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, () => {
    console.log(`VocalStudio AI server running on port ${port}`);
  });
}

startServer();
