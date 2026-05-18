import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import type { Diary } from '@/lib/types';
import FollowingPopup from '@/components/user/FollowingPopup';
import FollowerPopup from '@/components/user/FollowerPopup';

export default function MyDiaryPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [diaries, setDiaries] = useState<Diary[]>([]);
  const [followingCount, setFollowingCount] = useState(0);
  const [followerCount, setFollowerCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showFollowing, setShowFollowing] = useState(false);
  const [showFollower, setShowFollower] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate('/login');
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;
    async function load() {
      const [diaryRes, followingRes, followerRes] = await Promise.all([
        supabase
          .from('anon_diary_diaries')
          .select('*')
          .eq('author_id', user!.id)
          .order('created_at', { ascending: false }),
        supabase.from('anon_diary_follows').select('id', { count: 'exact', head: true }).eq('follower_id', user!.id),
        supabase.from('anon_diary_follows').select('id', { count: 'exact', head: true }).eq('following_id', user!.id),
      ]);
      setDiaries(diaryRes.data || []);
      setFollowingCount(followingRes.count || 0);
      setFollowerCount(followerRes.count || 0);
      setLoading(false);
    }
    void load();
  }, [user]);

  if (authLoading || loading) {
    return (
      <div className="h-full flex items-center justify-center" data-testid="my-diary-loading">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="h-full overflow-y-auto" data-testid="my-diary-page">
      <div className="px-4 py-5">
        <div className="flex gap-6 mb-6">
          <button
            onClick={() => setShowFollowing(true)}
            data-testid="button-show-following"
            className="flex items-center gap-1 text-sm hover:text-primary transition-colors"
          >
            <span className="text-lg">⭐</span>
            <span className="font-bold text-foreground">{followingCount}</span>
            <span className="text-muted-foreground">Following</span>
          </button>
          <button
            onClick={() => setShowFollower(true)}
            data-testid="button-show-followers"
            className="flex items-center gap-1 text-sm hover:text-primary transition-colors"
          >
            <span className="text-lg">☆</span>
            <span className="font-bold text-foreground">{followerCount}</span>
            <span className="text-muted-foreground">Followers</span>
          </button>
        </div>

        {diaries.length === 0 ? (
          <div className="text-center py-16" data-testid="my-diary-empty">
            <div className="text-4xl mb-3">✏️</div>
            <p className="text-muted-foreground mb-4">No diaries yet</p>
            <button
              onClick={() => navigate('/write')}
              data-testid="button-write-first-diary"
              className="px-5 py-2 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors"
            >
              Write your first diary
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {diaries.map(diary => (
              <button
                key={diary.id}
                onClick={() => navigate(`/diary/${diary.id}`)}
                data-testid={`card-my-diary-${diary.id}`}
                className="w-full text-left bg-white border border-border rounded-2xl p-4 hover:border-primary/30 hover:shadow-sm transition-all"
              >
                <div className="font-semibold text-foreground truncate mb-1">{diary.title}</div>
                <div className="text-xs text-muted-foreground">
                  {new Date(diary.created_at).toLocaleDateString('en-US')}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <button
        onClick={() => navigate('/write')}
        data-testid="button-write-diary"
        className="fixed bottom-20 right-5 w-14 h-14 bg-primary text-white rounded-full text-2xl shadow-lg hover:shadow-xl hover:bg-primary/90 transition-all active:scale-95 flex items-center justify-center z-10"
      >
        +
      </button>

      {showFollowing && <FollowingPopup userId={user.id} onClose={() => setShowFollowing(false)} />}
      {showFollower && <FollowerPopup userId={user.id} onClose={() => setShowFollower(false)} />}
    </div>
  );
}
