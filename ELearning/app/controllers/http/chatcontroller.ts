import type { HttpContext } from '@adonisjs/core/http'
import Course from '#models/course_mongoose'

export default class ChatController {
  public async test({ response }: HttpContext) {
    return response.ok({ message: 'Chat test berhasil' })
  }

  public async ask({ request, response }: HttpContext) {
    const { question } = request.all()
    
    if (!question) {
      return response.badRequest({ message: 'Pertanyaan tidak boleh kosong' })
    }

    const courses = await Course.find()
    
    if (courses.length === 0) {
      return response.ok({
        answer: 'Belum ada course yang tersedia. Silakan tambahkan course terlebih dahulu.',
      })
    }

    const match = courses.find((c) =>
      c.content?.toLowerCase().includes(question.toLowerCase())
    )

    if (match) {
      return response.ok({
        answer: `Berdasarkan materi "${match.title}": ${match.content}`,
      })
    }

    return response.ok({
      answer: 'Maaf, saya belum menemukan jawaban untuk pertanyaan itu.',
    })
  }
}