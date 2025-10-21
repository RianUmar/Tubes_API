import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'

// AUTH ROUTES
router.group(() => {
  router.post('/register', '#controllers/http/authcontroller.register')
  router.post('/login', '#controllers/http/authcontroller.login')
  router.get('/profile', '#controllers/http/authcontroller.profile').middleware([middleware.JwtAuth])
  router.get('/test', '#controllers/http/authcontroller.test')
  router.get('/all', '#controllers/http/authcontroller.getAllUsers')
}).prefix('/users')

// API ROUTES
router.group(() => {
  // Courses
  router.get('/courses', '#controllers/http/coursescontroller.index')
  router.get('/courses/:id', '#controllers/http/coursescontroller.show')
  router.post('/courses', '#controllers/http/coursescontroller.store')
  router.put('/courses/:id', '#controllers/http/coursescontroller.update')
  router.delete('/courses/:id', '#controllers/http/coursescontroller.destroy')

  // Chat
  router.get('/chat/test', '#controllers/http/chatcontroller.test')
  router.post('/chat', '#controllers/http/chatcontroller.ask')
}).prefix('/api')