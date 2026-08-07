import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Heart, MessageCircle, Share2, Bookmark, ArrowLeft } from "lucide-react";
import { CommentsSheet } from "@/components/CommentsSheet";
import { DiscoverAdSlot } from "@/components/GoogleAd";
import { useFlip } from "@/lib/flip-store";
import {
  compact,
  useCountView,
  useEngagement,
  useFollowing,
  usePost,
  usePublicFeed,
  useToggleFollow,
} from "@/lib/data";

export const Route = createFileRoute("/watch/$postId")({
  head: () => ({
    meta: [
      { title: "Watch — Flip Chat" },
      { name: "description", content: "Watch long-form videos and shorts from Flip Chat creators." },
      { property: "og:title", content: "Watch on Flip Chat" },
      { property: "og:description", content: "Long-form videos and shorts from Flip Chat creators." },
    ],
  }),
  component: WatchPage,
});

function WatchPage() {
  const { postId } = Route.useParams();
  const { user } = useFlip();
  const navigate = useNavigate();
  const { data: post, isLoading } = usePost(postId, user?.id);
  const { data: related = [] } = usePublicFeed(user?.id);
  const { toggleLike, toggleSave } = useEngagement(user?.id);
  const { data: following } = useFollowing(user?.id);
  const follow = useToggleFollow(user?.id);
  const countView = useCountView();
  const [commentsOpen, setCommentsOpen] = useState(false);

  useEffect(() => {
    if (post) countView.mutate(post.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [post?.id]);

  const needsAccount = !user;

  if (isLoading) return <p className="p-6 text-sm text-muted-foreground">Loading…</p>;
  if (!post) return <p className="p-6 text-sm text-muted-foreground">This video is unavailable.</p>;

  const page = post.page;

  return (
    <div className="mx-auto min-h-dvh w-full max-w-[480px] bg-background pb-16">
      <div className="sticky top-0 z-20 bg-black">
        <button
          onClick={() => navigate({ to: "/discover" })}
          aria-label="Back"
          className="absolute left-3 top-3 z-10 grid h-9 w-9 place-items-center rounded-full bg-black/50"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <LongVideoPlayer src={post.media_url} poster={post.poster_url} title={post.caption} />

      </div>

      <div className="space-y-4 p-4">
        <div>
          <h1 className="text-base font-semibold">{post.caption}</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            {compact(post.views_count)} views · {post.hashtags.map((h) => `#${h}`).join(" ")}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {page ? (
            <Link to="/c/$handle" params={{ handle: page.handle }} className="flex items-center gap-3">
              <img src={page.avatar_url ?? undefined} alt="" className="h-10 w-10 rounded-full bg-surface-2 object-cover" />
              <div>
                <p className="text-sm font-semibold">{page.name}</p>
                <p className="text-xs text-muted-foreground">@{page.handle}</p>
              </div>
            </Link>
          ) : (
            <p className="text-sm font-semibold">@{post.author?.username}</p>
          )}
          {page && page.owner_id !== user?.id && (
            <button
              onClick={() =>
                needsAccount
                  ? navigate({ to: "/auth" })
                  : follow.mutate({ pageId: page.id, ownerId: page.owner_id, following: !!following?.has(page.id) })
              }
              className={`ml-auto rounded-full px-4 py-1.5 text-xs font-semibold ${
                following?.has(page.id) ? "bg-surface-2 text-muted-foreground" : "bg-gradient-brand text-primary-foreground"
              }`}
            >
              {following?.has(page.id) ? "Following" : "Follow"}
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Pill
            icon={Heart}
            label={compact(post.likes)}
            active={post.likedByMe}
            onClick={() =>
              needsAccount ? navigate({ to: "/auth" }) : toggleLike.mutate({ post, liked: post.likedByMe })
            }
          />
          <Pill
            icon={MessageCircle}
            label={compact(post.comments)}
            onClick={() => (needsAccount ? navigate({ to: "/auth" }) : setCommentsOpen(true))}
          />
          <Pill
            icon={Bookmark}
            label={post.savedByMe ? "Saved" : "Save"}
            active={post.savedByMe}
            onClick={() =>
              needsAccount ? navigate({ to: "/auth" }) : toggleSave.mutate({ postId: post.id, saved: post.savedByMe })
            }
          />
          <Pill
            icon={Share2}
            label="Share"
            onClick={() => {
              const url = window.location.href;
              if (navigator.share) void navigator.share({ url, title: post.caption ?? "Flip Chat" });
              else void navigator.clipboard.writeText(url);
            }}
          />
        </div>

        {needsAccount && (
          <Link
            to="/auth"
            className="bg-gradient-brand block rounded-2xl py-3 text-center text-sm font-semibold text-primary-foreground"
          >
            Create a free Personal Account to like and comment
          </Link>
        )}

        <DiscoverAdSlot />

        <section>
          <h2 className="mb-2 text-sm font-semibold">Up next</h2>
          <div className="space-y-2">
            {related
              .filter((p) => p.id !== post.id)
              .slice(0, 6)
              .map((p) => (
                <Link
                  key={p.id}
                  to="/watch/$postId"
                  params={{ postId: p.id }}
                  className="flex gap-3 rounded-2xl bg-surface p-2"
                >
                  <img
                    src={p.poster_url ?? p.media_url}
                    alt=""
                    loading="lazy"
                    className="h-16 w-28 shrink-0 rounded-xl bg-surface-2 object-cover"
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{p.caption}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {p.page?.name ?? p.author?.display_name} · {compact(p.views_count)} views
                    </p>
                  </div>
                </Link>
              ))}
          </div>
        </section>
      </div>

      <CommentsSheet postId={post.id} authorId={post.author_id} open={commentsOpen} onOpenChange={setCommentsOpen} />
    </div>
  );
}

function Pill({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: typeof Heart;
  label: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-medium ${
        active ? "bg-surface-2 text-brand-pink" : "bg-surface text-muted-foreground"
      }`}
    >
      <Icon className={`h-4 w-4 ${active ? "fill-brand-pink text-brand-pink" : ""}`} /> {label}
    </button>
  );
}
