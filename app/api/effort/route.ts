import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Property from '@/models/Property';
import Room from '@/models/Room';
import Lead from '@/models/Lead';
import Visit from '@/models/Visit';

export async function GET() {
  try {
    await connectToDatabase();
    
    const properties = await Property.find({ isActive: true }).populate('ownerId');
    const rooms = await Room.find({});
    const leads = await Lead.find({});
    const visits = await Visit.find({});

    const effortData = properties.map(p => {
      const pId = p._id.toString();
      const pRooms = rooms.filter(r => r.propertyId?.toString() === pId);
      const pLeads = leads.filter(l => l.propertyId?.toString() === pId);
      const pVisits = visits.filter(v => v.propertyId?.toString() === pId);

      return {
        id: p._id,
        name: p.name,
        area: p.area,
        city: p.city,
        owners: p.ownerId,
        roomCount: pRooms.length,
        vacantRooms: pRooms.filter(r => r.status === 'vacant').length,
        lockedRooms: 0, // Placeholder for auto-lock logic
        totalLeads: pLeads.length,
        totalVisits: pVisits.length,
        booked: pVisits.filter(v => v.outcome === 'booked').length,
        considering: pVisits.filter(v => v.outcome === 'considering').length,
        notInterested: pVisits.filter(v => v.outcome === 'not_interested').length,
      };
    });

    return NextResponse.json(effortData);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
