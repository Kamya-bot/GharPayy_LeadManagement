import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Property, { IProperty } from '@/models/Property';
import Room from '@/models/Room';
import Visit from '@/models/Visit';

export async function GET() {
  try {
    await connectToDatabase();

    const [properties, rooms, visits] = await Promise.all([
      Property.find({ isActive: true }).populate('ownerId').lean<IProperty[]>(),
      Room.find({}).lean(),
      Visit.find({}).lean(),
    ]);

    const effortData = (properties as any[]).map((p) => {
      const pId = p._id.toString();
      const pRooms = (rooms as any[]).filter((r) => r.propertyId?.toString() === pId);
      const pVisits = (visits as any[]).filter((v) => v.propertyName === p.name);

      return {
        id: p._id,
        name: p.name,
        area: p.area,
        city: p.city,
        owners: p.ownerId,
        roomCount: pRooms.length,
        vacantRooms: pRooms.filter((r) => r.status === 'vacant').length,
        lockedRooms: 0,
        totalLeads: 0,
        totalVisits: pVisits.length,
        booked: pVisits.filter((v) => v.outcome === 'booked').length,
        considering: pVisits.filter((v) => v.outcome === 'considering').length,
        notInterested: pVisits.filter((v) => v.outcome === 'not_interested').length,
      };
    });

    return NextResponse.json(effortData);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}