import router from '@adonisjs/core/services/router'

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
    console.log('📝 Request data:', { name, email, password: '***' })
    
    if (!name || !email || !password) {
      return response.badRequest({ message: 'Name, email, dan password wajib diisi' })
    }
    
    // Cek email sudah ada
    console.log('🔍 Checking existing user...')
    const existing = await User.findOne({ email })
    if (existing) {
      console.log('❌ Email already exists')
      return response.badRequest({ message: 'Email sudah terdaftar' })
    }
    
    // Buat user baru
    console.log('✨ Creating new user...')
    const user = await User.create({ name, email, password })
    console.log('✅ User created:', user._id)
    
    return response.created({ 
      message: 'Registrasi berhasil', 
      user: { 
        id: user._id,
        name: user.name, 
        email: user.email,
        createdAt: user.createdAt
      } 
    })
  } catch (error) {
    console.error('❌ Register error:', error)
    return response.internalServerError({ 
      message: 'Terjadi kesalahan', 
      error: error.message 
    })
  }
})

// LOGIN ROUTE - Real authentication
router.post('/users/login', async ({ request, response }) => {
  try {
    console.log('🔑 Login endpoint called')
    const User = (await import('#models/user')).default
    const { email, password } = request.all()
    console.log('📝 Login attempt:', { email, password: '***' })
    
    if (!email || !password) {
      return response.badRequest({ message: 'Email dan password wajib diisi' })
    }
    
    // Cari user berdasarkan email
    console.log('🔍 Finding user...')
    const user = await User.findOne({ email })
    if (!user) {
      console.log('❌ User not found')
      return response.unauthorized({ message: 'Email tidak ditemukan' })
    }
    
    // Cek password
    console.log('🔐 Checking password...')
    const isMatch = await user.comparePassword(password)
    if (!isMatch) {
      console.log('❌ Password incorrect')
      return response.unauthorized({ message: 'Password salah' })
    }
    
    console.log('✅ Login successful')
    return response.ok({ 
      message: 'Login berhasil', 
      token: 'dummy-jwt-token',
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    })
  } catch (error) {
    console.error('❌ Login error:', error)
    return response.internalServerError({ 
      message: 'Terjadi kesalahan', 
      error: error.message 
    })
  }
})

// GET ROUTES
router.get('/users/test', ({ response }) => {
  return response.json({ message: 'Users test works' })
})

router.get('/users/all', async ({ response }) => {
  try {
    const User = (await import('#models/user')).default
    const users = await User.find().select('-password')
    return response.json({ 
      message: 'Users retrieved successfully', 
      count: users.length,
      users 
    })
  } catch (error) {
    console.error('Get users error:', error)
    return response.internalServerError({ 
      message: 'Terjadi kesalahan', 
      error: error.message 
    })
  }
})

// COURSES ENDPOINTS
router.get('/api/courses', async ({ response }) => {
  try {
    const Course = (await import('#models/course_mongoose')).default
    const courses = await Course.find()
    return response.json(courses)
  } catch (error) {
    console.error('Get courses error:', error)
    return response.json([])
  }
})

router.post('/api/courses', async ({ request, response }) => {
  try {
    console.log('🎓 Add course endpoint called')
    const Course = (await import('#models/course_mongoose')).default
    const { title, description } = request.all()
    console.log('📝 Course data:', { title, description })
    
    if (!title || !description) {
      return response.badRequest({ message: 'Title dan description wajib diisi' })
    }
    
    const course = await Course.create({ title, description })
    console.log('✅ Course created:', course._id)
    
    return response.created({ 
      message: 'Course berhasil ditambahkan', 
      course 
    })
  } catch (error) {
    console.error('❌ Add course error:', error)
    return response.internalServerError({ 
      message: 'Terjadi kesalahan', 
      error: error.message 
    })
  }
})