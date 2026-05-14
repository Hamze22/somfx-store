import { motion } from 'motion/react';

interface TickerItem {
  pair: string;
  val: string;
  pct: string;
  up: boolean;
}

const tickerData: TickerItem[] = [
  { pair: "EUR/USD", val: "1.0842", pct: "+0.12%", up: true },
  { pair: "GBP/USD", val: "1.2634", pct: "-0.08%", up: false },
  { pair: "USD/JPY", val: "151.42", pct: "+0.22%", up: true },
  { pair: "AUD/USD", val: "0.6521", pct: "-0.15%", up: false },
  { pair: "XAU/USD", val: "2348.60", pct: "+0.31%", up: true },
  { pair: "BTC/USD", val: "67,240", pct: "+1.2%", up: true },
];

export function Ticker() {
  const fullData = [...tickerData, ...tickerData];
  
  return (
    <div className="bg-black/55 border-b border-border/30 py-1.5 overflow-hidden mt-[62px]">
      <div className="flex gap-12 animate-ticker whitespace-nowrap">
        {fullData.map((item, idx) => (
          <span key={idx} className="font-mono text-[0.68rem] inline-flex items-center gap-2">
            <span className="text-muted-foreground">{item.pair}</span>
            <span className={item.up ? "text-success" : "text-destructive"}>
              {item.up ? "▲" : "▼"} {item.val} {item.pct}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
