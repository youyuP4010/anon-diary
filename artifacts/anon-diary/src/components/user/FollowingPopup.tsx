import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { FollowUser } from '@/lib/types';

interface FollowingPopupProps {
  userId: string;
  onClose: () => void;
}

export default function FollowingPopup({ userId, onClose }: FollowingPopupProps) {
  const [list, setList] = useState<FollowUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('anon_diary_follows')
        .select('following_id, anon_diary_profiles!anon_diary_follows_following_id_fkey(id, nickname)')
        .eq('follower_id', userId);
      setList(
        ((data || []) as unknown as { following_id: string; anon_diary_profiles: { id: string; nickname: string } | null }[]).map((row) => ({
          id: row.following_id,
          nickname: row.anon_diary_profiles?.nickname ?? 'Anonymous',
        }))
      );
      setLoading(false);
    }
    void load();
  }, [userId]);

  async function handleUnfollow(targetId: string) {
    await supabase
      .from('anon_diary_follows')
      .delete()
      .eq('follower_id', userId)
      .eq('following_id', targetId);
    setList(prev => prev.filter(u => u.id !== targetId));
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
      data-testid="following-popup-overlay"
    >
      <div
        className="bg-white rounded-2xl w-72 max-h-96 overflow-hidden shadow-2xl flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <span className="font-bold text-foreground">Following</span>
          <button onClick={onClose} data-testid="button-close-following" className="text-muted-foreground hover:text-foreground">✕</button>
        </div>
        <div className="overflow-y-auto flex-1">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground text-sm">Loading...</div>
          ) : list.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">Not following anyone yet</div>
          ) : (
            list.map(u => (
              <div key={u.id} className="flex items-center justify-between px-4 py-3 hover:bg-muted transition-colors">
                <span className="text-sm font-medium">{u.nickname}</span>
                <button
                  onClick={() => handleUnfollow(u.id)}
                  data-testid={`button-unfollow-${u.id}`}
                  className="text-lg transition-transform active:scale-110"
                >
                  ⭐
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
