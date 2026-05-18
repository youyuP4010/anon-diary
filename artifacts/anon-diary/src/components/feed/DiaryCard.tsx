import { useState } from 'react';
import type { User } from '@supabase/supabase-js';
import type { Diary } from '@/lib/types';
import { supabase } from '@/lib/supabase';
import CardHeader from '@/components/diary/CardHeader';
import CardContent from '@/components/diary/CardContent';
import CardFooter from '@/components/diary/CardFooter';
import LoginModal from '@/components/common/LoginModal';
import ReportModal from '@/components/diary/ReportModal';

interface DiaryCardProps {
  diary: Diary;
  user: User | null;
  initialIsFollowing: boolean;
}

export default function DiaryCard({ diary, user, initialIsFollowing }: DiaryCardProps) {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);

  const reactions = diary.reactions || [];
  const happyCount = reactions.filter(r => r.type === 'happy').length;
  const sadCount = reactions.filter(r => r.type === 'sad').length;
  const userReaction = user ? (reactions.find(r => r.user_id === user.id)?.type ?? null) : null;
  const nickname = diary.author?.nickname ?? '익명';

  async function ensureProfile() {
    if (!user) return;
    const { data } = await supabase
      .from('anon_diary_profiles')
      .select('id')
      .eq('id', user.id)
      .single();
    if (!data) {
      await supabase.from('anon_diary_profiles').insert({
        id: user.id,
        nickname: user.email?.split('@')[0] ?? '익명',
      });
    }
  }

  void ensureProfile();

  return (
    <div className="h-full flex flex-col overflow-hidden" data-testid={`card-diary-${diary.id}`}>
      <CardHeader
        diaryId={diary.id}
        authorId={diary.author_id}
        nickname={nickname}
        isFollowing={isFollowing}
        user={user}
        onLoginRequired={() => setShowLoginModal(true)}
        onFollowChange={setIsFollowing}
      />
      <CardContent
        title={diary.title}
        content={diary.content}
        backgroundType={diary.background_type}
        backgroundValue={diary.background_value}
        fontSize={diary.font_size ?? 14}
        fontColor={diary.font_color ?? '#ffffff'}
        textAlign={diary.text_align ?? 'center'}
      />
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
      {showLoginModal && <LoginModal onClose={() => setShowLoginModal(false)} />}
      {showReportModal && user && (
        <ReportModal diaryId={diary.id} user={user} onClose={() => setShowReportModal(false)} />
      )}
    </div>
  );
}
