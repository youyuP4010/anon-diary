import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';

interface CardHeaderProps {
  diaryId: string;
  authorId: string;
  nickname: string;
  isFollowing: boolean;
  user: User | null;
  onLoginRequired: () => void;
  onFollowChange: (following: boolean) => void;
}

export default function CardHeader({
  diaryId: _diaryId,
  authorId,
  nickname,
  isFollowing,
  user,
  onLoginRequired,
  onFollowChange,
}: CardHeaderProps) {
  const [following, setFollowing] = useState(isFollowing);
  const [loading, setLoading] = useState(false);

  async function handleFollowToggle() {
    if (!user) { onLoginRequired(); return; }
    if (user.id === authorId) return;
    setLoading(true);
    if (following) {
      await supabase
        .from('anon_diary_follows')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', authorId);
      setFollowing(false);
      onFollowChange(false);
    } else {
      await supabase
        .from('anon_diary_follows')
        .insert({ follower_id: user.id, following_id: authorId });
      setFollowing(true);
      onFollowChange(true);
    }
    setLoading(false);
  }

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-white/95 backdrop-blur-sm border-b border-border/30">
      <span className="font-semibold text-foreground text-sm truncate max-w-[160px]" data-testid="text-nickname">
        {nickname}
      </span>
      <div className="flex items-center gap-2">
        {user?.id !== authorId && (
          <button
            onClick={handleFollowToggle}
            disabled={loading}
            data-testid="button-follow-toggle"
            className={`text-lg transition-transform active:scale-125 ${loading ? 'opacity-50' : ''}`}
          >
            {following ? '⭐' : '☆'}
          </button>
        )}
      </div>
    </div>
  );
}
