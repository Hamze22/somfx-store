import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

export type Language = 'en' | 'so' | 'ar';

export const translations = {
  "nav.eas": { en: "EAs", so: "EAs", ar: "EAs" },
  "nav.indicators": { en: "Indicators", so: "Indicators", ar: "المؤشرات" },
  "nav.charts": { en: "Live Charts", so: "Live Charts", ar: "الرسوم البيانية" },
  "nav.login": { en: "Login", so: "Gal", ar: "تسجيل الدخول" },
  "nav.register": { en: "Register", so: "Isdiiwaangeli", ar: "التسجيل" },
  "nav.logout": { en: "Logout", so: "Bax", ar: "تسجيل الخروج" },
  "nav.store": { en: "Store", so: "Store", ar: "المتجر" },
  "nav.profile": { en: "Profile", so: "Profile", ar: "الملف الشخصي" },
  "nav.saved": { en: "Saved", so: "Kaydsan", ar: "المحفوظة" },
  "nav.contact": { en: "Contact", so: "Xiriir", ar: "اتصل بنا" },
  "store.liveBadge": { en: "🟢 LIVE · 20+ EAs READY", so: "🟢 LIVE · 20+ EAs DIYAAR AH", ar: "🟢 مباشر · +20 مستشار خبير جاهز" },
  "store.heroDesc": { en: "Professional Expert Advisors & Trading Tools for MetaTrader 4 & 5.", so: "Expert Advisors xirfadleh oo MetaTrader 4 & 5 ah.", ar: "مستشارون خبراء وأدوات تداول احترافية لـ MetaTrader 4 و 5." },
  "store.browseEAs": { en: "Browse EAs →", so: "Eeg EAs →", ar: "تصفح EAs ←" },
  "store.socialMedia": { en: "Social Media", so: "Baraha Bulshada", ar: "وسائل التواصل" },
  "store.support": { en: "24/7 Support", so: "Taageero 24/7", ar: "دعم 24/7" },
  "store.traders": { en: "Active Traders", so: "Ganacsatada Firfircoon", ar: "المتداولون النشطون" },
  "store.easCount": { en: "Expert Advisors", so: "Expert Advisors", ar: "المستشارون الخبراء" },
  "store.indicatorsCount": { en: "Indicators", so: "Tilmaamayaasha", ar: "المؤشرات" },
  "store.searchEAs": { en: "Search Expert Advisors...", so: "Raadi Expert Advisors...", ar: "ابحث عن مستشار خبير..." },
  "store.all": { en: "All", so: "Dhammaan", ar: "الكل" },
  "store.found": { en: "found", so: "la helay", ar: "وُجد" },
  "store.noResults": { en: "No results found", so: "Wax lama helin", ar: "لم يتم العثور على نتائج" },
  "store.buy": { en: "Buy Now", so: "Iibso Hadda", ar: "اشتري الآن" },
  "store.loginFirst": { en: "Please login first!", so: "Fadlan marka hore gal!", ar: "يرجى تسجيل الدخول أولاً!" },
  "store.tradingRisk": { en: "© 2025 SomFX Store — Trading involves risk.", so: "© 2025 SomFX Store — Ganacsigu khatarta wuu leeyahay.", ar: "© 2025 SomFX Store — التداول ينطوي على مخاطر." },
  "login.welcome": { en: "Welcome Back", so: "Ku soo dhawoow", ar: "مرحباً بعودتك" },
  "login.subtitle": { en: "Login to your SomFX Store account", so: "Gal akoonkaaga SomFX Store", ar: "سجّل الدخول إلى حسابك في SomFX Store" },
  "login.email": { en: "Email", so: "Email", ar: "البريد الإلكتروني" },
  "login.password": { en: "Password", so: "Password", ar: "كلمة المرور" },
  "login.submit": { en: "Login →", so: "Gal →", ar: "← تسجيل الدخول" },
  "login.noAccount": { en: "Don't have an account?", so: "Akoon ma lihid?", ar: "ليس لديك حساب؟" },
  "store.back": { en: "Back to Catalog", so: "Ku Laabo Buugga", ar: "العودة إلى الكتالوج" },
  "store.activeCatalog": { en: "Active Catalog", so: "Catalog-ka Firfircoon", ar: "الكتالوج النشط" },
  "store.technicalSpecs": { en: "Technical Specifications", so: "Faahfaahinta Farsamada", ar: "المواصفات الفنية" },
  "store.buyNow": { en: "Buy Now", so: "Iibso Hadda", ar: "اشتري الآن" },
  "store.verifiedReviews": { en: "Verified Reviews", so: "Faallooyinka La Hubiyay", ar: "مراجعات موثقة" },
  "store.digitalDelivery": { en: "Instant Digital Delivery", so: "Gaarsiin Digital Oo Degdeg Ah", ar: "تسليم رقمي فوري" },
  "indicators.desc": { en: "Premium Pine Script indicators for TradingView. 100% repainting-free signals.", so: "Pine Script indicators oo qaali ah TradingView. 100% repainting la'aan ah.", ar: "مؤشرات Pine Script متميزة لـ TradingView. إشارات خالية من إعادة الرسم بنسبة 100%." },
  "indicators.free": { en: "Free", so: "Bilaash", ar: "مجاني" },
  "indicators.getFree": { en: "Get Free", so: "Hadda Qaado", ar: "احصل مجاناً" },
  "login.registerHere": { en: "Register here", so: "Halkan isdiiwaangeli", ar: "سجّل هنا" },
  "contact.title": { en: "Contact Us", so: "Nala soo xiriir", ar: "اتصل بنا" },
  "contact.subtitle": { en: "We're here to help you succeed in trading.", so: "Waxaan diyaar u nahay inaan kaa caawino guusha ganacsigaaga.", ar: "نحن هنا لمساعدتك على النجاح في التداول." },
  "contact.telegram": { en: "Official Telegram", so: "Telegram-ka Rasmiga ah", ar: "تيليجرام الرسمي" },
  "contact.whatsapp": { en: "Direct WhatsApp", so: "WhatsApp Toos ah", ar: "واتساب مباشر" },
  "contact.email": { en: "Email Support", so: "Taageerada Email-ka", ar: "دعم البريد الإلكتروني" },
  "contact.back": { en: "Back to Home", so: "Ku laabo Hoyga", ar: "العودة إلى الرئيسية" },
  "store.downloads": { en: "Downloads", so: "Downloads", ar: "التحميلات" },
  "store.version": { en: "Version", so: "Version", ar: "الإصدار" },
  "store.compatibility": { en: "Compatibility", so: "Compatibility", ar: "التوافق" },
  "payment.evcZaad": { en: "EVC Plus / ZAAD", so: "EVC Plus / ZAAD", ar: "EVC Plus / ZAAD" },
  "payment.edahab": { en: "e-Dahab", so: "e-Dahab", ar: "e-Dahab" },
};

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: keyof typeof translations) => string;
  dir: 'ltr' | 'rtl';
}

const LanguageContext = createContext<LanguageContextType | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>(() => (localStorage.getItem('somfx-lang') as Language) || 'en');

  const setLang = useCallback((newLang: Language) => {
    setLangState(newLang);
    localStorage.setItem('somfx-lang', newLang);
  }, []);

  const t = useCallback((key: keyof typeof translations) => {
    return translations[key]?.[lang] || key;
  }, [lang]);

  const dir = lang === 'ar' ? 'rtl' : 'ltr';

  useEffect(() => {
    document.documentElement.dir = dir;
    document.documentElement.lang = lang;
  }, [dir, lang]);

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, dir }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
};
