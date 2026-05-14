import { useState, useEffect, useRef } from 'react';
import { Search, Sparkles, Command, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';
import { useNavigate } from 'react-router-dom';

export function SearchPrompt() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const suggestions = [
    { label: "Best MT4 EA for Gold", category: "Recommendation" },
    { label: "Scalping Indicators", category: "Tools" },
    { label: "How to use SomFX Expert?", category: "Support" },
    { label: "Prop Firm Compliant Bots", category: "Account" },
  ];

  return (
    <>
      {/* Trigger Button */}
      <button 
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary/50 border border-border hover:border-primary/50 transition-all text-muted-foreground hover:text-foreground group"
      >
        <Search className="w-4 h-4 group-hover:text-primary transition-colors" />
        <span className="text-xs hidden lg:inline-block">Search SomFX...</span>
        <div className="hidden lg:flex items-center gap-1 bg-background border border-border px-1.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-widest text-muted-foreground/60">
          <Command className="w-2.5 h-2.5" /> K
        </div>
      </button>

      {/* Modern Overlay Prompt */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[1000] flex items-start justify-center pt-[15vh] px-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-background/80 backdrop-blur-md"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              className="relative w-full max-w-xl bg-card border border-border shadow-2xl rounded-2xl overflow-hidden"
            >
              <div className="p-4 flex items-center gap-3 border-b border-border">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <Sparkles className="w-4 h-4" />
                </div>
                <input 
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Ask SomFX Assistant or search tools..."
                  className="flex-1 bg-transparent border-none outline-none text-base placeholder:text-muted-foreground/50"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && query.trim()) {
                      // Navigate or search logic
                      setIsOpen(false);
                      setQuery('');
                    }
                  }}
                />
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-md hover:bg-secondary transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-3">
                <div className="px-3 py-2 text-[10px] font-bold text-muted-foreground/50 uppercase tracking-wider">
                  Suggestions
                </div>
                <div className="space-y-1">
                  {suggestions.map((item, idx) => (
                    <button
                      key={idx}
                      className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-primary/10 hover:text-primary transition-all text-sm group"
                    >
                      <div className="flex items-center gap-3">
                        <Search className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary" />
                        <span>{item.label}</span>
                      </div>
                      <span className="text-[10px] bg-secondary px-1.5 py-0.5 rounded text-muted-foreground group-hover:bg-primary/20 group-hover:text-primary">
                        {item.category}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-secondary/30 flex items-center justify-between text-[10px] text-muted-foreground border-t border-border">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1"><kbd className="bg-background border border-border px-1 rounded">ENT</kbd> Search</span>
                  <span className="flex items-center gap-1"><kbd className="bg-background border border-border px-1 rounded">ESC</kbd> Close</span>
                </div>
                <span className="italic font-medium">Powered by SomFX AI</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
