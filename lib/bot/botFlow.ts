import { adminDb } from "@/lib/firebase/admin";
import * as admin from "firebase-admin";
import { sendWhatsAppMessage } from "@/lib/whatsapp";

// We will build this file next! It handles downloading the image and sending it to Cloudinary.
import { processWhatsAppImage } from "./media"; 

// ==========================================
// STATE MACHINE: THE STORE BUILDER
// ==========================================
export async function processBotFlow(senderPhone: string, messageData: { type: string, text?: string, mediaId?: string }): Promise<boolean> {
  const sessionRef = adminDb.collection("bot_sessions").doc(senderPhone);
  const sessionDoc = await sessionRef.get();
  
  // 1. TRIGGER THE FLOW (The user clicked "Sell an Item" or typed /add)
  if (messageData.type === "text" && messageData.text === "/add") {
    await sessionRef.set({ 
      step: "WAITING_FOR_NAME", 
      tempData: {},
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    await sendWhatsAppMessage(
      senderPhone, 
      "Let's get your item listed on Kabale Online! 📦\n\nFirst, what is the *Name* of the product?"
    );
    return true; // We handled this message!
  }

  // 2. CHECK FOR ACTIVE SESSION
  // If they aren't currently building a product, return false so the human proxy can take over.
  if (!sessionDoc.exists) {
    return false; 
  }

  const session = sessionDoc.data()!;
  const { step, tempData } = session;

  // 3. PROCESS THE CURRENT STEP
  try {
    switch (step) {
      
      // --- STEP A: CAPTURE NAME ---
      case "WAITING_FOR_NAME":
        if (messageData.type !== "text" || !messageData.text) {
          await sendWhatsAppMessage(senderPhone, "Please reply with a text message containing the product name.");
          return true;
        }
        
        await sessionRef.update({ 
          step: "WAITING_FOR_PRICE", 
          "tempData.title": messageData.text.trim(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        await sendWhatsAppMessage(
          senderPhone, 
          `Got it! Name set to *${messageData.text.trim()}*.\n\n💰 Next, what is the *Price in UGX*? (Numbers only, e.g. 50000)`
        );
        return true;

      // --- STEP B: CAPTURE PRICE ---
      case "WAITING_FOR_PRICE":
        if (messageData.type !== "text" || !messageData.text) {
          await sendWhatsAppMessage(senderPhone, "Please reply with the price.");
          return true;
        }

        // Clean the input (remove commas or text)
        const rawPrice = messageData.text.replace(/\D/g, "");
        if (!rawPrice || isNaN(Number(rawPrice))) {
          await sendWhatsAppMessage(senderPhone, "That doesn't look like a valid number. Please send the price using numbers only (e.g. 50000).");
          return true;
        }
        
        await sessionRef.update({ 
          step: "WAITING_FOR_IMAGE", 
          "tempData.price": Number(rawPrice),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        await sendWhatsAppMessage(
          senderPhone, 
          `Price saved at *UGX ${Number(rawPrice).toLocaleString()}*.\n\n📸 Finally, please send a *Photo* of the product.`
        );
        return true;

      // --- STEP C: CAPTURE IMAGE & SAVE ---
      case "WAITING_FOR_IMAGE":
        if (messageData.type !== "image" || !messageData.mediaId) {
          await sendWhatsAppMessage(senderPhone, "Please use the attachment icon 📎 to upload a photo of the product.");
          return true;
        }
        
        // Let the user know we are working on it, since image processing takes a few seconds
        await sendWhatsAppMessage(senderPhone, "Processing your image... ⏳");
        
        // 1. Download from Meta and Upload to Cloudinary
        const optimizedImageUrl = await processWhatsAppImage(messageData.mediaId);
        
        // 2. Assemble the final product object (matching your web schema)
        const newProduct = {
          ...tempData,
          images: [optimizedImageUrl], 
          sellerPhone: senderPhone,
          sellerId: senderPhone, // Using phone as ID for native WhatsApp users
          category: "general", // Default category
          condition: "used",   // Default condition
          stock: 1,
          description: "Listed via Kabale Online WhatsApp",
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        };

        // 3. Save to Firebase Products Collection
        const savedProductRef = await adminDb.collection("products").add(newProduct);
        
        // 4. Update the document with its own ID (if your web schema requires it)
        await savedProductRef.update({ publicId: savedProductRef.id });

        // 5. Clear the bot session
        await sessionRef.delete();
        
        // 6. Send the Success Celebration!
        const successText = `🎉 *Success!*\n\nYour *${newProduct.title}* is now live on Kabale Online!\n\nLink: https://kabaleonline.com/product/${savedProductRef.id}`;
        await sendWhatsAppMessage(senderPhone, successText);
        
        return true;

      // --- FAILSAFE ---
      default:
        await sessionRef.delete();
        await sendWhatsAppMessage(senderPhone, "Your session expired or hit an error. Please type /add to start over.");
        return true;
    }
  } catch (error) {
    console.error("Bot Flow Error:", error);
    await sessionRef.delete(); // Clear corrupted session
    await sendWhatsAppMessage(senderPhone, "Oops, something went wrong while saving your product. Please type /add to try again.");
    return true;
  }
}
