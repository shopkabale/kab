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