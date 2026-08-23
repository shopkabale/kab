"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { 
  signInWithPopup, 
  signOut as firebaseSignOut, 
  onAuthStateChanged, 
  User as FirebaseUser,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail
} from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, googleProvider, db } from "@/lib/firebase/config";
import { User } from "@/types";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

// 🔥 EXPORT 1: The Provider (Vercel is looking for this)
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeSnapshot: () => void;

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {  
      if (firebaseUser) {  
        try {  
          // Trigger backend sync to ensure database integrity  
          firebaseUser.getIdToken().then((token) => {  
             fetch("/api/auth/sync", {  
              method: "POST",  
              headers: { Authorization: `Bearer ${token}` },  
            }).catch(console.error);  
          });  

          // Real-time Firestore Listener  
          unsubscribeSnapshot = onSnapshot(doc(db, "users", firebaseUser.uid), (docSnap) => {  
            const firestoreData = docSnap.exists() ? docSnap.data() : {};  

            setUser({  
              id: firebaseUser.uid,  
              uid: firebaseUser.uid,  
              email: firebaseUser.email,  
              displayName: firebaseUser.displayName,  
              photoURL: firebaseUser.photoURL,  
              role: firestoreData.role || "customer",   
              createdAt: firestoreData.createdAt || Date.now(),  
              ...firestoreData   
            } as User);  

            setLoading(false);  
          });  

        } catch (error) {  
          console.error("Auth Error:", error);  
          setUser(null);  
          setLoading(false);  
        }  
      } else {  
        setUser(null);  
        setLoading(false);  
        if (unsubscribeSnapshot) unsubscribeSnapshot();   
      }  
    });  

    return () => {  
      unsubscribeAuth();  
      if (unsubscribeSnapshot) unsubscribeSnapshot();  
    };
  }, []);

  // Login with Google
  const signInWithGoogle = async () => {
    await signInWithPopup(auth, googleProvider);
  };

  // Login with Email & Password
  const signInWithEmail = async (email: string, pass: string) => {
    await signInWithEmailAndPassword(auth, email, pass);
  };

  // Register with Email & Password
  const signUpWithEmail = async (email: string, pass: string) => {
    await createUserWithEmailAndPassword(auth, email, pass);
  };

  // Password Reset
  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  // Logout
  const signOut = async () => {
    await firebaseSignOut(auth);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      signInWithGoogle, 
      signInWithEmail, 
      signUpWithEmail, 
      resetPassword, 
      signOut 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

// 🔥 EXPORT 2: The Hook (Vercel is also looking for this)
export const useAuth = () => useContext(AuthContext);
