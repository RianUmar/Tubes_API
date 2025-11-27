import { Schema, model, Document } from 'mongoose';

export interface ICourse extends Document {
  title: string;
  description: string;
  author?: string;
  createdAt: Date;
  updatedAt: Date;
}

const courseSchema = new Schema<ICourse>({
  title: { type: String, required: true },
  description: { type: String, required: true },
  author: { type: String, default: 'Anonymous' },
}, { timestamps: true });

export default model<ICourse>('Course', courseSchema);