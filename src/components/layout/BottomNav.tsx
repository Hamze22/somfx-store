import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { cn } from '../../lib/utils';
import { Store, Radio, MessageSquare, UserCircle, Heart } from 'lucide-react';

export function BottomNav() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { currentUser } = useAuth();
  const { t } = useLanguage();

  const navItems = [
    { label: t("nav.store"), icon: <Store className="w-5 h-5" />, path: "/" },
    { label: t("nav.indicators"), icon: <Radio className="w-5 h-5" />, path: "/indicators" },
    { label: t("nav.saved"), icon: <Heart className="w-5 h-5" />, path: "/saved", auth: true },
    { label: t("nav.profile"), icon: <UserCircle className="w-5 h-5" />, path: "/profile", auth: true },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[400] h-16 bg-background/98 backdrop-blur-xl border-t border-border flex items-stretch md:hidden pb-[env(safe-area-inset-bottom)] shadow-[0_-2px_10px_rgba(0,0,0,0.3)]">
      {navItems.map((item) => {
        const isActive = pathname === item.path || (item.path === '/profile' && pathname === '/login');
        return (
          <button 
            key={item.path}
            onClick={() => {
              if (item.auth && !currentUser) {
                navigate("/login");
              } else {
                navigate(item.path);
              }
            }}
            className={cn(
              "flex-1 flex flex-col items-center justify-center gap-1 transition-all",
              isActive ? "text-primary" : "text-muted-foreground"
            )}
          >
            <span className={cn("leading-none", isActive && "drop-shadow-[0_0_8px_rgba(245,197,24,0.4)]")}>
              {item.icon}
            </span>
            <span className="text-[0.6rem] font-bold tracking-wider uppercase">
              {item.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
