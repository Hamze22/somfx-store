import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { Sun, Moon, Globe, ChevronDown, User, Zap, Search } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { cn } from '../../lib/utils';
import { SearchPrompt } from './SearchPrompt';

export function Header() {
  const { currentUser, logout } = useAuth();
  const { lang, setLang, t } = useLanguage();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [isLangOpen, setIsLangOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);
  
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem('somfx-theme') === 'dark';
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.setAttribute('data-theme', 'dark');
      document.documentElement.classList.remove('light');
      localStorage.setItem('somfx-theme', 'dark');
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
      document.documentElement.classList.add('light');
      localStorage.setItem('somfx-theme', 'light');
    }
  }, [isDark]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setIsLangOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  const languages = [
    { code: 'en', label: 'English', flag: '🇬🇧' },
    { code: 'so', label: 'Soomaali', flag: '🇸🇴' },
    { code: 'ar', label: 'العربية', flag: '🇸🇦' }
  ] as const;

  const currentLang = languages.find(l => l.code === lang);

  const navItems = [
    { label: t("nav.eas"), path: "/" },
    { label: t("nav.indicators"), path: "/indicators" },
    { label: t("nav.charts"), path: "/charts" },
    { label: t("nav.saved"), path: "/saved" }
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-[400] h-[62px] bg-background/97 backdrop-blur-xl border-b border-border flex items-center justify-between px-5 md:px-10 shadow-sm">
      <div className="flex items-center gap-4">
        <div 
          className="text-lg font-extrabold tracking-tight cursor-pointer bg-gradient-to-r from-primary via-gold-dark to-success bg-clip-text text-transparent italic shrink-0"
          onClick={() => navigate("/")}
        >
          ⚡ SomFX Store
        </div>
        <div className="hidden sm:block">
          <SearchPrompt />
        </div>
      </div>

      <div className="hidden md:flex items-center gap-1">
        {navItems.map(item => (
          <button
            key={item.path}
            onClick={() => {
              navigate(item.path);
            }}
            className={cn(
              "px-4 py-2 rounded-md text-sm font-medium transition-all",
              pathname === item.path 
                ? "text-primary bg-primary/10" 
                : "text-muted-foreground hover:text-primary hover:bg-primary/5"
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <button 
          onClick={toggleTheme}
          className="w-8 h-8 rounded-full bg-secondary border border-border flex items-center justify-center text-sm hover:border-primary/40 transition-all"
        >
          {isDark ? '☀️' : '🌙'}
        </button>

        <div className="relative" ref={langRef}>
          <button 
            onClick={() => setIsLangOpen(!isLangOpen)}
            className="flex items-center gap-1.5 bg-card border border-border px-2.5 py-1.5 rounded-md text-xs font-medium text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all"
          >
            <span className="text-sm leading-none">{currentLang?.flag}</span>
            <span className="hidden sm:inline">{currentLang?.label}</span>
            <ChevronDown className={cn("w-3 h-3 transition-transform", isLangOpen && "rotate-180")} />
          </button>

          {isLangOpen && (
            <div className="absolute top-full mt-1 right-0 bg-card border border-border rounded-md shadow-xl overflow-hidden z-[500] min-w-[140px]">
              {languages.map(l => (
                <button
                  key={l.code}
                  onClick={() => { setLang(l.code); setIsLangOpen(false); }}
                  className={cn(
                    "w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm transition-all",
                    lang === l.code 
                      ? "bg-primary/10 text-primary font-semibold" 
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <span className="text-base leading-none">{l.flag}</span>
                  <span>{l.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {currentUser ? (
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate("/profile")}
              className="w-9 h-9 rounded-full bg-secondary border-2 border-border flex items-center justify-center text-sm font-bold text-primary hover:border-primary transition-all overflow-hidden"
            >
              {currentUser.avatar_url ? (
                <img src={currentUser.avatar_url} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                currentUser.name.charAt(0).toUpperCase()
              )}
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button 
              onClick={() => navigate("/login")}
              className="bg-transparent text-muted-foreground border border-border px-3 sm:px-4 py-1.5 rounded-md text-[0.65rem] sm:text-xs font-medium hover:text-foreground hover:border-primary/30 transition-all"
            >
              {t("nav.login")}
            </button>
            <button 
              onClick={() => navigate("/register")}
              className="hidden sm:block bg-gradient-to-r from-primary to-gold-dark text-black px-4 py-1.5 rounded-md text-xs font-bold hover:shadow-[0_4px_16px_rgba(245,197,24,0.4)] transition-all"
            >
              {t("nav.register")}
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
