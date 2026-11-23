export interface CoupleMember {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface CoupleSettings {
  id: string;
  is_singleton: boolean;
  couple_title: string;
  anniversary_date: string;
  background_music_url: string | null;
  background_music_title: string | null;
  proposal_question: string;
  proposal_subtext: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Album {
  id: string;
  title: string;
  description: string | null;
  cover_path: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Photo {
  id: string;
  album_id: string | null;
  storage_path: string;
  caption: string | null;
  taken_at: string;
  favorite_by: string[];
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface PhotoReaction {
  id: string;
  photo_id: string;
  emoji: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface TimeCapsuleSafe {
  id: string;
  title: string;
  content: string | null;
  is_readable: boolean;
  is_unlocked: boolean;
  unlock_at: string;
  opened_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Reason {
  id: string;
  content: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface TimelineItem {
  id: string;
  event_date: string;
  title: string;
  story: string | null;
  photo_path: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface LoveLetter {
  id: string;
  title: string;
  body: string;
  is_opened: boolean;
  opened_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correct_index: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface QuizAnswer {
  id: string;
  quiz_id: string;
  selected_index: number;
  is_correct: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export type WishlistCategory = 'makan' | 'jalan-jalan' | 'film' | 'rumah' | 'lainnya';

export interface WishlistItem {
  id: string;
  title: string;
  category: WishlistCategory | string;
  target_date: string | null;
  notes: string | null;
  is_done: boolean;
  done_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface SongItem {
  id: string;
  title: string;
  artist: string | null;
  url: string;
  reason: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CountdownItem {
  id: string;
  title: string;
  target_at: string;
  emoji: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface SharedNote {
  id: string;
  title: string;
  content: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  event_date: string;
  category: string;
  reminder_note: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface JournalEntry {
  id: string;
  entry_date: string;
  title: string;
  content: string;
  mood_emoji: string | null;
  is_private: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  content: string | null;
  photo_path: string | null;
  read_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  _optimistic?: boolean;
}

export interface MoodItem {
  id: string;
  emoji: string;
  note: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface HugEvent {
  id: string;
  kind: 'peluk' | 'cium' | string;
  message: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ActivityFeedItem {
  id: string;
  type: 'photo' | 'chat' | 'mood' | 'hug' | 'timeline' | 'wishlist' | 'letter' | 'note' | 'capsule';
  label: string;
  route: string;
  created_by: string | null;
  created_at: string;
}
