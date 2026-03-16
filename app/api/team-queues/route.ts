import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import TeamQueue from '@/models/TeamQueue';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const zoneId = searchParams.get('zoneId');
    await connectToDatabase();
    let query: any = { isActive: true };
    if (zoneId) query.zoneId = zoneId;
    const queues = await TeamQueue.find(query)
      .populate('zoneId', 'name')
      .populate('ownerAgentId', 'id name')
      .sort({ createdAt: -1 });
    return NextResponse.json(queues);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    await connectToDatabase();
    const queue = await TeamQueue.create(body);
    return NextResponse.json(queue, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
