import mongoose, { Schema, Document } from 'mongoose';

export interface IOwner extends Document {
  name: string;
  phone: string;
  email?: string;
  companyName?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const OwnerSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String },
    companyName: { type: String },
    notes: { type: String },
  },
  { timestamps: true }
);

export default mongoose.models.Owner || mongoose.model<IOwner>('Owner', OwnerSchema);
