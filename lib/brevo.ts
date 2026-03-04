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
    sender: {
      name: "Kabale Online",
      email: senderEmail,
    },
    to: [
      {
        email: userEmail,
        name: userName,
      },
    ],
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
      headers: {
        "Content-Type": "application/json",
        "api-key": brevoApiKey,
        "accept": "application/json"
      },
      body: JSON.stringify(emailData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Brevo API Error:", errorData);
      return false;
    }

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
  buyerPhone: string,
  buyerLocation: string
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
          <h3 style="margin-top: 0; color: #333;">Delivery Details</h3>
          <p><strong>Buyer Name:</strong> ${buyerName}</p>
          <p><strong>Location:</strong> ${buyerLocation}</p>
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
  buyerPhone: string
) {
  const brevoApiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.SENDER_EMAIL || "support@kabaleonline.com";
  const adminEmail = "shopkabale@gmail.com"; // Your actual admin receiving email

  if (!brevoApiKey) return false;

  const emailData = {
    sender: { name: "System Alert", email: senderEmail },
    to: [{ email: adminEmail, name: "Admin" }],
    subject: `🔔 New Sale Alert: ${itemName} (${orderNumber})`,
    htmlContent: `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h3 style="color: #333;">New Order Placed on Kabale Online</h3>
        <p><strong>Order ID:</strong> ${orderNumber}</p>
        <p><strong>Item:</strong> ${itemName}</p>
        <p><strong>Amount:</strong> UGX ${totalAmount.toLocaleString()}</p>
        <p><strong>Buyer:</strong> ${buyerName} (${buyerPhone})</p>
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