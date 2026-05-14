import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, ArrowRight, CirclePlay, Send, MessageSquare, Heart } from 'lucide-react';
import { PaymentModal } from '../components/shared/PaymentModal';
import { cn, getDriveDirectLink } from '../lib/utils';
import { EA } from '../types/store';
import { useFavorites } from '../hooks/useFavorites';

export function StorePage() {
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedItem, setSelectedItem] = useState<{ id: string, name: string, price: number, type: string } | null>(null);
  const { currentUser } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { toggleFavorite, isFavorite } = useFavorites();

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products', 'active'],
    queryFn: async () => {
      const q = query(
        collection(db, 'products'), 
        where('status', '==', 'active'),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
    }
  });

  const filteredProducts = useMemo(() => {
    let result = products;
    if (category !== 'all') {
      result = result.filter(ea => ea.category === category);
    }
    // Only show EAs in the Store Page
    result = result.filter(p => p.type === 'ea');
    
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(ea => ea.name.toLowerCase().includes(q) || ea.description.toLowerCase().includes(q));
    }
    return result;
  }, [category, search, products]);

  const categories = [
    { key: 'all', label: t("store.all") },
    { key: 'scalping', label: 'Scalping' },
    { key: 'trend', label: 'Trend' },
    { key: 'grid', label: 'Grid' },
    { key: 'gold', label: 'Gold/XAU' },
    { key: 'news', label: 'News' }
  ];

  const handleBuy = (ea: EA) => {
    if (!currentUser) {
      navigate("/login");
      return;
    }
    setSelectedItem({ id: ea.id, name: ea.name, price: ea.price, type: 'ea' });
  };

  return (
    <div className="pb-20">
      {/* Hero */}
      <section className="text-center pt-10 pb-4 px-6 max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 bg-success/5 border border-success/20 text-success font-mono text-[0.6rem] px-3 py-1 rounded-full tracking-widest mb-6 animate-pulse">
          {t("store.liveBadge")}
        </div>
        <h1 className="text-4xl md:text-6xl font-black tracking-tighter mb-4 bg-gradient-to-r from-foreground via-primary to-gold-dark bg-clip-text text-transparent italic uppercase">
          SomFX Store
        </h1>
        <p className="text-xs md:text-sm text-foreground/90 mb-4 max-w-sm mx-auto leading-relaxed font-semibold">
          {t("store.heroDesc")}
        </p>
      </section>

      {/* Social & Stats Section */}
      <section className="pt-4 pb-12 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <span className="text-[0.6rem] font-black tracking-[0.4em] text-muted-foreground uppercase opacity-60 mb-6 block">
            {t("store.socialMedia")}
          </span>
          <div className="flex justify-center gap-4 mb-16">
            <a href="https://t.me/SomaliEAbots" target="_blank" rel="noreferrer" className="flex items-center gap-3 px-6 py-2.5 bg-white border border-border rounded-2xl hover:border-[#2AABEE] hover:shadow-[0_0_20px_rgba(42,171,238,0.15)] transition-all group scale-100 hover:scale-105 active:scale-95">
              <Send className="w-4 h-4 text-[#2AABEE] group-hover:scale-110 transition-transform" />
              <span className="font-black text-[0.7rem] tracking-widest uppercase text-foreground/80 group-hover:text-foreground">Telegram</span>
            </a>
            <a href="https://wa.me/252634789972" target="_blank" rel="noreferrer" className="flex items-center gap-3 px-6 py-2.5 bg-white border border-border rounded-2xl hover:border-[#25D366] hover:shadow-[0_0_20px_rgba(37,211,102,0.15)] transition-all group scale-100 hover:scale-105 active:scale-95">
              <MessageSquare className="w-4 h-4 text-[#25D366] group-hover:scale-110 transition-transform" />
              <span className="font-black text-[0.7rem] tracking-widest uppercase text-foreground/80 group-hover:text-foreground">WhatsApp</span>
            </a>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-y-8 md:gap-x-4 max-w-5xl mx-auto">
            <div className="flex-1 min-w-[120px] flex flex-col items-center">
              <div className="text-2xl md:text-3xl font-black text-primary mb-1">80</div>
              <div className="text-[0.55rem] md:text-[0.6rem] font-black text-muted-foreground uppercase tracking-[0.2em] opacity-70">{t("store.easCount")}</div>
            </div>
            <div className="flex-1 min-w-[120px] flex flex-col items-center">
              <div className="text-2xl md:text-3xl font-black text-primary mb-1">15</div>
              <div className="text-[0.55rem] md:text-[0.6rem] font-black text-muted-foreground uppercase tracking-[0.2em] opacity-70">{t("store.indicatorsCount")}</div>
            </div>
            <div className="flex-1 min-w-[120px] flex flex-col items-center">
              <div className="text-2xl md:text-3xl font-black text-primary mb-1">1290</div>
              <div className="text-[0.55rem] md:text-[0.6rem] font-black text-muted-foreground uppercase tracking-[0.2em] opacity-70">{t("store.traders")}</div>
            </div>
            <div className="flex-1 min-w-[120px] flex flex-col items-center">
              <div className="text-2xl md:text-3xl font-black text-success mb-1">24/7</div>
              <div className="text-[0.55rem] md:text-[0.6rem] font-black text-muted-foreground uppercase tracking-[0.2em] opacity-70">{t("store.support")}</div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Grid */}
      <div id="grid" className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder={t("store.searchEAs")} 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-card border border-border rounded-lg py-3 px-4 pl-10 text-sm outline-none focus:border-primary transition-all font-medium"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar shrink-0">
            {categories.map(cat => (
              <button
                key={cat.key}
                onClick={() => setCategory(cat.key)}
                className={cn(
                  "px-4 py-1.5 rounded-full text-[0.7rem] font-black uppercase tracking-widest whitespace-nowrap border transition-all",
                  category === cat.key ? "bg-primary/10 border-primary text-primary" : "bg-card border-border text-muted-foreground hover:border-primary/40"
                )}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-6 flex items-center gap-2">
          <div className="w-1 h-1 rounded-full bg-primary" />
          <span className="text-xs font-black uppercase tracking-widest text-foreground">
            {t("store.activeCatalog")} <span className="text-muted-foreground font-mono font-medium ml-1">({filteredProducts.length} {t("store.found")})</span>
          </span>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="aspect-[4/5] bg-card border border-border rounded-xl animate-pulse" />
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-20 bg-card rounded-xl border border-dashed border-border">
            <p className="text-muted-foreground text-sm font-medium">{t("store.noResults")}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProducts.map(ea => (
              <div key={ea.id} className="bg-card border border-border rounded-xl overflow-hidden hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 transition-all group">
                <div 
                  className="aspect-[16/10] bg-secondary relative overflow-hidden cursor-pointer flex items-center justify-center p-8"
                  onClick={() => navigate(`/ea/${ea.id}`)}
                >
                  {ea.profileEmoji?.startsWith('http') ? (
                    <img 
                      src={getDriveDirectLink(ea.profileEmoji)} 
                      alt={ea.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                      referrerPolicy="no-referrer" 
                      onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x250?text=Image+Err'; }}
                    />
                  ) : (
                    <div className="text-7xl group-hover:scale-110 transition-transform duration-500">{ea.profileEmoji || '⚡'}</div>
                  )}
                  <div className="absolute top-3 left-3 flex gap-1.5">
                    <div className="px-2 py-0.5 bg-primary/20 backdrop-blur-md rounded font-mono text-[0.5rem] font-black text-primary uppercase tracking-widest border border-primary/20">
                      {ea.type}
                    </div>
                    {ea.version && (
                      <div className="px-2 py-0.5 bg-white/20 backdrop-blur-md rounded font-mono text-[0.5rem] font-black text-white uppercase tracking-widest border border-white/20">
                        {ea.version}
                      </div>
                    )}
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); toggleFavorite(ea.id); }}
                    className={cn(
                      "absolute top-3 right-3 p-2 rounded-full backdrop-blur-md transition-all active:scale-90",
                      isFavorite(ea.id) ? "bg-primary text-black" : "bg-black/20 text-white hover:bg-black/40"
                    )}
                  >
                    <Heart className={cn("w-4 h-4", isFavorite(ea.id) && "fill-black")} />
                  </button>
                </div>

                <div className="p-5">
                  <div className="flex justify-between items-start mb-2">
                    <h3 
                      className="text-base font-black uppercase tracking-tight italic cursor-pointer hover:text-primary transition-colors"
                      onClick={() => navigate(`/ea/${ea.id}`)}
                    >
                      {ea.name}
                    </h3>
                  </div>
                  <p className="text-[0.7rem] text-foreground/80 leading-relaxed mb-5 line-clamp-2 font-semibold">
                    {ea.description}
                  </p>

                  <div className="grid grid-cols-3 gap-3 mb-6">
                    <div className="text-center">
                      <div className="text-xs font-black text-success">+{ea.profit}%</div>
                      <div className="text-[0.55rem] text-muted-foreground uppercase tracking-widest">Return</div>
                    </div>
                    <div className="text-center border-x border-border/40">
                      <div className="text-xs font-black text-info">{ea.winrate}%</div>
                      <div className="text-[0.55rem] text-muted-foreground uppercase tracking-widest">Win Rate</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs font-black text-destructive">{ea.drawdown}%</div>
                      <div className="text-[0.55rem] text-muted-foreground uppercase tracking-widest">Drawdown</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-border/30">
                    <div className="flex flex-col">
                      <div className="text-xl font-black text-foreground">${ea.price}</div>
                      {ea.downloads && (
                        <div className="text-[0.6rem] font-black text-muted-foreground uppercase tracking-widest opacity-60">
                          {ea.downloads} {t("store.downloads")}
                        </div>
                      )}
                    </div>
                    <button 
                      onClick={() => handleBuy(ea)}
                      className="bg-primary text-black px-5 py-2 rounded-lg text-[0.65rem] font-black uppercase tracking-widest hover:shadow-lg hover:shadow-primary/20 transition-all active:scale-95"
                    >
                      {t("store.buy")}
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
