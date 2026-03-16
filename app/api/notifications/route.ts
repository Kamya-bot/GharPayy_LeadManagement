import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Notification from '@/models/Notification';

export async function GET() {
  try {
    await connectToDatabase();
    const notifications = await Notification.find({})
      .sort({ createdAt: -1 })
      .limit(50);
    return NextResponse.json(notifications);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const all = searchParams.get('all');
    
    await connectToDatabase();
    
    if (all === 'true') {
      await Notification.updateMany({ isRead: false }, { isRead: true });
      return NextResponse.json({ success: true });
    }
    
    if (id) {
      const notification = await Notification.findByIdAndUpdate(id, { isRead: true }, { new: true });
      if (!notification) return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
      return NextResponse.json(notification);
    }
    
    return NextResponse.json({ error: 'ID or all=true required' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
