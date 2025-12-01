import router from '@adonisjs/core/services/router'

// Import Controller (Lazy Load)
const ChatController = () => import('#controllers/http/chatcontroller')
const CoursesController = () => import('#controllers/http/coursescontroller') // Pastikan ini ada

// ROOT & STATIC FILES
router.get('/', ({ response }) => response.download('public/index.html'))
router.get('/style.css', ({ response }) => response.download('public/style.css'))
router.get('/app.js', ({ response }) => response.download('public/app.js'))

// AUTH ROUTES
router.post('/users/register', async ({ request, response }) => {
  try {
    const User = (await import('#models/user')).default
    const { name, email, password } = request.all()
    if (!name || !email || !password) return response.badRequest({ message: 'Data tidak lengkap' })
    
    const existing = await User.findOne({ email })
    if (existing) return response.badRequest({ message: 'Email sudah terdaftar' })
    
    const user = await User.create({ name, email, password })
    return response.created({ message: 'Registrasi berhasil', user: { id: user._id, name: user.name, email: user.email } })
  } catch (error) {
    return response.internalServerError({ message: 'Error server', error: error.message })
  }
})

router.post('/users/login', async ({ request, response }) => {
  try {
    const User = (await import('#models/user')).default
    const { email, password } = request.all()
    if (!email || !password) return response.badRequest({ message: 'Email & Password wajib' })
    
    const user = await User.findOne({ email })
    if (!user || !(await user.comparePassword(password))) {
      return response.unauthorized({ message: 'Email atau Password salah' })
    }
    
    // Di real app, gunakan JWT library beneran. Di sini kita simulasi token.
    // Kita kirim ID user agar frontend bisa menyimpannya.
    return response.ok({ 
      message: 'Login berhasil', 
      token: 'dummy-jwt-token', // Di app asli ini harus JWT string
      user: { id: user._id, name: user.name, email: user.email }
    })
  } catch (error) {
    return response.internalServerError({ message: 'Error server', error: error.message })
  }
})

// --- COURSES CRUD ROUTES ---
router.get('/api/courses', [CoursesController, 'index'])
router.post('/api/courses', [CoursesController, 'store'])

// Route Baru untuk Update & Delete (Parameter :id)
router.put('/api/courses/:id', [CoursesController, 'update'])
router.delete('/api/courses/:id', [CoursesController, 'destroy'])

// CHAT ROUTE
router.post('/api/chat', [ChatController, 'handleChat'])