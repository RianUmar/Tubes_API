import router from '@adonisjs/core/services/router'
// Import ChatController secara lazy loading
const ChatController = () => import('#controllers/http/chatcontroller')

// ROOT ROUTE - Serve Frontend
router.get('/', ({ response }) => {
  return response.download('public/index.html')
})

// STATIC FILES
router.get('/style.css', ({ response }) => {
  return response.download('public/style.css')
})

router.get('/app.js', ({ response }) => {
  return response.download('public/app.js')
})

// TEST ROUTES
router.get('/test-get', ({ response }) => {
  return response.json({ message: 'GET endpoint works' })
})

// REGISTER ROUTE - Save to MongoDB
router.post('/users/register', async ({ request, response }) => {
  try {
    console.log('🔥 Register endpoint called')
    const User = (await import('#models/user')).default
    const { name, email, password } = request.all()
    
    if (!name || !email || !password) {
      return response.badRequest({ message: 'Name, email, dan password wajib diisi' })
    }
    
    const existing = await User.findOne({ email })
    if (existing) {
      return response.badRequest({ message: 'Email sudah terdaftar' })
    }
    
    const user = await User.create({ name, email, password })
    
    return response.created({ 
      message: 'Registrasi berhasil', 
      user: { id: user._id, name: user.name, email: user.email } 
    })
  } catch (error) {
    return response.internalServerError({ message: 'Terjadi kesalahan', error: error.message })
  }
})

// LOGIN ROUTE
router.post('/users/login', async ({ request, response }) => {
  try {
    const User = (await import('#models/user')).default
    const { email, password } = request.all()
    
    if (!email || !password) {
      return response.badRequest({ message: 'Email dan password wajib diisi' })
    }
    
    const user = await User.findOne({ email })
    if (!user) {
      return response.unauthorized({ message: 'Email tidak ditemukan' })
    }
    
    const isMatch = await user.comparePassword(password)
    if (!isMatch) {
      return response.unauthorized({ message: 'Password salah' })
    }
    
    return response.ok({ 
      message: 'Login berhasil', 
      token: 'dummy-jwt-token',
      user: { id: user._id, name: user.name, email: user.email }
    })
  } catch (error) {
    return response.internalServerError({ message: 'Terjadi kesalahan', error: error.message })
  }
})

// GET USER ROUTES
router.get('/users/all', async ({ response }) => {
  try {
    const User = (await import('#models/user')).default
    const users = await User.find().select('-password')
    return response.json({ users })
  } catch (error) {
    return response.internalServerError({ error: error.message })
  }
})

// COURSES ENDPOINTS
router.get('/api/courses', async ({ response }) => {
  try {
    const Course = (await import('#models/course_mongoose')).default
    const courses = await Course.find()
    return response.json(courses)
  } catch (error) {
    return response.json([])
  }
})

router.post('/api/courses', async ({ request, response }) => {
  try {
    const Course = (await import('#models/course_mongoose')).default
    const { title, description } = request.all()
    
    if (!title || !description) {
      return response.badRequest({ message: 'Title dan description wajib diisi' })
    }
    
    const course = await Course.create({ title, description })
    return response.created({ message: 'Course berhasil ditambahkan', course })
  } catch (error) {
    return response.internalServerError({ error: error.message })
  }
})


router.post('/api/chat', [ChatController, 'handleChat'])