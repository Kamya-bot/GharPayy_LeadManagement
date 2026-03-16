import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Agent from '@/models/Agent';

export async function GET() {
  try {
    await connectToDatabase();
    const agents = await Agent.find({}).sort({ name: 1 });
    const transformed = agents.map(a => ({
      ...a.toObject(),
      id: a._id,
      is_active: a.isActive, // backward compatibility
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
    
    // Map snake_case from frontend if needed
    const data = {
      name: body.name,
      email: body.email,
      phone: body.phone,
      role: body.role || 'agent',
      isActive: body.is_active !== undefined ? body.is_active : true,
    };
    
    const agent = await Agent.create(data);
    return NextResponse.json(agent, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
