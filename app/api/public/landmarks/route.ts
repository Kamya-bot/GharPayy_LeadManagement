import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Landmark from '@/models/Landmark';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const city = searchParams.get('city');
    
    await connectToDatabase();
    
    let query: any = {};
    if (city) query.city = { $regex: city, $options: 'i' };
    
    const landmarks = await Landmark.find(query).sort({ name: 1 });
    return NextResponse.json(landmarks);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
