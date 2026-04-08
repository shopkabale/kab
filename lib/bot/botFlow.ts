import { adminDb } from "@/lib/firebase/admin";
import * as admin from "firebase-admin";
import { sendWhatsAppMessage, sendWhatsAppListMenu } from "@/lib/whatsapp";
import algoliasearch from "algoliasearch";

// ==========================================
// INITIALIZE ALGOLIA 
// ==========================================
const searchClient = algoliasearch(
  process.env.NEXT_PUBLIC_ALGOLIA_APP_ID || "",
  process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_KEY || ""
);
const index = searchClient.initIndex(process.env.NEXT_PUBLIC_ALGOLIA_INDEX_NAME || "products");

// ==========================================
// STATE MACHINE: THE SEARCH ENGINE
// ==========================================
export async function processBotFlow(senderPhone: string, messageData: { type: string, text?: string }): Promise<boolean> {
  const sessionRef = adminDb.collection("bot_sessions").doc(senderPhone);
  const sessionDoc = await sessionRef.get();

  // ------------------------------------------
  // 1. TRIGGER: THE SEARCH ENGINE (/search)
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
  // 2. CHECK FOR ACTIVE SESSION
  // ------------------------------------------
  if (!sessionDoc.exists) return false; 

  const session = sessionDoc.data()!;
  const { step } = session;

  // ------------------------------------------
  // 3. PROCESS THE CURRENT STEP
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

        await sessionRef.delete(); 
        const searchTerm = messageData.text.trim();
        await sendWhatsAppMessage(senderPhone, `🔍 Searching Kabale Online for "*${searchTerm}*"...`);

        try {
          const { hits } = await index.search(searchTerm, { hitsPerPage: 10 });

          if (hits.length === 0) {
            await sendWhatsAppMessage(
              senderPhone, 
              `We couldn't find any items matching "*${searchTerm}*". 😔\n\nTry searching for something else, or visit https://kabaleonline.com to browse everything.`
            );
            return true;
          }

          const rows = hits.map((hit: any) => ({
            id: `item_${hit.objectID}`, 
            title: hit.name.substring(0, 24), 
            description: `UGX ${Number(hit.price).toLocaleString()} - ${hit.category.replace('_', ' ')}`.substring(0, 72)
          }));

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
      // FAILSAFE
      // ==========================================
      default:
        await sessionRef.delete();
        return false;
    }
  } catch (error) {
    console.error("Bot Flow Error:", error);
    await sessionRef.delete(); 
    await sendWhatsAppMessage(senderPhone, "Oops, something went wrong. Please type 'MENU' to try again.");
    return true;
  }
}
