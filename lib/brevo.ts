// lib/brevo.ts
const BREVO_API_KEY = process.env.BREVO_API_KEY || "";
const SENDER_EMAIL = "support@kabaleonline.com"; // Update with your verified Brevo sender email
const SENDER_NAME = "Kabale Online";
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

// --- SHARED EMAIL WRAPPER (For consistent branding) ---
const emailWrapper = (content: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #334155;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
    <!-- Header -->
    <div style="background-color: #D97706; padding: 24px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 900; letter-spacing: -0.5px;">Kabale Online</h1>
    </div>
    
    <!-- Main Content -->
    <div style="padding: 32px 24px;">
      ${content}
    </div>
    
    <!-- Footer -->
    <div style="background-color: #f1f5f9; padding: 24px; text-align: center; font-size: 13px; color: #64748b; border-top: 1px solid #e2e8f0;">
      <p style="margin: 0; font-weight: 600;">Kabale Online Marketplace</p>
      <p style="margin: 4px 0 0 0;">Serving Kabale, Western Region, Uganda</p>
      <p style="margin: 12px 0 0 0;">&copy; ${YEAR} Kabale Online. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
`;

// --- 1. BUYER: ORDER PLACED (PENDING) ---
export async function sendOrderConfirmation(email: string, name: string, orderNumber: string, total: number) {
  const content = `
    <h2 style="margin-top: 0; color: #0f172a; font-size: 24px;">Order Received! 🎉</h2>
    <p style="font-size: 16px; line-height: 1.6;">Hi <strong>${name}</strong>,</p>
    <p style="font-size: 16px; line-height: 1.6;">Thank you for shopping with Kabale Online! Your order has been placed successfully and the item has been reserved for you.</p>
    
    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 24px 0;">
      <p style="margin: 0 0 8px 0; font-size: 14px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">Order Number</p>
      <p style="margin: 0 0 16px 0; font-size: 20px; font-weight: 800; color: #D97706; font-family: monospace;">${orderNumber}</p>
      
      <p style="margin: 0 0 8px 0; font-size: 14px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">Amount to Pay (Cash on Delivery)</p>
      <p style="margin: 0; font-size: 20px; font-weight: 800; color: #0f172a;">UGX ${total.toLocaleString()}</p>
    </div>
    
    <p style="font-size: 16px; line-height: 1.6;">The seller will review your order shortly. We will send you another email as soon as the status changes!</p>
  `;
  await sendEmail({ to: [{ email, name }], subject: `Order Received - ${orderNumber}`, htmlContent: emailWrapper(content) });
}

// --- 2. BUYER: STATUS UPDATES ---
export async function sendStatusUpdateEmail(email: string, name: string, orderNumber: string, newStatus: string) {
  const statusFormatMap: Record<string, { text: string, color: string, icon: string }> = {
    "confirmed": { text: "Confirmed & Preparing", color: "#2563eb", icon: "✅" },
    "out_for_delivery": { text: "Out for Delivery", color: "#9333ea", icon: "🚚" },
    "delivered": { text: "Delivered", color: "#16a34a", icon: "🎁" },
    "cancelled": { text: "Cancelled", color: "#dc2626", icon: "❌" }
  };

  const statusInfo = statusFormatMap[newStatus] || { text: newStatus, color: "#475569", icon: "📌" };
  
  const content = `
    <h2 style="margin-top: 0; color: #0f172a; font-size: 24px;">Order Update</h2>
    <p style="font-size: 16px; line-height: 1.6;">Hi <strong>${name}</strong>,</p>
    <p style="font-size: 16px; line-height: 1.6;">There is an update regarding your order <strong>${orderNumber}</strong>.</p>
    
    <div style="text-align: center; margin: 32px 0;">
      <span style="font-size: 48px;">${statusInfo.icon}</span>
      <h3 style="margin: 12px 0 0 0; color: ${statusInfo.color}; font-size: 22px; text-transform: uppercase; letter-spacing: 1px;">${statusInfo.text}</h3>
    </div>
    
    ${newStatus === 'out_for_delivery' ? '<p style="font-size: 16px; line-height: 1.6; background-color: #fffbeb; border-left: 4px solid #fbbf24; padding: 12px 16px; margin-bottom: 24px;"><strong>Action Required:</strong> Please prepare your cash for payment. The seller will be arriving soon!</p>' : ''}
    ${newStatus === 'delivered' ? '<p style="font-size: 16px; line-height: 1.6; text-align: center; font-weight: 600;">Thank you for shopping with Kabale Online! Enjoy your new item.</p>' : ''}
  `;
  await sendEmail({ to: [{ email, name }], subject: `Order ${statusInfo.text} - ${orderNumber}`, htmlContent: emailWrapper(content) });
}

// --- 3. BUYER: AUTO-EXPIRY (Cron Job) ---
export async function sendExpiryNotification(email: string, name: string, orderNumber: string) {
  const content = `
    <h2 style="margin-top: 0; color: #dc2626; font-size: 24px;">Order Expired ⏱️</h2>
    <p style="font-size: 16px; line-height: 1.6;">Hi <strong>${name}</strong>,</p>
    <p style="font-size: 16px; line-height: 1.6;">Your pending order <strong>${orderNumber}</strong> has automatically expired due to 36 hours of inactivity.</p>
    
    <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin: 24px 0;">
      <p style="margin: 0; font-size: 15px; color: #991b1b; line-height: 1.5;">To keep the marketplace fair, items are only reserved for 36 hours. The item has now been unlocked and made available to other buyers.</p>
    </div>
    
    <p style="font-size: 16px; line-height: 1.6; font-weight: 600;">Still want it?</p>
    <p style="font-size: 16px; line-height: 1.6;">You can still reorder the item on Kabale Online if it hasn't been purchased by someone else.</p>
  `;
  await sendEmail({ to: [{ email, name }], subject: `Order Expired - ${orderNumber}`, htmlContent: emailWrapper(content) });
}

// --- 4. SELLER: NEW ORDER ALERT ---
export async function sendSellerNotification(sellerEmail: string, sellerName: string, itemName: string, buyerName: string, buyerPhone: string) {
  const content = `
    <h2 style="margin-top: 0; color: #0f172a; font-size: 24px;">New Order Alert! 🚀</h2>
    <p style="font-size: 16px; line-height: 1.6;">Hi <strong>${sellerName}</strong>,</p>
    <p style="font-size: 16px; line-height: 1.6;">Great news! You have a new buyer for your item on Kabale Online.</p>
    
    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 24px 0;">
      <p style="margin: 0 0 8px 0; font-size: 14px; color: #64748b; font-weight: 600;">ITEM REQUESTED</p>
      <p style="margin: 0 0 20px 0; font-size: 18px; font-weight: 700; color: #0f172a;">${itemName}</p>
      
      <p style="margin: 0 0 8px 0; font-size: 14px; color: #64748b; font-weight: 600;">BUYER DETAILS</p>
      <p style="margin: 0 0 4px 0; font-size: 16px;"><strong>Name:</strong> ${buyerName}</p>
      <p style="margin: 0; font-size: 16px;"><strong>Phone:</strong> <a href="tel:${buyerPhone}" style="color: #D97706; text-decoration: none; font-weight: 600;">${buyerPhone}</a></p>
    </div>
    
    <p style="font-size: 16px; line-height: 1.6;">Please log in to your dashboard to confirm the order or contact the buyer directly to arrange delivery.</p>
  `;
  await sendEmail({ to: [{ email: sellerEmail, name: sellerName }], subject: `New Order for ${itemName}!`, htmlContent: emailWrapper(content) });
}

// --- ADMIN MASTER ALERT (Hardcoded to shopkabale@gmail.com) ---
export async function sendAdminAlert(
  orderNumber: string, 
  itemName: string, 
  total: number, 
  buyerName: string, 
  buyerPhone: string,
  sellerName: string,
  sellerPhone: string
) {
  // 🔥 HARDCODED MASTER EMAIL
  const masterEmail = "shopkabale@gmail.com"; 

  const content = `
    <h2 style="margin-top: 0; color: #dc2626; font-size: 24px;">🚨 New Order Alert!</h2>
    <p style="font-size: 16px; line-height: 1.6;">A new order has been placed on the Kabale Online marketplace.</p>
    
    <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin: 24px 0;">
      <p style="margin: 0 0 8px 0; font-size: 14px; color: #991b1b; font-weight: 600;">ORDER DETAILS</p>
      <p style="margin: 0 0 4px 0;"><strong>Order ID:</strong> ${orderNumber}</p>
      <p style="margin: 0 0 4px 0;"><strong>Item:</strong> ${itemName}</p>
      <p style="margin: 0 0 16px 0;"><strong>Value:</strong> UGX ${total.toLocaleString()}</p>
      
      <p style="margin: 0 0 8px 0; font-size: 14px; color: #991b1b; font-weight: 600;">BUYER</p>
      <p style="margin: 0 0 4px 0;"><strong>Name:</strong> ${buyerName}</p>
      <p style="margin: 0 0 16px 0;"><strong>Phone:</strong> ${buyerPhone}</p>

      <p style="margin: 0 0 8px 0; font-size: 14px; color: #991b1b; font-weight: 600;">SELLER</p>
      <p style="margin: 0 0 4px 0;"><strong>Name:</strong> ${sellerName}</p>
      <p style="margin: 0 0 0 0;"><strong>Phone:</strong> ${sellerPhone}</p>
    </div>
    
    <p style="font-size: 16px; line-height: 1.6; font-weight: bold;">Please ensure the seller contacts the buyer within 36 hours.</p>
  `;

  // Uses the masterEmail directly
  await sendEmail({ 
    to: [{ email: masterEmail, name: "Kabale Admin" }], 
    subject: `🚨 KABALE ORDER: ${orderNumber} - ${itemName}`, 
    htmlContent: emailWrapper(content) 
  });
}
