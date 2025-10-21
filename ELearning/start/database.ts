import mongoose from 'mongoose'

export async function connectDatabase() {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/e_learning_db')
    console.log('Connected to MongoDB')
  }
}