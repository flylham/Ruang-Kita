import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MotionConfig } from 'motion/react';
import { ToastProvider } from './context/ToastContext';
import { CoupleProvider, useCouple } from './context/CoupleContext';
import { Layout } from './components/Layout';
import { LoginPage } from './pages/LoginPage';
import { HomePage } from './pages/HomePage';
import { ChatPage } from './pages/ChatPage';
import { GalleryPage } from './pages/GalleryPage';
import { TimeCapsulePage } from './pages/TimeCapsulePage';
import { TimelinePage } from './pages/TimelinePage';
import { ReasonsPage } from './pages/ReasonsPage';
import { LettersPage } from './pages/LettersPage';
import { QuizPage } from './pages/QuizPage';
import { WishlistPage } from './pages/WishlistPage';
import { PlaylistPage } from './pages/PlaylistPage';
import { CountdownsPage } from './pages/CountdownsPage';
import { SharedNotesPage } from './pages/SharedNotesPage';
import { CalendarPage } from './pages/CalendarPage';
import { JournalPage } from './pages/JournalPage';
import { SurprisePage } from './pages/SurprisePage';
import { SettingsPage } from './pages/SettingsPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30,
      retry: 1,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    },
  },
});

const AppRoutes: React.FC = () => {
  const { isConfigured, isAuthorizedMember, isLoadingAuth } = useCouple();

  if (isLoadingAuth) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-[var(--bg-canvas)]">
        <div className="space-y-3 text-center">
          <div className="mx-auto h-10 w-10 animate-pulse rounded-full bg-rose-500/30" />
          <p className="font-display text-lg text-[var(--text-secondary)]">Membuka Ruang Kita...</p>
        </div>
      </div>
    );
  }

  if (!isConfigured || !isAuthorizedMember) {
    return <LoginPage />;
  }

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/galeri" element={<GalleryPage />} />
        <Route path="/kapsul" element={<TimeCapsulePage />} />
        <Route path="/linimasa" element={<TimelinePage />} />
        <Route path="/alasan" element={<ReasonsPage />} />
        <Route path="/surat" element={<LettersPage />} />
        <Route path="/kuis" element={<QuizPage />} />
        <Route path="/wishlist" element={<WishlistPage />} />
        <Route path="/playlist" element={<PlaylistPage />} />
        <Route path="/mundur" element={<CountdownsPage />} />
        <Route path="/catatan" element={<SharedNotesPage />} />
        <Route path="/kalender" element={<CalendarPage />} />
        <Route path="/jurnal" element={<JournalPage />} />
        <Route path="/kejutan" element={<SurprisePage />} />
        <Route path="/pengaturan" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
};

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <CoupleProvider>
            <BrowserRouter>
              <AppRoutes />
            </BrowserRouter>
          </CoupleProvider>
        </ToastProvider>
      </QueryClientProvider>
    </MotionConfig>
  );
}
