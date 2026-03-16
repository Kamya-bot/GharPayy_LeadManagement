import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Conversation from '@/models/Conversation';
import Lead from '@/models/Lead';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const leadId = searchParams.get('leadId');
    
    await connectToDatabase();
    
    let query: any = {};
    if (leadId) query.leadId = leadId;
    
    const conversations = await Conversation.find(query)
      .populate('leadId')
      .populate('agentId', 'id name')
      .sort({ createdAt: -1 });

    return NextResponse.json(conversations);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    await connectToDatabase();
    const conversation = await Conversation.create(body);
    return NextResponse.json(conversation, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
