import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';

// GET /api/team-members - list all team members
export async function GET(req: NextRequest) {
  await connectToDatabase();
  const { searchParams } = new URL(req.url);
  const zone = searchParams.get('zone');

  const query: Record<string, unknown> = { role: { $ne: 'admin' } };
  if (zone) query.zone = zone;

  const members = await User.find(query)
    .select('-password')
    .sort({ zone: 1, identity: 1 })
    .lean();

  const shaped = members.map((m: any) => ({
    ...m,
    id: m._id.toString(),
  }));

  return NextResponse.json(shaped);
}

// POST /api/team-members - create a team member
export async function POST(req: NextRequest) {
  await connectToDatabase();

  const body = await req.json();
  const { fullName, email, password, identity, zone, zoneId, role } = body;

  if (!fullName || !email || !password || !identity || !zone) {
    return NextResponse.json(
      { error: 'fullName, email, password, identity and zone are required' },
      { status: 400 }
    );
  }

  const existing = await User.findOne({ email });
  if (existing) {
    return NextResponse.json({ error: 'Email already exists' }, { status: 409 });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await User.create({
    fullName,
    email,
    password: hashedPassword,
    identity,
    zone,
    zoneId: zoneId || undefined,
    role: role || 'member',
    isActive: true,
  });

  return NextResponse.json({
    id: user._id.toString(),
    fullName: user.fullName,
    email: user.email,
    identity: user.identity,
    zone: user.zone,
    role: user.role,
  }, { status: 201 });
}