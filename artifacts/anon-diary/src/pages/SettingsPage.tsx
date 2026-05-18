import { useEffect, useState } from 'react';
import { useAuth, signOut } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { usePwaInstall } from '@/context/PwaInstallContext';
import ContactModal from '@/components/common/ContactModal';
import LegalModal from '@/components/common/LegalModal';

function DeleteConfirmModal({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      onClick={onCancel}
      data-testid="delete-confirm-overlay"
    >
      <div
        className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl"
        onClick={e => e.stopPropagation()}
        data-testid="delete-confirm-modal"
      >
        <div className="text-center space-y-3 mb-6">
          <div className="text-4xl">⚠️</div>
          <h3 className="font-bold text-foreground text-base">Delete your account?</h3>
          <p className="text-sm text-muted-foreground">
            All your diaries and data will be permanently deleted. This action cannot be undone.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            data-testid="button-delete-cancel"
            className="flex-1 py-3 border border-border rounded-xl text-sm font-semibold text-muted-foreground hover:border-foreground/30 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            data-testid="button-delete-confirm"
            className="flex-1 py-3 bg-destructive text-white rounded-xl text-sm font-semibold hover:bg-destructive/90 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const { user } = useAuth();
  const { canInstall, install } = usePwaInstall();
  const [nickname, setNickname] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showLegal, setShowLegal] = useState<'terms' | 'privacy' | null>(null);
  const [showServiceInfo, setShowServiceInfo] = useState(false);
  const [infoExpanded, setInfoExpanded] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('anon_diary_profiles')
      .select('nickname')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        if (data) setNickname(data.nickname);
        else setNickname(user.email?.split('@')[0] ?? '');
      });
  }, [user]);

  async function handleSaveNickname() {
    if (!user || !nickname.trim()) return;
    setSaving(true);
    await supabase
      .from('anon_diary_profiles')
      .upsert({ id: user.id, nickname: nickname.trim(), updated_at: new Date().toISOString() });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function handleDeleteAccount() {
    if (!user) return;
    setDeleting(true);
    await supabase.from('anon_diary_diaries').delete().eq('author_id', user.id);
    await supabase.from('anon_diary_profiles').delete().eq('id', user.id);
    await signOut();
    setDeleting(false);
    setShowDeleteConfirm(false);
  }

  const joinDate = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : '';

  return (
    <div className="h-full overflow-y-auto" data-testid="settings-page">
      <div className="max-w-lg mx-auto px-4 py-5 space-y-6 pb-24">

        {/* PWA Install Banner */}
        {canInstall && (
          <div className="bg-primary/5 border border-primary/20 rounded-2xl p-5 flex items-center gap-4">
            <div className="text-4xl">📔</div>
            <div className="flex-1">
              <div className="font-semibold text-foreground">Use as an app!</div>
              <div className="text-xs text-muted-foreground mt-0.5">Add to home screen for an app-like experience</div>
            </div>
            <button
              onClick={install}
              data-testid="button-pwa-install"
              className="px-3 py-2 bg-primary text-white text-xs font-semibold rounded-xl hover:bg-primary/90 transition-colors flex-shrink-0"
            >
              Download
            </button>
          </div>
        )}

        {/* Account */}
        {user ? (
          <section>
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-1">Account</h2>
            <div className="bg-white border border-border rounded-2xl overflow-hidden divide-y divide-border">
              <div className="p-4 space-y-3">
                <div className="text-sm font-medium text-foreground">Username</div>
                <div className="flex gap-2">
                  <input
                    value={nickname}
                    onChange={e => setNickname(e.target.value)}
                    placeholder="Enter username"
                    data-testid="input-nickname"
                    className="flex-1 border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary transition-colors"
                  />
                  <button
                    onClick={handleSaveNickname}
                    disabled={saving}
                    data-testid="button-save-nickname"
                    className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                      saved ? 'bg-green-500 text-white' : 'bg-primary text-white hover:bg-primary/90'
                    }`}
                  >
                    {saved ? 'Saved ✓' : saving ? '...' : 'Save'}
                  </button>
                </div>
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="font-medium text-foreground/60 w-14 flex-shrink-0">Email</span>
                    <span className="truncate">{user.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="font-medium text-foreground/60 w-14 flex-shrink-0">Joined</span>
                    <span>{joinDate}</span>
                  </div>
                </div>
              </div>
              <div className="p-4 space-y-2">
                <div className="text-sm font-medium text-foreground mb-2">Account Management</div>
                <button
                  onClick={signOut}
                  data-testid="button-sign-out"
                  className="w-full text-left px-4 py-3 rounded-xl bg-muted hover:bg-muted/70 text-sm transition-colors"
                >
                  Sign Out
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  data-testid="button-delete-account"
                  className="w-full text-left px-4 py-3 rounded-xl bg-destructive/10 hover:bg-destructive/20 text-destructive text-sm transition-colors"
                >
                  Delete Account
                </button>
              </div>
            </div>
          </section>
        ) : (
          <div className="text-center py-8 text-muted-foreground text-sm">
            <p>Sign in to manage settings</p>
          </div>
        )}

        {/* Support */}
        <section>
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-1">Support</h2>
          <div className="bg-white border border-border rounded-2xl overflow-hidden divide-y divide-border">
            <button
              onClick={() => setShowContactModal(true)}
              data-testid="link-contact"
              className="flex w-full items-center justify-between px-4 py-4 text-sm hover:bg-muted transition-colors text-left"
            >
              <span>Contact Us</span>
              <span className="text-muted-foreground">→</span>
            </button>
          </div>
        </section>

        {/* Info */}
        <section>
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-1">Info</h2>
          <div className="bg-white border border-border rounded-2xl overflow-hidden divide-y divide-border">
            <button
              onClick={() => setInfoExpanded(v => !v)}
              data-testid="button-info-toggle"
              className="flex w-full items-center justify-between px-4 py-4 text-sm hover:bg-muted transition-colors text-left"
            >
              <span className="font-medium">Info</span>
              <span className={`text-muted-foreground transition-transform duration-200 ${infoExpanded ? 'rotate-90' : ''}`}>→</span>
            </button>

            {infoExpanded && (
              <div className="divide-y divide-border bg-muted/30">
                <button
                  onClick={() => setShowLegal('terms')}
                  data-testid="link-terms"
                  className="flex w-full items-center justify-between pl-8 pr-4 py-3.5 text-sm hover:bg-muted transition-colors text-left"
                >
                  <span>Terms of Service</span>
                  <span className="text-muted-foreground text-xs">→</span>
                </button>
                <button
                  onClick={() => setShowLegal('privacy')}
                  data-testid="link-privacy"
                  className="flex w-full items-center justify-between pl-8 pr-4 py-3.5 text-sm hover:bg-muted transition-colors text-left"
                >
                  <span>Privacy Policy</span>
                  <span className="text-muted-foreground text-xs">→</span>
                </button>
                <button
                  onClick={() => setShowServiceInfo(true)}
                  data-testid="link-service-info"
                  className="flex w-full items-center justify-between pl-8 pr-4 py-3.5 text-sm hover:bg-muted transition-colors text-left"
                >
                  <span>About</span>
                  <span className="text-muted-foreground text-xs">→</span>
                </button>
              </div>
            )}
          </div>
        </section>

        <div className="text-center text-xs text-muted-foreground py-4">
          Anon Diary v1.0
        </div>
      </div>

      {showDeleteConfirm && (
        <DeleteConfirmModal
          onConfirm={handleDeleteAccount}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}

      {deleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl p-6 flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-muted-foreground">Deleting account...</span>
          </div>
        </div>
      )}

      {showContactModal && (
        <ContactModal
          defaultEmail={user?.email ?? ''}
          onClose={() => setShowContactModal(false)}
        />
      )}

      {showLegal && (
        <LegalModal type={showLegal} onClose={() => setShowLegal(null)} />
      )}

      {showServiceInfo && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          onClick={() => setShowServiceInfo(false)}
          data-testid="service-info-modal"
        >
          <div
            className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-foreground text-base">About</h3>
              <button onClick={() => setShowServiceInfo(false)} className="text-muted-foreground hover:text-foreground text-xl leading-none">✕</button>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <span className="text-muted-foreground w-20 flex-shrink-0">Service</span>
                <span className="font-medium">Anon Diary</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-muted-foreground w-20 flex-shrink-0">Contact</span>
                <span className="font-medium">demisoda4010@gmail.com</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-muted-foreground w-20 flex-shrink-0">Version</span>
                <span className="font-medium">v1.0</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
