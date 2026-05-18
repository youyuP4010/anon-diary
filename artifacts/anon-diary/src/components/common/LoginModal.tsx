import { signInWithGoogle } from '@/lib/auth';

interface LoginModalProps {
  onClose: () => void;
}

export default function LoginModal({ onClose }: LoginModalProps) {
  async function handleLogin() {
    await signInWithGoogle();
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
      data-testid="login-modal-overlay"
    >
      <div
        className="bg-white rounded-2xl p-8 w-80 text-center shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="text-3xl font-bold text-primary mb-2">Anon Diary</div>
        <p className="text-muted-foreground mb-6 text-sm">Sign in required</p>
        <button
          onClick={handleLogin}
          data-testid="button-google-login-modal"
          className="w-full bg-primary text-white font-semibold py-3 rounded-xl hover:bg-primary/90 transition-colors mb-3"
        >
          Sign in with Google
        </button>
        <button
          onClick={onClose}
          data-testid="button-close-login-modal"
          className="w-full text-muted-foreground text-sm py-2 hover:text-foreground transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
