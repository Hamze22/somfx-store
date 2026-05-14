import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useFavorites } from '../hooks/useFavorites';
import { useNavigate } from 'react-router-dom';
import { Heart, ArrowRight, ShieldCheck, Download, Play, ShoppingCart } from 'lucide-react';
import { cn, getDriveDirectLink } from '../lib/utils';

export function SavedPage() {
  const { currentUser } = useAuth();
  const { t } = useLanguage();
  const { favorites, toggleFavorite, isFavorite } = useFavorites();
  const navigate = useNavigate();

  const { data: favoriteProducts = [], isLoading } = useQuery({
    queryKey: ['favorite-products-full', favorites],
    queryFn: async () => {
      if (favorites.length === 0) return [];
      const q = query(collection(db, 'products'), where('__name__', 'in', favorites));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
    },
    enabled: favorites.length > 0
  });

  if (!currentUser) return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
       <Heart className="w-16 h-16 text-muted-foreground mb-4 opacity-20" />
       <h2 className="text-xl font-black uppercase tracking-tight italic mb-2">Log in to save products</h2>
       <p className="text-sm text-muted-foreground max-w-xs mb-8">Create an account to bookmark your favorite expert advisors and indicators.</p>
       <button onClick={() => navigate("/login")} className="bg-primary text-black px-8 py-3 rounded-xl font-black uppercase tracking-widest text-xs">Sign In</button>
    </div>
  );

  return (
    <div className="pb-24 max-w-4xl mx-auto px-6 pt-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black italic uppercase tracking-tighter text-foreground mb-1">
            {t("nav.saved") || "Saved Products"}
          </h1>
          <p className="text-xs text-muted-foreground font-black uppercase tracking-widest opacity-60">
            {favorites.length} {favorites.length === 1 ? 'Product' : 'Products'} Bookmarked
          </p>
        </div>
        <div className="bg-primary/10 p-3 rounded-2xl border border-primary/20">
          <Heart className="w-6 h-6 text-primary fill-primary" />
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map(i => <div key={i} className="aspect-[16/10] bg-card border border-border rounded-xl animate-pulse" />)}
        </div>
      ) : favoriteProducts.length === 0 ? (
        <div className="text-center py-32 bg-card border border-dashed border-border rounded-2xl">
          <Heart className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" />
          <p className="text-muted-foreground text-sm font-medium mb-6">You haven't saved any products yet.</p>
          <button 
            onClick={() => navigate("/")}
            className="inline-flex items-center gap-2 bg-secondary text-primary border border-primary/30 px-6 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest hover:bg-primary/5 transition-all"
          >
            Explore Store <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {favoriteProducts.map((p: any) => (
            <div key={p.id} className="bg-card border border-border rounded-xl overflow-hidden group hover:border-primary/40 transition-all flex flex-col">
               <div className="aspect-[16/10] bg-secondary relative flex items-center justify-center p-6 shrink-0">
                  {p.profileEmoji?.startsWith('http') ? (
                    <img 
                      src={getDriveDirectLink(p.profileEmoji)} 
                      alt="" 
                      className="w-full h-full object-cover group-hover:scale-105 transition-all" 
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="text-6xl group-hover:scale-110 transition-all">{p.profileEmoji || '⚡'}</div>
                  )}
                  <button 
                    onClick={() => toggleFavorite(p.id)}
                    className="absolute top-3 right-3 p-2 bg-primary text-black rounded-full shadow-lg transition-all active:scale-90"
                  >
                    <Heart className="w-4 h-4 fill-black" />
                  </button>
                  <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded border border-white/10 text-[0.55rem] font-bold text-white uppercase">
                    {p.type}
                  </div>
               </div>
               
               <div className="p-5 flex-1 flex flex-col">
                  <h3 className="text-base font-black uppercase italic tracking-tight mb-2 truncate">{p.name}</h3>
                  <p className="text-[0.65rem] text-muted-foreground line-clamp-2 mb-4 font-medium flex-1">{p.description}</p>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-border/40">
                     <div className="text-xl font-black text-foreground">${p.price}</div>
                     <button 
                       onClick={() => navigate(p.type === 'indicator' ? `/indicators` : `/`)}
                       className="bg-primary text-black px-4 py-2 rounded-lg text-[0.65rem] font-black uppercase tracking-widest hover:shadow-lg transition-all flex items-center gap-2"
                     >
                        View Product <ShoppingCart className="w-3.5 h-3.5" />
                     </button>
                  </div>
               </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
