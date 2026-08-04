import { useState } from "react";
import { X, Send } from "lucide-react";
import { useAddComment, useComments, timeAgo } from "@/lib/data";
import { useFlip } from "@/lib/flip-store";

export function CommentsSheet({
  postId,
  authorId,
  open,
  onOpenChange,
}: {
  postId: string;
  authorId: string;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { user } = useFlip();
  const { data: comments = [] } = useComments(open ? postId : undefined);
  const add = useAddComment(postId, user?.id);
  const [draft, setDraft] = useState("");
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/70" onClick={() => onOpenChange(false)}>
      <div
        className="glass-strong animate-rise mx-auto flex h-[68vh] w-full max-w-[480px] flex-col rounded-t-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold">{comments.length} comments</h2>
          <button onClick={() => onOpenChange(false)} aria-label="Close">
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
          {comments.map((c) => (
            <div key={c.id} className="flex gap-3">
              <img
                src={c.author?.avatar_url ?? "/robots.txt"}
                alt=""
                className="h-8 w-8 rounded-full bg-surface-2 object-cover"
              />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">
                  @{c.author?.username ?? "user"} · {timeAgo(c.created_at)}
                </p>
                <p className="text-sm">{c.body}</p>
              </div>
            </div>
          ))}
          {comments.length === 0 && (
            <p className="py-10 text-center text-sm text-muted-foreground">Be the first to comment.</p>
          )}
        </div>

        <div className="flex items-center gap-2 border-t border-border px-3 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={user ? "Add a comment…" : "Sign in to comment"}
            disabled={!user}
            className="min-w-0 flex-1 rounded-full bg-surface px-4 py-2.5 text-sm outline-none placeholder:text-muted-foreground"
          />
          <button
            aria-label="Send comment"
            disabled={!draft.trim() || add.isPending}
            onClick={() => {
              add.mutate(
                { body: draft.trim(), authorId },
                { onSuccess: () => setDraft("") },
              );
            }}
            className="bg-gradient-brand grid h-9 w-9 shrink-0 place-items-center rounded-full text-primary-foreground disabled:opacity-40"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
