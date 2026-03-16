import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Property from '@/models/Property';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    await connectToDatabase();
    
    const updates: any = { ...body };
    if (body.price_range) updates.priceRange = body.price_range;
    if (body.isActive !== undefined) updates.isActive = body.isActive;

    const property = await Property.findByIdAndUpdate(id, updates, { new: true });
    if (!property) return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    
    return NextResponse.json(property);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await connectToDatabase();
    const property = await Property.findByIdAndDelete(id);
    if (!property) return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    return NextResponse.json({ message: 'Property deleted' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
