import KiriminAja from "kiriminaja";

// Initialize KiriminAja client using the API key from environment
KiriminAja.init({
  baseUrl: "https://tdev.kiriminaja.com", // use production url for live
  apiKey: process.env.KIRIMINAJA_API_KEY || "",
});

export const kirimajaClient = KiriminAja;

export async function getProvinces() {
  return await KiriminAja.address.provinces();
}

export async function getCities(provinceId: number) {
  return await KiriminAja.address.cities(provinceId);
}

export async function getDistricts(cityId: number) {
  return await KiriminAja.address.districts(cityId);
}

export async function checkShippingCost(
  origin: number,
  destination: number,
  weight: number,
  couriers: string[] = ["jne"]
) {
  return await KiriminAja.coverageArea.pricingExpress({
    origin,
    destination,
    weight,
    item_value: 0,
    insurance: 0,
    courier: couriers,
  });
}
