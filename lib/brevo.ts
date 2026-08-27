const BREVO_API_KEY = process.env.BREVO_API_KEY || "";
const SENDER_EMAIL = "cs@mbararaonline.com";
const SENDER_NAME = "Mbarara Online";
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
<body style="font-family: sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #334155;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
    <div style="background-color: #FF6A00; padding: 24px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 900;">Mbarara Online</h1>
    </div>
    <div style="padding: 32px 24px;">${content}</div>
    <div style="background-color: #f1f5f9; padding: 24px; text-align: center; font-size: 13px; color: #64748b; border-top: 1px solid #e2e8f0;">
      <p style="margin: 0; font-weight: 600;">Mbarara Online Operations</p>
      <p style="margin: 12px 0 0 0;">&copy; ${YEAR} Mbarara Online. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
`;

// --- 1. ADMIN ORDER ALERT ---
export async function sendAdminAlert(
  orderNumber: string, 
  items: any[], 
  total: number, 
  buyerPhone: string, 
  deliveryLocation: string
) {
  const masterEmail = "hardwaremaco@gmail.com"; 

  const itemsListHtml = items.map(item => {
    // 🚀 Prioritize publicId (e.g. GEN-0078), fallback to standard id if missing
    const identifier = item.publicId || item.productId || item.id; 
    
    // 🚀 Uses /product/ path for SEO friendly URLs
    const productLink = `https://www.mbararaonline.com/product/${identifier}`;
    const itemName = item.name || item.title || "Unknown Item";

    return `
      <li style="margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px dashed #e2e8f0;">
        <a href="${productLink}" style="color: #FF6A00; text-decoration: underline; font-weight: bold; font-size: 16px;">
          ${itemName}
        </a>
        <div style="margin-top: 4px; color: #475569; font-size: 14px;">
          Qty: <strong>${item.quantity}</strong> | Price: UGX ${(item.price * item.quantity).toLocaleString()}
        </div>
        <div style="margin-top: 2px; color: #64748b; font-size: 12px;">
          Seller Phone: ${item.sellerPhone || "N/A"}
        </div>
      </li>
    `;
  }).join(""); 

  const content = `
    <h2 style="color: #dc2626; margin-top: 0;">🚨 New Order Received!</h2>
    <p>A new transaction has been initiated on Mbarara Online.</p>
    
    <div style="background-color: #fef2f2; padding: 16px; border-radius: 8px; margin: 24px 0;">
      <p style="margin-top: 0;"><strong>Order ID:</strong> ${orderNumber}</p>
      <p><strong>Total Paid (COD):</strong> UGX ${total.toLocaleString()}</p>
      <p><strong>Buyer Phone:</strong> ${buyerPhone}</p>
      <p><strong>Delivery To:</strong> ${deliveryLocation || "Not provided"}</p>
    </div>

    <h3 style="color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px;">Order Details</h3>
    <ul style="list-style-type: none; padding: 0; margin: 0;">
      ${itemsListHtml}
    </ul>
  `;

  await sendEmail({ 
    to: [{ email: masterEmail, name: "Admin" }], 
    subject: `🚨 NEW ORDER: ${orderNumber} - UGX ${total.toLocaleString()}`, 
    htmlContent: emailWrapper(content) 
  });
}

// --- 2. BUYER RECEIPT ---
export async function sendBuyerReceipt(buyerEmail: string, buyerName: string, orderNumber: string, itemName: string, total: number) {
  const content = `
    <h2 style="color: #16a34a; margin-top: 0;">🎉 Order Confirmed!</h2>
    <p>Hi ${buyerName}, thank you for shopping with Mbarara Online!</p>
    <div style="background-color: #f0fdf4; padding: 16px; border-radius: 8px; margin: 24px 0;">
      <p><strong>Order ID:</strong> ${orderNumber}</p>
      <p><strong>Items:</strong> ${itemName}</p>
      <p><strong>Total to Pay:</strong> UGX ${total.toLocaleString()}</p>
    </div>
    <p>Our team will contact you shortly to coordinate delivery.</p>
  `;
  await sendEmail({ to: [{ email: buyerEmail, name: buyerName }], subject: `Order Receipt - ${orderNumber}`, htmlContent: emailWrapper(content) });
}

// --- 3. SELLER NOTIFICATION ---
export async function sendSellerNotification(
  sellerEmail: string, 
  sellerName: string, 
  orderNumber: string, 
  itemName: string, 
  total: number,
  buyerPhone: string
) {
  const content = `
    <h2 style="color: #FF6A00; margin-top: 0;">🚀 You Made a Sale!</h2>
    <p>Hi ${sellerName}, congratulations on your sale!</p>
    <div style="background-color: #fff7ed; padding: 16px; border-radius: 8px; margin: 24px 0;">
      <p style="margin: 0 0 8px 0;"><strong>Order ID:</strong> ${orderNumber}</p>
      <p style="margin: 0 0 8px 0;"><strong>Items Sold:</strong> ${itemName}</p>
      <p style="margin: 0 0 8px 0;"><strong>Payout Amount:</strong> UGX ${total.toLocaleString()}</p>
      <hr style="border: 0; border-top: 1px solid #fed7aa; margin: 12px 0;">
      <p style="margin: 0; color: #9a3412;"><strong>Buyer Phone:</strong> ${buyerPhone}</p>
    </div>
    <p>Please contact the buyer at <strong>${buyerPhone}</strong> to coordinate delivery as soon as possible.</p>
    <p>You can also check your Mbarara Online seller dashboard to manage this fulfillment.</p>
  `;

  await sendEmail({ 
    to: [{ email: sellerEmail, name: sellerName }], 
    subject: `You sold an item on Mbarara Online! (#${orderNumber})`, 
    htmlContent: emailWrapper(content) 
  });
}

// --- 4. ADMIN PAYOUT ALERT ---
export async function sendAdminPayoutAlert(requestId: string, sellerId: string, amount: number, newStatus: string) {
  const masterEmail = "hardwaremaco@gmail.com"; 
  const content = `
    <h2 style="color: #0f172a; margin-top: 0;">💰 Payout Update: ${newStatus.toUpperCase()}</h2>
    <p>Request ID: ${requestId}</p>
    <p>Amount: UGX ${amount.toLocaleString()}</p>
  `;
  await sendEmail({ to: [{ email: masterEmail, name: "Admin" }], subject: `💳 Payout Update: ${newStatus}`, htmlContent: emailWrapper(content) });
}
