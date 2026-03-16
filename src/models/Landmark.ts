import mongoose, { Schema, Document } from 'mongoose';

export interface ILandmark extends Document {
  name: string;
  city: string;
  type?: string;
  createdAt: Date;
  updatedAt: Date;
}

const LandmarkSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    city: { type: String, required: true },
    type: { type: String },
  },
  { timestamps: true }
);

export default mongoose.models.Landmark || mongoose.model<ILandmark>('Landmark', LandmarkSchema);
