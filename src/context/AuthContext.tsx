import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  joined: string;
  avatar_url?: string;
}

interface AuthContextType {
  currentUser: UserProfile | null;
  firebaseUser: User | null;
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubProfile: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      // Cleanup previous profile listener if any
      if (unsubProfile) {
        unsubProfile();
        unsubProfile = null;
      }

      setFirebaseUser(user);
      
      if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        
        unsubProfile = onSnapshot(userDocRef, async (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            const isAdmin = data.role === 'admin' || user.email === 'hamze.zakarie@gmail.com';
            setCurrentUser({
              id: user.uid,
              name: data.displayName || user.displayName || 'Trader',
              email: user.email || '',
              role: isAdmin ? 'admin' : 'user',
              joined: data.createdAt ? new Date(data.createdAt).toLocaleDateString() : 'Just now',
              avatar_url: data.photoURL || user.photoURL || undefined
            });
          } else {
            // Create profile if it doesn't exist
            try {
              const newProfile = {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName || 'Trader',
                photoURL: user.photoURL || '',
                role: 'user',
                createdAt: new Date().toISOString()
              };
              await setDoc(userDocRef, newProfile);
            } catch (err) {
              console.error("Error creating profile:", err);
            }
          }
          setLoading(false);
        }, (error) => {
          // Ignore permission errors on sign out (race condition)
          if (error.code !== 'permission-denied') {
            console.error("Profile listen error:", error);
          }
          setLoading(false);
        });
      } else {
        setCurrentUser(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubProfile) unsubProfile();
    };
  }, []);

  const logout = async () => {
    await signOut(auth);
    setCurrentUser(null);
  };

  return (
    <AuthContext.Provider value={{ currentUser, firebaseUser, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
