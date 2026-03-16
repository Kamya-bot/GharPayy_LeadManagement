import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Visit from '@/models/Visit';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    await connectToDatabase();
    const visit = await Visit.findByIdAndUpdate(id, body, { new: true });
    if (!visit) return NextResponse.json({ error: 'Visit not found' }, { status: 404 });
    return NextResponse.json(visit);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
