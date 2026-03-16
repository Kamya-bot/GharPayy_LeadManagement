import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import RoomStatusLog from '@/models/RoomStatusLog';
import Room from '@/models/Room';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    await connectToDatabase();
    
    const log = await RoomStatusLog.create({
      roomId: body.room_id || body.roomId,
      status: body.status,
      confirmedBy: body.confirmed_by || body.confirmedBy,
      notes: body.notes,
      rentUpdated: body.rent_updated || body.rentUpdated || false,
    });

    // Also update the room's current status and last_confirmed_at
    await Room.findByIdAndUpdate(body.room_id || body.roomId, {
      status: body.status,
      lastConfirmedAt: new Date(),
    });

    return NextResponse.json(log, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
