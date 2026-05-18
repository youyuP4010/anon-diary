import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithGoogle, useAuth } from '@/lib/auth';

export default function LoginPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) navigate('/');
  }, [user, loading, navigate]);

  async function handleLogin() {
    await signInWithGoogle();
  }

  return (
    <div className="h-full flex flex-col items-center justify-center p-8" data-testid="login-page">
      <div className="text-5xl font-bold text-primary mb-3 tracking-tight">Anon Diary</div>
      <p className="text-muted-foreground text-sm mb-10 text-center">
        Write anonymous diaries and share with the world
      </p>
      <button
        onClick={handleLogin}
        data-testid="button-google-login"
        className="flex items-center gap-3 bg-white border border-border rounded-2xl px-6 py-4 shadow-sm hover:shadow-md hover:border-primary/30 transition-all font-semibold text-foreground"
      >
        <svg width="20" height="20" viewBox="0 0 48 48">
          <path fill="#EA4335" d="M24 9.5c3.5 0 6.3 1.2 8.6 3.2l6.4-6.4C34.9 2.7 29.8 0 24 0 14.6 0 6.6 5.4 2.6 13.3l7.5 5.8C12 13.2 17.5 9.5 24 9.5z"/>
          <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h12.7c-.6 3-2.3 5.5-4.9 7.2l7.5 5.8c4.4-4 6.9-9.9 6.9-17z"/>
          <path fill="#FBBC05" d="M10.1 28.6c-.5-1.5-.8-3-.8-4.6s.3-3.1.8-4.6L2.6 13.3C.9 16.8 0 20.3 0 24s.9 7.2 2.6 10.7l7.5-6.1z"/>
          <path fill="#34A853" d="M24 48c5.8 0 10.9-1.9 14.6-5.2l-7.5-5.8c-2 1.3-4.4 2.1-7.1 2.1-6.5 0-12-4.5-13.9-10.5l-7.5 6.1C6.6 42.6 14.6 48 24 48z"/>
        </svg>
        Sign in with Google
      </button>
    </div>
  );
}
