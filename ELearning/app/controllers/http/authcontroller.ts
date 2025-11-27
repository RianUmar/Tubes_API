// app/Controllers/Http/AuthController.ts
import { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import jwt from 'jsonwebtoken'
import env from '#start/env'

export default class AuthController {
  // 🟢 Register user baru
  public async register({ request, response }: HttpContext) {
    try {
      console.log('Register endpoint hit')
      const { name, email, password } = request.all()
      console.log('Request data:', { name, email, password: '***' })
      
      if (!name || !email || !password) {
        return response.badRequest({ message: 'Name, email, dan password wajib diisi' })
      }
      
      const existing = await User.findOne({ email })
      if (existing) return response.badRequest({ message: 'Email sudah terdaftar' })

      const user = await User.create({ name, email, password })
      console.log('User created successfully')
      return response.created({ message: 'Registrasi berhasil', user: { name: user.name, email: user.email } })
    } catch (error) {
      console.error('Register error:', error)
      return response.internalServerError({ message: 'Terjadi kesalahan', error: error.message })
    }
  }

  // 🟢 Login user
  public async login({ request, response }: HttpContext) {
    try {
      const { email, password } = request.all()
      const user = await User.findOne({ email })
      if (!user) return response.unauthorized({ message: 'Email tidak ditemukan' })

      const isMatch = await user.comparePassword(password)
      if (!isMatch) return response.unauthorized({ message: 'Password salah' })

      // generate JWT token
      const token = jwt.sign({ id: user._id }, env.get('JWT_SECRET'), { expiresIn: '24h' })
      return response.ok({ message: 'Login berhasil', token, user })
    } catch (error) {
      return response.internalServerError({ message: 'Terjadi kesalahan', error })
    }
  }

  // 🟢 Profil user (cek token)
  public async profile({ request, response }: HttpContext) {
    const user = (request as any)['user']
    console.log('User from middleware:', user)
    
    if (!user) {
      return response.status(401).json({ message: 'User tidak ditemukan dalam request' })
    }
    
    return response.status(200).json({ 
      message: 'Profile berhasil diambil',
      user: user 
    })
  }

  // 🟢 Test endpoint
  public async test({ response }: HttpContext) {
    return response.ok({ message: 'Test berhasil' })
  }

  // 🟢 Lihat semua users (untuk testing)
  public async getAllUsers({ response }: HttpContext) {
    try {
      const users = await User.find()
      return response.ok({ users })
    } catch (error) {
      return response.internalServerError({ message: 'Terjadi kesalahan', error })
    }
  }
}
