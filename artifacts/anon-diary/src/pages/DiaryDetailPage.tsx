import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import type { Diary } from '@/lib/types';
import CardHeader from '@/components/diary/CardHeader';
import CardContent from '@/components/diary/CardContent';
import CardFooter from '@/components/diary/CardFooter';
import LoginModal from '@/components/common/LoginModal';
import ReportModal from '@/components/diary/ReportModal';

export default function DiaryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [diary, setDiary] = useState<Diary | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  useEffect(() => {
    if (!id) { setNotFound(true); return; }
    async function load() {
      const { data, error } = await supabase
        .from('anon_diary_diaries')
        .select('*, author:anon_diary_profiles(nickname), reactions:anon_diary_reactions(type, user_id)')
        .eq('id', id)
        .single();

      if (error || !data) { setNotFound(true); setLoading(false); return; }
      setDiary(data);

      if (user) {
        const { data: follow } = await supabase
          .from('anon_diary_follows')
          .select('id')
          .eq('follower_id', user.id)
          .eq('following_id', data.author_id)
          .single();
        setIsFollowing(!!follow);
      }
      setLoading(false);
    }
    void load();
  }, [id, user]);

  async function handleDelete() {
    if (!diary || !window.confirm('Delete this diary?')) return;
    await supabase.from('anon_diary_diaries').delete().eq('id', diary.id);
    navigate('/my');
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound || !diary) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-4" data-testid="diary-not-found">
        <div className="text-4xl">😶</div>
        <p className="text-muted-foreground">Diary not found</p>
        <button onClick={() => navigate('/')} className="px-4 py-2 bg-primary text-white rounded-xl text-sm">
          Go Home
        </button>
      </div>
    );
  }

  const isOwner = user?.id === diary.author_id;
  const reactions = diary.reactions || [];
  const happyCount = reactions.filter(r => r.type === 'happy').length;
  const sadCount = reactions.filter(r => r.type === 'sad').length;
  const userReaction = user ? (reactions.find(r => r.user_id === user.id)?.type ?? null) : null;
  const nickname = diary.author?.nickname ?? 'Anonymous';

  return (
    <div className="h-full flex flex-col" data-testid="diary-detail-page">
      {isOwner ? (
        <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-border flex-shrink-0">
          <button
            onClick={() => navigate(-1)}
            data-testid="button-back"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back
          </button>
          <div className="flex gap-2">
            <button
              onClick={() => navigate(`/write?id=${diary.id}`)}
              data-testid="button-edit-diary"
              className="px-4 py-2 border border-primary text-primary rounded-xl text-sm font-medium hover:bg-primary/10 transition-colors"
            >
              Edit
            </button>
            <button
              onClick={handleDelete}
              data-testid="button-delete-diary"
              className="px-4 py-2 bg-destructive text-white rounded-xl text-sm font-medium hover:bg-destructive/90 transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      ) : (
        <CardHeader
          diaryId={diary.id}
          authorId={diary.author_id}
          nickname={nickname}
          isFollowing={isFollowing}
          user={user}
          onLoginRequired={() => setShowLoginModal(true)}
          onFollowChange={setIsFollowing}
        />
      )}

      <CardContent
        title={diary.title}
        content={diary.content}
        backgroundType={diary.background_type}
        backgroundValue={diary.background_value}
        fontSize={diary.font_size ?? 14}
        fontColor={diary.font_color ?? '#ffffff'}
        textAlign={diary.text_align ?? 'center'}
      />

      {!isOwner && (
        <CardFooter
          diaryId={diary.id}
          createdAt={diary.created_at}
          happyCount={happyCount}
          sadCount={sadCount}
          userReaction={userReaction}
          user={user}
          onLoginRequired={() => setShowLoginModal(true)}
          onReport={() => {
            if (!user) { setShowLoginModal(true); return; }
            setShowReportModal(true);
          }}
        />
      )}

      {showLoginModal && <LoginModal onClose={() => setShowLoginModal(false)} />}
      {showReportModal && user && (
        <ReportModal diaryId={diary.id} user={user} onClose={() => setShowReportModal(false)} />
      )}
    </div>
  );
}
