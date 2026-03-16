import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Lead from '@/models/Lead';
import Visit from '@/models/Visit';
import Booking from '@/models/Booking';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: propertyId } = await params;
    await connectToDatabase();

    // Aggregate statistics for the property
    const totalLeads = await Lead.countDocuments({ propertyId });
    const totalVisits = await Visit.countDocuments({ propertyId });
    const booked = await Booking.countDocuments({ propertyId, bookingStatus: 'confirmed' });
    const notInterested = await Lead.countDocuments({ propertyId, status: 'not_interested' });

    return NextResponse.json({
      total_leads: totalLeads,
      total_visits: totalVisits,
      booked: booked,
      not_interested: notInterested,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
