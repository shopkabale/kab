import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { adminId, subject, htmlContent } = await req.json();

    // 1. DATA VALIDATION
    if (!adminId || !subject || !htmlContent) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 2. VERIFY ADMIN PRIVILEGES
    const adminDoc = await adminDb.collection("users").doc(adminId).get();
    if (!adminDoc.exists || adminDoc.data()?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
    }

    // 3. FETCH ALL VALID EMAILS
    const usersSnap = await adminDb.collection("users").get();
    const allEmails = usersSnap.docs
      .map(doc => doc.data().email)
      .filter(email => email && email.includes("@"));

    if (allEmails.length === 0) {
      return NextResponse.json({ error: "No valid user emails found" }, { status: 404 });
    }

    // 4. BREVO CONFIG
    const BREVO_API_KEY = process.env.BREVO_API_KEY || "";
    const SENDER_EMAIL = "support@kabaleonline.com"; 
    const SENDER_NAME = "Kabale Online";

    // 5. CHUNK EMAILS (40 at a time for maximum deliverability)
    const chunkSize = 40;
    const emailChunks = [];
    for (let i = 0; i < allEmails.length; i += chunkSize) {
      emailChunks.push(allEmails.slice(i, i + chunkSize));
    }

    // 6. SEQUENTIAL PROCESSING (Hacker-Proof & Spam-Safe)
    let totalSent = 0;
    for (let i = 0; i < emailChunks.length; i++) {
      const chunk = emailChunks[i];
      const bccList = chunk.map((email: string) => ({ email }));

      const response = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
          "api-key": BREVO_API_KEY,
        },
        body: JSON.stringify({
          sender: { email: SENDER_EMAIL, name: SENDER_NAME },
          to: [{ email: SENDER_EMAIL, name: "Kabale Community" }], 
          bcc: bccList, 
          subject: subject,
          htmlContent: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #334155;">
              <div style="background-color: #D97706; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
                <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Kabale Online</h1>
              </div>
              <div style="padding: 30px 20px; background-color: #ffffff; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px; line-height: 1.6;">
                ${htmlContent}
              </div>
              <div style="text-align: center; padding: 20px; font-size: 12px; color: #94a3b8;">
                You are receiving this because you have an account on Kabale Online.<br>
                Kabale, Western Region, Uganda.
              </div>
            </div>
          `,
        }),
      });

      if (response.ok) {
        totalSent += chunk.length;
      }

      // Small 300ms delay between batches to stay "under the radar"
      if (i < emailChunks.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    }

    return NextResponse.json({ 
      message: `Broadcast successfully sent to ${totalSent} users in ${emailChunks.length} batches.` 
    }, { status: 200 });

  } catch (error: any) {
    console.error("Broadcast API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
