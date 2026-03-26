const BREVO_API_KEY = process.env.BREVO_API_KEY || "";
const SENDER_EMAIL = "support@kabaleonline.com"; // Update with your verified Brevo sender email
const SENDER_NAME = "Kabale Admin";
const YEAR = new Date().getFullYear();

// --- BASE EMAIL SENDER ---
async function sendEmail({ to, subject, htmlContent }: { to: { email: string; name: string }[], subject: string, htmlContent: string }) {
  if (!BREVO_API_KEY) {
    console.error("Missing BREVO_API_KEY environment variable.");
    return;
  }

  try {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "api-key": BREVO_API_KEY,
      },
      body: JSON.stringify({
        sender: { email: SENDER_EMAIL, name: SENDER_NAME },
        to,
        subject,
        htmlContent,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Brevo API Error:", errorData);
    }
  } catch (error) {
    console.error("Failed to send email via Brevo:", error);
  }
}

// --- SHARED EMAIL WRAPPER ---
const emailWrapper = (content: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #334155;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
    <div style="background-color: #D97706; padding: 24px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 900; letter-spacing: -0.5px;">Kabale Online</h1>
    </div>
    <div style="padding: 32px 24px;">
      ${content}
    </div>
    <div style="background-color: #f1f5f9; padding: 24px; text-align: center; font-size: 13px; color: #64748b; border-top: 1px solid #e2e8f0;">
      <p style="margin: 0; font-weight: 600;">Kabale Online Admin Ledger</p>
      <p style="margin: 12px 0 0 0;">&copy; ${YEAR} Kabale Online.</p>
    </div>
  </div>
</body>
</html>
`;

// --- ADMIN MASTER ALERT ONLY ---
export async function sendAdminAlert(
  orderNumber: string, 
  itemName: string, 
  total: number, 
  buyerPhone: string,
  sellerPhone: string
) {
  const masterEmail = "shopkabale@gmail.com"; 

  const content = `
    <h2 style="margin-top: 0; color: #dc2626; font-size: 24px;">🚨 WhatsApp Order Created!</h2>
    <p style="font-size: 16px; line-height: 1.6;">A new native WhatsApp transaction has started on the platform.</p>
    
    <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin: 24px 0;">
      <p style="margin: 0 0 8px 0; font-size: 14px; color: #991b1b; font-weight: 600;">ORDER DETAILS</p>
      <p style="margin: 0 0 4px 0;"><strong>Order ID:</strong> ${orderNumber}</p>
      <p style="margin: 0 0 4px 0;"><strong>Item:</strong> ${itemName}</p>
      <p style="margin: 0 0 16px 0;"><strong>Value:</strong> UGX ${total.toLocaleString()}</p>
      
      <p style="margin: 0 0 8px 0; font-size: 14px; color: #991b1b; font-weight: 600;">PARTICIPANTS</p>
      <p style="margin: 0 0 4px 0;"><strong>Buyer Phone:</strong> <a href="https://wa.me/${buyerPhone.replace(/\D/g, '')}" style="color: #D97706; text-decoration: none;">${buyerPhone}</a></p>
      <p style="margin: 0 0 0 0;"><strong>Seller Phone:</strong> <a href="https://wa.me/${sellerPhone.replace(/\D/g, '')}" style="color: #D97706; text-decoration: none;">${sellerPhone}</a></p>
    </div>
    
    <p style="font-size: 16px; line-height: 1.6; font-weight: bold;">Check your Admin Dashboard for live status updates.</p>
  `;

  await sendEmail({ 
    to: [{ email: masterEmail, name: "Kabale Admin" }], 
    subject: `🚨 KABALE ORDER: UGX ${total.toLocaleString()}`, 
    htmlContent: emailWrapper(content) 
  });
}
