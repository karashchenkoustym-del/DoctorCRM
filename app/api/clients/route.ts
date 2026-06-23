import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  const clients = await db.getClients();
  // Attach visit count to each client
  const withCounts = await Promise.all(
    clients.map(async c => ({
      ...c,
      visitCount: await db.countAppointmentsByClient(c.id),
    }))
  );
  return NextResponse.json(withCounts);
}

export async function POST(req: NextRequest) {
  const data = await req.json();
  if (!data.name?.trim()) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  }
  const client = await db.createClient({
    name: data.name.trim(),
    phone: data.phone?.trim() ?? '',
    email: data.email?.trim() ?? '',
    notes: data.notes?.trim() ?? '',
    images: Array.isArray(data.images) ? data.images : [],
  });
  return NextResponse.json(client, { status: 201 });
}
