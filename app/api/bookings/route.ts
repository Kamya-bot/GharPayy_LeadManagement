import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Booking from '@/models/Booking';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const leadId = searchParams.get('leadId');
    const propertyIds = searchParams.get('propertyIds')?.split(',').filter(Boolean);
    
    await connectToDatabase();
    
    let query: any = {};
    if (leadId) query.leadId = leadId;
    if (propertyIds && propertyIds.length > 0) query.propertyId = { $in: propertyIds };
    
    const bookings = await Booking.find(query)
      .populate('propertyId')
      .populate('roomId')
      .populate('bedId')
      .populate('leadId')
      .sort({ createdAt: -1 });


    const transformedBookings = bookings.map(b => ({
      ...b.toObject(),
      id: b._id,
      properties: b.propertyId,
      rooms: b.roomId,
      beds: b.bedId,
      bookingStatus: b.bookingStatus,
      monthlyRent: b.monthlyRent,
      securityDeposit: b.securityDeposit,
      checkInDate: b.checkInDate,
    }));

    return NextResponse.json(transformedBookings);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    await connectToDatabase();
    const booking = await Booking.create(body);
    return NextResponse.json(booking, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
