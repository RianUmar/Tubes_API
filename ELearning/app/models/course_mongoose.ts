import { Schema, model, Document } from 'mongoose'

export interface ICourse extends Document {
  title: string
  description: string
  content: string
  author: string
}

const courseSchema = new Schema<ICourse>({
  title: { type: String, required: true },
  description: { type: String, required: true },
  content: { type: String, required: true },
  author: { type: String, required: true },
}, { timestamps: true })

export default model<ICourse>('Course', courseSchema)