"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { signInWithPopup, signOut as firebaseSignOut, onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase/config";
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

  // --- NEW: Helper to update the store's lastActiveAt timestamp ---
  const updateStoreActivity = async (userId: string, role: string) => {
    // Only ping the database if the user is actually a vendor
    if (role === "vendor") {
      try {
        await fetch("/api/vendor/activity", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ vendorId: userId })
        });
      } catch (error) {
        console.error("Failed to update vendor activity status:", error);
      }
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        try {
          const token = await firebaseUser.getIdToken();

          // Sync with the backend (your existing secure logic)
          const res = await fetch("/api/auth/sync", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (res.ok) {
            const data = await res.json();
            const syncedUser = data.user as User;
            setUser(syncedUser);
            
            // --- NEW: Trigger the activity ping! ---
            updateStoreActivity(syncedUser.id, syncedUser.role);

          } else {
            const errData = await res.json();
            console.error("Backend sync failed:", errData);
            alert(`Server Error during login: ${errData.error || 'Check Vercel logs'}`);
            setUser(null);
          }
        } catch (error) {
          console.error("Auth Error:", error);
          alert("Network error while communicating with the server.");
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
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
