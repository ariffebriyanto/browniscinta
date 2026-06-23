const BABLAST_API_URL = "https://api.bablast.id";
const BABLAST_TOKEN = process.env.BABLAST_API_KEY || "KgEx1ihLuvFlXkeI9yxX4kaGuy7Ey65p64uH4rGz8s0UY6ESpTKoLQi1ECazuJFMuOaLmJH0TcGmjUrkSvUdxwF6kKnDZPB42zmL";

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
    // Bablast usually requires 62 prefix instead of 0
    let formattedPhone = phone;
    if (formattedPhone.startsWith("0")) {
      formattedPhone = "62" + formattedPhone.substring(1);
    }

    const response = await fetch(`${BABLAST_API_URL}/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${BABLAST_TOKEN}`,
      },
      body: JSON.stringify({
        phone: formattedPhone,
        message: text,
      }),
    });

    const data = await response.json();
    require('fs').appendFileSync('wa-debug.log', `[${new Date().toISOString()}] SUCCESS to ${formattedPhone}: ${JSON.stringify(data)}\n`);
    return data;
  } catch (error) {
    require('fs').appendFileSync('wa-debug.log', `[${new Date().toISOString()}] ERROR to ${phone}: ${error}\n`);
    console.error("Failed to send WhatsApp text:", error);
    throw error;
  }
}
