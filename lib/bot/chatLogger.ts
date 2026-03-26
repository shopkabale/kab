import { adminDb } from "@/lib/firebase/admin";
import * as admin from "firebase-admin";

export async function logChat(
  phone: string, 
  direction: "incoming" | "outgoing", 
  messageType: string, 
  content: string
) {
  try {
    const cleanPhone = phone.replace(/\D/g, '');
    const chatRef = adminDb.collection("chats").doc(cleanPhone);
    
    // 1. Save the specific message
    await chatRef.collection("messages").add({
      direction,
      type: messageType,
      content,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    // 2. Update the parent document for easy sorting in an admin dashboard
    await chatRef.set({
      phoneNumber: cleanPhone,
      lastMessage: content.substring(0, 50),
      lastActivity: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

  } catch (error) {
    console.error("🔥 Error saving chat to Firestore:", error);
  }
}
