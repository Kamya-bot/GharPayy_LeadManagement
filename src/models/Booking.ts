import mongoose, { Schema, Document, Model } from "mongoose";

export interface IBooking extends Document {
  leadId: mongoose.Types.ObjectId;
  visitId?: mongoose.Types.ObjectId;

  // Lead info (denormalized for display)
  leads: { name: string; phone: string };

  // Property info
  properties?: { name: string };
  rooms?:      { room_number: string };
  beds?:       { bed_number: string };

  // Booking details
  monthly_rent?:   number;
  move_in_date?:   Date;
  move_out_date?:  Date;
  deposit?:        number;

  booking_status:  "pending" | "confirmed" | "checked_in" | "checked_out" | "cancelled";
  payment_status:  "unpaid" | "partial" | "paid";

  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const BookingSchema = new Schema<IBooking>(
  {
    leadId:  { type: Schema.Types.ObjectId, ref: "Lead", required: true },
    visitId: { type: Schema.Types.ObjectId, ref: "Visit" },

    leads:      {
      name:  { type: String, required: true },
      phone: { type: String, required: true },
    },
    properties: { name: String },
    rooms:      { room_number: String },
    beds:       { bed_number: String },

    monthly_rent:  { type: Number },
    move_in_date:  { type: Date },
    move_out_date: { type: Date },
    deposit:       { type: Number },

    booking_status: {
      type: String,
      enum: ["pending", "confirmed", "checked_in", "checked_out", "cancelled"],
      default: "pending",
    },
    payment_status: {
      type: String,
      enum: ["unpaid", "partial", "paid"],
      default: "unpaid",
    },

    notes: { type: String },
  },
  { timestamps: true }
);

BookingSchema.index({ leadId: 1 });
BookingSchema.index({ booking_status: 1 });
BookingSchema.index({ createdAt: -1 });

const Booking: Model<IBooking> =
  mongoose.models.Booking || mongoose.model<IBooking>("Booking", BookingSchema);

export default Booking;
