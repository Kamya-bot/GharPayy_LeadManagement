import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Escalation from '@/models/Escalation';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    await connectToDatabase();
    const escalation = await Escalation.findByIdAndUpdate(id, body, { new: true });
    if (!escalation) return NextResponse.json({ error: 'Escalation not found' }, { status: 404 });
    return NextResponse.json(escalation);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
