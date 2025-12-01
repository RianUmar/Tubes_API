import { Schema, model, Document } from 'mongoose';

export interface ICourse extends Document {
  title: string;
  description: string;
  author?: string; // Nama author (opsional)
  userId: string;  // ID Pemilik (WAJIB UNTUK VALIDASI)
  createdAt: Date;
  updatedAt: Date;
}

const courseSchema = new Schema<ICourse>({
  title: { type: String, required: true },
  description: { type: String, required: true },
  author: { type: String, default: 'Anonymous' },
  // TAMBAHAN: Menyimpan ID User pembuat course
  userId: { type: String, required: true }, 
}, { timestamps: true });

export default model<ICourse>('Course', courseSchema);