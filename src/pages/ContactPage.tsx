import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { MessageSquare, Send, Mail, ChevronLeft, ArrowRight } from 'lucide-react';

export function ContactPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const contactMethods = [
    {
      id: 'telegram',
      title: t('contact.telegram'),
      value: '@SomaliEAbots',
      link: 'https://t.me/SomaliEAbots',
      icon: <Send className="w-6 h-6 text-[#2AABEE]" />,
      color: 'hover:border-[#2AABEE] hover:shadow-[0_0_30px_rgba(42,171,238,0.15)]',
      bg: 'bg-[#2AABEE]/5'
    },
    {
      id: 'whatsapp',
      title: t('contact.whatsapp'),
      value: '+252 63 478 9972',
      link: 'https://wa.me/252634789972',
      icon: <MessageSquare className="w-6 h-6 text-[#25D366]" />,
      color: 'hover:border-[#25D366] hover:shadow-[0_0_30px_rgba(37,211,102,0.15)]',
      bg: 'bg-[#25D366]/5'
    },
    {
      id: 'email',
      title: t('contact.email'),
      value: 'somfxstore@gmail.com',
      link: 'mailto:somfxstore@gmail.com',
      icon: <Mail className="w-6 h-6 text-primary" />,
      color: 'hover:border-primary/40 hover:shadow-[0_0_30px_rgba(245,197,24,0.15)]',
      bg: 'bg-primary/5'
    }
  ];

  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-4xl mx-auto px-6 py-12 pb-24">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-foreground/70 hover:text-primary transition-all text-[0.65rem] font-black mb-12 uppercase tracking-[0.2em] group"
        >
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> {t("contact.back")}
        </button>

        <section className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-black text-black italic uppercase tracking-tighter mb-4 leading-none">
            {t('contact.title')}
          </h1>
          <p className="text-sm md:text-base text-foreground/60 max-w-md mx-auto leading-relaxed font-bold">
            {t('contact.subtitle')}
          </p>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-1 gap-6 max-w-2xl mx-auto">
          {contactMethods.map((method) => (
            <a 
              key={method.id}
              href={method.link}
              target="_blank"
              rel="noreferrer"
              className={`flex items-center justify-between p-8 bg-white border border-border rounded-3xl transition-all group ${method.color}`}
            >
              <div className="flex items-center gap-6">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 ${method.bg}`}>
                  {method.icon}
                </div>
                <div>
                  <h3 className="text-[0.6rem] font-black uppercase tracking-[0.2em] text-muted-foreground mb-1">
                    {method.title}
                  </h3>
                  <p className="text-lg font-black text-black tracking-tight italic uppercase">
                    {method.value}
                  </p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-border group-hover:text-primary transition-colors group-hover:translate-x-1" />
            </a>
          ))}
        </div>

        <div className="mt-20 p-8 bg-secondary/10 border border-border rounded-[2.5rem] text-center">
           <p className="text-[0.6rem] font-black text-muted-foreground uppercase tracking-[0.3em] mb-4">Trading Support Hours</p>
           <p className="text-sm font-black text-black italic uppercase tracking-tight">Monday - Saturday: 8:00 AM - 10:00 PM (EAT)</p>
        </div>
      </div>
    </div>
  );
}
