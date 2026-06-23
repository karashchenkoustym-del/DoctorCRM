import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const data = await req.json();
  const appt = await db.updateAppointment(id, {
    clientId: data.clientId,
    date: data.date,
    time: data.time,
    duration: data.duration !== undefined ? Number(data.duration) : undefined,
    comments: data.comments?.trim(),
    status: data.status,
    images: Array.isArray(data.images) ? data.images : undefined,
  });
  if (!appt) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(appt);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const ok = await db.deleteAppointment(id);
  if (!ok) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ success: true });
}
