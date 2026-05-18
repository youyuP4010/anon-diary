import { useState, useRef, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';

interface CardFooterProps {
  diaryId: string;
  createdAt: string;
  happyCount: number;
  sadCount: number;
  userReaction: string | null;
  user: User | null;
  onLoginRequired: () => void;
  onReport: () => void;
}

export default function CardFooter({
  diaryId,
  createdAt,
  happyCount,
  sadCount,
  userReaction,
  user,
  onLoginRequired,
  onReport,
}: CardFooterProps) {
  const [happy, setHappy] = useState(happyCount);
  const [sad, setSad] = useState(sadCount);
  const [myReaction, setMyReaction] = useState<string | null>(userReaction);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  async function handleReact(type: 'happy' | 'sad') {
    if (!user) { onLoginRequired(); return; }

    if (myReaction === type) {
      await supabase.from('anon_diary_reactions').delete().eq('diary_id', diaryId).eq('user_id', user.id);
      setMyReaction(null);
      if (type === 'happy') setHappy(h => Math.max(0, h - 1));
      else setSad(s => Math.max(0, s - 1));
    } else {
      if (myReaction) {
        await supabase.from('anon_diary_reactions').delete().eq('diary_id', diaryId).eq('user_id', user.id);
        if (myReaction === 'happy') setHappy(h => Math.max(0, h - 1));
        else setSad(s => Math.max(0, s - 1));
      }
      const { error } = await supabase.from('anon_diary_reactions').insert({ diary_id: diaryId, user_id: user.id, type });
      if (!error) {
        setMyReaction(type);
        if (type === 'happy') setHappy(h => h + 1);
        else setSad(s => s + 1);
      }
    }
  }

  function handleShare() {
    const url = `${window.location.origin}/diary/${diaryId}`;
    if (navigator.share) {
      navigator.share({ url });
    } else {
      navigator.clipboard.writeText(url);
    }
    setMenuOpen(false);
  }

  const dateStr = new Date(createdAt).toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' });

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-white/95 backdrop-blur-sm border-t border-border/30">
      <span className="text-xs text-muted-foreground" data-testid="text-diary-date">{dateStr}</span>
      <div className="flex items-center gap-3">
        <button
          onClick={() => handleReact('happy')}
          data-testid="button-react-happy"
          className={`flex items-center gap-1 text-sm px-2 py-1 rounded-full transition-all active:scale-110 ${
            myReaction === 'happy' ? 'bg-primary/10 text-primary font-semibold' : 'hover:bg-muted'
          }`}
        >
          <span>😊</span>
          <span className="text-xs">{happy}</span>
        </button>
        <button
          onClick={() => handleReact('sad')}
          data-testid="button-react-sad"
          className={`flex items-center gap-1 text-sm px-2 py-1 rounded-full transition-all active:scale-110 ${
            myReaction === 'sad' ? 'bg-blue-50 text-blue-500 font-semibold' : 'hover:bg-muted'
          }`}
        >
          <span>😢</span>
          <span className="text-xs">{sad}</span>
        </button>
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(o => !o)}
            data-testid="button-more-menu"
            className="text-muted-foreground hover:text-foreground px-1 py-1 rounded transition-colors"
          >
            ···
          </button>
          {menuOpen && (
            <div className="absolute right-0 bottom-full mb-1 bg-white border border-border rounded-xl shadow-lg overflow-hidden z-10 w-32">
              <button
                onClick={() => { onReport(); setMenuOpen(false); }}
                data-testid="button-report"
                className="w-full text-left px-4 py-3 text-sm hover:bg-muted transition-colors text-destructive"
              >
                Report
              </button>
              <button
                onClick={handleShare}
                data-testid="button-share"
                className="w-full text-left px-4 py-3 text-sm hover:bg-muted transition-colors"
              >
                Share
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
