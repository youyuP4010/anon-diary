export type TextAlign = 'left' | 'center' | 'right';

export type Diary = {
  id: string;
  author_id: string;
  title: string;
  content: string;
  background_type: 'color' | 'image';
  background_value: string;
  font_size: number;
  font_color: string;
  text_align: TextAlign;
  is_hidden: boolean;
  created_at: string;
  author?: { nickname: string } | null;
  reactions?: { type: string; user_id: string }[];
};

export type Profile = {
  id: string;
  nickname: string;
  created_at: string;
  updated_at: string;
};

export type FollowUser = {
  id: string;
  nickname: string;
};
