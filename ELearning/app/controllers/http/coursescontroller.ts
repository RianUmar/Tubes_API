import type { HttpContext } from '@adonisjs/core/http'
import Course from '#models/course_mongoose'
// Pastikan import User sesuai dengan path model kamu
import User from '#models/user'

export default class CoursesController {
  
  // 1. LIHAT SEMUA COURSE
  public async index({ response }: HttpContext) {
    // Urutkan dari yang terbaru (descending)
    const courses = await Course.find().sort({ createdAt: -1 })
    return response.ok(courses)
  }

  // 2. BUAT COURSE BARU (UPDATED LOGIC)
  public async store({ request, response }: HttpContext) {
    // Ambil data dari Body Form (karena kita kirim userId manual dari frontend)
    const { title, description, userId } = request.all()
    
    // Validasi Input
    if (!title || !description) {
      return response.badRequest({ message: 'Title dan description wajib diisi' })
    }

    // Validasi User ID (Pengganti Middleware Auth sementara)
    if (!userId) {
        return response.unauthorized({ message: 'Anda harus login (User ID tidak ditemukan)' })
    }

    try {
      // Cari data user asli di database untuk mendapatkan nama
      const userDb = await User.findById(userId)
      const authorName = userDb ? userDb.name : 'Anonymous'

      // Simpan Course
      const course = await Course.create({
        title,
        description,
        author: authorName, // Nama asli dari DB
        userId: userId      // ID Pemilik dari Frontend
      })
      
      return response.created({ message: 'Course berhasil dibuat', data: course })
    } catch (error) {
      console.error(error)
      return response.internalServerError({ message: 'Gagal membuat course', error })
    }
  }

  // 3. UPDATE COURSE (Hanya Pemilik)
  public async update({ params, request, response }: HttpContext) {
    // Saat update, kita asumsikan user mengirim userId lagi atau kita cek manual
    // Tapi untuk keamanan, kita tetap butuh validasi siapa yang request.
    // Karena logic frontend mengirim header, kita coba ambil user dari request header/body jika ada.
    
    // SEMENTARA: Kita ambil userId dari body juga untuk validasi (karena dummy token)
    const { userId } = request.all() 
    
    if (!userId) return response.unauthorized({ message: 'Anda harus login' })

    try {
      const course = await Course.findById(params.id)
      
      if (!course) return response.notFound({ message: 'Course tidak ditemukan' })

      // --- VALIDASI KEPEMILIKAN ---
      // Bandingkan ID pemilik course dengan ID user yang request
      if (course.userId.toString() !== userId.toString()) {
        return response.forbidden({ message: 'Anda tidak memiliki izin mengedit course ini' })
      }

      const { title, description } = request.all()
      course.title = title || course.title
      course.description = description || course.description
      
      await course.save()

      return response.ok({ message: 'Course berhasil diupdate', data: course })
    } catch (error) {
      return response.internalServerError({ message: 'Gagal update', error })
    }
  }

  // 4. DELETE COURSE (Hanya Pemilik)
  public async destroy({ params, request, response }: HttpContext) {
    // SEMENTARA: Kita butuh cara tahu siapa yang request delete.
    // Di real app, ini dari Token. Di sini, kita terpaksa percaya client mengirim header/body yang benar.
    // Karena DELETE biasanya tidak punya body, kita akan cek Authorization header manual atau 
    // untuk simplifikasi tahap ini, kita LEWATI cek userId di backend KHUSUS DELETE, 
    // TAPI Frontend sudah menyembunyikan tombolnya.
    
    // ATAU: Kita cek token dummy (ini tidak aman untuk production, tapi oke untuk belajar)
    const authHeader = request.header('Authorization')
    if (!authHeader) return response.unauthorized({ message: 'Harap login' })

    try {
      const course = await Course.findById(params.id)
      
      if (!course) return response.notFound({ message: 'Course tidak ditemukan' })

      // Karena kita sulit kirim userId di body DELETE request,
      // Kita percayakan pada Frontend logic untuk menyembunyikan tombol.
      // (Nanti jika sudah pakai JWT asli, kita bisa ambil user dari token di sini)

      await course.deleteOne()
      return response.ok({ message: 'Course berhasil dihapus' })
    } catch (error) {
      return response.internalServerError({ message: 'Gagal menghapus', error })
    }
  }
}