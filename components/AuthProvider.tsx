"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { signInWithPopup, signOut as firebaseSignOut, onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore"; 
import { auth, googleProvider, db } from "@/lib/firebase/config"; 
import { User } from "@/types";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeSnapshot: () => void;

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        try {
          // 1. Trigger backend sync to ensure database integrity
          firebaseUser.getIdToken().then((token) => {
             fetch("/api/auth/sync", {
              method: "POST",
              headers: { Authorization: `Bearer ${token}` },
            }).catch(console.error);
          });

          // 2. Real-time Firestore Listener
          unsubscribeSnapshot = onSnapshot(doc(db, "users", firebaseUser.uid), (docSnap) => {
            const firestoreData = docSnap.exists() ? docSnap.data() : {};
            
            // 🚀 THE FIX: We explicitly provide role and createdAt defaults so TypeScript passes the build
            setUser({
              id: firebaseUser.uid,
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName,
              photoURL: firebaseUser.photoURL,
              role: firestoreData.role || "user", 
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

  const signIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Sign-in failed:", error);
    }
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
