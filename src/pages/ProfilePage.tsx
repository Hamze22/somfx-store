import React, { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { LogOut, User, ShieldCheck, Clock, Download, Play, Settings, Heart, ArrowRight } from 'lucide-react';
import { cn } from '../lib/utils';
import { useLanguage } from '../context/LanguageContext';
import { useFavorites } from '../hooks/useFavorites';

export function ProfilePage() {
  const { currentUser, logout, loading } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { favorites } = useFavorites();

  const { data: favoriteProducts = [] } = useQuery({
    queryKey: ['favorite-products', favorites],
    queryFn: async () => {
      if (favorites.length === 0) return [];
      const q = query(collection(db, 'products'), where('__name__', 'in', favorites));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
    },
    enabled: favorites.length > 0
  });

  const { data: myOrders = [] } = useQuery({
    queryKey: ['orders', currentUser?.id],
    queryFn: async () => {
      const q = query(
        collection(db, 'orders'), 
        where('userId', '==', currentUser?.id),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const orders = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
      
      // Fetch product details for each completed order to get download URLs
      const ordersWithProducts = await Promise.all(orders.map(async (order) => {
        if (order.status === 'completed' && order.productId) {
          const productDoc = await getDocs(query(collection(db, 'products'), where('__name__', '==', order.productId)));
          if (!productDoc.empty) {
            const productData = productDoc.docs[0].data();
            return { ...order, productDetail: productData };
          }
        }
        return order;
      }));
      
      return ordersWithProducts;
    },
    enabled: !!currentUser
  });

  useEffect(() => {
    if (!loading && !currentUser) {
      navigate("/login");
    }
  }, [currentUser, loading, navigate]);

  if (loading) return <div className="text-center py-20 text-muted-foreground">Loading...</div>;
  if (!currentUser) return null;

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 pb-24">
      <div className="bg-card border border-border rounded-xl p-8 mb-8 flex flex-col md:flex-row items-center gap-8 shadow-xl">
         <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-gold-dark flex items-center justify-center text-4xl font-black text-black">
            {currentUser.name.charAt(0).toUpperCase()}
         </div>
         <div className="text-center md:text-left flex-1">
            <h2 className="text-2xl font-black text-foreground uppercase italic tracking-tighter mb-1">{currentUser.name}</h2>
            <p className="text-sm text-muted-foreground mb-4">{currentUser.email}</p>
            <div className="flex flex-wrap justify-center md:justify-start gap-2">
               <span className="bg-success/10 text-success border border-success/20 px-3 py-1 rounded-full text-[0.65rem] font-black uppercase tracking-widest">
                  Member since {currentUser.joined}
               </span>
               <span className="bg-primary/10 text-primary border border-primary/20 px-3 py-1 rounded-full text-[0.65rem] font-black uppercase tracking-widest">
                  {currentUser.role}
               </span>
            </div>
         </div>
         <div className="flex flex-col gap-2 w-full md:w-auto">
            {currentUser.role === 'admin' && (
              <button 
                onClick={() => navigate("/admin")}
                className="bg-secondary text-primary border border-primary/30 px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest hover:bg-primary/5 transition-all"
              >
                <Settings className="w-4 h-4 inline mr-2" /> Admin Panel
              </button>
            )}
            <button 
              onClick={async () => { await logout(); navigate("/"); }}
              className="bg-destructive/10 text-destructive border border-destructive/20 px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest hover:bg-destructive/20 transition-all flex items-center justify-center gap-2"
            >
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck className="w-5 h-5 text-primary" />
            <h3 className="text-sm font-black uppercase tracking-widest italic">Inventory & Access</h3>
          </div>
          
          <div className="space-y-3">
            {myOrders.filter((p: any) => p.status === 'completed').map((p: any) => (
              <div key={p.id} className="bg-card border border-border rounded-xl p-5 hover:border-primary/20 transition-all shadow-lg">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="text-base font-black uppercase tracking-tight italic text-foreground">{p.productName}</h4>
                    <span className="text-[0.6rem] font-bold text-muted-foreground uppercase opacity-70">
                       License ID: {p.id.slice(0,8).toUpperCase()}
                    </span>
                  </div>
                  <div className="bg-success text-black px-2.5 py-1 rounded text-[0.6rem] font-black uppercase tracking-widest">
                    ACTIVE
                  </div>
                </div>
                
                <div className="flex gap-2">
                   {(p.productDetail?.fileUrl || p.productDetail?.file_url) && (
                     <a 
                       href={p.productDetail.fileUrl || p.productDetail.file_url} 
                       target="_blank" 
                       rel="noopener noreferrer"
                       className="flex-1 bg-secondary border border-border py-2.5 rounded-lg text-[0.65rem] font-black uppercase tracking-widest hover:bg-muted transition-all flex items-center justify-center gap-2"
                     >
                        <Download className="w-3.5 h-3.5" /> Download
                     </a>
                   )}
                   {(p.productDetail?.videoUrl || p.productDetail?.video_url) && (
                     <button 
                       onClick={() => window.open(p.productDetail.videoUrl || p.productDetail.video_url, '_blank')}
                       className="flex-1 bg-primary text-black py-2.5 rounded-lg text-[0.65rem] font-black uppercase tracking-widest hover:shadow-lg transition-all flex items-center justify-center gap-2"
                     >
                        <Play className="w-3.5 h-3.5" /> View
                     </button>
                   )}
                </div>
              </div>
            ))}
            
            {myOrders.filter((p: any) => p.status === 'completed').length === 0 && (
              <div className="bg-card border border-dashed border-border rounded-xl py-12 text-center">
                 <p className="text-muted-foreground text-xs font-medium">No active licenses found in your catalog.</p>
                 <button onClick={() => navigate("/")} className="mt-4 text-primary text-[0.65rem] font-black uppercase tracking-widest underline">Browse Store</button>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
           <div className="flex items-center gap-2 mb-2">
            <Heart className="w-5 h-5 text-primary" />
            <h3 className="text-sm font-black uppercase tracking-widest italic">Saved Products</h3>
          </div>
          
          <div className="space-y-3">
             {favoriteProducts.map((p: any) => (
                <div 
                  key={p.id} 
                  onClick={() => navigate(p.type === 'indicator' ? `/indicators` : `/`)}
                  className="bg-card border border-border p-4 rounded-xl hover:border-primary/40 transition-all cursor-pointer group"
                >
                   <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-black uppercase italic tracking-tight text-foreground truncate group-hover:text-primary transition-colors">
                        {p.name}
                      </span>
                      <ArrowRight className="w-3 h-3 text-muted-foreground group-hover:text-primary transition-all translate-x-0 group-hover:translate-x-1" />
                   </div>
                   <div className="flex items-center gap-2">
                      <span className="text-[0.6rem] font-bold text-muted-foreground uppercase opacity-70">
                         {p.type}
                      </span>
                      <span className="text-[0.6rem] font-black text-primary">
                         ${p.price}
                      </span>
                   </div>
                </div>
             ))}
             
             {favoriteProducts.length === 0 && (
               <div className="bg-secondary/20 border border-dashed border-border rounded-xl py-6 text-center">
                  <p className="text-[0.65rem] text-muted-foreground">No saved products.</p>
               </div>
             )}
          </div>

           <div className="flex items-center gap-2 mb-2 pt-4">
            <Clock className="w-5 h-5 text-muted-foreground" />
            <h3 className="text-sm font-black uppercase tracking-widest italic">Order History</h3>
          </div>
          
          <div className="space-y-3">
             {myOrders.map((p: any) => (
               <div key={p.id} className="bg-secondary/40 border border-border p-4 rounded-xl">
                  <div className="flex justify-between text-xs font-bold mb-1 uppercase tracking-tight text-foreground">
                    <span>{p.productName}</span>
                    <span className="text-primary">${p.amount}</span>
                  </div>
                  <div className="flex justify-between items-center text-[0.6rem] text-muted-foreground">
                    <span>{new Date(p.createdAt).toLocaleDateString()}</span>
                    <span className={cn(
                      "font-black uppercase",
                      p.status === 'completed' ? 'text-success' : p.status === 'failed' ? 'text-destructive' : 'text-primary'
                    )}>
                      {p.status}
                    </span>
                  </div>
               </div>
             ))}
             
             {myOrders.length === 0 && (
               <p className="text-center py-6 text-[0.65rem] text-muted-foreground">No recent orders.</p>
             )}
          </div>
        </div>
      </div>
    </div>
  );
}
