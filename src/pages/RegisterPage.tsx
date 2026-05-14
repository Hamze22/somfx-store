import React, { useState } from 'react';
import { auth, db } from '../lib/firebase';
import { createUserWithEmailAndPassword, updateProfile, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useLanguage } from '../context/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, User, PlusCircle, Chrome } from 'lucide-react';

export function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { t } = useLanguage();
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setError("Please fill all fields");
      return;
    }
    setLoading(true);
    setError('');
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      await updateProfile(user, { displayName: name });
      
      // Explicitly create the profile doc
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: user.email,
        displayName: name,
        photoURL: '',
        role: 'user',
        createdAt: new Date().toISOString()
      });

      navigate("/");
    } catch (err: any) {
      setError(err.message || "Failed to create account");
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
        // Safe to ignore
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
        <h2 className="text-2xl font-black text-primary mb-1 text-center tracking-tighter uppercase italic">Create Account</h2>
        <p className="text-xs text-muted-foreground text-center mb-8">Join the elite trading community</p>

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

        <form onSubmit={handleRegister} className="space-y-4">
           <div>
            <label className="block text-[0.65rem] text-muted-foreground uppercase font-black mb-1.5 ml-1">Full Name</label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
              <input 
                type="text" 
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Ahmed Ali"
                className="w-full bg-background border border-border text-sm py-3 px-4 pl-10 rounded-lg outline-none focus:border-primary transition-all font-medium"
              />
            </div>
          </div>
          <div>
            <label className="block text-[0.65rem] text-muted-foreground uppercase font-black mb-1.5 ml-1">Email Address</label>
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
            <label className="block text-[0.65rem] text-muted-foreground uppercase font-black mb-1.5 ml-1">Secure Password</label>
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
            {loading ? 'Creating Account...' : 'Register →'}
          </button>
        </form>

        <p className="text-center mt-8 text-xs text-muted-foreground font-medium">
          Already have an account?{' '}
          <button onClick={() => navigate("/login")} className="text-primary hover:underline font-bold">
            Login here
          </button>
        </p>
      </div>
    </div>
  );
}
