// lib/brevo.ts

export async function sendOrderConfirmation(
  userEmail: string, 
  userName: string, 
  orderNumber: string, 
  totalAmount: number
) {
  const brevoApiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.SENDER_EMAIL || "noreply@kabaleonline.com";

  if (!brevoApiKey) {
    console.error("Missing BREVO_API_KEY environment variable");
    return false;
  }

  const emailData = {
    sender: { name: "Kabale Online", email: senderEmail },
    to: [{ email: userEmail, name: userName }],
    subject: `Order Confirmation - ${orderNumber} | Kabale Online`,
    htmlContent: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
        <h2 style="color: #0ea5e9;">Thank you for your order, ${userName}!</h2>
        <p>Your order <strong>${orderNumber}</strong> has been successfully placed on Kabale Online.</p>
        
        <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Order Summary</h3>
          <p><strong>Order Number:</strong> ${orderNumber}</p>
          <p><strong>Total Amount:</strong> UGX ${totalAmount.toLocaleString()}</p>
          <p><strong>Payment Method:</strong> Cash on Delivery</p>
          <p><strong>Status:</strong> Pending Confirmation</p>
        </div>

        <p>The vendor will contact you shortly to arrange the delivery within Kabale town.</p>
        <p>Please have the exact cash ready upon delivery.</p>
        
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;" />
        <p style="font-size: 12px; color: #64748b; text-align: center;">
          Kabale Online - The Better Way to Inform Your Community.<br/>
          Kabale, Uganda
        </p>
      </div>
    `,
  };

  try {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: { "Content-Type": "application/json", "api-key": brevoApiKey, "accept": "application/json" },
      body: JSON.stringify(emailData),
    });
    if (!response.ok) return false;
    return true;
  } catch (error) {
    console.error("Failed to send email via Brevo:", error);
    return false;
  }
}

export async function sendSellerNotification(
  sellerEmail: string,
  sellerName: string,
  itemName: string,
  buyerName: string,
  buyerPhone: string
) {
  const brevoApiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.SENDER_EMAIL || "noreply@okaynotice.com";

  if (!brevoApiKey || !sellerEmail) return false;

  const emailData = {
    sender: { name: "Kabale Online Alerts", email: senderEmail },
    to: [{ email: sellerEmail, name: sellerName || "Seller" }],
    subject: `💰 New Order for ${itemName}!`,
    htmlContent: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb; border-radius: 10px;">
        <h2 style="color: #D97706; margin-top: 0;">You have a new customer!</h2>
        <p>Someone wants to buy your <strong>${itemName}</strong>.</p>
        
        <div style="background-color: #ffffff; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #333;">Buyer Details</h3>
          <p><strong>Name:</strong> ${buyerName}</p>
          <p><strong>Phone:</strong> ${buyerPhone}</p>
        </div>
        
        <p style="margin-top: 20px; text-align: center;">
          <a href="https://wa.me/${buyerPhone.replace(/[^0-9]/g, '')}?text=Hi%20${buyerName},%20I%20am%20contacting%20you%20about%20your%20order%20for%20${itemName}%20on%20Kabale%20Online." 
             style="background-color: #25D366; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
            Click here to WhatsApp the Buyer
          </a>
        </p>
      </div>
    `,
  };

  try {
    await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: { "Content-Type": "application/json", "api-key": brevoApiKey, "accept": "application/json" },
      body: JSON.stringify(emailData),
    });
    return true;
  } catch (error) {
    console.error("Seller email failed:", error);
    return false;
  }
}

export async function sendAdminAlert(
  orderNumber: string,
  itemName: string,
  totalAmount: number,
  buyerName: string,
  buyerPhone: string,
  sellerName: string,       
  sellerPhone: string      
) {
  const brevoApiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.SENDER_EMAIL || "support@kabaleonline.com";
  const adminEmail = "shopkabale@gmail.com"; 

  if (!brevoApiKey) return false;

  const emailData = {
    sender: { name: "System Alert", email: senderEmail },
    to: [{ email: adminEmail, name: "Admin" }],
    subject: `🚨 KABALE ADMIN: Sale Alert - ${itemName} (${orderNumber})`,
    htmlContent: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f1f5f9; border-radius: 10px;">
        <h2 style="color: #0f172a; margin-top: 0; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">🚨 System Alert: New Order</h2>
        <div style="background-color: #ffffff; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 15px;">
          <h3 style="margin-top: 0; color: #333;">🛒 Order Details</h3>
          <p style="margin: 5px 0;"><strong>Order ID:</strong> ${orderNumber}</p>
          <p style="margin: 5px 0;"><strong>Item:</strong> ${itemName}</p>
          <p style="margin: 5px 0;"><strong>Total Amount:</strong> UGX ${totalAmount.toLocaleString()}</p>
        </div>
        <div style="background-color: #ffffff; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 15px;">
          <h3 style="margin-top: 0; color: #2563eb;">👤 Buyer Overview</h3>
          <p style="margin: 5px 0;"><strong>Name:</strong> ${buyerName}</p>
          <p style="margin: 5px 0;"><strong>Phone:</strong> ${buyerPhone}</p>
          <p style="margin-top: 10px;">
            <a href="https://wa.me/${buyerPhone.replace(/\D/g, '')}" style="color: #25D366; text-decoration: none; font-weight: bold;">💬 Chat with Buyer</a>
          </p>
        </div>
        <div style="background-color: #ffffff; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0;">
          <h3 style="margin-top: 0; color: #16a34a;">🏪 Seller Overview</h3>
          <p style="margin: 5px 0;"><strong>Name:</strong> ${sellerName}</p>
          <p style="margin: 5px 0;"><strong>Phone:</strong> ${sellerPhone || "No Phone Provided"}</p>
          <p style="margin-top: 10px;">
            <a href="https://wa.me/${(sellerPhone || "").replace(/\D/g, '')}" style="color: #25D366; text-decoration: none; font-weight: bold;">💬 Chat with Seller</a>
          </p>
        </div>
      </div>
    `,
  };

  try {
    await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: { "Content-Type": "application/json", "api-key": brevoApiKey, "accept": "application/json" },
      body: JSON.stringify(emailData),
    });
    return true;
  } catch (error) {
    console.error("Admin alert failed:", error);
    return false;
  }
}

// ============================================================================
// 🔥 NEW: THE MAGIC LINK WHATSAPP NOTIFICATION
// ============================================================================
export async function sendWhatsAppReplyAlert(
  sellerEmail: string,
  buyerPhone: string,
  messageContent: string,
  messageId: string,
  orderId: string = "Recent Order" // ✅ 5th argument added here
) {
  const brevoApiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.SENDER_EMAIL || "support@kabaleonline.com";

  if (!brevoApiKey || !sellerEmail) return false;

  // Uses your live domain if available, otherwise defaults to localhost for testing
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const magicLink = `${baseUrl}/reply/${messageId}`;

  const emailData = {
    sender: { name: "Kabale Online Secure Chat", email: senderEmail },
    to: [{ email: sellerEmail, name: "Seller / Admin" }],
    subject: `💬 New WhatsApp Reply from Customer (${buyerPhone})`,
    htmlContent: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc; border-radius: 10px;">
        <h2 style="color: #D97706; margin-top: 0;">You have a new WhatsApp message!</h2>
        <p>A customer has replied to an automated WhatsApp order notification for <strong>${orderId}</strong>.</p>
        
        <div style="background-color: #ffffff; padding: 20px; border-radius: 8px; border-left: 4px solid #D97706; margin: 20px 0; font-size: 16px; color: #333;">
          <p style="margin: 0; font-size: 12px; color: #64748b; margin-bottom: 8px;">Customer Phone: ${buyerPhone}</p>
          <em style="font-size: 18px;">"${messageContent}"</em>
        </div>
        
        <p style="margin-top: 30px; text-align: center;">
          <a href="${magicLink}" 
             style="background-color: #0f172a; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">
            Click Here to Reply Securely
          </a>
        </p>
        
        <p style="font-size: 12px; color: #94a3b8; text-align: center; margin-top: 20px;">
          Your reply will be automatically routed back to their WhatsApp.
        </p>
      </div>
    `,
  };

  try {
    await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: { "Content-Type": "application/json", "api-key": brevoApiKey, "accept": "application/json" },
      body: JSON.stringify(emailData),
    });
    return true;
  } catch (error) {
    console.error("Magic link email failed:", error);
    return false;
  }
}
