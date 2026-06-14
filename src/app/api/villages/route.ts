import { NextResponse } from 'next/server';

const API_KEY = process.env.API_CO_ID_KEY!;
const BASE = 'https://use.api.co.id';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search')?.trim();
  if (!search || search.length < 3) {
    return NextResponse.json({ results: [] });
  }

  try {
    const res = await fetch(`${BASE}/regional/indonesia/villages?search=${encodeURIComponent(search)}&size=10`, {
      headers: { 'x-api-co-id': API_KEY },
      next: { revalidate: 3600 }, // cache 1 jam
    });

    if (!res.ok) {
      return NextResponse.json({ results: [] });
    }

    const data = await res.json();
    const results = (data.data || []).filter((v: any) => v.is_courier_support);

    return NextResponse.json({ results });
  } catch {
    return NextResponse.json({ results: [] });
  }
}
