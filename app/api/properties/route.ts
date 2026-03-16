import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Property from '@/models/Property';
import Owner from '@/models/Owner';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const ownerId = searchParams.get('ownerId');
    
    await connectToDatabase();
    const query: any = { isActive: true };
    if (ownerId) query.ownerId = ownerId;

    // Populate owner info and rooms/beds for owner portal
    const properties = await Property.find(query)
      .populate('ownerId')
      .populate({
        path: 'rooms',
        populate: { path: 'beds' }
      })
      .sort({ name: 1 });
    
    // Transform to match frontend expected structure
    const transformedProperties = properties.map(p => ({
      ...p.toObject(),
      id: p._id,
      owners: p.ownerId
    }));

    return NextResponse.json(transformedProperties);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}


export async function POST(req: Request) {
  try {
    const body = await req.json();
    await connectToDatabase();
    const property = await Property.create(body);
    return NextResponse.json(property, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
