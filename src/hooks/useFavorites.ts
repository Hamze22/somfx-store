import { useState, useEffect } from 'react';
import { collection, doc, setDoc, deleteDoc, onSnapshot, query } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';

export function useFavorites() {
  const { currentUser } = useAuth();
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) {
      setFavorites([]);
      setLoading(false);
      return;
    }

    const favsRef = collection(db, 'users', currentUser.id, 'favorites');
    const q = query(favsRef);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const favIds = snapshot.docs.map(doc => doc.id);
      setFavorites(favIds);
      setLoading(false);
    }, (error) => {
      console.error("Error listening to favorites:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const toggleFavorite = async (productId: string) => {
    if (!currentUser) return;

    const favDocRef = doc(db, 'users', currentUser.id, 'favorites', productId);
    
    if (favorites.includes(productId)) {
      try {
        await deleteDoc(favDocRef);
      } catch (err) {
        console.error("Error removing favorite:", err);
      }
    } else {
      try {
        await setDoc(favDocRef, {
          productId,
          addedAt: new Date().toISOString()
        });
      } catch (err) {
        console.error("Error adding favorite:", err);
      }
    }
  };

  const isFavorite = (productId: string) => favorites.includes(productId);

  return { favorites, toggleFavorite, isFavorite, loading };
}
