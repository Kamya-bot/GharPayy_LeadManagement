import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Owner from '@/models/Owner';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    
    await connectToDatabase();
    const query = userId ? { userId } : {};
    const owners = await Owner.find(query).sort({ createdAt: -1 });
    return NextResponse.json(owners);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}


export async function POST(req: Request) {
  try {
    const body = await req.json();
    await connectToDatabase();
    const owner = await Owner.create(body);
    return NextResponse.json(owner, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
