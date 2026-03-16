import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Zone from '@/models/Zone';

export async function GET() {
  try {
    await connectToDatabase();
    const zones = await Zone.find({ isActive: true }).sort({ name: 1 });
    return NextResponse.json(zones);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    await connectToDatabase();
    const zone = await Zone.create(body);
    return NextResponse.json(zone, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
