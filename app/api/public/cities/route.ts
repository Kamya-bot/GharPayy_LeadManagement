import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Property from '@/models/Property';

export async function GET() {
  try {
    await connectToDatabase();
    const cities = await Property.distinct('city', { isActive: true });
    return NextResponse.json(cities);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
