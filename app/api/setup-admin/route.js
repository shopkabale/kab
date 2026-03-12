import admin from 'firebase-admin';
import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');
  const uid = searchParams.get('uid');

  // 1. Security Check
  if (secret !== process.env.SETUP_SECRET) {
    return NextResponse.json({ error: 'Unauthorized access.' }, { status: 401 });
  }

  if (!uid) {
    return NextResponse.json({ error: 'Please provide a User UID.' }, { status: 400 });
  }

  // 2. Initialize Firebase Admin safely INSIDE the request
  if (!admin.apps.length) {
    try {
      if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
        return NextResponse.json({ 
          error: "The FIREBASE_SERVICE_ACCOUNT environment variable is missing in Vercel." 
        }, { status: 500 });
      }
      
      // DECODE THE BASE64 STRING HERE
      const base64String = process.env.FIREBASE_SERVICE_ACCOUNT;
      const decodedJsonString = Buffer.from(base64String, 'base64').toString('utf-8');
      
      // Parse the decoded string into a JSON object
      const serviceAccount = JSON.parse(decodedJsonString);
      
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      
    } catch (error) {
      return NextResponse.json({ 
        error: "Failed to decode or parse the Base64 Firebase Service Account.", 
        details: error.message 
      }, { status: 500 });
    }
  }

  // 3. Grant the custom claim
  try {
    await admin.auth().setCustomUserClaims(uid, { admin: true });
    
    await admin.firestore().collection('users').doc(uid).set(
      { role: 'admin' }, 
      { merge: true }
    );

    return NextResponse.json({ 
      success: true, 
      message: `Success! User ${uid} is now an admin.` 
    });
    
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
