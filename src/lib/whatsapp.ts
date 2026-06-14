const BABLAST_API_URL = "https://api.bablast.id/waba";
const BABLAST_TOKEN = process.env.BABLAST_API_KEY || "Op5SgFLRT9oCW1EqecJzxMfVtj7RkndWQDVloZBtoM5BVfkUAd6WOD5K4ADTjxzYC1mTTdG4n4sUqudb7ARhbJzVp6zaykVlgeuZ";

export async function sendWhatsappMessage(
  phone: string,
  templateName: string,
  parameters: { type: "text"; text: string }[]
) {
  if (!BABLAST_TOKEN) {
    console.error("BABLAST_TOKEN is not configured.");
    return;
  }

  try {
    const response = await fetch(`${BABLAST_API_URL}/send-template`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${BABLAST_TOKEN}`,
      },
      body: JSON.stringify({
        phone: phone,
        template_name: templateName,
        language: "id",
        parameters: parameters,
      }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to send WhatsApp message:", error);
    throw error;
  }
}

export async function sendWhatsappText(phone: string, text: string) {
  if (!BABLAST_TOKEN) {
    console.error("BABLAST_TOKEN is not configured.");
    return;
  }

  try {
    const response = await fetch(`${BABLAST_API_URL}/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${BABLAST_TOKEN}`,
      },
      body: JSON.stringify({
        phone: phone,
        message: text,
      }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to send WhatsApp text:", error);
    throw error;
  }
}
