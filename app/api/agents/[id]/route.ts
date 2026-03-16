import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Agent from '@/models/Agent';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    await connectToDatabase();
    
    const updates: any = {};
    if (body.name) updates.name = body.name;
    if (body.email) updates.email = body.email;
    if (body.phone) updates.phone = body.phone;
    if (body.role) updates.role = body.role;
    if (body.is_active !== undefined) updates.isActive = body.is_active;
    if (body.isActive !== undefined) updates.isActive = body.isActive;

    const agent = await Agent.findByIdAndUpdate(id, updates, { new: true });
    if (!agent) return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    
    return NextResponse.json(agent);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await connectToDatabase();
    const agent = await Agent.findByIdAndDelete(id);
    if (!agent) return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    return NextResponse.json({ message: 'Agent deleted' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
