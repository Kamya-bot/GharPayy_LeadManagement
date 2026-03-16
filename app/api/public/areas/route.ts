import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Property from '@/models/Property';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const city = searchParams.get('city');
    
    await connectToDatabase();
    
    let query: any = { isActive: true };
    if (city) query.city = { $regex: city, $options: 'i' };
    
    const areas = await Property.distinct('area', query);
    return NextResponse.json(areas);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
