import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import MessageTemplate from '@/models/MessageTemplate';

export async function GET() {
  try {
    await connectToDatabase();
    const templates = await MessageTemplate.find({}).sort({ name: 1 });
    return NextResponse.json(templates);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    await connectToDatabase();
    const template = await MessageTemplate.create(body);
    return NextResponse.json(template, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
