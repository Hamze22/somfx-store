import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { PaymentModal } from '../components/shared/PaymentModal';
import { cn, getDriveDirectLink } from '../lib/utils';
import { Indicator } from '../types/store';
import { useFavorites } from '../hooks/useFavorites';
import { Heart } from 'lucide-react';

export function IndicatorsPage() {
  const [filter, setFilter] = useState('all');
  const [selectedItem, setSelectedItem] = useState<{ id: string, name: string, price: number, type: string } | null>(null);
  const { currentUser } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { toggleFavorite, isFavorite } = useFavorites();

  const { data: indicators = [], isLoading } = useQuery({
    queryKey: ['indicators', 'active'],
    queryFn: async () => {
      const q = query(
        collection(db, 'products'), 
        where('type', '==', 'indicator'),
        where('status', '==', 'active'),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Indicator[];
    }
  });

  const filtered = useMemo(() => {
    if (filter === 'all') return indicators;
    if (filter === 'free') return indicators.filter(i => i.price === 0);
    return indicators.filter(i => i.category === filter);
  }, [filter, indicators]);

  const categories = [
    { key: 'all', label: 'All' },
    { key: 'trend', label: 'Trend' },
    { key: 'momentum', label: 'Momentum' },
    { key: 'volume', label: 'Volume' },
    { key: 'free', label: 'Free' }
  ];

  return (
    <div className="pb-20">
      <section className="text-center py-10 px-6 max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 bg-purple/10 border border-purple/20 text-purple font-mono text-[0.6rem] px-3 py-1 rounded-full tracking-widest mb-6">
          📡 TRADINGVIEW PLUGINS
        </div>
        <h1 className="text-3xl md:text-5xl font-black tracking-tighter mb-4 bg-gradient-to-r from-foreground via-purple to-info bg-clip-text text-transparent italic uppercase">
          {t("nav.indicators")}
        </h1>
        <p className="text-xs text-foreground/90 mb-8 max-w-sm mx-auto leading-relaxed font-semibold">
          {t("indicators.desc")}
        </p>
      </section>

      <div className="max-w-7xl mx-auto px-6">
        <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar mb-6 justify-center">
          {categories.map(cat => (
            <button
              key={cat.key}
              onClick={() => setFilter(cat.key)}
              className={cn(
                "px-5 py-2 rounded-full text-[0.7rem] font-black uppercase tracking-widest whitespace-nowrap border transition-all",
                filter === cat.key ? "bg-purple/10 border-purple text-purple" : "bg-card border-border text-muted-foreground hover:border-purple/40"
              )}
            >
              {cat.key === 'all' ? t("store.all") : cat.key === 'free' ? t("indicators.free") : cat.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
             {[1,2,3].map(i => <div key={i} className="aspect-[4/5] bg-card border border-border rounded-xl animate-pulse" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(ind => (
              <div key={ind.id} className="bg-card border border-border rounded-xl overflow-hidden hover:border-purple/40 transition-all group">
                <div 
                  className="aspect-video bg-secondary relative flex items-center justify-center overflow-hidden p-8 cursor-pointer"
                  onClick={() => navigate(`/ea/${ind.id}`)}
                >
                  {(ind as any).profileEmoji?.startsWith('http') ? (
                    <img 
                      src={getDriveDirectLink((ind as any).profileEmoji)} 
                      alt="" 
                      className="w-full h-full object-cover group-hover:scale-105 transition-all" 
                      referrerPolicy="no-referrer" 
                      onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x250?text=Image+Err'; }}
                    />
                  ) : (
                    <div className="text-6xl group-hover:scale-110 transition-all">{(ind as any).profileEmoji || '📡'}</div>
                  )}
                  <div className="absolute top-3 left-3 flex gap-1.5">
                    <div className="px-2 py-0.5 bg-black/60 backdrop-blur-md rounded font-mono text-[0.55rem] font-black text-purple border border-purple/30 uppercase">
                      {ind.type}
                    </div>
                    {ind.version && (
                      <div className="px-2 py-0.5 bg-purple/20 backdrop-blur-md rounded font-mono text-[0.55rem] font-black text-white uppercase border border-white/20">
                        {ind.version}
                      </div>
                    )}
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); toggleFavorite(ind.id); }}
                    className={cn(
                      "absolute top-3 right-3 p-2 rounded-full backdrop-blur-md transition-all active:scale-90",
                      isFavorite(ind.id) ? "bg-purple text-black" : "bg-black/20 text-white hover:bg-black/40"
                    )}
                  >
                    <Heart className={cn("w-4 h-4", isFavorite(ind.id) && "fill-black")} />
                  </button>
                </div>
                <div className="p-5">
                  <h3 
                    className="text-base font-black mb-1.5 uppercase italic tracking-tight cursor-pointer hover:text-purple transition-colors"
                    onClick={() => navigate(`/ea/${ind.id}`)}
                  >
                    {ind.name}
                  </h3>
                  <p className="text-[0.65rem] text-foreground/80 line-clamp-2 mb-4 font-semibold leading-relaxed">{ind.description}</p>
                  
                  <div className="grid grid-cols-3 gap-2 mb-6 border-y border-border/20 py-3">
                    <div className="text-center">
                      <div className="text-[0.6rem] text-muted-foreground uppercase tracking-widest mb-0.5">Profit</div>
                      <div className="text-xs font-black text-success">+{ind.profit || '0'}%</div>
                    </div>
                    <div className="text-center border-x border-border/20">
                      <div className="text-[0.6rem] text-muted-foreground uppercase tracking-widest mb-0.5">Winrate</div>
                      <div className="text-xs font-black text-info">{ind.winrate || '0'}%</div>
                    </div>
                    <div className="text-center">
                      <div className="text-[0.6rem] text-muted-foreground uppercase tracking-widest mb-0.5">DD</div>
                      <div className="text-xs font-black text-destructive">{ind.drawdown || '0'}%</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-border/30">
                    <div className="flex flex-col">
                      <div className="text-lg font-black text-foreground">
                        {ind.price === 0 ? <span className="text-success tracking-widest uppercase">{t("indicators.free")}</span> : `$${ind.price}`}
                      </div>
                      {ind.downloads && (
                        <div className="text-[0.6rem] font-black text-muted-foreground uppercase tracking-widest opacity-60">
                          {ind.downloads} {t("store.downloads")}
                        </div>
                      )}
                    </div>
                    <button 
                      onClick={() => ind.price === 0 ? window.open(ind.fileUrl || ind.file_url) : (currentUser ? setSelectedItem({ id: ind.id, name: ind.name, price: ind.price, type: 'indicator' }) : navigate('/login'))}
                      className="bg-purple text-black px-5 py-2 rounded-lg text-[0.65rem] font-black uppercase tracking-widest hover:shadow-[0_4px_166px_rgba(155,111,255,0.3)] transition-all"
                    >
                      {ind.price === 0 ? t("indicators.getFree") : t("store.buy")}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedItem && (
        <PaymentModal item={selectedItem} onClose={() => setSelectedItem(null)} />
      )}
    </div>
  );
}
