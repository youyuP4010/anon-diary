import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/lib/auth';
import { getFeedDiaries } from '@/lib/feedAlgorithm';
import { supabase } from '@/lib/supabase';
import type { Diary } from '@/lib/types';
import DiarySwiper from '@/components/feed/DiarySwiper';

export default function FeedPage() {
  const { user, loading: authLoading } = useAuth();
  const [diaries, setDiaries] = useState<Diary[]>([]);
  const [followedAuthorIds, setFollowedAuthorIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const loadedRef = useRef(false);

  useEffect(() => {
    if (authLoading) return;
    if (loadedRef.current) return;
    loadedRef.current = true;

    async function load() {
      setError(false);
      try {
        const data = await getFeedDiaries(user?.id);
        setDiaries(data);
        if (user) {
          const { data: follows } = await supabase
            .from('anon_diary_follows')
            .select('following_id')
            .eq('follower_id', user.id);
          setFollowedAuthorIds(new Set((follows || []).map((f: { following_id: string }) => f.following_id)));
        }
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [authLoading, user]);

  function retry() {
    loadedRef.current = false;
    setLoading(true);
    setError(false);
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center" data-testid="feed-loading">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-muted-foreground">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-4" data-testid="feed-error">
        <p className="text-muted-foreground">Failed to load</p>
        <button
          onClick={retry}
          data-testid="button-retry-feed"
          className="px-5 py-2 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="h-full" data-testid="feed-page">
      <DiarySwiper diaries={diaries} user={user} followedAuthorIds={followedAuthorIds} />
    </div>
  );
}
