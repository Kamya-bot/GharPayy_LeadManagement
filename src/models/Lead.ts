import mongoose, { Schema, Document, Model } from "mongoose";

// ─── Activity ────────────────────────────────────────────────────────────────

export type ActivityType =
  | "stage_change"
  | "note"
  | "call"
  | "visit_scheduled"
  | "visit_done"
  | "document"
  | "whatsapp"
  | "email";

export interface IActivity {
  _id?: mongoose.Types.ObjectId;
  type: ActivityType;
  note: string;
  fromStage?: string;
  toStage?: string;
  performedBy: string;
  createdAt: Date;
}

// ─── Lead ────────────────────────────────────────────────────────────────────

export type LeadStage =
  | "New"
  | "Contacted"
  | "Visit Scheduled"
  | "Visited"
  | "Negotiation"
  | "Booked"
  | "Lost";

export type LeadSource =
  | "Website"
  | "WhatsApp"
  | "Referral"
  | "Walk-in"
  | "Housing.com"
  | "99acres"
  | "MagicBricks"
  | "Facebook"
  | "Instagram"
  | "Cold Call"
  | "Other";

export type BudgetRange =
  | "Under ₹5L"
  | "₹5L–₹10L"
  | "₹10L–₹20L"
  | "₹20L–₹30L"
  | "₹30L–₹50L"
  | "Above ₹50L";

export type PropertyType =
  | "1BHK"
  | "2BHK"
  | "3BHK"
  | "4BHK+"
  | "Studio"
  | "Villa"
  | "Plot"
  | "Commercial";

export type SubPipeline =
  | "Student"
  | "Working Professional"
  | "Family"
  | "Corporate"
  | "Other";

export interface ILead extends Document {
  // Core identity
  name: string;
  phone: string;
  email?: string;
  whatsapp?: string;

  // Lead metadata
  source: LeadSource;
  stage: LeadStage;
  assignedTo: string;
  zone?: string;
  priority: "Low" | "Medium" | "High";
  tags: string[];

  // Location classification
  inBlr?: "INBLR" | "NOBLR";         // Inside Bangalore or Not
  subPipeline?: SubPipeline;          // Student / Working Professional / etc.

  // Property preference
  propertyType?: PropertyType;
  budget?: BudgetRange;
  preferredLocality?: string;
  possession?: "Ready to Move" | "Under Construction" | "Any";

  // Internal notes
  notes?: string;

  // Activity log
  activities: IActivity[];

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  lastContactedAt?: Date;
  nextFollowUpAt?: Date;
}

// ─── Schemas ─────────────────────────────────────────────────────────────────

const ActivitySchema = new Schema<IActivity>(
  {
    type: {
      type: String,
      enum: [
        "stage_change", "note", "call", "visit_scheduled",
        "visit_done", "document", "whatsapp", "email",
      ],
      required: true,
    },
    note: { type: String, required: true },
    fromStage: String,
    toStage: String,
    performedBy: { type: String, required: true },
  },
  { timestamps: true }
);

const LeadSchema = new Schema<ILead>(
  {
    name:     { type: String, required: true, trim: true },
    phone:    { type: String, required: true, trim: true },
    email:    { type: String, trim: true, lowercase: true },
    whatsapp: { type: String, trim: true },

    source: {
      type: String,
      enum: [
        "Website", "WhatsApp", "Referral", "Walk-in",
        "Housing.com", "99acres", "MagicBricks",
        "Facebook", "Instagram", "Cold Call", "Other",
      ],
      required: true,
    },
    stage: {
      type: String,
      enum: ["New", "Contacted", "Visit Scheduled", "Visited", "Negotiation", "Booked", "Lost"],
      default: "New",
    },
    assignedTo: { type: String, required: true },
    zone:       String,
    priority: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Medium",
    },
    tags: [String],

    // New fields
    inBlr: {
      type: String,
      enum: ["INBLR", "NOBLR"],
    },
    subPipeline: {
      type: String,
      enum: ["Student", "Working Professional", "Family", "Corporate", "Other"],
    },

    propertyType: {
      type: String,
      enum: ["1BHK", "2BHK", "3BHK", "4BHK+", "Studio", "Villa", "Plot", "Commercial"],
    },
    budget: {
      type: String,
      enum: [
        "Under ₹5L", "₹5L–₹10L", "₹10L–₹20L",
        "₹20L–₹30L", "₹30L–₹50L", "Above ₹50L",
      ],
    },
    preferredLocality: String,
    possession: {
      type: String,
      enum: ["Ready to Move", "Under Construction", "Any"],
    },

    notes:           String,
    activities:      [ActivitySchema],
    lastContactedAt: Date,
    nextFollowUpAt:  Date,
  },
  { timestamps: true }
);

LeadSchema.index({ phone: 1 });
LeadSchema.index({ stage: 1 });
LeadSchema.index({ assignedTo: 1 });
LeadSchema.index({ zone: 1 });
LeadSchema.index({ inBlr: 1 });
LeadSchema.index({ subPipeline: 1 });
LeadSchema.index({ createdAt: -1 });

const Lead: Model<ILead> =
  mongoose.models.Lead || mongoose.model<ILead>("Lead", LeadSchema);

export default Lead;