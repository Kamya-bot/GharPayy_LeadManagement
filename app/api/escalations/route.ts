import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Escalation from '@/models/Escalation';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    await connectToDatabase();
    let query: any = {};
    if (status) query.status = status;
    const escalations = await Escalation.find(query)
      .populate('zoneId', 'name')
      .populate('raisedBy', 'name')
      .populate('assignedTo', 'name')
      .sort({ createdAt: -1 });

    const transformed = escalations.map(e => ({
      ...e.toObject(),
      id: e._id,
      zones: e.zoneId,
      raised: e.raisedBy,
      assigned: e.assignedTo
    }));

    return NextResponse.json(transformed);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    await connectToDatabase();
    const escalation = await Escalation.create(body);
    return NextResponse.json(escalation, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}


