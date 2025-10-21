import type { HttpContext } from '@adonisjs/core/http'
import Course from '#models/course_mongoose'

export default class CoursesController {
  public async index({ response }: HttpContext) {
    const courses = await Course.find()
    return response.ok(courses)
  }

  public async show({ params, response }: HttpContext) {
    const course = await Course.findById(params.id)
    if (!course) {
      return response.notFound({ message: 'Course not found' })
    }
    return response.ok(course)
  }

  public async store({ request, response }: HttpContext) {
    const user = (request as any).user
    const { title, description, content } = request.all()
    
    if (!title || !description || !content) {
      return response.badRequest({ 
        message: 'Title, description, dan content wajib diisi' 
      })
    }

    try {
      const course = await Course.create({
        title,
        description,
        content,
        author: user?.email || 'anonymous',
      })
      
      return response.created({
        message: 'Course created successfully',
        data: course,
      })
    } catch (error) {
      console.error('Error creating course:', error)
      return response.internalServerError({
        message: 'Failed to create course',
        error: error
      })
    }
  }

  public async update({ params, request, response }: HttpContext) {
    try {
      const course = await Course.findById(params.id)
      if (!course) {
        return response.notFound({ message: 'Course not found' })
      }

      const { title, description, content } = request.all()
      course.title = title || course.title
      course.description = description || course.description
      course.content = content || course.content
      await course.save()

      return response.ok({
        message: 'Course updated successfully',
        data: course,
      })
    } catch (error) {
      console.error('Update error:', error)
      return response.internalServerError({ message: 'Update failed', error })
    }
  }

  public async destroy({ params, response }: HttpContext) {
    try {
      const course = await Course.findById(params.id)
      if (!course) {
        return response.notFound({ message: 'Course not found' })
      }

      await course.deleteOne()
      return response.ok({ message: 'Course deleted successfully' })
    } catch (error) {
      console.error('Delete error:', error)
      return response.internalServerError({ message: 'Delete failed', error })
    }
  }
}