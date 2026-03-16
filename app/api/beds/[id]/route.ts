import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Bed from '@/models/Bed';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    await connectToDatabase();
    const bed = await Bed.findByIdAndUpdate(id, body, { new: true });
    if (!bed) return NextResponse.json({ error: 'Bed not found' }, { status: 404 });
    return NextResponse.json(bed);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
