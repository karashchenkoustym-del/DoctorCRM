import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const client = await db.getClient(id);
  if (!client) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const appointments = await db.getAppointmentsByClient(id);
  return NextResponse.json({ ...client, appointments, visitCount: appointments.length });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const data = await req.json();
  const client = await db.updateClient(id, {
    name: data.name?.trim(),
    phone: data.phone?.trim(),
    email: data.email?.trim(),
    notes: data.notes?.trim(),
    images: Array.isArray(data.images) ? data.images : undefined,
  });
  if (!client) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(client);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const ok = await db.deleteClient(id);
  if (!ok) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ success: true });
}
