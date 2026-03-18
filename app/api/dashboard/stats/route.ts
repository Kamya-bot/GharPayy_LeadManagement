import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Lead from '@/models/Lead';
import Visit from '@/models/Visit';
import Booking from '@/models/Booking';

export async function GET() {
  try {
    await connectToDatabase();

    const [leads, visits] = await Promise.all([
      Lead.find({}, 'stage source createdAt').lean(),
      Visit.find({}, 'outcome scheduledAt').lean(),
    ]);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const totalLeads = leads.length;
    const newToday = leads.filter(l => new Date(l.createdAt) >= today).length;
    const bookedLeads = leads.filter(l => l.stage === 'Booked').length;
    const conversionRate = totalLeads ? +((bookedLeads / totalLeads) * 100).toFixed(1) : 0;

    const upcomingVisits = visits.filter(v => new Date(v.scheduledAt) >= today && !v.outcome).length;
    const completedVisits = visits.filter(v => v.outcome !== undefined && v.outcome !== null).length;

    return NextResponse.json({
      totalLeads,
      newToday,
      avgResponseTime: 0,
      slaCompliance: 100,
      slaBreaches: 0,
      conversionRate,
      visitsScheduled: upcomingVisits,
      visitsCompleted: completedVisits,
      bookingsClosed: bookedLeads,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}