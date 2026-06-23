import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get('date') ?? undefined;
  const from = req.nextUrl.searchParams.get('from') ?? undefined;
  const to = req.nextUrl.searchParams.get('to') ?? undefined;
  const appointments = await db.getAppointments({ date, from, to });
  return NextResponse.json(appointments);
}

export async function POST(req: NextRequest) {
  const data = await req.json();
  if (!data.clientId || !data.date || !data.time) {
    return NextResponse.json({ error: 'clientId, date, and time are required' }, { status: 400 });
  }
  const appt = await db.createAppointment({
    clientId: data.clientId,
    date: data.date,
    time: data.time,
    duration: Number(data.duration) || 60,
    comments: data.comments?.trim() ?? '',
    status: data.status ?? 'scheduled',
    images: Array.isArray(data.images) ? data.images : [],
  });
  return NextResponse.json(appt, { status: 201 });
}
