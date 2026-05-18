import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import AuthProvider from '@/components/common/AuthProvider';
import { PwaInstallProvider } from '@/context/PwaInstallContext';
import AppShell from '@/components/layout/AppShell';
import FeedPage from '@/pages/FeedPage';
import MyDiaryPage from '@/pages/MyDiaryPage';
import DiaryDetailPage from '@/pages/DiaryDetailPage';
import WritePage from '@/pages/WritePage';
import SettingsPage from '@/pages/SettingsPage';
import LoginPage from '@/pages/LoginPage';
import AuthCallbackPage from '@/pages/AuthCallbackPage';

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <PwaInstallProvider>
          <BrowserRouter basename={import.meta.env.BASE_URL}>
            <AppShell>
              <Routes>
                <Route path="/" element={<FeedPage />} />
                <Route path="/my" element={<MyDiaryPage />} />
                <Route path="/diary/:id" element={<DiaryDetailPage />} />
                <Route path="/write" element={<WritePage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/auth/callback" element={<AuthCallbackPage />} />
                <Route path="/auth/v1/callback" element={<AuthCallbackPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </AppShell>
            <Toaster />
          </BrowserRouter>
        </PwaInstallProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
