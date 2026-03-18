import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_change_me';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    if (!token) return NextResponse.json({ user: null });

    const decoded = jwt.verify(token, JWT_SECRET) as any;

    // Virtual admin
    if (decoded.userId === 'admin-id-static') {
      return NextResponse.json({
        user: {
          id: 'admin-id-static',
          email: decoded.email,
          fullName: 'Administrator',
          role: 'admin',
          identity: 'admin',
          zone: null,
          zoneId: null,
        },
      });
    }

    await connectToDatabase();
    const user = await User.findById(decoded.userId).select('-password').lean() as any;
    if (!user) return NextResponse.json({ user: null });

    return NextResponse.json({
      user: {
        id: user._id.toString(),
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        identity: user.identity || null,
        zone: user.zone || null,
        zoneId: user.zoneId?.toString() || null,
        isActive: user.isActive,
      },
    });
  } catch {
    return NextResponse.json({ user: null });
  }
}