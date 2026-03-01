import * as admin from "firebase-admin";

if (!admin.apps.length) {
  try {
    const base64ServiceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
    
    if (!base64ServiceAccount) {
      throw new Error("FIREBASE_SERVICE_ACCOUNT environment variable is missing.");
    }

    // Decode the Base64 string back into a standard JSON string
    const decodedServiceAccount = Buffer.from(base64ServiceAccount, 'base64').toString('utf-8');
    
    // Parse the decoded string into a JSON object
    const serviceAccount = JSON.parse(decodedServiceAccount);
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } catch (error) {
    console.error("Firebase Admin Initialization Error:", error);
  }
}

export const adminDb = admin.firestore();
export const adminAuth = admin.auth();