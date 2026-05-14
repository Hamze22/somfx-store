import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { collection, query, getDocs, updateDoc, doc, deleteDoc, setDoc, orderBy, getDocFromServer } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { uploadFileWithProgress, validateFile, UploadProgress } from '../lib/storageUtils';
import { sendDownloadEmail } from '../services/emailService';
import { 
  Users, 
  DollarSign, 
  Package, 
  Eye, 
  Check, 
  X, 
  Trash2, 
  Plus,
  ChevronLeft,
  Image as ImageIcon,
  Upload,
  Mail
} from 'lucide-react';
import { cn, getDriveDirectLink } from '../lib/utils';
import { toast } from 'sonner';
import { getDoc } from 'firebase/firestore';

export function AdminPage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<'stats' | 'users' | 'payments' | 'products' | 'promos'>('stats');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);

  // Connection Check
  React.useEffect(() => {
    async function testConnection() {
      try {
        // Simple ping to test connectivity
        await getDocFromServer(doc(db, '_connection_test', 'ping'));
      } catch (error: any) {
        if (error?.message?.includes('offline')) {
          console.error("Firebase is offline. Check connection.");
        }
      }
    }
    testConnection();
  }, []);
  
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    price: '',
    type: 'ea',
    version: 'mt4',
    category: '',
    profit: '',
    winrate: '',
    drawdown: '',
    profileEmoji: '', // Holds the direct URL/Link
    emojis: ['', '', ''] as string[], // Holds the 3 gallery URLs
    fileUrl: '', // Holds the direct file link (Drive/Cloudinary)
    videoUrl: ''
  });

  const [files, setFiles] = useState<{
    profile: File | null;
    gallery: (File | null)[];
    mainFile: File | null;
  }>({
    profile: null,
    gallery: [null, null, null],
    mainFile: null
  });

  const [uploadProgress, setUploadProgress] = useState<Record<string, UploadProgress>>({});

  const [newPromo, setNewPromo] = useState({
    code: '',
    discount: '',
    type: 'percentage',
    expiry: ''
  });

  const { data: stats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const usersSnap = await getDocs(collection(db, 'users'));
      const ordersSnap = await getDocs(query(collection(db, 'orders'), orderBy('createdAt', 'desc')));
      
      const revenue = ordersSnap.docs
        .filter(d => d.data().status === 'completed')
        .reduce((acc, curr) => acc + (curr.data().amount || 0), 0);
        
      return { 
        userCount: usersSnap.size, 
        revenue, 
        orderCount: ordersSnap.size 
      };
    }
  });

  const { data: users = [] } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    }
  });

  const { data: orders = [] } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: async () => {
      const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    }
  });

  const { data: products = [] } = useQuery({
    queryKey: ['admin-products'],
    queryFn: async () => {
      const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];
    }
  });

  const { data: promos = [] } = useQuery({
    queryKey: ['admin-promos'],
    queryFn: async () => {
      const q = query(collection(db, 'promocodes'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    }
  });

  const handleUpdateOrderStatus = async (id: string, status: string) => {
    try {
       await updateDoc(doc(db, 'orders', id), { status });
       
       if (status === 'completed') {
         const orderDoc = await getDoc(doc(db, 'orders', id));
         if (orderDoc.exists()){
           const orderData = orderDoc.data();
           const productDoc = await getDoc(doc(db, 'products', orderData.productId));
           
           if (productDoc.exists()){
             const productData = productDoc.data();
             const downloadLink = productData.fileUrl; // This is the Google Drive/Cloud link
             
             if (downloadLink) {
                toast.promise(
                  sendDownloadEmail({
                    to_name: orderData.userEmail.split('@')[0],
                    to_email: orderData.userEmail,
                    product_name: orderData.productName,
                    download_link: downloadLink,
                    order_id: orderData.id
                  }),
                  {
                    loading: 'Sending download link to customer...',
                    success: 'Download link sent via email!',
                    error: 'Failed to send email. Check EmailJS config.'
                  }
                );
             } else {
                toast.warning("Order completed but product has no download link!");
             }
           }
         }
       }

       queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
       queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
       toast.success(`Order marked as ${status}`);
    } catch (error) {
       const msg = handleFirestoreError(error, 'update', `orders/${id}`);
       toast.error(msg);
    }
  };

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleFirestoreError = (error: any, operation: string, path: string) => {
    const errInfo = {
      error: error?.message || String(error),
      operationType: operation,
      path: path,
      authInfo: {
        userId: currentUser?.uid,
        email: currentUser?.email,
        role: (currentUser as any)?.role
      }
    };
    console.error(`Firestore Error [${operation}]:`, JSON.stringify(errInfo));
    return `Permission Denied or Connection Error. (${operation})`;
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm("Are you sure you want to remove this asset?")) return;
    setDeletingId(id);
    try {
      await deleteDoc(doc(db, 'products', id));
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      toast.success("Product deleted successfully");
    } catch (error: any) {
      const msg = handleFirestoreError(error, 'delete', `products/${id}`);
      toast.error(msg);
    } finally {
      setDeletingId(null);
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newProduct.name || !newProduct.price) {
       alert("Please enter a name and price.");
       return;
    }
    
    if (isNaN(Number(newProduct.price))) {
       alert("Please enter a valid price.");
       return;
    }

    setLoading(true);
    setUploadProgress({});
    
    try {
      const productId = editingProductId || ("prod-" + Math.random().toString(36).substr(2, 9));
      let profileUrl = newProduct.profileEmoji;
      let galleryUrls: string[] = [...newProduct.emojis];
      let mainFileUrl = newProduct.fileUrl;

      // 1. Upload Profile Image
      if (files.profile) {
        validateFile(files.profile, ['image/'], 5); // 5MB limit for images
        profileUrl = await uploadFileWithProgress(
          files.profile, 
          `products/${productId}/images`, 
          (p) => setUploadProgress(prev => ({ ...prev, profile: p }))
        );
      }

      // 2. Upload Gallery Images
      for (let i = 0; i < files.gallery.length; i++) {
        const file = files.gallery[i];
        if (file) {
          validateFile(file, ['image/'], 5);
          const url = await uploadFileWithProgress(
            file, 
            `products/${productId}/images`,
            (p) => setUploadProgress(prev => ({ ...prev, [`gallery_${i}`]: p }))
          );
          galleryUrls[i] = url;
        }
      }

      // 3. Upload Main Product File
      if (files.mainFile) {
        validateFile(files.mainFile, ['.ex4', '.ex5', '.pdf', '.zip', '.rar'], 100); // 100MB limit for products
        mainFileUrl = await uploadFileWithProgress(
          files.mainFile, 
          `products/${productId}/files`,
          (p) => setUploadProgress(prev => ({ ...prev, mainFile: p }))
        );
      }

      if (!mainFileUrl && !newProduct.fileUrl) {
         toast.error("Please upload a product file or provide a link.");
         setLoading(false);
         return;
      }

      // 4. Save to Firestore
      const downloads = editingProductId 
        ? products.find((p: any) => p.id === editingProductId)?.downloads || Math.floor(Math.random() * (1000 - 500 + 1) + 500)
        : Math.floor(Math.random() * (1000 - 500 + 1) + 500);

      const productData = {
        ...newProduct,
        id: productId,
        price: Number(newProduct.price),
        profileEmoji: profileUrl,
        emojis: galleryUrls.filter(url => url.trim() !== ''),
        fileUrl: mainFileUrl,
        downloads,
        status: 'active' as const,
        updatedAt: new Date().toISOString(),
        ...(editingProductId ? {} : { createdAt: new Date().toISOString() })
      };

      if (editingProductId) {
        await updateDoc(doc(db, 'products', productId), productData);
      } else {
        await setDoc(doc(db, 'products', productId), productData);
      }
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      setShowAddModal(false);
      resetForm();
      toast.success(editingProductId ? "Asset updated successfully!" : "Asset saved successfully! Files uploaded.");
    } catch (error: any) {
      console.error("Save error:", error);
      toast.error("Failed to save product. " + (error?.message || ""));
    } finally {
      setLoading(false);
      setEditingProductId(null);
    }
  };

  const handleEditProduct = (p: any) => {
    setNewProduct({
      name: p.name || '',
      description: p.description || '',
      price: String(p.price) || '',
      type: p.type || 'ea',
      version: p.version || 'mt4',
      category: p.category || '',
      profit: p.profit || '',
      winrate: p.winrate || '',
      drawdown: p.drawdown || '',
      profileEmoji: p.profileEmoji || '',
      emojis: p.emojis?.length ? [...p.emojis, '', '', ''].slice(0, 3) : ['', '', ''],
      fileUrl: p.fileUrl || '',
      videoUrl: p.videoUrl || ''
    });
    setEditingProductId(p.id);
    setShowAddModal(true);
  };

  const resetForm = () => {
    setNewProduct({
      name: '',
      description: '',
      price: '',
      type: 'ea',
      version: 'mt4',
      category: '',
      profit: '',
      winrate: '',
      drawdown: '',
      profileEmoji: '',
      emojis: ['', '', ''],
      fileUrl: '',
      videoUrl: ''
    });
    setFiles({
      profile: null,
      gallery: [null, null, null],
      mainFile: null
    });
    setUploadProgress({});
  };

  const handleSavePromo = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = newPromo.code.toUpperCase();
    try {
      await setDoc(doc(db, 'promocodes', id), {
        ...newPromo,
        discount: Number(newPromo.discount),
        createdAt: new Date().toISOString()
      });
      queryClient.invalidateQueries({ queryKey: ['admin-promos'] });
      setNewPromo({ code: '', discount: '', type: 'percentage', expiry: '' });
      alert("Promo code deployed!");
    } catch (error) {
      const msg = handleFirestoreError(error, 'write', `promocodes/${id}`);
      alert(`Promo failed: ${msg}`);
    }
  };

  const handleDeletePromo = async (id: string) => {
    if (!confirm("Delete promo?")) return;
    try {
      await deleteDoc(doc(db, 'promocodes', id));
      queryClient.invalidateQueries({ queryKey: ['admin-promos'] });
      toast.success("Promo code deleted");
    } catch (error) {
      const msg = handleFirestoreError(error, 'delete', `promocodes/${id}`);
      toast.error(msg);
    }
  };

  const handleDeleteOrder = async (id: string) => {
    if (!confirm("Remove this order record?")) return;
    try {
      await deleteDoc(doc(db, 'orders', id));
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      toast.success("Order record removed");
    } catch (error) {
      const msg = handleFirestoreError(error, 'delete', `orders/${id}`);
      toast.error(msg);
    }
  };

  if (!currentUser || currentUser.role !== 'admin') {
    navigate("/");
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 pb-24">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
           <button onClick={() => navigate("/profile")} className="p-2 hover:bg-secondary rounded-lg transition-all">
             <ChevronLeft className="w-5 h-5" />
           </button>
           <h2 className="text-xl font-black uppercase italic tracking-tighter text-primary underline decoration-2 underline-offset-4">
              Mission Control
           </h2>
        </div>
      </div>

      <div className="flex gap-2 p-1 bg-secondary rounded-xl mb-8 w-full md:w-fit border border-border overflow-x-auto">
          {(['stats', 'users', 'payments', 'products', 'promos'] as const).map(t => (
            <button
               key={t}
               onClick={() => setTab(t)}
               className={cn(
                 "px-6 py-2 rounded-lg text-[0.65rem] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                 tab === t ? "bg-card text-primary shadow-lg border border-border" : "text-muted-foreground hover:text-foreground"
               )}
            >
               {t}
            </button>
          ))}
      </div>

      {tab === 'stats' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <div className="bg-card border border-border p-6 rounded-xl">
              <Users className="w-6 h-6 text-info mb-4" />
              <div className="text-2xl font-black text-foreground">{stats?.userCount || 0}</div>
              <div className="text-[0.6rem] font-bold text-muted-foreground uppercase tracking-widest">Global Traders</div>
           </div>
           <div className="bg-card border border-border p-6 rounded-xl border-b-primary">
              <DollarSign className="w-6 h-6 text-success mb-4" />
              <div className="text-2xl font-black text-foreground">${stats?.revenue || 0}</div>
              <div className="text-[0.6rem] font-bold text-muted-foreground uppercase tracking-widest">Total Revenue</div>
           </div>
           <div className="bg-card border border-border p-6 rounded-xl">
              <Package className="w-6 h-6 text-purple mb-4" />
              <div className="text-2xl font-black text-foreground">{stats?.orderCount || 0}</div>
              <div className="text-[0.6rem] font-bold text-muted-foreground uppercase tracking-widest">Transaction Log</div>
           </div>
        </div>
      )}

      {tab === 'users' && (
        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-xl font-mono">
           <table className="w-full text-left">
              <thead className="bg-secondary/50 text-[0.6rem] uppercase font-bold text-muted-foreground">
                 <tr>
                    <th className="p-4 border-b border-border">User</th>
                    <th className="p-4 border-b border-border">Joined</th>
                    <th className="p-4 border-b border-border text-right">Actions</th>
                 </tr>
              </thead>
              <tbody className="text-xs">
                 {users.map((u: any) => (
                   <tr key={u.id} className="border-b border-border/40 hover:bg-secondary/20 transition-all">
                      <td className="p-4">
                         <div className="font-bold text-foreground">{u.displayName}</div>
                         <div className="text-[0.65rem] text-muted-foreground">{u.email}</div>
                      </td>
                      <td className="p-4 text-muted-foreground">{new Date(u.createdAt).toLocaleDateString()}</td>
                      <td className="p-4 text-right">
                         <button className="text-info hover:underline text-[0.6rem] font-black uppercase">Inspect</button>
                      </td>
                   </tr>
                 ))}
              </tbody>
           </table>
        </div>
      )}

      {tab === 'payments' && (
        <div className="space-y-3">
           {orders.map((p: any) => (
             <div key={p.id} className="bg-card border border-border p-4 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-primary/20 transition-all">
                <div className="flex-1">
                   <div className="flex items-center gap-3 mb-1">
                      <span className="text-xs font-black uppercase tracking-tight text-foreground">{p.productName || p.productId}</span>
                      <span className="text-[0.6rem] font-bold text-primary font-mono">${p.amount}</span>
                      <span className="text-[0.55rem] font-black px-1.5 py-0.5 bg-secondary border border-border rounded text-muted-foreground uppercase">{p.method}</span>
                   </div>
                   <div className="flex flex-col gap-0.5">
                      <div className="text-[0.7rem] font-bold text-foreground">
                         {p.userName || 'Trader'} <span className="text-muted-foreground font-normal">({p.userEmail})</span>
                      </div>
                      <div className="text-[0.65rem] text-primary/80 font-black tracking-wider font-mono">
                         Number: {p.phone || 'N/A'}
                      </div>
                      <div className="text-[0.55rem] text-muted-foreground font-mono">
                         {new Date(p.createdAt).toLocaleString()}
                      </div>
                   </div>
                </div>
                
                <div className="flex items-center gap-2">
                   <button 
                     onClick={() => setSelectedOrder(p)}
                     className="flex items-center gap-1 px-2.5 py-1.5 bg-info/10 text-info rounded text-[0.55rem] font-black uppercase tracking-widest hover:bg-info/20 transition-all border border-info/30"
                   >
                     <Eye className="w-3 h-3" /> View
                   </button>
                   <span className={cn(
                     "text-[0.65rem] font-black px-2.5 py-1 rounded font-mono uppercase tracking-widest border",
                     p.status === 'completed' ? 'bg-success/5 border-success text-success' : p.status === 'failed' ? 'bg-destructive/5 border-destructive text-destructive' : 'bg-primary/5 border-primary text-primary'
                   )}>
                      {p.status}
                   </span>
                   {p.status === 'pending' && (
                     <div className="flex items-center gap-1.5 ml-2">
                        <button 
                          onClick={() => handleUpdateOrderStatus(p.id, 'completed')} 
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-success/10 text-success rounded text-[0.55rem] font-black uppercase tracking-widest hover:bg-success/20 transition-all border border-success/30"
                        >
                          <Check className="w-3 h-3" /> Approve
                        </button>
                        <button 
                          onClick={() => handleUpdateOrderStatus(p.id, 'failed')} 
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-destructive/10 text-destructive rounded text-[0.55rem] font-black uppercase tracking-widest hover:bg-destructive/20 transition-all border border-destructive/30"
                        >
                          <X className="w-3 h-3" /> Reject
                        </button>
                     </div>
                   )}
                   <button 
                     onClick={() => handleDeleteOrder(p.id)}
                     className="p-1.5 bg-secondary text-muted-foreground rounded hover:bg-muted transition-all"
                   >
                     <Trash2 className="w-4 h-4" />
                   </button>
                </div>
             </div>
           ))}
        </div>
      )}

      {tab === 'products' && (
        <div className="space-y-4">
           {showAddModal && (
             <div className="fixed inset-0 z-[1100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
               <form 
                 onSubmit={handleSaveProduct}
                 className="bg-card border border-border rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl relative"
               >
                 <button 
                   type="button"
                   onClick={() => {
                     setShowAddModal(false);
                     setEditingProductId(null);
                     resetForm();
                   }}
                   className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
                 >
                   <X className="w-5 h-5" />
                 </button>

                 <h3 className="text-xl font-black uppercase italic tracking-tighter mb-6 text-primary">
                   {editingProductId ? 'Edit Asset' : 'Add New Asset'}
                 </h3>

                 {loading && Object.keys(uploadProgress).length > 0 && (
                   <div className="mb-6 p-4 bg-secondary/50 rounded-xl border border-border animate-in fade-in slide-in-from-top-4 duration-300">
                     <h4 className="text-[0.6rem] font-bold uppercase tracking-widest text-muted-foreground mb-3">Upload Progress</h4>
                     <div className="space-y-3">
                       {Object.entries(uploadProgress).map(([key, p]) => {
                         const uploadP = p as UploadProgress;
                         return (
                           <div key={key}>
                              <div className="flex justify-between items-center mb-1">
                                 <span className="text-[0.6rem] font-bold uppercase text-foreground">{key === 'mainFile' ? 'Product File' : key === 'profile' ? 'Profile Image' : `Gallery #${parseInt(key.split('_')[1]) + 1}`}</span>
                                 <span className="text-[0.6rem] font-mono text-primary">{Math.round(uploadP.progress || 0)}%</span>
                              </div>
                              <div className="h-1 bg-background rounded-full overflow-hidden border border-border">
                                 <div 
                                   className="h-full bg-primary transition-all duration-300" 
                                   style={{ width: `${uploadP.progress || 0}%` }} 
                                 />
                              </div>
                           </div>
                         );
                       })}
                     </div>
                   </div>
                 )}

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div className="space-y-4">
                     <div>
                       <label className="text-[0.6rem] font-bold uppercase tracking-widest text-muted-foreground mb-1 block">Type</label>
                       <select 
                         value={newProduct.type}
                         onChange={e => setNewProduct({...newProduct, type: e.target.value})}
                         className="w-full bg-background border border-border rounded-lg p-2.5 text-xs outline-none focus:border-primary"
                       >
                         <option value="ea">Trading Robot (EA)</option>
                         <option value="indicator">Indicator</option>
                         
                       </select>
                     </div>
                     <div>
                       <label className="text-[0.6rem] font-bold uppercase tracking-widest text-muted-foreground mb-1 block">Name</label>
                       <input 
                         required
                         placeholder="NeoScalper v2"
                         value={newProduct.name}
                         onChange={e => setNewProduct({...newProduct, name: e.target.value})}
                         className="w-full bg-background border border-border rounded-lg p-2.5 text-xs outline-none focus:border-primary"
                       />
                     </div>
                     <div>
                       <label className="text-[0.6rem] font-bold uppercase tracking-widest text-muted-foreground mb-1 block">Description</label>
                       <textarea 
                         required
                         placeholder="Advanced algorithm for..."
                         value={newProduct.description}
                         onChange={e => setNewProduct({...newProduct, description: e.target.value})}
                         className="w-full bg-background border border-border rounded-lg p-2.5 text-xs outline-none focus:border-primary h-24"
                       />
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[0.6rem] font-bold uppercase tracking-widest text-muted-foreground mb-1 block">Version / Compatibility</label>
                        <select 
                          value={newProduct.version}
                          onChange={e => setNewProduct({...newProduct, version: e.target.value})}
                          className="w-full bg-background border border-border rounded-lg p-2.5 text-xs outline-none focus:border-primary"
                        >
                          <option value="mt4">MT4</option>
                          <option value="mt5">MT5</option>
                          <option value="both">MT4 & MT5</option>
                        </select>
                      </div>
                      <div>
                           <label className="text-[0.6rem] font-bold uppercase tracking-widest text-muted-foreground mb-1 block">Price ($)</label>
                           <input 
                             required
                             type="number"
                             placeholder="499"
                             value={newProduct.price}
                             onChange={e => setNewProduct({...newProduct, price: e.target.value})}
                             className="w-full bg-background border border-border rounded-lg p-2.5 text-xs outline-none focus:border-primary"
                           />
                        </div>
                        <div>
                           <label className="text-[0.6rem] font-bold uppercase tracking-widest text-muted-foreground mb-1 block">Category</label>
                           <select 
                              value={newProduct.category}
                              onChange={e => setNewProduct({...newProduct, category: e.target.value})}
                              className="w-full bg-background border border-border rounded-lg p-2.5 text-xs outline-none focus:border-primary"
                            >
                               <option value="">Select Category</option>
                               <option value="scalping">Scalping</option>
                               <option value="trend">Trend</option>
                               <option value="gold">Gold</option>
                               <option value="grid">Grid</option>
                               <option value="news">News</option>
                            </select>
                        </div>
                     </div>
                   </div>

                   <div className="space-y-4">
                     {newProduct.type !== 'course' && (
                       <div className="grid grid-cols-3 gap-2">
                         <div>
                           <label className="text-[0.6rem] font-bold uppercase tracking-widest text-muted-foreground mb-1 block">Avg Proft%</label>
                           <input placeholder="15" value={newProduct.profit} onChange={e => setNewProduct({...newProduct, profit: e.target.value})} className="w-full bg-background border border-border rounded-lg p-2 text-xs outline-none" />
                         </div>
                         <div>
                            <label className="text-[0.6rem] font-bold uppercase tracking-widest text-muted-foreground mb-1 block">Winrate%</label>
                            <input placeholder="88" value={newProduct.winrate} onChange={e => setNewProduct({...newProduct, winrate: e.target.value})} className="w-full bg-background border border-border rounded-lg p-2 text-xs outline-none" />
                         </div>
                         <div>
                            <label className="text-[0.6rem] font-bold uppercase tracking-widest text-muted-foreground mb-1 block">Drawdn%</label>
                            <input placeholder="5" value={newProduct.drawdown} onChange={e => setNewProduct({...newProduct, drawdown: e.target.value})} className="w-full bg-background border border-border rounded-lg p-2 text-xs outline-none" />
                         </div>
                       </div>
                     )}

                      <div>
                        <label className="text-[0.6rem] font-bold uppercase tracking-widest text-muted-foreground mb-1 block">Profile Image</label>
                        <div className="flex gap-2">
                           <label className="w-10 h-10 rounded bg-secondary border border-border flex items-center justify-center shrink-0 overflow-hidden cursor-pointer hover:border-primary transition-all">
                              {files.profile ? (
                                <img 
                                  src={URL.createObjectURL(files.profile)} 
                                  alt="" 
                                  className="w-full h-full object-cover" 
                                />
                              ) : newProduct.profileEmoji ? (
                                <img 
                                  src={getDriveDirectLink(newProduct.profileEmoji)} 
                                  alt="" 
                                  className="w-full h-full object-cover" 
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <Upload className="w-4 h-4 text-muted-foreground/30" />
                              )}
                              <input 
                                type="file" 
                                className="hidden" 
                                accept="image/*"
                                onChange={e => setFiles({...files, profile: e.target.files?.[0] || null})}
                              />
                           </label>
                           <input 
                              placeholder="Or direct image link"
                              value={newProduct.profileEmoji}
                              onChange={e => setNewProduct({...newProduct, profileEmoji: e.target.value})}
                              className="flex-1 bg-background border border-border rounded-lg p-2.5 text-[0.65rem] outline-none focus:border-primary font-mono"
                           />
                        </div>
                      </div>

                      {newProduct.type !== 'course' && (
                        <div>
                          <label className="text-[0.6rem] font-bold uppercase tracking-widest text-muted-foreground mb-1 block text-primary">Gallery Images (3 Max)</label>
                          <div className="space-y-2">
                            {[0, 1, 2].map(i => (
                              <div key={i} className="flex gap-2">
                                <label className="w-8 h-8 rounded bg-secondary border border-border flex items-center justify-center shrink-0 overflow-hidden cursor-pointer hover:border-primary transition-all">
                                  {files.gallery[i] ? (
                                    <img 
                                      src={URL.createObjectURL(files.gallery[i]!)} 
                                      alt="" 
                                      className="w-full h-full object-cover" 
                                    />
                                  ) : newProduct.emojis[i] ? (
                                    <img 
                                      src={getDriveDirectLink(newProduct.emojis[i])} 
                                      alt="" 
                                      className="w-full h-full object-cover" 
                                      referrerPolicy="no-referrer"
                                    />
                                  ) : (
                                    <ImageIcon className="w-3 h-3 text-muted-foreground/20" />
                                  )}
                                  <input 
                                    type="file" 
                                    className="hidden" 
                                    accept="image/*"
                                    onChange={e => {
                                      const newFiles = [...files.gallery];
                                      newFiles[i] = e.target.files?.[0] || null;
                                      setFiles({...files, gallery: newFiles});
                                    }}
                                  />
                                </label>
                                <input 
                                  placeholder={`Or Image Link #${i+1}`}
                                  value={newProduct.emojis[i]}
                                  onChange={e => {
                                    const newGal = [...newProduct.emojis];
                                    newGal[i] = e.target.value;
                                    setNewProduct({...newProduct, emojis: newGal});
                                  }}
                                  className="w-full bg-background border border-border rounded-lg p-2 text-[0.65rem] outline-none hover:border-primary/50 transition-all font-mono"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div>
                        <label className="text-[0.6rem] font-bold uppercase tracking-widest text-muted-foreground mb-1 block">Digital Asset / Google Drive Link</label>
                        <div className="space-y-2">
                          <label className="block bg-secondary border border-border rounded-lg p-3 cursor-pointer hover:border-primary transition-all">
                             <div className="flex items-center gap-3">
                                <Upload className={cn("w-4 h-4", files.mainFile ? "text-primary" : "text-muted-foreground")} />
                                <span className="text-[0.65rem] font-black uppercase tracking-widest truncate">
                                   {files.mainFile ? files.mainFile.name : 'Upload File (Optional)'}
                                </span>
                             </div>
                             <input 
                                type="file" 
                                className="hidden" 
                                onChange={e => setFiles({...files, mainFile: e.target.files?.[0] || null})}
                             />
                          </label>
                          <input 
                             placeholder="Paste Google Drive / Cloud Link here"
                             value={newProduct.fileUrl}
                             onChange={e => setNewProduct({...newProduct, fileUrl: e.target.value})}
                             className="w-full bg-background border border-border rounded-lg p-2.5 text-[0.65rem] outline-none focus:border-primary font-mono"
                          />
                        </div>
                        <p className="text-[0.55rem] text-muted-foreground mt-1 italic">This link will be sent automatically to the customer upon approval.</p>
                      </div>

                     <div>
                       <label className="text-[0.6rem] font-bold uppercase tracking-widest text-muted-foreground mb-1 block">External Video URL (Optional)</label>
                       <input placeholder="YouTube Link" value={newProduct.videoUrl} onChange={e => setNewProduct({...newProduct, videoUrl: e.target.value})} className="w-full bg-background border border-border rounded-lg p-2.5 text-xs outline-none focus:border-primary" />
                     </div>
                   </div>
                 </div>

                 <button 
                   type="submit"
                   disabled={loading}
                   className="w-full bg-primary text-black font-black uppercase tracking-widest py-3 rounded-lg mt-8 shadow-xl shadow-primary/20 hover:scale-[1.01] active:scale-95 transition-all disabled:opacity-50"
                 >
                   {loading ? 'Processing...' : 'Save Asset'}
                 </button>
               </form>
             </div>
           )}

           <div className="flex justify-between items-center mb-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Catalog ({products.length})</h3>
              <button 
                onClick={() => setShowAddModal(true)}
                className="bg-primary text-black px-4 py-1.5 rounded-lg text-[0.6rem] font-black uppercase tracking-widest flex items-center gap-1 shadow-lg shadow-primary/20"
              >
                <Plus className="w-3 h-3" /> Add Product
              </button>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((p: any) => (
                <div key={p.id} className="bg-card border border-border p-4 rounded-xl flex justify-between items-center group hover:border-primary/30 transition-all">
                   <div>
                      <div className="text-sm font-black uppercase italic tracking-tight">{p.name}</div>
                      <div className="text-[0.6rem] text-primary font-mono">${p.price} • {p.type}</div>
                   </div>
                   <div className="flex gap-2">
                      <button 
                        onClick={() => handleEditProduct(p)}
                        className="p-1.5 bg-secondary hover:bg-muted rounded text-muted-foreground transition-all"
                      >
                         <Upload className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => navigate(`/ea/${p.id}`)}
                        className="p-1.5 bg-secondary hover:bg-muted rounded text-muted-foreground transition-all"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteProduct(p.id)}
                        disabled={deletingId === p.id}
                        className="p-1.5 bg-destructive/10 hover:bg-destructive/20 rounded text-destructive transition-all disabled:opacity-50"
                      >
                        {deletingId === p.id ? (
                          <div className="w-4 h-4 border-2 border-destructive border-t-transparent animate-spin rounded-full" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                   </div>
                </div>
              ))}
              
              {products.length === 0 && (
                <div className="col-span-full text-center py-20 bg-card/50 border border-dashed border-border rounded-xl">
                   <Package className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                   <p className="text-muted-foreground text-sm font-medium italic">Empty Vault</p>
                </div>
              )}
           </div>
        </div>
      )}

      {tab === 'promos' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-1">
            <div className="bg-card border border-border p-6 rounded-xl">
              <h3 className="text-xs font-black uppercase tracking-widest text-primary mb-6">Create Promo Code</h3>
              <form onSubmit={handleSavePromo} className="space-y-4">
                <div>
                  <label className="text-[0.6rem] font-bold uppercase tracking-widest text-muted-foreground mb-1 block">Code</label>
                  <input 
                    required
                    placeholder="RAMADAN20" 
                    value={newPromo.code}
                    onChange={e => setNewPromo({...newPromo, code: e.target.value})}
                    className="w-full bg-background border border-border rounded-lg p-2.5 text-xs outline-none focus:border-primary font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="text-[0.6rem] font-bold uppercase tracking-widest text-muted-foreground mb-1 block">Value</label>
                  <div className="flex gap-2">
                    <input 
                      required
                      type="number"
                      placeholder="20" 
                      value={newPromo.discount}
                      onChange={e => setNewPromo({...newPromo, discount: e.target.value})}
                      className="flex-1 bg-background border border-border rounded-lg p-2.5 text-xs outline-none"
                    />
                    <select 
                      value={newPromo.type}
                      onChange={e => setNewPromo({...newPromo, type: e.target.value as any})}
                      className="bg-background border border-border rounded-lg px-2 text-xs outline-none"
                    >
                      <option value="percentage">%</option>
                      <option value="fixed">$</option>
                    </select>
                  </div>
                </div>
                <div>
                   <label className="text-[0.6rem] font-bold uppercase tracking-widest text-muted-foreground mb-1 block">Expiry</label>
                   <input 
                     type="date"
                     value={newPromo.expiry}
                     onChange={e => setNewPromo({...newPromo, expiry: e.target.value})}
                     className="w-full bg-background border border-border rounded-lg p-2.5 text-xs outline-none"
                   />
                </div>
                <button className="w-full bg-primary/20 text-primary border border-primary/20 py-2.5 rounded-lg text-[0.65rem] font-black uppercase tracking-widest hover:bg-primary hover:text-black transition-all mt-4">
                  Deploy Code
                </button>
              </form>
            </div>
          </div>

          <div className="md:col-span-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               {promos.map((p: any) => (
                 <div key={p.id} className="bg-card border border-border p-4 rounded-xl flex justify-between items-center">
                   <div>
                     <div className="text-lg font-black font-mono text-foreground">{p.id}</div>
                     <div className="text-[0.6rem] font-bold text-success uppercase tracking-widest">
                       {p.type === 'percentage' ? `${p.discount}% OFF` : `$${p.discount} OFF`}
                     </div>
                   </div>
                   <button 
                     onClick={() => handleDeletePromo(p.id)}
                     className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-all"
                   >
                     <Trash2 className="w-4 h-4" />
                   </button>
                 </div>
               ))}
               {promos.length === 0 && (
                 <div className="col-span-full py-12 text-center bg-secondary/20 border border-dashed border-border rounded-xl">
                   <p className="text-[0.65rem] text-muted-foreground uppercase font-black tracking-widest">No Active Promo Codes</p>
                 </div>
               )}
            </div>
          </div>
        </div>
      )}
      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-[1200] bg-black/60 backdrop-blur-md flex items-center justify-center p-4" onClick={() => setSelectedOrder(null)}>
          <div 
            className="bg-white border border-border rounded-3xl w-full max-w-lg shadow-[0_20px_50px_rgba(0,0,0,0.1)] relative overflow-hidden flex flex-col max-h-[90vh]"
            onClick={e => e.stopPropagation()}
          >
            <div className="absolute top-0 left-0 w-full h-1.5 bg-primary shrink-0" />
            
            <div className="p-6 border-b border-border flex items-center justify-between shrink-0 bg-white">
               <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-primary/10 rounded-xl border border-primary/20">
                     <Package className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                     <h3 className="text-lg font-black text-black uppercase italic tracking-tight">Order Details</h3>
                     <p className="text-[0.6rem] text-muted-foreground font-black tracking-widest uppercase">ID: {selectedOrder.id}</p>
                  </div>
               </div>
               <button 
                 onClick={() => setSelectedOrder(null)}
                 className="p-2 text-muted-foreground hover:text-black transition-all"
               >
                 <X className="w-5 h-5" />
               </button>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar space-y-7 bg-white">
               {/* Product Section */}
               <div className="space-y-3">
                  <h4 className="text-[0.65rem] font-black text-primary uppercase tracking-[0.2em] flex items-center gap-2">
                     <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                     Product Information
                  </h4>
                  <div className="bg-secondary/30 border border-border p-5 rounded-2xl shadow-sm">
                     <div className="flex justify-between items-start mb-3">
                        <div className="text-sm font-extrabold text-black">{selectedOrder.productName}</div>
                        <div className="text-xl font-black text-primary font-mono">
                          {selectedOrder.currency === 'SLSH' ? 'SLSH ' : '$'}
                          {selectedOrder.amount?.toLocaleString()}
                        </div>
                     </div>
                     <div className="flex gap-2">
                        <span className="text-[0.6rem] font-black px-2.5 py-1 bg-white border border-border rounded text-muted-foreground uppercase">{selectedOrder.type}</span>
                        <span className="text-[0.6rem] font-black px-2.5 py-1 bg-primary/10 text-primary border border-primary/20 rounded uppercase tracking-widest">{selectedOrder.method}</span>
                     </div>
                  </div>
               </div>

               {/* Customer Section */}
               <div className="space-y-3">
                  <h4 className="text-[0.65rem] font-black text-primary uppercase tracking-[0.2em] flex items-center gap-2">
                     <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                     Customer Details
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     <div className="bg-secondary/20 border border-border p-4 rounded-2xl">
                        <div className="text-[0.55rem] text-muted-foreground font-black uppercase tracking-wider mb-1.5">Full Name</div>
                        <div className="text-sm font-extrabold text-black">{selectedOrder.userName || 'N/A'}</div>
                     </div>
                     <div className="bg-secondary/20 border border-border p-4 rounded-2xl">
                        <div className="text-[0.55rem] text-muted-foreground font-black uppercase tracking-wider mb-1.5">Email Address</div>
                        <div className="text-sm font-bold text-black break-all">{selectedOrder.userEmail}</div>
                     </div>
                     <div className="bg-secondary/20 border border-border p-4 rounded-2xl">
                        <div className="text-[0.55rem] text-muted-foreground font-black uppercase tracking-wider mb-1.5">Payment Number / Hash</div>
                        <div className="text-sm font-mono font-black text-primary truncate">{selectedOrder.phone || 'N/A'}</div>
                     </div>
                     <div className="bg-secondary/20 border border-border p-4 rounded-2xl">
                        <div className="text-[0.55rem] text-muted-foreground font-black uppercase tracking-wider mb-1.5">Order Date</div>
                        <div className="text-sm font-bold text-black">{new Date(selectedOrder.createdAt).toLocaleString()}</div>
                     </div>
                  </div>
               </div>

               {/* Status Section */}
               <div className="space-y-3">
                  <h4 className="text-[0.65rem] font-black text-primary uppercase tracking-[0.2em] flex items-center gap-2">
                     <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                     Order Status
                  </h4>
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-secondary/10 border border-border p-5 rounded-2xl">
                     <span className={cn(
                       "px-5 py-2.5 rounded-xl font-black uppercase text-xs tracking-widest border shadow-sm",
                       selectedOrder.status === 'completed' ? 'bg-success/5 border-success text-success' : selectedOrder.status === 'failed' ? 'bg-destructive/5 border-destructive text-destructive' : 'bg-primary/5 border-primary text-primary'
                     )}>
                        {selectedOrder.status}
                     </span>
                     
                     <div className="flex items-center gap-2 w-full sm:w-auto">
                        {selectedOrder.status === 'pending' && (
                          <div className="flex items-center gap-2 flex-1 sm:flex-initial">
                            <button 
                              onClick={() => {
                                handleUpdateOrderStatus(selectedOrder.id, 'completed');
                                setSelectedOrder(null);
                              }} 
                              className="flex-1 sm:flex-none px-6 py-2.5 bg-primary text-black font-black uppercase text-[0.65rem] tracking-widest rounded-xl hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-primary/20"
                            >
                               Approve
                            </button>
                            <button 
                              onClick={() => {
                                handleUpdateOrderStatus(selectedOrder.id, 'failed');
                                setSelectedOrder(null);
                              }}
                              className="flex-1 sm:flex-none px-6 py-2.5 bg-destructive text-white font-black uppercase text-[0.65rem] tracking-widest rounded-xl hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-destructive/20"
                            >
                               Reject
                            </button>
                          </div>
                        )}
                        <button 
                          onClick={() => {
                            handleDeleteOrder(selectedOrder.id);
                            setSelectedOrder(null);
                          }}
                          className="p-2.5 bg-white border border-border text-muted-foreground hover:text-destructive hover:border-destructive transition-all rounded-xl shadow-sm"
                        >
                           <Trash2 className="w-5 h-5" />
                        </button>
                     </div>
                  </div>
               </div>
            </div>

            <div className="p-6 bg-secondary/30 border-t border-border shrink-0 flex justify-end">
               <button 
                 onClick={() => setSelectedOrder(null)}
                 className="px-8 py-3 bg-white border border-border text-black text-xs font-black uppercase tracking-widest rounded-xl hover:bg-secondary transition-all shadow-sm"
               >
                 Close
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
