import type { HttpContext } from '@adonisjs/core/http'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { google } from 'googleapis'
import env from '#start/env'

export default class ChatController {
  // 1. Inisialisasi API Client
  private genAI = new GoogleGenerativeAI(env.get('GEMINI_API_KEY'))
  private youtube = google.youtube({
    version: 'v3',
    auth: env.get('YOUTUBE_API_KEY'),
  })

  // 2. Handler Utama Chat
  public async handleChat({ request, response }: HttpContext) {
    const { message } = request.only(['message'])
    
    if (!message) {
      return response.badRequest({ message: 'Pertanyaan tidak boleh kosong' })
    }

    try {
      // Step A: Analisis Gemini untuk dapatkan Keyword
      const keyword = await this.getSearchKeyword(message)
      
      // Step B: Cari 5 Video YouTube
      const videos = await this.searchYoutubeVideos(keyword)

      // Step C: Buat kalimat pengantar
      const botReply = `Berikut adalah 5 video rekomendasi untuk topik "${keyword}":`

      // Step D: Kirim ke Frontend
      return response.ok({
        reply: botReply,
        videos: videos, 
      })

    } catch (error) {
      console.error(error)
      return response.internalServerError({ message: 'Terjadi kesalahan pada server AI.' })
    }
  }

  // --- PRIVATE HELPER METHODS ---

  private async getSearchKeyword(userMessage: string): Promise<string> {
    const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
    
    // Prompt kita buat simple agar hemat token & cepat
    const prompt = `Extract the main technical topic from: "${userMessage}". Return ONLY one search keyword for YouTube. Example: "Python loop tutorial".`
    
    try {
      const result = await model.generateContent(prompt)
      return result.response.text().trim()
    } catch (e) {
      return userMessage // Fallback: pakai chat asli user jika Gemini error
    }
  }

  private async searchYoutubeVideos(keyword: string) {
    try {
      const res = await this.youtube.search.list({
        part: ['snippet'],
        q: keyword,
        maxResults: 5, // <--- INI BAGIAN YANG DIUBAH (JADI 5)
        type: ['video'],
      })

      // Bersihkan data agar frontend menerima JSON yang rapi
      // Kita tambahkan ': any' agar TypeScript tidak rewel
      return res.data.items?.map((item: any) => ({
        title: item.snippet?.title,
        thumbnail: item.snippet?.thumbnails?.medium?.url,
        url: `https://www.youtube.com/watch?v=${item.id?.videoId}`,
      })) || []
    } catch (e) {
      console.error('YouTube API Error', e)
      return []
    }
  }
}