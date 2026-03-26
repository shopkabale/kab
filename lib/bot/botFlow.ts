import { adminDb } from "@/lib/firebase/admin";
import * as admin from "firebase-admin";
import { sendWhatsAppMessage, sendWhatsAppListMenu } from "@/lib/whatsapp";
import { processWhatsAppImage } from "./media"; 
import algoliasearch from "algoliasearch";

// ==========================================
// INITIALIZE ALGOLIA (Backend Safe)
// ==========================================
const searchClient = algoliasearch(
  process.env.NEXT_PUBLIC_ALGOLIA_APP_ID || "",
  process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_KEY || ""
);
const index = searchClient.initIndex(process.env.NEXT_PUBLIC_ALGOLIA_INDEX_NAME || "products");

// ==========================================
// STATE MACHINE: THE STORE BUILDER & SEARCH
// ==========================================
export async function processBotFlow(senderPhone: string, messageData: { type: string, text?: string, mediaId?: string }): Promise<boolean> {
  const sessionRef = adminDb.collection("bot_sessions").doc(senderPhone);
  const sessionDoc = await sessionRef.get();
  
  // ------------------------------------------
  // 1. TRIGGER: THE STORE BUILDER (/add)
  // ------------------------------------------
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
    return true; 
  }

  // ------------------------------------------
  // 2. TRIGGER: THE SEARCH ENGINE (/search)
  // ------------------------------------------
  if (messageData.type === "text" && messageData.text === "/search") {
    await sessionRef.set({ 
      step: "WAITING_FOR_SEARCH_TERM", 
      updatedAt: admin.firestore.FieldValue.serverTimestamp() 
    });
    
    await sendWhatsAppMessage(senderPhone, "🔍 What are you looking for? Type a keyword (e.g. 'Laptop', 'Shoes', 'Cable').");
    return true; 
  }

  // ------------------------------------------
  // 3. CHECK FOR ACTIVE SESSION
  // ------------------------------------------
  if (!sessionDoc.exists) return false; 

  const session = sessionDoc.data()!;
  const { step, tempData } = session;

  // ------------------------------------------
  // 4. PROCESS THE CURRENT STEP
  // ------------------------------------------
  try {
    switch (step) {
      
      // ==========================================
      // FLOW: SEARCHING ALGOLIA
      // ==========================================
      case "WAITING_FOR_SEARCH_TERM":
        if (messageData.type !== "text" || !messageData.text) {
          await sendWhatsAppMessage(senderPhone, "Please type a word to search for.");
          return true;
        }
        
        await sessionRef.delete(); // Clear the search session
        const searchTerm = messageData.text.trim();
        await sendWhatsAppMessage(senderPhone, `🔍 Searching Kabale Online for "*${searchTerm}*"...`);

        try {
          // Hit the Algolia Index
          const { hits } = await index.search(searchTerm, { hitsPerPage: 10 });

          if (hits.length === 0) {
            await sendWhatsAppMessage(
              senderPhone, 
              `We couldn't find any items matching "*${searchTerm}*". 😔\n\nTry searching for something else, or visit https://kabaleonline.com to browse everything.`
            );
            return true;
          }

          // Format Algolia hits into a WhatsApp List Menu
          const rows = hits.map((hit: any) => ({
            id: `item_${hit.objectID}`, 
            title: hit.name.substring(0, 24), // Meta limit: 24 chars
            description: `UGX ${Number(hit.price).toLocaleString()} - ${hit.category.replace('_', ' ')}`.substring(0, 72)
          }));

          // Send the Native Popup Menu
          await sendWhatsAppListMenu(
            senderPhone,
            `Found ${hits.length} result(s) for "*${searchTerm}*":\n\nTap the button below to view them!`,
            "View Results",
            [{ title: "Search Results", rows: rows }]
          );
        } catch (error) {
          console.error("Algolia Search Error in Bot:", error);
          await sendWhatsAppMessage(senderPhone, "Oops! Our search engine is taking a quick nap. Please try again in a moment.");
        }
        return true;

      // ==========================================
      // FLOW: SELLING AN ITEM
      // ==========================================
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

      case "WAITING_FOR_PRICE":
        if (messageData.type !== "text" || !messageData.text) {
          await sendWhatsAppMessage(senderPhone, "Please reply with the price.");
          return true;
        }

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
          `Price saved at *UGX ${Number(rawPrice).toLocaleString()}*.\n\n📸 Finally, please send a *Photo* of the product using the attachment icon.`
        );
        return true;

      case "WAITING_FOR_IMAGE":
        if (messageData.type !== "image" || !messageData.mediaId) {
          await sendWhatsAppMessage(senderPhone, "Please use the attachment icon 📎 to upload a photo of the product.");
          return true;
        }
        
        await sendWhatsAppMessage(senderPhone, "Processing your image... ⏳");
        
        // Process Media & Save to DB
        const optimizedImageUrl = await processWhatsAppImage(messageData.mediaId);
        
        const newProduct = {
          ...tempData,
          images: [optimizedImageUrl], 
          sellerPhone: senderPhone,
          sellerId: senderPhone, 
          category: "electronics", // Defaulting to electronics for quick upload
          condition: "used",
          stock: 1,
          description: "Listed via Kabale Online WhatsApp",
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        };

        const savedProductRef = await adminDb.collection("products").add(newProduct);
        await savedProductRef.update({ publicId: savedProductRef.id });

        await sessionRef.delete(); // Clear session
        
        const successText = `🎉 *Success!*\n\nYour *${newProduct.title}* is now live on Kabale Online!\n\nLink: https://kabaleonline.com/product/${savedProductRef.id}`;
        await sendWhatsAppMessage(senderPhone, successText);
        
        return true;

      // ==========================================
      // FAILSAFE
      // ==========================================
      default:
        await sessionRef.delete();
        await sendWhatsAppMessage(senderPhone, "Your session expired or hit an error. Please type 'menu' to start over.");
        return true;
    }
  } catch (error) {
    console.error("Bot Flow Error:", error);
    await sessionRef.delete(); 
    await sendWhatsAppMessage(senderPhone, "Oops, something went wrong. Please type 'menu' to try again.");
    return true;
  }
}
