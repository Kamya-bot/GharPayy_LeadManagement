import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Zone from '@/models/Zone';

// GET /api/zones
export async function GET() {
  try {
    await connectToDatabase();
    const zones = await Zone.find({ isActive: true })
      .populate('manager_id', 'name email')
      .sort({ name: 1 })
      .lean();

    // Shape to match UI expectations
    const shaped = zones.map((z: any) => ({
      ...z,
      id: z._id.toString(),
      agents: z.manager_id ? { name: (z.manager_id as any).name } : null,
    }));

    return NextResponse.json(shaped);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

// POST /api/zones
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    await connectToDatabase();

    const { name, city, areas, color, manager_id, description } = body;

    if (!name) {
      return NextResponse.json({ error: 'Zone name is required' }, { status: 400 });
    }

    const zone = await Zone.create({
      name,
      city: city || 'Bangalore',
      areas: areas || [],
      color: color || '#6366f1',
      manager_id: manager_id || undefined,
      description,
      isActive: true,
    });

    return NextResponse.json({ ...zone.toObject(), id: zone._id.toString() }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}