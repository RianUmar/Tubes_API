import type { HttpContext } from '@adonisjs/core/http'
import { google } from 'googleapis'
import env from '#start/env'

export default class ChatController {
  
  private apiKey = env.get('GEMINI_API_KEY')
  
  private youtube = google.youtube({
    version: 'v3',
    auth: env.get('YOUTUBE_API_KEY'),
  })

  public async handleChat({ request, response }: HttpContext) {
    const { message } = request.only(['message'])
    
    // Validasi input
    if (!message) return response.badRequest({ message: 'Input kosong' })

    try {
      // 1. LOGIKA MANUAL: Cek apakah user minta video?
      const isTutorial = message.toLowerCase().match(/(tutorial|cara|belajar|video|praktek|install|buat|bikin|langkah)/);
      const videoKeyword = isTutorial ? message : null;

      // 2. MINTA PENJELASAN TEKS (Pakai fungsi Smart)
      const textResponse = await this.askGeminiSmart(message);
      
      let videos: any[] = []

      // 3. CARI VIDEO (Hanya jika terdeteksi kata kunci tutorial)
      if (videoKeyword) {
        videos = await this.searchYoutubeVideos(videoKeyword)
      }

      // 4. Kirim Balasan
      return response.ok({
        reply: textResponse,
        videos: videos, 
      })

    } catch (error) {
      console.error("🔥 ERROR:", error)
      return response.internalServerError({ message: 'Error: ' + error.message })
    }
  }

  // --- FUNGSI PINTAR: Cari Model Dulu Baru Tanya ---
  private async askGeminiSmart(userMessage: string) {
    try {
      // LANGKAH A: Tanya Google, "Model apa yang saya punya?"
      const listUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${this.apiKey}`;
      const listRes = await fetch(listUrl);
      
      if (!listRes.ok) throw new Error("Gagal cek model AI");

      const listData: any = await listRes.json();
      
      // LANGKAH B: Pilih model yang cocok (bukan vision, bukan experimental)
      const validModels = listData.models?.filter((m: any) => 
        m.supportedGenerationMethods?.includes("generateContent") && 
        m.name.includes("gemini") &&
        !m.name.includes("vision")
      );

      if (!validModels || validModels.length === 0) {
        return "Maaf, API Key kamu tidak valid untuk model chat manapun.";
      }

      // Prioritaskan model 'pro' atau 'flash'
      let selectedModel = validModels.find((m: any) => m.name.includes("flash"));
      if (!selectedModel) selectedModel = validModels.find((m: any) => m.name.includes("pro"));
      if (!selectedModel) selectedModel = validModels[0]; // Ambil aja yang ada

      // LANGKAH C: Kirim Pertanyaan ke Model Terpilih
      const genUrl = `https://generativelanguage.googleapis.com/v1beta/${selectedModel.name}:generateContent?key=${this.apiKey}`;
      
      const payload = {
        contents: [{ parts: [{ text: `Jawab pertanyaan ini dengan Bahasa Indonesia yang jelas: "${userMessage}"` }] }]
      };

      const res = await fetch(genUrl, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
      });

      if (!res.ok) {
        if (res.status === 429) return "Maaf, kuota gratis harian API Key kamu habis.";
        const errJson = await res.json();
        throw new Error(`Google Error: ${JSON.stringify(errJson)}`);
      }

      const data: any = await res.json();
      
      if (data.candidates && data.candidates[0].content) {
        return data.candidates[0].content.parts[0].text;
      } else {
        return "AI merespon tapi kosong.";
      }

    } catch (e: any) {
      console.error("SMART FETCH ERROR:", e);
      return `⚠️ Gagal menghubungi AI: ${e.message}`;
    }
  }

  // --- HELPER YOUTUBE ---
  private async searchYoutubeVideos(keyword: string) {
    try {
      const res = await this.youtube.search.list({
        part: ['snippet'],
        q: keyword,
        maxResults: 5, 
        type: ['video'],
      })
      return res.data.items?.map((item: any) => ({
        title: item.snippet?.title,
        thumbnail: item.snippet?.thumbnails?.medium?.url,
        url: `https://www.youtube.com/watch?v=${item.id?.videoId}`,
      })) || []
    } catch (e) {
      return []
    }
  }
}