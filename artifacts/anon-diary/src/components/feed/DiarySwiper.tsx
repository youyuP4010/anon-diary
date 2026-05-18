import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import type { User } from '@supabase/supabase-js';
import type { Diary } from '@/lib/types';
import DiaryCard from './DiaryCard';

interface DiarySwiperProps {
  diaries: Diary[];
  user: User | null;
  followedAuthorIds: Set<string>;
}

export default function DiarySwiper({ diaries, user, followedAuthorIds }: DiarySwiperProps) {
  if (diaries.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-8" data-testid="feed-empty">
        <div className="text-5xl mb-4">📖</div>
        <h3 className="text-lg font-semibold text-foreground mb-2">아직 일기가 없어요</h3>
        <p className="text-muted-foreground text-sm">첫 번째 일기를 작성해보세요!</p>
      </div>
    );
  }

  return (
    <Swiper
      direction="horizontal"
      slidesPerView={1}
      spaceBetween={0}
      nested
      touchStartPreventDefault={false}
      style={{ height: '100%', width: '100%' }}
      data-testid="diary-swiper"
    >
      {diaries.map(diary => (
        <SwiperSlide key={diary.id} style={{ height: '100%' }}>
          <DiaryCard
            diary={diary}
            user={user}
            initialIsFollowing={followedAuthorIds.has(diary.author_id)}
          />
        </SwiperSlide>
      ))}
    </Swiper>
  );
}
