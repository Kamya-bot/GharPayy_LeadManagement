import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Booking from '@/models/Booking';

export async function GET() {
  try {
    await connectToDatabase();
    const bookings = await Booking.find({}, 'booking_status monthly_rent payment_status');

    const total = bookings.length;
    const pending   = bookings.filter(b => b.booking_status === 'pending').length;
    const confirmed = bookings.filter(b => b.booking_status === 'confirmed').length;
    const checkedIn = bookings.filter(b => b.booking_status === 'checked_in').length;
    const cancelled = bookings.filter(b => b.booking_status === 'cancelled').length;

    const revenue = bookings
      .filter(b => b.booking_status === 'confirmed' || b.booking_status === 'checked_in')
      .reduce((sum, b) => sum + (Number(b.monthly_rent) || 0), 0);

    const pendingRevenue = bookings
      .filter(b => b.booking_status === 'pending')
      .reduce((sum, b) => sum + (Number(b.monthly_rent) || 0), 0);

    return NextResponse.json({ total, pending, confirmed, checkedIn, cancelled, revenue, pendingRevenue });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}