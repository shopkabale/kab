import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin"; // <--- YOUR CORRECT ADMIN IMPORT

export async function GET(req: Request) {
  try {
    // 1. Read the secret from the URL
    const { searchParams } = new URL(req.url);
    const secret = searchParams.get("secret");

    if (secret !== process.env.ADMIN_SECRET_KEY) {
      return NextResponse.json({ error: "Unauthorized. Wrong secret." }, { status: 401 });
    }

    const brevoApiKey = process.env.BREVO_API_KEY;
    const senderEmail = process.env.SENDER_EMAIL || "support@kabaleonline.com";

    if (!brevoApiKey) {
      return NextResponse.json({ error: "Missing BREVO_API_KEY" }, { status: 500 });
    }

    // 2. Fetch users using Firebase ADMIN SDK
    const snapshot = await adminDb.collection("users").get();
    
    const allEmails: string[] = [];
    snapshot.forEach((doc) => {
      const userData = doc.data();
      if (userData.email && typeof userData.email === "string") {
        allEmails.push(userData.email);
      }
    });

    if (allEmails.length === 0) return NextResponse.json({ message: "No user emails found." }, { status: 404 });

    // 3. Batching
    const chunkSize = 50;
    const failedBatches = [];
    let successfulEmails = 0;
    const currentYear = new Date().getFullYear();

    for (let i = 0; i < allEmails.length; i += chunkSize) {
      const batch = allEmails.slice(i, i + chunkSize);
      const bccList = batch.map((email) => ({ email }));
      
      const emailData = {
        sender: { name: "Kabale Online", email: senderEmail },
        to: [{ email: senderEmail, name: "Kabale Online Community" }],
        bcc: bccList,
        subject: "📢 Important Updates to Our Terms & Conditions",
        htmlContent: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333; background-color: #f8fafc; border-radius: 8px;">
            <div style="background-color: #ffffff; padding: 30px; border-radius: 8px; border: 1px solid #e2e8f0;">
              <h2 style="color: #0f172a; margin-top: 0;">Hi there,</h2>
              <p style="font-size: 16px; line-height: 1.6;">We are reaching out to let you know that we have made some important updates to the <strong>Kabale Online Terms & Conditions</strong>.</p>
              <p style="font-size: 16px; line-height: 1.6;">As our community grows, we want to ensure a safe, reliable, and transparent marketplace for everyone in Kigezi.</p>

              <div style="background-color: #f1f5f9; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #0ea5e9;">
                <h3 style="margin-top: 0; color: #0ea5e9; font-size: 16px;">Key Changes Include:</h3>
                <ul style="padding-left: 20px; line-height: 1.6; margin-bottom: 0;">
                  <li><strong>Clearer Buyer & Seller Guidelines:</strong> Stricter rules on order commitment and stock accuracy.</li>
                  <li><strong>Platform Enforcement:</strong> New penalties for fake orders, unjustified cancellations, and "ghost" stock.</li>
                  <li><strong>Logistics Coordination:</strong> Clarified our role in facilitating secure deliveries.</li>
                  <li><strong>Affiliate Rules:</strong> Updated guidelines for our upcoming ambassador program.</li>
                </ul>
              </div>

              <p style="text-align: center; margin: 35px 0;">
                <a href="https://www.kabaleonline.com/terms" style="background-color: #0ea5e9; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; display: inline-block;">Read the Full Terms Here</a>
              </p>
              <p style="font-size: 16px; line-height: 1.6; margin-bottom: 0;">Thank you for your continued support to Kabale Online. Let's keep building the best marketplace in our community!</p>
            </div>

            <div style="text-align: center; margin-top: 20px;">
              <p style="font-size: 14px; margin-bottom: 10px;">
                <a href="https://www.kabaleonline.com/" style="color: #0ea5e9; text-decoration: none; margin: 0 10px;">Home</a> | 
                <a href="https://www.kabaleonline.com/sell" style="color: #0ea5e9; text-decoration: none; margin: 0 10px;">Sell an Item</a> | 
                <a href="https://www.kabaleonline.com/profile" style="color: #0ea5e9; text-decoration: none; margin: 0 10px;">Your Profile</a>
              </p>
              <hr style="border: none; border-top: 1px solid #cbd5e1; margin: 20px 0;" />
              <p style="font-size: 12px; color: #64748b; margin: 5px 0;">&copy; ${currentYear} Kabale Online. All rights reserved.</p>
              <p style="font-size: 11px; color: #94a3b8; margin: 5px 0; font-style: italic;">You are receiving this message because you own an account on Kabale Online.</p>
            </div>
          </div>
        `,
      };

      try {
        const response = await fetch("https://api.brevo.com/v3/smtp/email", {
          method: "POST",
          headers: { "Content-Type": "application/json", "api-key": brevoApiKey, accept: "application/json" },
          body: JSON.stringify(emailData),
        });

        if (!response.ok) {
          failedBatches.push(i / chunkSize + 1);
        } else {
          successfulEmails += batch.length;
        }
      } catch (err) {
        failedBatches.push(i / chunkSize + 1);
      }
      // Wait 1 second between batches to keep Brevo happy
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    return NextResponse.json({
      success: true,
      totalAttempted: allEmails.length,
      totalSuccessful: successfulEmails,
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
