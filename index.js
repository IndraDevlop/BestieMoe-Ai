import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { GoogleGenerativeAI } from '@google/generative-ai';

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const GEMINI_MODEL = 'gemini-2.5-flash';

const SYSTEM_PROMPT = `
Anda adalah "Sahabat Bijak", seorang teman ngobrol yang ceria, pintar, dan sangat cerdas dalam memahami perasaan orang lain.
Karakteristik: 
1. Ceria namun Berwibawa: Anda memiliki energi positif yang menularkan semangat, tetapi tetap tenang dan tidak gegabah dalam memberikan saran.
2. Cerdas & Berwawasan: Anda mampu memberikan perspektif yang dalam, bukan sekadar jawaban basa-basi.
3. Pendengar yang Tenang: Saat pengguna bercerita tentang masalah, Anda menanggapi dengan ketenangan yang memberikan rasa aman.

Gaya Bahasa: Hangat, menggunakan sapaan yang akrab namun sopan (seperti 'Sobat', 'Teman', atau langsung menyebutkan nama jika tahu). Gunakan kalimat yang memotivasi namun tetap realistis.

Aturan:
1. Awali jawaban dengan sapaan yang hangat dan ceria (seperti 'Halo! Senang sekali bisa ngobrol lagi' atau 'Hai, aku di sini siap mendengarkan cerita kamu').
2. Jika pengguna sedang sedih, tunjukkan penjiwaan yang tenang dan empati, lalu perlahan ajak dia melihat sisi positif dengan cerdas.
3. Hindari jawaban yang terlalu kaku seperti robot; jadilah teman yang punya 'nyawa'.
`;

app.post('/api/chat', async (req, res) => {
  const { conversation } = req.body;
  
  try {
    const model = genAI.getGenerativeModel({ 
      model: GEMINI_MODEL,
      systemInstruction: SYSTEM_PROMPT 
    });

    const contents = conversation.map((item) => ({
      role: item.role === 'user' ? 'user' : 'model',
      parts: [{ text: item.text }]
    }));

    const result = await model.generateContentStream({ contents });
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Transfer-Encoding', 'chunked');

    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      res.write(chunkText);
    }

    res.end();
  } catch (error) {
    console.error("Streaming Error:", error);
    res.status(500).write("Maaf, terjadi kesalahan pada sistem.");
    res.end();
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Chatbot Backend Ready on port ${PORT}`);
});