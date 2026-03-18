import mongoose, { Schema, Document } from 'mongoose';

export type IdentityRole = 'Alpha' | 'Beta' | 'Gamma' | 'Fire' | 'Water' | 'admin';

export interface IUser extends Document {
  email: string;
  password?: string;
  fullName: string;
  role: 'admin' | 'zone_admin' | 'member';
  identity: IdentityRole;
  zone?: string;
  zoneId?: mongoose.Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema(
  {
    email:    { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: false },
    fullName: { type: String, required: true },
    role: {
      type: String,
      enum: ['admin', 'zone_admin', 'member'],
      default: 'member',
    },
    identity: {
      type: String,
      enum: ['Alpha', 'Beta', 'Gamma', 'Fire', 'Water', 'admin'],
      default: 'Alpha',
    },
    zone:   { type: String },
    zoneId: { type: Schema.Types.ObjectId, ref: 'Zone' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

UserSchema.index({ zone: 1 });
UserSchema.index({ identity: 1 });

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);