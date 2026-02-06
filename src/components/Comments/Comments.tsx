import { useAuth } from "@/hooks/useAuth";
import { useComments } from "@/hooks/useComments";
import { useEffect, useState } from "react";
import CommentForm from "./CommentForm";
import CommentList from "./CommentList";

interface CommentsProps {
  postSlug: string;
}

export default function Comments({ postSlug }: CommentsProps) {
  const { user, loading: authLoading } = useAuth();
  const { comments, loading: commentsLoading, error } = useComments(postSlug, user);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient || authLoading || commentsLoading) {
    return (
      <div className="space-y-4">
        <div className="h-12 w-full animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />
        <div className="space-y-2">
          <div className="h-20 w-full animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />
          <div className="h-20 w-full animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      {!user ? (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-6 dark:border-gray-700 dark:bg-gray-900/50">
          <p className="mb-4 text-gray-600 dark:text-gray-400">
            Sign in to comment on this post
          </p>
          <CommentForm
            postSlug={postSlug}
            onCommentAdded={() => {}}
            isReply={false}
          />
        </div>
      ) : (
        <CommentForm
          postSlug={postSlug}
          onCommentAdded={() => {}}
          isReply={false}
        />
      )}

      <div className="space-y-4">
        {comments.length === 0 ? (
          <p className="text-center text-gray-500 dark:text-gray-400">
            No comments yet. Be the first to comment!
          </p>
        ) : (
          <>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {comments.length} {comments.length === 1 ? "comment" : "comments"}
            </h3>
            <CommentList comments={comments} postSlug={postSlug} />
          </>
        )}
      </div>
    </div>
  );
}
