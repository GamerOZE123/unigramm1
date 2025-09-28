// Simplified interfaces to avoid complex type instantiation

export interface SimplePost {
  id: string;
  title: string;
  content: string;
  user_id: string;
  created_at: string;
  views_count?: number;
  likes_count?: number;
  click_count?: number;
}

export interface SimpleJob {
  id: string;
  job_title: string;
  description: string;
  location: string;
  salary_range: string;
  job_type: string;
  user_id: string;
  created_at: string;
}

export interface SimpleAuction {
  id: string;
  title: string;
  description: string;
  starting_price: number;
  current_price: number;
  image_urls: string[];
  end_time: string;
  created_at: string;
  user_id: string;
  item_name?: string;
  reserve_price?: number;
  is_active?: boolean;
  winner_id?: string;
  bid_count?: number;
}

export interface SimpleScheduledWorkout {
  id: string;
  workout_time: string;
  workouts?: any;
}

export interface SimpleWorkoutSession {
  id: string;
  session_start: string;
}

export interface SimpleWorkout {
  id: string;
  workout_name: string;
  title?: string;
  duration?: number;
  difficulty?: string;
  equipment?: string;
  calories?: string;
  workout_type?: string;
  created_at?: string;
}

export interface SimpleRecentChat {
  id: string;
  other_user_id: string;
  other_user_name: string;
  other_user_avatar: string;
  last_message: string;
  last_message_time: string;
  unread_count: number;
}

export interface SimpleTrendingHashtag {
  id: string;
  hashtag: string;
  post_count?: number;
  unique_users?: number;
  last_used?: string;
}