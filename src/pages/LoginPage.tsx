import React, { useState } from 'react';
import { auth } from '../lib/firebase';
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { useLanguage } from '../context/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, LogIn, Chrome } from 'lucide-react';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { t } = useLanguage();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError(t("login.fillAll"));
      return;
    }
    setLoading(true);
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/");
    } catch (err) {
      setError(t("login.invalid"));
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (loading) return;
    const provider = new GoogleAuthProvider();
    setLoading(true);
    try {
      await signInWithPopup(auth, provider);
      navigate("/");
    } catch (err: any) {
      if (err.code === 'auth/cancelled-popup-request' || err.code === 'auth/popup-closed-by-user') {
        // Safe to ignore or just stop loading
      } else {
        console.error(err);
        setError("Sign in failed. Please try again.");
      }
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-120px)] px-6 py-10">
      <div className="bg-card border border-border rounded-xl p-8 w-full max-w-[420px] shadow-2xl">
        <h2 className="text-2xl font-black text-primary mb-1 text-center tracking-tighter uppercase italic">{t("login.welcome")}</h2>
        <p className="text-xs text-muted-foreground text-center mb-8">{t("login.subtitle")}</p>

        {error && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-lg p-3 mb-6 text-[0.7rem] font-bold text-center">
            {error}
          </div>
        )}

        <button 
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-3 bg-white border border-border text-black py-3 rounded-lg text-xs font-bold hover:bg-gray-50 transition-all mb-6 shadow-sm"
        >
          <img 
            src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
            alt="Google" 
            className="w-4 h-4"
            referrerPolicy="no-referrer"
          /> 
          Continue with Google
        </button>

        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 h-px bg-border" />
          <span className="text-[0.6rem] text-muted-foreground uppercase font-black">Or email</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-[0.65rem] text-muted-foreground uppercase font-black mb-1.5 ml-1">{t("login.email")}</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
              <input 
                type="email" 
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="trader@somfx.com"
                className="w-full bg-background border border-border text-sm py-3 px-4 pl-10 rounded-lg outline-none focus:border-primary transition-all font-medium"
              />
            </div>
          </div>
          <div>
            <label className="block text-[0.65rem] text-muted-foreground uppercase font-black mb-1.5 ml-1">{t("login.password")}</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
              <input 
                type="password" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-background border border-border text-sm py-3 px-4 pl-10 rounded-lg outline-none focus:border-primary transition-all font-medium"
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-black py-3.5 rounded-lg text-xs font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all disabled:opacity-50 mt-4"
          >
            {loading ? 'Authenticating...' : t("login.submit")}
          </button>
        </form>

        <p className="text-center mt-8 text-xs text-muted-foreground font-medium">
          {t("login.noAccount")}{' '}
          <button onClick={() => navigate("/register")} className="text-primary hover:underline font-bold">
            {t("login.registerHere")}
          </button>
        </p>
      </div>
    </div>
  );
}
