import { NextResponse } from 'next/server';
import { kirimajaClient } from '@/lib/kirimaja';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search')?.trim();
  
  if (!search || search.length < 3) {
    return NextResponse.json({ results: [] });
  }

  try {
    const res = await kirimajaClient.coverageArea.districtsByName(search);
    
    if (!res.status || !res.data) {
      return NextResponse.json({ results: [] });
    }

    // Format matches expected structure in frontend somewhat, but we just need id and text
    const results = res.data.map((d: any) => ({
      code: d.id, // Using id as code
      name: d.text, // "Kecamatan, Kabupaten, Provinsi"
      district: d.text.split(', ')[0] || '',
      regency: d.text.split(', ')[1] || '',
      province: d.text.split(', ')[2] || '',
    }));

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Error fetching districts:", error);
    return NextResponse.json({ results: [] });
  }
}
