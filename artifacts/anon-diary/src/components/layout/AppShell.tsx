import { useState } from 'react';
import { Link } from 'react-router-dom';
import TopAdBanner from './TopAdBanner';
import BottomNav from './BottomNav';
import LegalModal from '@/components/common/LegalModal';
import { isSupabaseConfigured } from '@/lib/supabase';

interface AppShellProps {
  children: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const [showLegal, setShowLegal] = useState<'terms' | 'privacy' | null>(null);

  if (!isSupabaseConfigured) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="max-w-md text-center space-y-4">
          <div className="text-4xl font-bold text-primary">Anon Diary</div>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 text-sm text-amber-800 text-left space-y-2">
            <p className="font-semibold">Supabase environment variables are not configured.</p>
            <p>Please add the following to Replit Secrets:</p>
            <code className="block bg-amber-100 rounded p-2 text-xs">
              VITE_SUPABASE_URL<br />
              VITE_SUPABASE_ANON_KEY
            </code>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="flex-shrink-0 bg-white border-b border-border" data-testid="app-header">
        <div className="flex items-center justify-between px-4" style={{ height: '52px' }}>
          <Link
            to="/"
            data-testid="link-logo"
            className="text-xl font-bold text-primary tracking-tight"
          >
            Anon Diary
          </Link>
          <Link
            to="/settings"
            data-testid="link-settings"
            className="text-muted-foreground hover:text-foreground transition-colors text-lg"
          >
            ⚙
          </Link>
        </div>
        <div className="h-px bg-border" />
        <div className="h-3" />
        <TopAdBanner />
      </header>

      <main className="flex-1 overflow-hidden" data-testid="app-main">
        {children}
      </main>

      <BottomNav />

      {/* Footer */}
      <footer className="flex-shrink-0 bg-white border-t border-border py-2.5 px-4">
        <div className="flex items-center justify-center gap-4 text-[10px] text-muted-foreground">
          <button
            onClick={() => setShowLegal('terms')}
            data-testid="footer-link-terms"
            className="hover:text-foreground transition-colors"
          >
            Terms of Service
          </button>
          <span className="opacity-40">|</span>
          <button
            onClick={() => setShowLegal('privacy')}
            data-testid="footer-link-privacy"
            className="hover:text-foreground transition-colors"
          >
            Privacy Policy
          </button>
          <span className="opacity-40">|</span>
          <span>© 2026 Anon Diary</span>
        </div>
      </footer>

      {showLegal && (
        <LegalModal type={showLegal} onClose={() => setShowLegal(null)} />
      )}
    </div>
  );
}
