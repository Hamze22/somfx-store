import React, { useEffect, useRef, useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { cn } from '../lib/utils';
import { BarChart3 } from 'lucide-react';

declare global {
  interface Window {
    TradingView: any;
  }
}

export function ChartsPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [symbol, setSymbol] = useState('FOREXCOM:EURUSD');
  const [isTvLoaded, setIsTvLoaded] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/tv.js';
    script.async = true;
    script.onload = () => setIsTvLoaded(true);
    document.head.appendChild(script);
    return () => {
      document.head.removeChild(script);
    };
  }, []);

  useEffect(() => {
    if (isTvLoaded && containerRef.current && window.TradingView) {
      containerRef.current.innerHTML = '';
      const currentTheme = localStorage.getItem('somfx-theme') === 'dark' ? 'dark' : 'light';
      new window.TradingView.widget({
        autosize: true,
        symbol: symbol,
        interval: 'D',
        timezone: 'Etc/UTC',
        theme: currentTheme,
        style: '1',
        locale: 'en',
        toolbar_bg: '#f1f3f6',
        enable_publishing: false,
        hide_side_toolbar: false,
        allow_symbol_change: true,
        container_id: containerRef.current.id,
        studies: [
          'RSI@tv-basicstudies',
          'MASimple@tv-basicstudies'
        ],
      });
    }
  }, [isTvLoaded, symbol]);

  const marketGroups = [
    { label: 'EUR/USD', sym: 'FOREXCOM:EURUSD' },
    { label: 'GBP/USD', sym: 'FOREXCOM:GBPUSD' },
    { label: 'XAU/USD', sym: 'OANDA:XAUUSD' },
    { label: 'BTC/USD', sym: 'BINANCE:BTCUSDT' },
    { label: 'NDX', sym: 'CAPITALCOM:US100' },
  ];

  return (
    <div className="pb-20">
      <section className="text-center py-10 px-6 max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 bg-info/10 border border-info/20 text-info font-mono text-[0.6rem] px-3 py-1 rounded-full tracking-widest mb-6">
          📊 TRADINGVIEW ANALYTICS
        </div>
        <h1 className="text-3xl md:text-5xl font-black tracking-tighter mb-4 bg-gradient-to-r from-foreground to-info bg-clip-text text-transparent italic uppercase">
          Market Intelligence
        </h1>
        <p className="text-xs text-muted-foreground mb-8 max-w-sm mx-auto leading-relaxed">
          Real-time global market analysis with professional technical indicators.
        </p>
      </section>

      <div className="max-w-7xl mx-auto px-6">
        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-2xl">
          <div className="p-3 border-b border-border/40 flex items-center justify-between flex-wrap gap-3">
             <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-primary" />
                <span className="text-[0.7rem] font-black uppercase tracking-widest text-muted-foreground">Market Feed</span>
             </div>
             <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                {marketGroups.map(m => (
                  <button
                    key={m.sym}
                    onClick={() => setSymbol(m.sym)}
                    className={cn(
                      "px-3 py-1.5 rounded text-[0.65rem] font-bold border transition-all whitespace-nowrap",
                      symbol === m.sym ? "bg-primary/10 border-primary text-primary" : "bg-secondary border-border text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {m.label}
                  </button>
                ))}
             </div>
          </div>
          <div id="tradingview_widget" ref={containerRef} className="h-[500px] w-full bg-black/20" />
        </div>
      </div>
    </div>
  );
}
