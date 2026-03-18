import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Booking from "@/models/Booking";

type Params = { params: Promise<{ id: string }> };

// GET /api/bookings/[id]
export async function GET(_req: NextRequest, { params }: Params) {
  await dbConnect();
  const { id } = await params;
  const booking = await Booking.findById(id).lean();
  if (!booking) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ...booking, id: (booking._id as any).toString() });
}

// PATCH /api/bookings/[id]
export async function PATCH(req: NextRequest, { params }: Params) {
  await dbConnect();
  const { id } = await params;
  const body = await req.json();
  const booking = await Booking.findById(id);
  if (!booking) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const allowedFields = [
    "booking_status", "payment_status",
    "monthly_rent", "move_in_date", "move_out_date",
    "deposit", "notes",
    "properties", "rooms", "beds",
  ];
  for (const key of allowedFields) {
    if (key in body) {
      (booking as any)[key] = body[key];
    }
  }
  await booking.save();
  return NextResponse.json({ ...booking.toObject(), id: booking._id.toString() });
}

// DELETE /api/bookings/[id]
export async function DELETE(_req: NextRequest, { params }: Params) {
  await dbConnect();
  const { id } = await params;
  await Booking.findByIdAndDelete(id);
  return NextResponse.json({ success: true });
}