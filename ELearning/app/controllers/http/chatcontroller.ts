import type { HttpContext } from '@adonisjs/core/http'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { google } from 'googleapis'
import env from '#start/env'

export default class ChatController {
  
  private genAI = new GoogleGenerativeAI(env.get('GEMINI_API_KEY'))
  private youtube = google.youtube({
    version: 'v3',
    auth: env.get('YOUTUBE_API_KEY'),
  })

  public async handleChat({ request, response }: HttpContext) {
    const { message } = request.only(['message'])
    if (!message) return response.badRequest({ message: 'Input kosong' })

    try {
      // 1. DAPATKAN ANALISIS DARI GEMINI
      const aiAnalysis = await this.askGemini(message)
      
      let videos: any[] = []

      // 2. LOGIKA VIDEO
      // Kita cari video jika AI menyarankan (needs_video = true)
      // ATAU jika parsing gagal tapi kita mendeteksi keyword 'tutorial' di pertanyaan user
      if (aiAnalysis.needs_video && aiAnalysis.video_keyword) {
        videos = await this.searchYoutubeVideos(aiAnalysis.video_keyword)
      }

      // 3. KIRIM JAWABAN
      return response.ok({
        reply: aiAnalysis.text_response, // Ini sekarang pasti berisi penjelasan
        videos: videos, 
      })

    } catch (error) {
      console.error("🔥 SYSTEM ERROR:", error)
      return response.internalServerError({ message: 'Server sedang sibuk.' })
    }
  }

  // --- HELPER GEMINI: ROBUST VERSION ---
  private async askGemini(userMessage: string) {
    const model = this.genAI.getGenerativeModel({ model: 'gemini-pro' })

    const prompt = `
      Kamu adalah guru E-Learning. Pertanyaan Siswa: "${userMessage}"
      
      Instruksi:
      1. Jawab pertanyaan siswa dengan LENGKAP dan JELAS (Bahasa Indonesia).
      2. Format jawabanmu WAJIB JSON seperti ini:
      {
        "text_response": "Tulis penjelasan panjangmu disini...",
        "needs_video": true/false (True jika butuh tutorial visual),
        "video_keyword": "keyword pencarian youtube"
      }
    `
    
    try {
      const result = await model.generateContent(prompt)
      let text = result.response.text()

      // Bersihkan Markdown ```json dan ```
      text = text.replace(/```json/g, '').replace(/```/g, '').trim()
      
      // COBA PARSE JSON
      return JSON.parse(text)

    } catch (e) {
      console.warn("⚠️ JSON Parse Gagal, mengambil Raw Text...", e)
      
      // --- PERBAIKAN UTAMA DISINI ---
      // Jika JSON gagal diparse, jangan buang teksnya!
      // Kemungkinan besar Gemini menjawab dengan teks biasa (bukan JSON).
      // Jadi kita pakai teks itu sebagai jawabannya.
      
      const isTutorial = userMessage.toLowerCase().match(/(tutorial|cara|belajar|video|praktek)/)

      return {
        // Kita ambil teks mentah dari Gemini sebagai jawaban (ini yang tadi hilang)
        text_response: e instanceof SyntaxError ? result.response.text().replace(/```json/g, '').replace(/```/g, '') : "Maaf, saya tidak dapat menjawab saat ini.",
        
        // Kita tentukan kebutuhan video secara manual
        needs_video: !!isTutorial,
        video_keyword: userMessage
      }
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