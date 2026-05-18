import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function handle() {
      const url = new URL(window.location.href);
      const code = url.searchParams.get('code');
      const errorDesc = url.searchParams.get('error_description') ?? url.searchParams.get('error');
      const hashParams = new URLSearchParams(window.location.hash.replace('#', ''));
      const accessToken = hashParams.get('access_token');

      // Error from OAuth provider
      if (errorDesc) {
        setErrorMsg(decodeURIComponent(errorDesc));
        return;
      }

      // PKCE flow: code in query params
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(window.location.href);
        if (error) {
          setErrorMsg(error.message);
          return;
        }
        navigate('/', { replace: true });
        return;
      }

      // Implicit flow: access_token in hash
      if (accessToken) {
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          navigate('/', { replace: true });
          return;
        }
      }

      // No recognizable params — check if already logged in
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        navigate('/', { replace: true });
      } else {
        navigate('/login', { replace: true });
      }
    }

    void handle();
  }, [navigate]);

  if (errorMsg) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-4 px-6" data-testid="auth-callback-error">
        <div className="text-3xl">⚠️</div>
        <p className="text-destructive text-sm text-center">{errorMsg}</p>
        <button
          onClick={() => navigate('/login', { replace: true })}
          className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium"
        >
          다시 로그인하기
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex items-center justify-center" data-testid="auth-callback-page">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-muted-foreground">로그인 처리 중...</span>
      </div>
    </div>
  );
}
