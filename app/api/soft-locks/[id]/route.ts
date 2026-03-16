import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import SoftLock from '@/models/SoftLock';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    await connectToDatabase();
    const lock = await SoftLock.findByIdAndUpdate(id, body, { new: true });
    if (!lock) return NextResponse.json({ error: 'SoftLock not found' }, { status: 404 });
    return NextResponse.json(lock);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
