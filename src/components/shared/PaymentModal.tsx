import React, { useState } from 'react';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { X, CreditCard, Smartphone, ShieldCheck, Ticket } from 'lucide-react';
import { cn } from '../../lib/utils';
import { toast } from 'sonner';

interface PaymentModalProps {
  item: {
    id: string;
    name: string;
    price: number;
    type: string;
  };
  onClose: () => void;
}

export function PaymentModal({ item, onClose }: PaymentModalProps) {
  const [method, setMethod] = useState<'evc' | 'sahal' | 'edahab' | 'mastercard' | 'crypto'>('evc');
  const [currency, setCurrency] = useState<'USD' | 'SLSH'>('USD');
  const [senderInfo, setSenderInfo] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [promoApplied, setPromoApplied] = useState(false);
  const [loading, setLoading] = useState(false);
  const { currentUser } = useAuth();
  const { t } = useLanguage();

  // Initialize customer name from current user
  React.useEffect(() => {
    if (currentUser?.name) {
      setCustomerName(currentUser.name);
    }
  }, [currentUser]);

  const usdtAddress = "TQkFn7TA7bWBxkJhExaeFo1qCpT4xHBqSp";
  const conversionRate = 10000;

  const finalPrice = Math.max(0, item.price - discount);
  const displayPrice = currency === 'USD' ? finalPrice : finalPrice * conversionRate;
  const currencySymbol = currency === 'USD' ? '$' : 'SLSH ';

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) return;
    try {
      const promoDoc = await getDoc(doc(db, 'promocodes', promoCode.toUpperCase()));
      if (promoDoc.exists()) {
        const data = promoDoc.data();
        let calcDiscount = 0;
        if (data.type === 'percentage') {
          calcDiscount = (item.price * data.discount) / 100;
        } else {
          calcDiscount = data.discount;
        }
        setDiscount(calcDiscount);
        setPromoApplied(true);
        alert(`Success! Discount of $${calcDiscount} applied.`);
      } else {
        alert("Invalid promo code.");
      }
    } catch (error) {
      console.error("Promo error:", error);
    }
  };

  const handleSubmit = async () => {
    if (!currentUser) return;
    const mobileMethods = ['evc', 'sahal', 'edahab'];
    if (mobileMethods.includes(method) && !senderInfo.trim()) {
      alert("Fadlan geli nambarkaaga.");
      return;
    }

    setLoading(true);
    try {
      const orderId = "order-" + Math.random().toString(36).substr(2, 9);
      
      // Step 1: Record the order in Firestore
      await setDoc(doc(db, 'orders', orderId), {
        id: orderId,
        userId: currentUser.id,
        userEmail: currentUser.email,
        userName: customerName || currentUser.name,
        productId: item.id,
        productName: item.name,
        amount: displayPrice,
        currency: currency,
        originalPrice: item.price,
        discountApplied: discount,
        promoUsed: promoApplied ? promoCode.toUpperCase() : null,
        type: item.type,
        method: method.toUpperCase(),
        phone: senderInfo,
        status: 'pending',
        createdAt: new Date().toISOString()
      });

      alert("Fariintaada waa nala soo gaadhay. Fadlan sug inta admin-ku xaqiijinayo lacag bixintaada.");
      onClose();
    } catch (error) {
      console.error("Order error:", error);
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getPaymentInstructions = () => {
    switch(method) {
      case 'evc': return { number: '0634270434', title: t("payment.evcZaad") };
      case 'edahab': return { number: '0654270434', title: t("payment.edahab") };
      case 'sahal': return { number: '0634270434', title: 'Sahal' };
      default: return null;
    }
  };

  const instructions = getPaymentInstructions();

  return (
    <div className="fixed inset-0 z-[1000] bg-black/60 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 text-black" onClick={onClose}>
      <div 
        className="bg-white border border-border rounded-3xl w-full max-w-[440px] shadow-[0_20px_50px_rgba(0,0,0,0.1)] relative overflow-hidden flex flex-col max-h-[95vh] sm:max-h-[90vh] text-black" 
        onClick={e => e.stopPropagation()}
      >
        <div className="absolute top-0 left-0 w-full h-1.5 bg-primary shrink-0" />
        
        <button onClick={onClose} className="absolute top-5 right-5 text-muted-foreground hover:text-foreground transition-colors z-20">
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 sm:p-8 overflow-y-auto custom-scrollbar">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2.5 bg-primary/10 rounded-xl border border-primary/20 shrink-0">
              <CreditCard className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-black text-black tracking-tight uppercase italic flex items-center gap-2">
                Checkout <span className="text-primary font-sans">SIFALO</span>
              </h2>
              <p className="text-[0.6rem] text-muted-foreground font-bold tracking-[0.2em] uppercase">Secure Transaction</p>
            </div>
          </div>

          <div className="bg-secondary/30 border border-border p-4 sm:p-6 rounded-2xl mb-6 flex justify-between items-center group hover:border-primary/30 transition-all shadow-sm">
            <div className="flex-1">
              <div className="text-[0.6rem] text-muted-foreground uppercase tracking-widest font-black mb-1">Item to Purchase</div>
              <div className="text-sm font-extrabold text-black mb-2 line-clamp-1">{item.name}</div>
              <div className="flex items-baseline gap-2">
                {discount > 0 && <span className="text-xs line-through text-muted-foreground opacity-50 font-mono">${item.price}</span>}
                <div className="text-3xl font-black text-primary font-mono">{currencySymbol}{displayPrice.toLocaleString()}</div>
              </div>
            </div>
            <div className="flex flex-col items-center gap-1 opacity-20 group-hover:opacity-100 transition-opacity shrink-0 ml-4">
              <ShieldCheck className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
              <span className="text-[0.4rem] sm:text-[0.5rem] font-black uppercase text-primary">Verified</span>
            </div>
          </div>

          <div className="flex items-center justify-between mb-4 bg-secondary/10 p-2 rounded-xl border border-border/50">
            <span className="text-[0.6rem] font-black text-muted-foreground uppercase tracking-widest ml-2">Select Currency:</span>
            <div className="flex p-0.5 bg-background rounded-lg border border-border shadow-sm">
              <button 
                onClick={() => setCurrency('USD')}
                className={cn(
                  "px-4 py-1.5 text-[0.6rem] font-black uppercase rounded-md transition-all",
                  currency === 'USD' ? "bg-primary text-black" : "text-muted-foreground hover:text-black"
                )}
              >
                USD
              </button>
              <button 
                onClick={() => setCurrency('SLSH')}
                className={cn(
                  "px-4 py-1.5 text-[0.6rem] font-black uppercase rounded-md transition-all",
                  currency === 'SLSH' ? "bg-primary text-black" : "text-muted-foreground hover:text-black"
                )}
              >
                SLSH
              </button>
            </div>
          </div>

          <div className="mb-6">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Ticket className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input 
                  type="text"
                  placeholder="PROMO CODE" 
                  value={promoCode}
                  onChange={e => setPromoCode(e.target.value)}
                  className="w-full bg-white border border-border rounded-xl pl-10 pr-3 py-3 text-[0.7rem] font-black uppercase tracking-widest outline-none focus:border-primary transition-all text-black shadow-sm"
                />
              </div>
              <button 
                onClick={handleApplyPromo}
                disabled={promoApplied || !promoCode}
                className="bg-primary text-black px-4 sm:px-6 rounded-xl text-[0.65rem] font-black uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all disabled:opacity-30 shrink-0"
              >
                {promoApplied ? 'Done' : 'Apply'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-5 gap-1.5 sm:gap-2 mb-8">
            {(['evc', 'sahal', 'edahab', 'mastercard', 'crypto'] as const).map(m => (
              <button
                key={m}
                onClick={() => {
                   setMethod(m);
                   setSenderInfo('');
                }}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 sm:gap-1.5 py-3 sm:py-4 px-1 rounded-xl sm:rounded-2xl border text-[0.5rem] sm:text-[0.55rem] font-black uppercase tracking-tight transition-all relative overflow-hidden",
                  method === m 
                    ? "bg-primary/5 border-primary text-primary shadow-sm" 
                    : "bg-white border-border text-muted-foreground hover:border-primary/30"
                )}
              >
                {m === 'evc' || m === 'sahal' || m === 'edahab' ? (
                  <div className="w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center text-[0.4rem] text-primary border border-primary/20">S</div>
                ) : m === 'mastercard' ? (
                  <div className="w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center text-[0.4rem] text-primary border border-primary/20">M</div>
                ) : (
                  <div className="w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center text-[0.4rem] text-primary border border-primary/20">U</div>
                )}
                <span className="hidden sm:inline">{m === 'evc' ? 'EVC/ZAAD' : m === 'sahal' ? 'Sahal' : m === 'edahab' ? 'Dahab' : m === 'mastercard' ? 'Card' : 'Crypto'}</span>
                <span className="sm:hidden">{m === 'evc' ? 'EVC/ZAD' : m === 'sahal' ? 'SHL' : m === 'edahab' ? 'DHB' : m === 'mastercard' ? 'CRD' : 'CRP'}</span>
                {method === m && <div className="absolute top-0 right-0 w-3 h-3 sm:w-4 sm:h-4 bg-primary text-black rounded-bl-lg flex items-center justify-center"><div className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-black" /></div>}
              </button>
            ))}
          </div>

          <div className="min-h-[140px]">
            {instructions && (
              <div className="p-4 sm:p-6 bg-secondary/20 rounded-2xl border border-border text-center animate-in fade-in slide-in-from-bottom-2 shadow-sm">
                <div className="text-[0.6rem] text-primary mb-2 font-black uppercase tracking-[0.2em]">{instructions.title} Instructions</div>
                <div className="text-xs text-muted-foreground mb-2 flex flex-col items-center gap-1">
                  <span>Send payment to this number:</span>
                  <div className="text-sm font-black text-black bg-primary/10 px-3 py-1 rounded-full border border-primary/20 mt-1">
                    Total: {currencySymbol}{displayPrice.toLocaleString()}
                  </div>
                </div>
                <div 
                  className="bg-white border border-primary/20 p-3 sm:p-4 rounded-xl mb-6 group cursor-pointer hover:border-primary transition-all active:scale-95 shadow-lg shadow-primary/5"
                  onClick={() => {
                    navigator.clipboard.writeText(instructions.number);
                    toast.success("Number copied!");
                  }}
                >
                  <div className="text-xl sm:text-2xl font-black text-black tracking-widest">{instructions.number}</div>
                  <div className="text-[0.5rem] uppercase text-muted-foreground mt-1 group-hover:text-primary transition-colors">Click to copy number</div>
                </div>
                <div className="text-left space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[0.6rem] font-bold text-muted-foreground uppercase tracking-widest ml-1">Magacaaga oo Buuxa</label>
                    <input 
                      type="text"
                      placeholder="Geli magacaaga"
                      value={customerName}
                      onChange={e => setCustomerName(e.target.value)}
                      className="w-full bg-white border border-border px-4 py-3 rounded-xl text-sm outline-none focus:border-primary transition-all text-black"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[0.6rem] font-bold text-muted-foreground uppercase tracking-widest ml-1">Reference Number / TID</label>
                    <input 
                      type="tel"
                      placeholder="Geli nambarka ama TID"
                      value={senderInfo}
                      onChange={e => setSenderInfo(e.target.value)}
                      className="w-full bg-white border border-border px-4 py-3 rounded-xl text-sm outline-none focus:border-primary text-center font-mono placeholder:text-muted-foreground/30 transition-all text-black"
                    />
                  </div>
                </div>
              </div>
            )}

            {method === 'crypto' && (
              <div className="p-4 sm:p-6 bg-secondary/20 rounded-2xl border border-border text-center shadow-sm">
                <div className="text-[0.6rem] text-primary mb-2 font-black uppercase tracking-widest">USDT (TRC20) Network</div>
                <div className="text-[0.6rem] text-muted-foreground mb-3 font-bold">Total: {currencySymbol}{displayPrice.toLocaleString()}</div>
                <div className="bg-white border border-border p-3 rounded-xl mb-4">
                  <div className="text-[0.6rem] font-mono text-primary break-all select-all">{usdtAddress}</div>
                </div>
                <div className="text-left space-y-4 mb-4">
                  <div className="space-y-1.5">
                    <label className="text-[0.6rem] font-bold text-muted-foreground uppercase tracking-widest ml-1">Magacaaga oo Buuxa</label>
                    <input 
                      type="text"
                      placeholder="Geli magacaaga"
                      value={customerName}
                      onChange={e => setCustomerName(e.target.value)}
                      className="w-full bg-white border border-border px-4 py-3 rounded-xl text-sm outline-none focus:border-primary transition-all text-black"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[0.6rem] font-bold text-muted-foreground uppercase tracking-widest ml-1">Transaction ID (Hash)</label>
                    <input 
                      type="text"
                      placeholder="Insert Hash or Ref"
                      value={senderInfo}
                      onChange={e => setSenderInfo(e.target.value)}
                      className="w-full bg-white border border-border px-4 py-3 rounded-xl text-sm outline-none focus:border-primary text-center font-mono transition-all text-black"
                    />
                  </div>
                </div>
              </div>
            )}

            {method === 'mastercard' && (
              <div className="space-y-4">
                <div className="p-4 sm:p-6 bg-secondary/20 rounded-2xl border border-border shadow-sm">
                   <p className="text-[0.65rem] text-muted-foreground text-center mb-2 italic px-2">Direct card payments coming soon. For now, please enter your details for verification.</p>
                   <div className="text-center mb-4">
                     <span className="text-xs font-black text-black bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
                       Total: {currencySymbol}{displayPrice.toLocaleString()}
                     </span>
                   </div>
                   <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[0.6rem] font-bold text-muted-foreground uppercase tracking-widest ml-1">Magacaaga oo Buuxa</label>
                      <input 
                        type="text"
                        placeholder="Magacaaga oo buuxa"
                        value={customerName}
                        onChange={e => setCustomerName(e.target.value)}
                        className="w-full bg-white border border-border px-4 py-3 rounded-xl text-sm outline-none focus:border-primary text-center text-black"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[0.6rem] font-bold text-muted-foreground uppercase tracking-widest ml-1">Cardholder Name / Ref</label>
                      <input 
                        type="text"
                        placeholder="Cardholder Ref"
                        value={senderInfo}
                        onChange={e => setSenderInfo(e.target.value)}
                        className="w-full bg-white border border-border px-4 py-3 rounded-xl text-sm outline-none focus:border-primary text-center text-black"
                      />
                    </div>
                   </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="p-6 sm:p-8 bg-secondary/30 border-t border-border shrink-0">
          <button 
            disabled={loading || !senderInfo.trim() || !customerName.trim()}
            onClick={handleSubmit}
            className="w-full bg-primary text-black py-4 rounded-xl text-sm font-black uppercase tracking-[0.2em] shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-20 disabled:grayscale disabled:scale-100 relative group overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            {loading ? 'Processing...' : 'Submit Payment Info'}
          </button>
          <div className="mt-5 flex items-center justify-center gap-2 opacity-50">
            <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
            <span className="text-[0.55rem] font-black uppercase tracking-widest text-black">Encrypted Connection Ready</span>
          </div>
        </div>
      </div>
    </div>
  );
}
