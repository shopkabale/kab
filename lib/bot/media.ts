import { v2 as cloudinary } from "cloudinary";

// ==========================================
// CONFIGURE CLOUDINARY
// ==========================================
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ==========================================
// DOWNLOAD FROM META & UPLOAD TO CLOUDINARY
// ==========================================
export async function processWhatsAppImage(mediaId: string): Promise<string> {
  const WHATSAPP_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;

  if (!WHATSAPP_TOKEN) {
    throw new Error("Missing WHATSAPP_ACCESS_TOKEN in environment variables.");
  }

  try {
    // 1. Ask Meta for the temporary download URL
    const metaRes = await fetch(`https://graph.facebook.com/v19.0/${mediaId}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${WHATSAPP_TOKEN}` },
    });

    if (!metaRes.ok) {
      const errorData = await metaRes.json();
      console.error("Meta API Error:", errorData);
      throw new Error("Failed to fetch media URL from Meta");
    }

    const metaData = await metaRes.json();
    const mediaUrl = metaData.url;

    // 2. Download the raw image file from Meta's URL
    // (You MUST pass the Bearer token here too, or Meta will reject it)
    const imageRes = await fetch(mediaUrl, {
      method: "GET",
      headers: { Authorization: `Bearer ${WHATSAPP_TOKEN}` },
    });

    if (!imageRes.ok) throw new Error("Failed to download image buffer from Meta");
    
    // Convert the response into a Node.js Buffer
    const arrayBuffer = await imageRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 3. Stream the buffer directly to Cloudinary
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: "kabale_online" },
        (error, result) => {
          if (error) {
            console.error("Cloudinary Upload Error:", error);
            return reject(error);
          }
          
          if (!result || !result.secure_url) {
            return reject(new Error("Cloudinary did not return a secure URL"));
          }

          // Let Cloudinary optimize it before serving, exactly like your web app does
          const optimizedUrl = result.secure_url.replace('/upload/', '/upload/f_auto,q_auto,w_800/');
          resolve(optimizedUrl);
        }
      );
      
      // End the stream and trigger the upload
      uploadStream.end(buffer);
    });

  } catch (error) {
    console.error("❌ Media Processing Failed:", error);
    throw error; // Rethrow so the botFlow knows the upload failed
  }
}
