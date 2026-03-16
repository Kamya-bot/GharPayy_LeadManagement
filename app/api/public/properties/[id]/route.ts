import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Property from '@/models/Property';
import Room from '@/models/Room';
import mongoose from 'mongoose';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    await connectToDatabase();
    
    const property = await Property.findById(id).populate('ownerId');
    if (!property) return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    
    const rooms = await Room.find({ propertyId: id }).populate('beds');
    
    return NextResponse.json({
      ...property.toObject(),
      id: property._id,
      owners: property.ownerId,
      rooms: rooms.map(r => ({ ...r.toObject(), id: r._id }))
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
