import { NextResponse } from 'next/server';
import { kirimajaClient } from '@/lib/kirimaja';

// Fallback logic for coordinates
function extractCoords(address: string): { lat: number; lng: number } | null {
  const parts = address.split(',').map(s => s.trim());
  if (parts.length >= 2) {
    const last = parseFloat(parts[parts.length - 1]);
    const secondLast = parseFloat(parts[parts.length - 2]);
    if (!isNaN(last) && !isNaN(secondLast) && Math.abs(secondLast) <= 90 && Math.abs(last) <= 180) {
      return { lat: secondLast, lng: last }; // Assume lat is secondLast, lng is last based on how we generated it
    }
  }
  return null;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { destination_district_code, destination, weight = 1000 } = body;
    const weightGram = typeof weight === 'number' ? Math.max(weight, 100) : 1000;

    let availableCouriers: any[] = [];
    
    // Store origin coordinates (Jalan Jambon, Gamping)
    const STORE_LAT = -7.7647423;
    const STORE_LNG = 110.3494548;
    const STORE_ADDRESS = "Toko Brownis Cinta, Jalan Jambon, Gamping, Yogyakarta";

    // 1. Fetch Instant Delivery (GoSend) if coordinates available
    const coords = extractCoords(destination || '');
    if (coords) {
      try {
        const instantRes = await kirimajaClient.coverageArea.pricingInstant({
          service: ["gosend"],
          item_price: 50000, // Dummy item price since it's required
          origin: {
            lat: STORE_LAT,
            long: STORE_LNG,
            address: STORE_ADDRESS
          },
          destination: {
            lat: coords.lat,
            long: coords.lng,
            address: destination || "Tujuan"
          },
          weight: weightGram,
          vehicle: "motor",
          timezone: "Asia/Jakarta"
        });

        if (instantRes.status && instantRes.data && Array.isArray(instantRes.data)) {
          instantRes.data.forEach((courier: any) => {
             // Append to available couriers
             availableCouriers.push({
               courier_code: courier.courier_code || 'GOSEND',
               courier_name: courier.courier_name || 'GoSend Instant',
               service_name: courier.service_name || 'Instant',
               price: courier.price,
               estimation: courier.estimation || 'Hari ini',
               is_instant: true
             });
          });
        }
      } catch (err) {
        console.error("Instant pricing error:", err);
      }
    }

    // 2. Fetch Express Delivery (Reguler) if district code available
    if (destination_district_code) {
      try {
        // Find Store District ID if not set
        let storeDistrictId = process.env.STORE_DISTRICT_ID;
        
        if (!storeDistrictId) {
           // Fallback: search for Gamping dynamically
           const searchRes = await kirimajaClient.coverageArea.districtsByName("Gamping");
           if (searchRes.status && searchRes.data && searchRes.data.length > 0) {
             // Find Gamping in Sleman
             const gamping = searchRes.data.find((d: any) => d.text.includes("Sleman"));
             if (gamping) {
               storeDistrictId = gamping.id.toString();
             } else {
               storeDistrictId = searchRes.data[0].id.toString();
             }
           }
        }

        if (storeDistrictId) {
          const expressRes = await kirimajaClient.coverageArea.pricingExpress({
            origin: parseInt(storeDistrictId),
            destination: parseInt(destination_district_code),
            weight: weightGram,
            item_value: 0,
            insurance: 0,
            courier: ["jne", "sicepat", "jnt"]
          });

          if (expressRes.status && expressRes.results && Array.isArray(expressRes.results)) {
            expressRes.results.forEach((courier: any) => {
               if (courier.costs && Array.isArray(courier.costs)) {
                 courier.costs.forEach((cost: any) => {
                   availableCouriers.push({
                     courier_code: courier.code,
                     courier_name: `${courier.name} ${cost.service}`,
                     service_name: cost.service,
                     price: cost.cost,
                     estimation: cost.etd ? `${cost.etd} Hari` : '-',
                     is_instant: false
                   });
                 });
               }
            });
          }
        }
      } catch (err) {
        console.error("Express pricing error:", err);
      }
    }

    if (availableCouriers.length === 0) {
      return NextResponse.json({ error: 'Tidak ada layanan pengiriman tersedia ke lokasi ini' }, { status: 400 });
    }

    // Sort by price ascending
    availableCouriers.sort((a, b) => a.price - b.price);

    // Default selected is cheapest
    const selected = availableCouriers[0];

    return NextResponse.json({
      success: true,
      service: selected.courier_name,
      origin: STORE_ADDRESS,
      destination: destination || '',
      cost: selected.price,
      estimated_days: selected.estimation,
      couriers: availableCouriers, // Send all options for user to select
      is_estimate: false,
    });

  } catch (error: any) {
    console.error("Shipping API outer error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
