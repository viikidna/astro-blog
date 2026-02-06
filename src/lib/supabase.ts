import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase environment variables: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY"
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Comment = {
  id: string;
  post_slug: string;
  author_id: string;
  parent_comment_id: string | null;
  content: string;
  is_approved: boolean;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  author?: {
    id: string;
    email?: string;
    user_metadata?: {
      name?: string;
      avatar_url?: string;
    };
  };
  reply_count?: number;
  reactions?: {
    like: number;
  };
};

export type CommentReaction = {
  id: string;
  comment_id: string;
  user_id: string;
  reaction_type: string;
  created_at: string;
};
