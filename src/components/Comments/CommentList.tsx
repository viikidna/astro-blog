import CommentItem from "./CommentItem";
import type { Comment } from "@/lib/supabase";

interface CommentListProps {
  comments: Comment[];
  postSlug: string;
}

export default function CommentList({ comments, postSlug }: CommentListProps) {
  // Build nested comment structure
  const buildCommentTree = (allComments: Comment[]) => {
    const commentMap = new Map<string, Comment & { replies: Comment[] }>();

    // Initialize all comments
    allComments.forEach((comment) => {
      commentMap.set(comment.id, { ...comment, replies: [] });
    });

    // Build parent-child relationships
    const topLevelComments: (Comment & { replies: Comment[] })[] = [];
    allComments.forEach((comment) => {
      const commentWithReplies = commentMap.get(comment.id)!;

      if (comment.parent_comment_id) {
        const parent = commentMap.get(comment.parent_comment_id);
        if (parent) {
          parent.replies.push(commentWithReplies);
        }
      } else {
        topLevelComments.push(commentWithReplies);
      }
    });

    // Sort by creation date (newest first)
    topLevelComments.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    return topLevelComments;
  };

  const commentTree = buildCommentTree(comments);

  return (
    <div className="space-y-4">
      {commentTree.map((comment) => (
        <CommentItem
          key={comment.id}
          comment={comment}
          postSlug={postSlug}
          allComments={comments}
          replies={comment.replies}
        />
      ))}
    </div>
  );
}
