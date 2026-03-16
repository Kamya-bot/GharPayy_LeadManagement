import mongoose, { Schema, Document } from 'mongoose';

export interface IMessageTemplate extends Document {
  name: string;
  content: string;
  category?: string;
  createdAt: Date;
  updatedAt: Date;
}

const MessageTemplateSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    content: { type: String, required: true },
    category: { type: String },
  },
  { timestamps: true }
);

export default mongoose.models.MessageTemplate || mongoose.model<IMessageTemplate>('MessageTemplate', MessageTemplateSchema);
