import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Bed from '@/models/Bed';
import Room from '@/models/Room';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const roomId = searchParams.get('roomId');
    
    await connectToDatabase();
    
    let query = Bed.find({}).populate({
      path: 'roomId',
      populate: { path: 'propertyId' }
    });
    
    if (roomId) {
      query = query.where('roomId').equals(roomId);
    }
    
    const beds = await query.sort({ bedNumber: 1 });
    
    const transformedBeds = beds.map(b => ({
      ...b.toObject(),
      id: b._id,
      rooms: b.roomId // frontend expects 'rooms' key
    }));

    return NextResponse.json(transformedBeds);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    await connectToDatabase();
    const bed = await Bed.create(body);
    return NextResponse.json(bed, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
