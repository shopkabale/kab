import * as admin from "firebase-admin";

if (!admin.apps.length) {
  try {
    const saEnv = process.env.FIREBASE_SERVICE_ACCOUNT;
    
    if (!saEnv) {
      throw new Error("FIREBASE_SERVICE_ACCOUNT environment variable is missing.");
    }

    let serviceAccount;
    
    // Auto-detect if it's a raw JSON string or Base64 encoded
    if (saEnv.trim().startsWith("{")) {
      serviceAccount = JSON.parse(saEnv);
    } else {
      const decodedServiceAccount = Buffer.from(saEnv, 'base64').toString('utf-8');
      serviceAccount = JSON.parse(decodedServiceAccount);
    }
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    
    console.log("Firebase Admin Initialized Successfully");
  } catch (error) {
    console.error("Firebase Admin Initialization Error:", error);
  }
}

export const adminDb = admin.firestore();
export const adminAuth = admin.auth();