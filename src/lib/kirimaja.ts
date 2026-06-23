const baseUrl = process.env.NODE_ENV === "production" ? "https://client.kiriminaja.com" : "https://tdev.kiriminaja.com";
const apiKey = process.env.KIRIMINAJA_API_KEY || "";

const request = async (path: string, body?: any) => {
  const res = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
      "Accept": "application/json"
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || `API Error: ${res.status}`);
  }
  return data;
};

export const kirimajaClient = {
  coverageArea: {
    districtsByName: async (search: string) => {
      return await request("/api/mitra/v2/get_address_by_name", { search: search });
    },
    pricingExpress: async (params: any) => {
      return await request("/api/mitra/v6.1/shipping_price", params);
    },
    pricingInstant: async (params: any) => {
      return await request("/api/mitra/v4/instant/pricing", params);
    }
  }
};
