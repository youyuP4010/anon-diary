import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { FollowUser } from '@/lib/types';

interface FollowerRow {
  follower_id: string;
  anon_diary_profiles: { id: string; nickname: string } | null;
}

interface FollowerPopupProps {
  userId: string;
  onClose: () => void;
}

export default function FollowerPopup({ userId, onClose }: FollowerPopupProps) {
  const [list, setList] = useState<FollowUser[]>([]);
  const [myFollows, setMyFollows] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [followersRes, followingRes] = await Promise.all([
        supabase
          .from('anon_diary_follows')
          .select('follower_id, anon_diary_profiles!anon_diary_follows_follower_id_fkey(id, nickname)')
          .eq('following_id', userId),
        supabase
          .from('anon_diary_follows')
          .select('following_id')
          .eq('follower_id', userId),
      ]);
      setList(
        ((followersRes.data || []) as unknown as FollowerRow[]).map((row) => ({
          id: row.follower_id,
          nickname: row.anon_diary_profiles?.nickname ?? 'Anonymous',
        }))
      );
      setMyFollows(new Set((followingRes.data || []).map((r: { following_id: string }) => r.following_id)));
      setLoading(false);
    }
    void load();
  }, [userId]);

  async function handleToggleFollow(targetId: string) {
    if (myFollows.has(targetId)) {
      await supabase.from('anon_diary_follows').delete().eq('follower_id', userId).eq('following_id', targetId);
      setMyFollows(prev => { const s = new Set(prev); s.delete(targetId); return s; });
    } else {
      await supabase.from('anon_diary_follows').insert({ follower_id: userId, following_id: targetId });
      setMyFollows(prev => new Set(prev).add(targetId));
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
      data-testid="follower-popup-overlay"
    >
      <div
        className="bg-white rounded-2xl w-72 max-h-96 overflow-hidden shadow-2xl flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <span className="font-bold text-foreground">Followers</span>
          <button onClick={onClose} data-testid="button-close-follower" className="text-muted-foreground hover:text-foreground">✕</button>
        </div>
        <div className="overflow-y-auto flex-1">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground text-sm">Loading...</div>
          ) : list.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">No followers yet</div>
          ) : (
            list.map(u => (
              <div key={u.id} className="flex items-center justify-between px-4 py-3 hover:bg-muted transition-colors">
                <span className="text-sm font-medium">{u.nickname}</span>
                <button
                  onClick={() => handleToggleFollow(u.id)}
                  data-testid={`button-toggle-follow-${u.id}`}
                  className="text-lg transition-transform active:scale-110"
                >
                  {myFollows.has(u.id) ? '⭐' : '☆'}
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
