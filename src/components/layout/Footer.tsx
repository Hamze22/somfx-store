import { useLanguage } from '../../context/LanguageContext';

export function Footer() {
  const { t } = useLanguage();
  
  return (
    <footer className="bg-background/99 border-t border-border mt-20 py-12 text-center px-6">
      <div className="max-w-4xl mx-auto">
        <p className="text-[0.65rem] text-muted-foreground/80 leading-relaxed uppercase tracking-[0.2em] font-bold mb-8">
          {t("store.tradingRisk")}
        </p>
        
        <div className="h-px w-20 bg-border mx-auto mb-8" />
        
        <div className="text-[0.6rem] text-muted-foreground/40 font-black tracking-widest uppercase">
          © {new Date().getFullYear()} SOMFX GLOBAL TECHNOLOGY. ALL RIGHTS RESERVED.
        </div>
      </div>
    </footer>
  );
}
