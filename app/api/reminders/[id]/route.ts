import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Reminder from '@/models/Reminder';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    
    await connectToDatabase();
    
    const reminder = await Reminder.findByIdAndUpdate(id, body, { new: true });
    
    if (!reminder) {
      return NextResponse.json({ error: 'Reminder not found' }, { status: 404 });
    }
    
    return NextResponse.json(reminder);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
