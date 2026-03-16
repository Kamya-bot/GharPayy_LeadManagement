import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_change_me';
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'gharpayy@123';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin!123admin@123admin';

export async function POST(req: Request) {
  try {
    const { email: rawEmail, password } = await req.json();
    const email = rawEmail?.trim();

    console.log('Login attempt for:', email);
    console.log('Expected Admin:', ADMIN_USERNAME);

    // Check .env credentials first
    if (email === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      console.log('Admin match found, skipping DB');
      const token = jwt.sign(
        { userId: 'admin-id-static', email: ADMIN_USERNAME, role: 'admin' },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      const cookieStore = await cookies();
      cookieStore.set('auth_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/',
      });

      return NextResponse.json({
        message: 'Logged in successfully',
        user: {
          id: 'admin-id-static',
          email: ADMIN_USERNAME,
          fullName: 'Administrator',
          role: 'admin'
        }
      });
    }

    // Fallback to database
    await connectToDatabase();
    const user = await User.findOne({ email });
    if (!user || !user.password) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const cookieStore = await cookies();
    cookieStore.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return NextResponse.json({
      message: 'Logged in successfully',
      user: {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        role: user.role
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
