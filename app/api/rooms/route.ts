import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Room from '@/models/Room';
import Property from '@/models/Property';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const propertyId = searchParams.get('propertyId');
    
    await connectToDatabase();
    
    let query = Room.find({}).populate('propertyId');
    if (propertyId) {
      query = query.where('propertyId').equals(propertyId);
    }
    
    const rooms = await query.sort({ roomNumber: 1 });
    
    const transformedRooms = rooms.map(r => ({
      ...r.toObject(),
      id: r._id,
      properties: r.propertyId
    }));

    return NextResponse.json(transformedRooms);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    await connectToDatabase();
    const room = await Room.create(body);
    return NextResponse.json(room, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
