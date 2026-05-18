import { useState } from 'react';
import { supabase } from '@/lib/supabase';

interface ContactModalProps {
  defaultEmail?: string;
  onClose: () => void;
}

export default function ContactModal({ defaultEmail = '', onClose }: ContactModalProps) {
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) return;
    setSubmitting(true);
    setError(null);

    const { error: dbError } = await supabase
      .from('anon_diary_inquiries')
      .insert({ email: defaultEmail || null, message: message.trim() });

    if (dbError) {
      console.error('[ContactModal] insert error:', dbError);
      setError(dbError.message);
      setSubmitting(false);
      return;
    }

    setDone(true);
    setSubmitting(false);
    setTimeout(onClose, 1800);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      onClick={onClose}
      data-testid="contact-modal-overlay"
    >
      <div
        className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
        data-testid="contact-modal"
      >
        <div className="px-6 pt-6 pb-2 flex items-center justify-between">
          <h3 className="font-bold text-foreground text-base">Contact Us</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-xl leading-none">✕</button>
        </div>

        {done ? (
          <div className="flex flex-col items-center justify-center py-10 px-6 gap-3">
            <div className="text-3xl">✅</div>
            <p className="font-semibold text-foreground text-center">Message received!</p>
            <p className="text-sm text-muted-foreground text-center">We'll get back to you as soon as possible.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="px-6 pb-6 pt-4 space-y-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Message</label>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Write your message here..."
                required
                rows={5}
                data-testid="textarea-contact-message"
                className="w-full border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary transition-colors resize-none"
              />
            </div>
            {error && (
              <p className="text-destructive text-xs">{error}</p>
            )}
            <button
              type="submit"
              disabled={submitting || !message.trim()}
              data-testid="button-submit-contact"
              className="w-full py-3 bg-primary text-white font-semibold rounded-xl disabled:opacity-50 hover:bg-primary/90 transition-colors"
            >
              {submitting ? 'Sending...' : 'Submit'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
