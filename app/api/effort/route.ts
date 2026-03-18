import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Property from '@/models/Property';
import Room from '@/models/Room';
import Visit from '@/models/Visit';

export async function GET() {
  try {
    await connectToDatabase();

    const [properties, rooms, visits] = await Promise.all([
      Property.find({ isActive: true }).populate('ownerId').lean(),
      Room.find({}).lean(),
      Visit.find({}).lean(),
    ]);

    const effortData = properties.map((p: any) => {
      const pId = p._id.toString();
      const pRooms = rooms.filter((r: any) => r.propertyId?.toString() === pId);
      const pVisits = visits.filter((v: any) => v.propertyName === p.name);

      return {
        id: p._id,
        name: p.name,
        area: p.area,
        city: p.city,
        owners: p.ownerId,
        roomCount: pRooms.length,
        vacantRooms: pRooms.filter((r: any) => r.status === 'vacant').length,
        lockedRooms: 0,
        totalLeads: 0,
        totalVisits: pVisits.length,
        booked: pVisits.filter((v: any) => v.outcome === 'booked').length,
        considering: pVisits.filter((v: any) => v.outcome === 'considering').length,
        notInterested: pVisits.filter((v: any) => v.outcome === 'not_interested').length,
      };
    });

    return NextResponse.json(effortData);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}