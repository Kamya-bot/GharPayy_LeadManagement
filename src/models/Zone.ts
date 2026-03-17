import mongoose, { Schema, Document } from 'mongoose';

export interface IZone extends Document {
  name: string;
  city: string;
  areas: string[];
  color: string;
  manager_id?: mongoose.Types.ObjectId;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ZoneSchema: Schema = new Schema(
  {
    name:        { type: String, required: true },
    city:        { type: String, default: 'Bangalore' },
    areas:       { type: [String], default: [] },
    color:       { type: String, default: '#6366f1' },
    manager_id:  { type: Schema.Types.ObjectId, ref: 'Agent' },
    description: { type: String },
    isActive:    { type: Boolean, default: true },
  },
  { timestamps: true }
);

ZoneSchema.index({ areas: 1 });
ZoneSchema.index({ name: 1 });

export default mongoose.models.Zone || mongoose.model<IZone>('Zone', ZoneSchema);