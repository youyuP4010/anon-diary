import { supabase } from './supabase';
import type { Diary } from './types';

export async function getFeedDiaries(userId?: string): Promise<Diary[]> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let followedIds = new Set<string>();
  if (userId) {
    const { data: followData } = await supabase
      .from('anon_diary_follows')
      .select('following_id')
      .eq('follower_id', userId);
    followedIds = new Set((followData || []).map((f: { following_id: string }) => f.following_id));
  }

  const { data: todayDiaries } = await supabase
    .from('anon_diary_diaries')
    .select('*, author:anon_diary_profiles(nickname), reactions:anon_diary_reactions(type, user_id)')
    .eq('is_hidden', false)
    .gte('created_at', today.toISOString())
    .order('created_at', { ascending: false });

  const results: Diary[] = [];
  const seenIds = new Set<string>();

  if (todayDiaries && todayDiaries.length > 0) {
    const shuffled = [...todayDiaries].sort(() => Math.random() - 0.5);
    const followed = shuffled.filter((d: Diary) => followedIds.has(d.author_id));
    const others = shuffled.filter((d: Diary) => !followedIds.has(d.author_id));
    results.push(...followed, ...others);
    shuffled.forEach((d: Diary) => seenIds.add(d.id));
  }

  if (results.length < 10) {
    const { data: recentDiaries } = await supabase
      .from('anon_diary_diaries')
      .select('*, author:anon_diary_profiles(nickname), reactions:anon_diary_reactions(type, user_id)')
      .eq('is_hidden', false)
      .order('created_at', { ascending: false })
      .limit(50);

    if (recentDiaries) {
      const notSeen = (recentDiaries as Diary[]).filter(d => !seenIds.has(d.id));
      notSeen.sort((a, b) => (b.reactions?.length || 0) - (a.reactions?.length || 0));
      const followed = notSeen.filter(d => followedIds.has(d.author_id));
      const others = notSeen.filter(d => !followedIds.has(d.author_id));
      results.push(...followed, ...others);
    }
  }

  return results;
}
