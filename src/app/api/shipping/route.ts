import { NextResponse } from 'next/server';

const API_KEY = process.env.API_CO_ID_KEY!;
const STORE_VILLAGE_CODE = process.env.STORE_VILLAGE_CODE || '3404012002'; // Ambarketawang, Gamping, Sleman
const BASE = 'https://use.api.co.id';

// Haversine fallback — used if village code not provided
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) *
    Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function fallbackCost(distKm: number): number {
  const road = distKm * 1.3;
  if (road <= 5)   return 9000;
  if (road <= 15)  return 12000;
  if (road <= 30)  return 15000;
  if (road <= 60)  return 20000;
  if (road <= 120) return 27000;
  if (road <= 300) return 35000;
  if (road <= 600) return 45000;
  return 55000;
}

function extractCoords(address: string): { lat: number; lng: number } | null {
  const parts = address.split(',').map(s => s.trim());
  if (parts.length >= 2) {
    const last = parseFloat(parts[parts.length - 1]);
    const secondLast = parseFloat(parts[parts.length - 2]);
    if (!isNaN(last) && !isNaN(secondLast) && Math.abs(secondLast) <= 90 && Math.abs(last) <= 180) {
      return { lat: secondLast, lng: last };
    }
  }
  return null;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { destination_village_code, destination, weight = 1 } = body;

    // --- Real API path: village codes provided ---
    if (destination_village_code) {
      const weightKg = typeof weight === 'number' ? Math.max(weight / 1000, 0.1) : 1;

      const apiRes = await fetch(
        `${BASE}/expedition/shipping-cost?origin_village_code=${STORE_VILLAGE_CODE}&destination_village_code=${destination_village_code}&weight=${weightKg}`,
        {
          headers: { 'x-api-co-id': API_KEY },
          next: { revalidate: 300 },
        }
      );

      const apiData = await apiRes.json();

      if (!apiRes.ok || !apiData.is_success) {
        return NextResponse.json(
          { error: apiData.message || 'Gagal mengambil data ongkir dari API' },
          { status: 400 }
        );
      }

      const couriers: Array<{
        courier_code: string;
        courier_name: string;
        price: number;
        weight: number;
        estimation: string | null;
      }> = apiData.data.couriers || [];

      // Find JNE Express first, fallback to cheapest courier
      const jne = couriers.find(c => c.courier_code === 'JNE');
      const cheapest = couriers.sort((a, b) => a.price - b.price)[0];
      const selected = jne || cheapest;

      if (!selected) {
        return NextResponse.json({ error: 'Tidak ada layanan pengiriman tersedia ke wilayah ini' }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        service: selected.courier_name,
        origin: 'Ambarketawang, Gamping, Sleman',
        destination: destination || '',
        cost: selected.price,
        estimated_days: selected.estimation || '-',
        couriers: couriers.slice(0, 6), // return up to 6 options for display
      });
    }

    // --- Fallback path: GPS coordinates from address string ---
    const STORE_LAT = -7.7647423;
    const STORE_LNG = 110.3494548;

    const coords = extractCoords(destination || '');
    const distKm = coords
      ? haversineKm(STORE_LAT, STORE_LNG, coords.lat, coords.lng)
      : 30;

    const cost = fallbackCost(distKm);
    const roadKm = Math.round(distKm * 1.3);

    return NextResponse.json({
      success: true,
      service: 'JNE Reguler (estimasi)',
      origin: 'Ambarketawang, Gamping, Sleman',
      destination: destination || '',
      distance_km: Math.round(distKm),
      road_distance_km: roadKm,
      cost,
      estimated_days: roadKm <= 60 ? '1-2 Hari' : roadKm <= 300 ? '2-3 Hari' : '3-5 Hari',
      is_estimate: true,
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
