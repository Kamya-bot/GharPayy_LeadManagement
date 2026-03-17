import mongoose, { Schema, Document, Model } from "mongoose";

export interface IVisit extends Document {
  leadId: mongoose.Types.ObjectId;
  leadName: string;
  leadPhone: string;
  propertyName: string;
  propertyAddress?: string;
  agentName: string;
  scheduledAt: Date;
  confirmed: boolean;
  outcome?: "booked" | "considering" | "not_interested";
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const VisitSchema = new Schema<IVisit>(
  {
    leadId:          { type: Schema.Types.ObjectId, ref: "Lead", required: true },
    leadName:        { type: String, required: true },
    leadPhone:       { type: String, required: true },
    propertyName:    { type: String, required: true },
    propertyAddress: { type: String },
    agentName:       { type: String, required: true },
    scheduledAt:     { type: Date, required: true },
    confirmed:       { type: Boolean, default: false },
    outcome:         { type: String, enum: ["booked", "considering", "not_interested"] },
    notes:           { type: String },
  },
  { timestamps: true }
);

VisitSchema.index({ leadId: 1 });
VisitSchema.index({ scheduledAt: -1 });

const Visit: Model<IVisit> =
  mongoose.models.Visit || mongoose.model<IVisit>("Visit", VisitSchema);

export default Visit;
