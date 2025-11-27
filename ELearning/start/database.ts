import mongoose from 'mongoose'

export async function connectDatabase() {
  if (mongoose.connection.readyState === 0) {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/elearning'
    console.log('Connecting to MongoDB:', uri)
    await mongoose.connect(uri)
    console.log('✅ Connected to MongoDB successfully')
    console.log('Database name:', mongoose.connection.db.databaseName)
  } else {
    console.log('MongoDB already connected')
  }
}