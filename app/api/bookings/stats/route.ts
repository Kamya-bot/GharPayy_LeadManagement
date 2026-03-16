import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Booking from '@/models/Booking';

export async function GET() {
  try {
    await connectToDatabase();

    const bookings = await Booking.find({}, 'bookingStatus monthlyRent paymentStatus');
    
    const total = bookings.length;
    const pending = bookings.filter(b => b.bookingStatus === 'pending').length;
    const confirmed = bookings.filter(b => b.bookingStatus === 'confirmed').length;
    const checkedIn = bookings.filter(b => b.bookingStatus === 'checked_in').length;
    const cancelled = bookings.filter(b => b.bookingStatus === 'cancelled').length;
    
    const revenue = bookings.filter(b => b.bookingStatus === 'confirmed' || b.bookingStatus === 'checked_in')
      .reduce((sum, b) => sum + (Number(b.monthlyRent) || 0), 0);
      
    const pendingRevenue = bookings.filter(b => b.bookingStatus === 'pending')
      .reduce((sum, b) => sum + (Number(b.monthlyRent) || 0), 0);

    return NextResponse.json({ 
      total, 
      pending, 
      confirmed, 
      checkedIn, 
      cancelled, 
      revenue, 
      pendingRevenue 
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
