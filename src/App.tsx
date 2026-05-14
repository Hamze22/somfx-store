/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { Header } from './components/layout/Header';
import { Ticker } from './components/layout/Ticker';
import { BottomNav } from './components/layout/BottomNav';
import { Footer } from './components/layout/Footer';

// Pages
import { StorePage } from './pages/StorePage';
import { IndicatorsPage } from './pages/IndicatorsPage';
import { ChartsPage } from './pages/ChartsPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ProfilePage } from './pages/ProfilePage';
import { AdminPage } from './pages/AdminPage';
import { EADetailPage } from './pages/EADetailPage';
import { ContactPage } from './pages/ContactPage';
import { SavedPage } from './pages/SavedPage';
import { Toaster } from 'sonner';

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <AuthProvider>
          <Router>
            <div className="min-h-screen bg-background text-foreground flex flex-col">
              <Header />
              <Ticker />
              
              <main className="flex-1 mt-4">
                <Routes>
                  <Route path="/" element={<StorePage />} />
                  <Route path="/indicators" element={<IndicatorsPage />} />
                  <Route path="/charts" element={<ChartsPage />} />
                  <Route path="/contact" element={<ContactPage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/saved" element={<SavedPage />} />
                  <Route path="/admin" element={<AdminPage />} />
                  <Route path="/ea/:id" element={<EADetailPage />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </main>

              <Footer />
              <BottomNav />
              <Toaster position="top-center" richColors />
            </div>
          </Router>
        </AuthProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}
