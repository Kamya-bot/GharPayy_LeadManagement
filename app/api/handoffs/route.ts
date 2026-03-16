import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Handoff from '@/models/Handoff';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const leadId = searchParams.get('leadId');
    await connectToDatabase();
    let query: any = {};
    if (leadId) query.leadId = leadId;
    const handoffs = await Handoff.find(query)
      .populate('fromAgentId', 'name')
      .populate('toAgentId', 'name')
      .populate('zoneId', 'name')
      .sort({ createdAt: -1 });
    
    const transformedHandoffs = handoffs.map(h => ({
      ...h.toObject(),
      id: h._id,
      from_agent: h.fromAgentId,
      to_agent: h.toAgentId,
      zones: h.zoneId
    }));

    return NextResponse.json(transformedHandoffs);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    await connectToDatabase();
    const handoff = await Handoff.create(body);
    return NextResponse.json(handoff, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
