import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Lead from '@/models/Lead';
import Agent from '@/models/Agent';
import Property from '@/models/Property';

export async function GET() {
  try {
    await connectToDatabase();
    
    // In a real app, we might want to filter by user/org
    const leads = await Lead.find({})
      .populate('assignedAgentId', 'id name')
      .populate('propertyId', 'id name')
      .sort({ createdAt: -1 });

    // Transform to match the frontend expected structure (agents, properties instead of IDs)
    const transformedLeads = leads.map(l => ({
      ...l.toObject(),
      id: l._id,
      agents: l.assignedAgentId,
      properties: l.propertyId
    }));

    return NextResponse.json(transformedLeads);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    await connectToDatabase();
    
    // Map snake_case from form to camelCase for model
    const leadData = {
      ...body,
      preferredLocation: body.preferred_location || body.preferredLocation
    };
    
    const lead = await Lead.create(leadData);
    return NextResponse.json(lead, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

