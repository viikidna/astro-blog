import { supabase, type Comment } from "@/lib/supabase";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";

export const useComments = (postSlug: string, user: User | null) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch comments for a specific post
  const fetchComments = async () => {
    try {
      setError(null);
      setLoading(true);

      const { data, error: err } = await supabase
        .from("comments")
        .select("*")
        .eq("post_slug", postSlug)
        .eq("is_deleted", false)
        .eq("is_approved", true)
        .order("created_at", { ascending: false });

      if (err) throw err;

      // Fetch author info and reactions for each comment
      const enrichedComments = await Promise.all(
        (data || []).map(async (comment) => {
          // Get author info
          const { data: userData } = await supabase.auth.admin.getUserById(comment.author_id);

          // Count reactions
          const { count: likeCount } = await supabase
            .from("comment_reactions")
            .select("*", { count: "exact", head: true })
            .eq("comment_id", comment.id)
            .eq("reaction_type", "like");

          return {
            ...comment,
            author: userData?.user,
            reactions: { like: likeCount || 0 },
          };
        })
      );

      setComments(enrichedComments);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch comments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [postSlug]);

  // Add a new comment
  const addComment = async (
    content: string,
    parentCommentId: string | null = null
  ): Promise<boolean> => {
    if (!user) {
      setError("You must be logged in to comment");
      return false;
    }

    try {
      setError(null);

      const { error: err } = await supabase.from("comments").insert({
        post_slug: postSlug,
        author_id: user.id,
        parent_comment_id: parentCommentId,
        content,
        is_approved: true, // Auto-approve for now. Change to false for moderation
      });

      if (err) throw err;
      await fetchComments();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add comment");
      return false;
    }
  };

  // Update a comment (only if user is the author)
  const updateComment = async (commentId: string, content: string): Promise<boolean> => {
    if (!user) {
      setError("You must be logged in to edit comments");
      return false;
    }

    try {
      setError(null);

      const { error: err } = await supabase
        .from("comments")
        .update({ content, updated_at: new Date().toISOString() })
        .eq("id", commentId)
        .eq("author_id", user.id);

      if (err) throw err;
      await fetchComments();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update comment");
      return false;
    }
  };

  // Delete a comment (soft delete - only if user is the author)
  const deleteComment = async (commentId: string): Promise<boolean> => {
    if (!user) {
      setError("You must be logged in to delete comments");
      return false;
    }

    try {
      setError(null);

      const { error: err } = await supabase
        .from("comments")
        .update({ is_deleted: true })
        .eq("id", commentId)
        .eq("author_id", user.id);

      if (err) throw err;
      await fetchComments();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete comment");
      return false;
    }
  };

  // Toggle reaction (like)
  const toggleReaction = async (commentId: string): Promise<boolean> => {
    if (!user) {
      setError("You must be logged in to react");
      return false;
    }

    try {
      setError(null);

      // Check if user already liked this comment
      const { data: existing } = await supabase
        .from("comment_reactions")
        .select("id")
        .eq("comment_id", commentId)
        .eq("user_id", user.id)
        .eq("reaction_type", "like")
        .single();

      if (existing) {
        // Unlike
        const { error: err } = await supabase
          .from("comment_reactions")
          .delete()
          .eq("id", existing.id);
        if (err) throw err;
      } else {
        // Like
        const { error: err } = await supabase.from("comment_reactions").insert({
          comment_id: commentId,
          user_id: user.id,
          reaction_type: "like",
        });
        if (err) throw err;
      }

      await fetchComments();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to toggle reaction");
      return false;
    }
  };

  return {
    comments,
    loading,
    error,
    fetchComments,
    addComment,
    updateComment,
    deleteComment,
    toggleReaction,
  };
};
