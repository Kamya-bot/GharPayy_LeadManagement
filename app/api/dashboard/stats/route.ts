import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Lead from '@/models/Lead';
import Visit from '@/models/Visit';
import Booking from '@/models/Booking';

export async function GET() {
  try {
    await connectToDatabase();

    const [leads, visits, bookings] = await Promise.all([
      Lead.find({}, 'id status firstResponseTimeMin source createdAt'),
      Visit.find({}, 'id outcome scheduledAt'),
      Booking.find({ bookingStatus: 'booked' }, 'id') // Assuming 'booked' is the status for closed bookings
    ]);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const totalLeads = leads.length;
    const newToday = leads.filter(l => new Date(l.createdAt) >= today).length;
    const responseTimes = leads.filter(l => l.firstResponseTimeMin !== undefined && l.firstResponseTimeMin !== null).map(l => l.firstResponseTimeMin!);
    const avgResponseTime = responseTimes.length ? +(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length).toFixed(1) : 0;
    const withinSLA = responseTimes.filter(t => t <= 5).length;
    const slaCompliance = responseTimes.length ? Math.round((withinSLA / responseTimes.length) * 100) : 0;
    const slaBreaches = responseTimes.filter(t => t > 5).length;
    const bookedLeads = leads.filter(l => l.status === 'booked').length;
    const conversionRate = totalLeads ? +((bookedLeads / totalLeads) * 100).toFixed(1) : 0;
    const upcomingVisits = visits.filter(v => new Date(v.scheduledAt) >= today && !v.outcome).length;
    const completedVisits = visits.filter(v => v.outcome !== undefined && v.outcome !== null).length;

    return NextResponse.json({
      totalLeads,
      newToday,
      avgResponseTime,
      slaCompliance,
      slaBreaches,
      conversionRate,
      visitsScheduled: upcomingVisits,
      visitsCompleted: completedVisits,
      bookingsClosed: bookedLeads,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
