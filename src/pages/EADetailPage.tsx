import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { ChevronLeft, Star, TrendingUp, BarChart, Shield, Download, Lock, Heart } from 'lucide-react';
import { PaymentModal } from '../components/shared/PaymentModal';
import { EA, Indicator } from '../types/store';
import { getDriveDirectLink, getYoutubeId, cn } from '../lib/utils';
import { useFavorites } from '../hooks/useFavorites';

export function EADetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { currentUser } = useAuth();
  const [selectedItem, setSelectedItem] = useState<{ id: string, name: string, price: number, type: string } | null>(null);
  const { toggleFavorite, isFavorite } = useFavorites();

  const { data: ea, isLoading } = useQuery({
    queryKey: ['ea', id],
    queryFn: async () => {
      if (!id) return null;
      const docRef = doc(db, 'products', id);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) return null;
      return { id: docSnap.id, ...docSnap.data() } as EA;
    }
  });

  if (isLoading) return <div className="text-center py-20 text-muted-foreground">Loading assets...</div>;
  if (!ea) return <div className="text-center py-20 text-muted-foreground">Asset not found.</div>;

  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-7xl mx-auto px-6 py-10 pb-24">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-foreground/70 hover:text-primary transition-all text-[0.65rem] font-black mb-10 uppercase tracking-[0.2em] group"
        >
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> {t("store.back")}
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Left Column: Visuals */}
          <div className="lg:col-span-7 space-y-6">
             {ea.videoUrl && getYoutubeId(ea.videoUrl) ? (
               <div className="aspect-video bg-black border border-border rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.1)] relative group">
                 <iframe 
                   width="100%" 
                   height="100%" 
                   src={`https://www.youtube.com/embed/${getYoutubeId(ea.videoUrl)}`} 
                   title="YouTube video player" 
                   frameBorder="0" 
                   allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                   allowFullScreen
                   className="absolute inset-0"
                 ></iframe>
               </div>
             ) : (
               <div className="aspect-video bg-secondary/30 border border-border rounded-3xl flex items-center justify-center overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.05)] relative group">
                  {(ea as any).profileEmoji?.startsWith('http') ? (
                    <img 
                      src={getDriveDirectLink((ea as any).profileEmoji)} 
                      alt="" 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/600x400?text=Image+Not+Found';
                      }}
                    />
                  ) : (
                    <span className="text-9xl animate-in zoom-in-75">{(ea as any).profileEmoji || '⚡'}</span>
                  )}
               </div>
             )}
             
              <div className="grid grid-cols-3 gap-4">
                {(ea as any).emojis?.map((img: string, i: number) => (
                  <div key={i} className="aspect-video bg-secondary/20 border border-border rounded-2xl overflow-hidden flex items-center justify-center transition-all cursor-pointer hover:border-primary/50 group">
                     {img?.startsWith('http') ? (
                       <img 
                         src={getDriveDirectLink(img)} 
                         alt="" 
                         className="w-full h-full object-cover transition-transform group-hover:scale-110" 
                         referrerPolicy="no-referrer"
                         onError={(e) => {
                           (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150?text=Gallery+Err';
                         }}
                       />
                     ) : (
                       <span className="text-4xl group-hover:scale-110 transition-transform">{img || '📸'}</span>
                     )}
                  </div>
                ))}
             </div>
          </div>

          {/* Right Column: Details */}
          <div className="lg:col-span-5">
             <div className="flex items-center gap-2 mb-4">
                <span className="text-[0.6rem] font-black px-3 py-1 bg-primary/10 text-primary border border-primary/20 rounded-full uppercase tracking-widest">
                  {ea.category}
                </span>
                {ea.badge && (
                  <span className="text-[0.6rem] font-black px-3 py-1 bg-destructive text-white rounded-full uppercase tracking-widest shadow-lg shadow-destructive/20 animate-pulse">
                    {ea.badge}
                  </span>
                )}
                {ea.version && (
                  <span className="text-[0.6rem] font-black px-3 py-1 bg-black text-white rounded-full uppercase tracking-widest border border-border/20">
                    {ea.version.toUpperCase()}
                  </span>
                )}
             </div>
             
             <div className="flex items-center justify-between gap-4 mb-4">
               <h1 className="text-4xl md:text-5xl font-black text-black italic uppercase tracking-tighter leading-none flex-1">
                 {ea.name}
               </h1>
               <button 
                 onClick={() => toggleFavorite(ea.id)}
                 className={cn(
                   "p-4 rounded-2xl border transition-all active:scale-95",
                   isFavorite(ea.id) ? "bg-primary border-primary text-black" : "bg-card border-border text-muted-foreground hover:border-primary/40"
                 )}
               >
                 <Heart className={cn("w-6 h-6", isFavorite(ea.id) && "fill-black")} />
               </button>
             </div>
             
             <div className="flex items-center gap-1.5 text-primary text-xs mb-8">
                <Star className="w-4 h-4 fill-primary" />
                <Star className="w-4 h-4 fill-primary" />
                <Star className="w-4 h-4 fill-primary" />
                <Star className="w-4 h-4 fill-primary" />
                <Star className="w-4 h-4 fill-primary" />
                <span className="ml-3 text-muted-foreground font-black uppercase tracking-widest text-[0.6rem] opacity-60">({ea.reviews || 0} {t("store.verifiedReviews")})</span>
                {ea.downloads && (
                  <span className="ml-3 px-2 py-0.5 bg-secondary/50 rounded-md text-muted-foreground font-black uppercase tracking-widest text-[0.6rem] opacity-60">
                    {ea.downloads} {t("store.downloads")}
                  </span>
                )}
             </div>

             <div className="bg-secondary/10 border border-border p-6 rounded-3xl mb-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5">
                  <Shield className="w-20 h-20 text-black" />
                </div>
                <h4 className="text-[0.65rem] font-black uppercase tracking-[0.2em] text-primary mb-3">Product Description</h4>
                <p className="text-sm text-foreground/90 leading-relaxed font-semibold">
                  {ea.description}
                </p>
             </div>

              {ea.type !== 'course' && (
                <div className="grid grid-cols-3 gap-4 mb-10">
                  <div className="bg-white border border-border p-5 rounded-2xl text-center shadow-sm">
                      <div className="text-xl font-black text-primary">+{ea.profit}%</div>
                      <div className="text-[0.5rem] font-black text-muted-foreground uppercase tracking-widest mt-1">ROI Est.</div>
                  </div>
                  <div className="bg-white border border-border p-5 rounded-2xl text-center shadow-sm">
                      <div className="text-xl font-black text-primary">{ea.winrate}%</div>
                      <div className="text-[0.5rem] font-black text-muted-foreground uppercase tracking-widest mt-1">Accuracy</div>
                  </div>
                  <div className="bg-white border border-border p-5 rounded-2xl text-center shadow-sm">
                      <div className="text-xl font-black text-destructive">{ea.drawdown}%</div>
                      <div className="text-[0.5rem] font-black text-muted-foreground uppercase tracking-widest mt-1">Risk LVL</div>
                  </div>
                </div>
              )}

             <div className="bg-black text-white p-8 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-6 shadow-2xl shadow-black/20 group">
                <div className="text-center sm:text-left">
                   <div className="text-[0.6rem] font-black text-white/50 uppercase tracking-[0.3em] mb-2 group-hover:text-primary transition-colors">{t("store.digitalDelivery")}</div>
                   <div className="text-5xl font-black text-white tracking-tighter group-hover:scale-105 transition-transform origin-left">${ea.price}</div>
                </div>
                <button 
                  onClick={() => currentUser ? setSelectedItem({ id: ea.id, name: ea.name, price: ea.price, type: ea.type || 'ea' }) : navigate('/login')}
                  className="w-full sm:w-auto bg-primary text-black px-12 py-5 rounded-2xl text-sm font-black uppercase tracking-[0.1em] hover:scale-105 hover:shadow-[0_0_40px_rgba(245,197,24,0.4)] active:scale-95 transition-all"
                >
                  {t("store.buyNow")}
                </button>
             </div>
          </div>
        </div>

        <div className="mt-20 border-t border-border pt-16">
           <div className="flex items-center gap-3 mb-10">
              <div className="w-1.5 h-1.5 rounded-full bg-primary" />
              <h3 className="text-sm font-black uppercase tracking-[0.2em] italic text-black">{t("store.technicalSpecs")}</h3>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="space-y-4">
                 {[
                   { icon: <TrendingUp className="w-4 h-4" />, label: 'Market Correlation', val: ea.pairs || 'Major / Minor Crosses' },
                   { icon: <BarChart className="w-4 h-4" />, label: 'Temporal Resolution', val: 'M15, H1, H4, D1' },
                   { icon: <Shield className="w-4 h-4" />, label: 'Risk Architecture', val: 'Dynamic SL/TP / Breakeven' }
                 ].map((item, i) => (
                   <div key={i} className="flex items-center justify-between p-5 bg-secondary/10 border border-border/50 rounded-2xl text-sm transition-all hover:bg-secondary/20 group">
                      <div className="flex items-center gap-4 text-foreground/80 font-black uppercase text-[0.65rem] tracking-widest group-hover:text-foreground">
                         <span className="text-primary">{item.icon}</span> {item.label}
                      </div>
                      <div className="font-extrabold text-black">{item.val}</div>
                   </div>
                 ))}
              </div>
              
              <div className="p-8 bg-secondary/5 border border-border rounded-3xl relative overflow-hidden">
                 <div className="absolute -bottom-4 -right-4 opacity-5">
                    <Download className="w-32 h-32 text-black" />
                 </div>
                 <h4 className="text-[0.7rem] font-black uppercase tracking-[0.2em] text-primary mb-6 flex items-center gap-2">
                   <Lock className="w-4 h-4" /> Licensing Framework
                 </h4>
                 <ul className="space-y-4 text-[0.7rem] text-muted-foreground/80 leading-relaxed font-bold uppercase tracking-wider">
                    <li className="flex gap-3"><span className="text-primary">•</span> UNLIMITED ACCESS ON DEMO TERMINALS</li>
                    <li className="flex gap-3"><span className="text-primary">•</span> DUAL-LICENSE REAL MT4/MT5 BUNDLE</li>
                    <li className="flex gap-3"><span className="text-primary">•</span> PROPRIETARY FIRM COMPLIANT ALGORITHM</li>
                    <li className="flex gap-3"><span className="text-primary">•</span> LIFETIME CLOUD-DRIVE UPDATES INCLUDED</li>
                 </ul>
              </div>
           </div>
        </div>

        {selectedItem && (
          <PaymentModal item={selectedItem} onClose={() => setSelectedItem(null)} />
        )}
      </div>
    </div>
  );
}
