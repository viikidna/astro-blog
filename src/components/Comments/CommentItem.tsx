import { useAuth } from "@/hooks/useAuth";
import { useComments } from "@/hooks/useComments";
import { useState } from "react";
import CommentForm from "./CommentForm";
import type { Comment } from "@/lib/supabase";

interface CommentItemProps {
  comment: Comment;
  postSlug: string;
  allComments: Comment[];
  replies?: Comment[];
  nestingLevel?: number;
}

export default function CommentItem({
  comment,
  postSlug,
  allComments,
  replies = [],
  nestingLevel = 0,
}: CommentItemProps) {
  const { user } = useAuth();
  const { updateComment, deleteComment, toggleReaction } = useComments(postSlug, user);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [isReplying, setIsReplying] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [reactionLoading, setReactionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAuthor = user?.id === comment.author_id;
  const hasUserReacted = true; // Placeholder - you could fetch this separately

  const handleSaveEdit = async () => {
    if (!editContent.trim()) {
      setError("Comment cannot be empty");
      return;
    }

    setSaveLoading(true);
    setError(null);

    const success = await updateComment(comment.id, editContent);
    if (success) {
      setIsEditing(false);
    } else {
      setError("Failed to update comment");
    }
    setSaveLoading(false);
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this comment?")) return;

    setDeleteLoading(true);
    setError(null);

    const success = await deleteComment(comment.id);
    if (!success) {
      setError("Failed to delete comment");
    }
    setDeleteLoading(false);
  };

  const handleReaction = async () => {
    if (!user) {
      setError("You must sign in to react");
      return;
    }

    setReactionLoading(true);
    setError(null);

    const success = await toggleReaction(comment.id);
    if (!success) {
      setError("Failed to toggle reaction");
    }
    setReactionLoading(false);
  };

  const authorName = comment.author?.user_metadata?.name || comment.author?.email?.split("@")[0] || "Anonymous";
  const createdAt = new Date(comment.created_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div
      className={`space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900/30 ${
        nestingLevel > 0 ? "ml-8" : ""
      }`}>
      {/* Author info */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white">
            {authorName.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">{authorName}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{createdAt}</p>
          </div>
        </div>
        {isAuthor && <span className="text-xs font-medium text-primary">You</span>}
      </div>

      {/* Comment content or edit form */}
      {isEditing ? (
        <div className="space-y-2">
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            rows={4}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          />
          {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
          <div className="flex gap-2">
            <button
              onClick={handleSaveEdit}
              disabled={saveLoading}
              className="rounded px-3 py-1 text-sm font-medium text-white bg-primary hover:opacity-90 disabled:opacity-50">
              {saveLoading ? "Saving..." : "Save"}
            </button>
            <button
              onClick={() => {
                setIsEditing(false);
                setEditContent(comment.content);
                setError(null);
              }}
              className="rounded px-3 py-1 text-sm font-medium text-gray-600 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-800">
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <p className="text-gray-800 dark:text-gray-200">{comment.content}</p>
      )}

      {/* Actions */}
      {!isEditing && (
        <div className="flex flex-wrap gap-4 pt-2">
          {/* Reactions */}
          <button
            onClick={handleReaction}
            disabled={reactionLoading || !user}
            className="flex items-center gap-1 text-sm text-gray-600 hover:text-primary disabled:opacity-50 dark:text-gray-400 dark:hover:text-primary">
            <span>{reactionLoading ? "..." : "👍"}</span>
            <span>{comment.reactions?.like || 0}</span>
          </button>

          {/* Reply */}
          {nestingLevel < 3 && (
            <button
              onClick={() => setIsReplying(!isReplying)}
              className="text-sm text-gray-600 hover:text-primary dark:text-gray-400 dark:hover:text-primary">
              {isReplying ? "Cancel" : "Reply"}
            </button>
          )}

          {/* Edit */}
          {isAuthor && (
            <button
              onClick={() => setIsEditing(true)}
              className="text-sm text-gray-600 hover:text-primary dark:text-gray-400 dark:hover:text-primary">
              Edit
            </button>
          )}

          {/* Delete */}
          {isAuthor && (
            <button
              onClick={handleDelete}
              disabled={deleteLoading}
              className="text-sm text-red-600 hover:text-red-700 disabled:opacity-50 dark:text-red-400">
              {deleteLoading ? "Deleting..." : "Delete"}
            </button>
          )}
        </div>
      )}

      {/* Reply form */}
      {isReplying && (
        <CommentForm
          postSlug={postSlug}
          parentCommentId={comment.id}
          onCommentAdded={() => {
            setIsReplying(false);
          }}
          isReply={true}
          onCancel={() => setIsReplying(false)}
        />
      )}

      {/* Nested replies */}
      {replies.length > 0 && (
        <div className="space-y-3 pt-3">
          {replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              postSlug={postSlug}
              allComments={allComments}
              nestingLevel={nestingLevel + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
