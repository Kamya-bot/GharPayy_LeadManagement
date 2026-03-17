import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Booking from "@/models/Booking";
import Lead from "@/models/Lead";

// GET /api/bookings  or  /api/bookings?leadId=xxx
export async function GET(req: NextRequest) {
  await dbConnect();

  const { searchParams } = new URL(req.url);
  const leadId = searchParams.get("leadId");
  const stats  = searchParams.get("stats");

  // ── Stats endpoint (/api/bookings?stats=1) ──────────────────────────────
  if (stats) {
    const [all, pending, confirmed, checkedIn] = await Promise.all([
      Booking.countDocuments(),
      Booking.countDocuments({ booking_status: "pending" }),
      Booking.countDocuments({ booking_status: "confirmed" }),
      Booking.countDocuments({ booking_status: "checked_in" }),
    ]);

    // Revenue: sum monthly_rent for confirmed + checked_in
    const revenueAgg = await Booking.aggregate([
      { $match: { booking_status: { $in: ["confirmed", "checked_in", "checked_out"] } } },
      { $group: { _id: null, total: { $sum: "$monthly_rent" } } },
    ]);
    const pendingRevenueAgg = await Booking.aggregate([
      { $match: { booking_status: "pending" } },
      { $group: { _id: null, total: { $sum: "$monthly_rent" } } },
    ]);

    return NextResponse.json({
      total:          all,
      pending,
      confirmed,
      checkedIn,
      revenue:        revenueAgg[0]?.total ?? 0,
      pendingRevenue: pendingRevenueAgg[0]?.total ?? 0,
    });
  }

  // ── List bookings ────────────────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const query: Record<string, any> = {};
  if (leadId) query.leadId = leadId;

  const bookings = await Booking.find(query).sort({ createdAt: -1 }).lean();
  const shaped = bookings.map((b) => ({ ...b, id: b._id.toString() }));

  return NextResponse.json(shaped);
}

// POST /api/bookings
export async function POST(req: NextRequest) {
  await dbConnect();

  const body = await req.json();
  const {
    leadId, visitId,
    leadName, leadPhone,
    propertyName, roomNumber, bedNumber,
    monthly_rent, move_in_date, deposit,
    notes,
  } = body;

  if (!leadId || !leadName) {
    return NextResponse.json({ error: "leadId and leadName are required" }, { status: 400 });
  }

  // Strip empty optional fields
  const optionalFields = ["visitId", "roomNumber", "bedNumber", "monthly_rent", "move_in_date", "deposit", "notes"];
  for (const f of optionalFields) {
    if (body[f] === "" || body[f] === null) delete body[f];
  }

  const booking = await Booking.create({
    leadId,
    visitId:    visitId || undefined,
    leads:      { name: leadName, phone: leadPhone || "" },
    properties: propertyName ? { name: propertyName } : undefined,
    rooms:      roomNumber   ? { room_number: roomNumber } : undefined,
    beds:       bedNumber    ? { bed_number: bedNumber }  : undefined,
    monthly_rent: monthly_rent || undefined,
    move_in_date: move_in_date ? new Date(move_in_date) : undefined,
    deposit:      deposit || undefined,
    notes,
    booking_status: "pending",
    payment_status: "unpaid",
  });

  // Auto-update lead stage to Booked
  await Lead.findByIdAndUpdate(leadId, {
    stage: "Booked",
    $push: {
      activities: {
        type: "note",
        note: `Booking confirmed${propertyName ? ` at ${propertyName}` : ""}`,
        toStage: "Booked",
        performedBy: "Admin",
        createdAt: new Date(),
      },
    },
  });

  return NextResponse.json({ ...booking.toObject(), id: booking._id.toString() }, { status: 201 });
}
