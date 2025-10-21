import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import jwt from 'jsonwebtoken'
import env from '#start/env'
import User from '#models/user'

export default class JwtAuth {
  async handle({ request, response }: HttpContext, next: NextFn) {
    const authHeader = request.header('authorization')
    if (!authHeader) {
      return response.status(401).json({ message: 'Token dibutuhkan' })
    }

    const token = authHeader.replace('Bearer ', '')

    try {
      const payload: any = jwt.verify(token, env.get('JWT_SECRET'))
      console.log('JWT Payload:', payload)
      const user = await User.findById(payload.id)
      console.log('Found user:', user)
      if (!user) {
        return response.status(401).json({ message: 'Token tidak valid' })
      }

      ;(request as any).user = user
      await next()
    } catch (err) {
      console.log('JWT Error:', err)
      return response.status(401).json({ message: 'Token tidak valid atau kedaluwarsa' })
    }
  }
}