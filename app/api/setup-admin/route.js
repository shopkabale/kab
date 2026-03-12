import admin from 'firebase-admin';
import { NextResponse } from 'next/server';

// Initialize Firebase Admin using your existing FIREBASE_SERVICE_ACCOUNT variable
if (!admin.apps.length) {
  try {
    // Parse the JSON string stored in your Vercel environment variables
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  } catch (error) {
    console.error('Error parsing FIREBASE_SERVICE_ACCOUNT JSON:', error);
  }
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');
  const uid = searchParams.get('uid');

  // 1. Security Check: Require your exact secret password
  if (secret !== process.env.SETUP_SECRET) {
    return NextResponse.json({ error: 'Unauthorized access.' }, { status: 401 });
  }

  // 2. Ensure a UID was provided
  if (!uid) {
    return NextResponse.json({ error: 'Please provide a User UID.' }, { status: 400 });
  }

  try {
    // 3. Grant the custom claim!
    await admin.auth().setCustomUserClaims(uid, { admin: true });
    
    // 4. (Optional) Sync with Firestore so your frontend role checks still work
    await admin.firestore().collection('users').doc(uid).set(
      { role: 'admin' }, 
      { merge: true }
    );

    return NextResponse.json({ 
      success: true, 
      message: `Success! User ${uid} is now an admin with custom claims.` 
    });
    
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
