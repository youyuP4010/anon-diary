import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';

const REASONS = ['Spam', 'Harassment', 'Inappropriate Content', 'Other'];

interface ReportModalProps {
  diaryId: string;
  user: User;
  onClose: () => void;
}

export default function ReportModal({ diaryId, user, onClose }: ReportModalProps) {
  const [selected, setSelected] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [alreadyReported, setAlreadyReported] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    async function checkExisting() {
      const { data } = await supabase
        .from('anon_diary_reports')
        .select('id')
        .eq('diary_id', diaryId)
        .eq('reporter_id', user.id)
        .maybeSingle();
      setAlreadyReported(!!data);
      setChecking(false);
    }
    void checkExisting();
  }, [diaryId, user.id]);

  async function handleSubmit() {
    if (!selected) return;
    setLoading(true);
    await supabase.from('anon_diary_reports').insert({
      diary_id: diaryId,
      reporter_id: user.id,
      reason: selected,
    });
    setDone(true);
    setLoading(false);
    setTimeout(onClose, 1400);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
      data-testid="report-modal-overlay"
    >
      <div
        className="bg-white rounded-2xl p-6 w-72 shadow-2xl"
        onClick={e => e.stopPropagation()}
        data-testid="report-modal"
      >
        {checking ? (
          <div className="flex justify-center py-6">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : alreadyReported ? (
          <div className="text-center py-4 space-y-3">
            <div className="text-3xl">⚠️</div>
            <p className="font-semibold text-foreground">Already reported</p>
            <p className="text-sm text-muted-foreground">You have already reported this diary.</p>
            <button
              onClick={onClose}
              className="w-full mt-2 py-2.5 border border-border rounded-xl text-sm text-muted-foreground hover:border-foreground/30 transition-colors"
            >
              Close
            </button>
          </div>
        ) : done ? (
          <div className="text-center py-4 space-y-2">
            <div className="text-3xl">✅</div>
            <p className="font-semibold">Report submitted</p>
          </div>
        ) : (
          <>
            <h3 className="font-bold text-foreground mb-4">Select a reason</h3>
            <div className="space-y-2 mb-5">
              {REASONS.map(r => (
                <button
                  key={r}
                  onClick={() => setSelected(r)}
                  data-testid={`button-report-reason-${r}`}
                  className={`w-full text-left px-4 py-3 rounded-xl text-sm transition-colors ${
                    selected === r ? 'bg-primary text-white' : 'bg-muted hover:bg-muted/80'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
            <button
              onClick={handleSubmit}
              disabled={!selected || loading}
              data-testid="button-submit-report"
              className="w-full bg-destructive text-white font-semibold py-3 rounded-xl disabled:opacity-50 transition-colors hover:bg-destructive/90"
            >
              {loading ? 'Submitting...' : 'Report'}
            </button>
            <button
              onClick={onClose}
              data-testid="button-cancel-report"
              className="w-full text-muted-foreground text-sm py-2 mt-2 hover:text-foreground transition-colors"
            >
              Cancel
            </button>
          </>
        )}
      </div>
    </div>
  );
}
