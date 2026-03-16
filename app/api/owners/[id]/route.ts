import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Owner from '@/models/Owner';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    await connectToDatabase();
    const owner = await Owner.findByIdAndUpdate(id, body, { new: true });
    if (!owner) return NextResponse.json({ error: 'Owner not found' }, { status: 404 });
    return NextResponse.json(owner);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
