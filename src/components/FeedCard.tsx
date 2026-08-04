import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Heart, MessageCircle, Share2, Bookmark, Flag, Plus, Check } from "lucide-react";
import { ClipPlayer } from "./ClipPlayer";
import { CommentsSheet } from "./CommentsSheet";
import { useFlip } from "@/lib/flip-store";
import {
  compact,
  useEngagement,
  useFollowing,
  useReportPost,
  useToggleFollow,
  type Ad,
  type FeedPost,
} from "@/lib/data";

export function AdCard({ ad, active }: { ad: Ad; active: boolean }) {
  const isVideo = /\.(mp4|webm|mov)$/i.test(ad.media_url);
  return (
    <section className="relative h-dvh w-full shrink-0 snap-start overflow-hidden bg-black">
      {isVideo ? (
        <ClipPlayer
          src={ad.media_url}
          poster={ad.poster_url}
          active={active}
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <img src={ad.poster_url ?? ad.media_url} alt={ad.title} className="absolute inset-0 h-full w-full object-cover" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/25 to-black/40" />
      <span className="absolute left-4 top-16 rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest backdrop-blur-md">
        Sponsored
      </span>
      <div className="absolute inset-x-0 bottom-0 p-4 pb-28">
        <p className="text-sm font-semibold">{ad.advertiser}</p>
        <p className="mt-1 text-sm text-white/80">{ad.title}</p>
        <a
          href={ad.cta_url}
          target="_blank"
          rel="noreferrer noopener"
          className="bg-gradient-brand shadow-glow mt-3 block rounded-2xl py-3 text-center text-sm font-semibold text-primary-foreground"
        >
          {ad.cta_label}
        </a>
      </div>
    </section>
  );
}

export function FeedCard({ post, active }: { post: FeedPost; active: boolean }) {
  const { user } = useFlip();
  const { toggleLike, toggleSave } = useEngagement(user?.id);
  const { data: following } = useFollowing(user?.id);
  const follow = useToggleFollow(user?.id);
  const report = useReportPost(user?.id);
  const [commentsOpen, setCommentsOpen] = useState(false);

  const page = post.page;
  const handle = page?.handle ?? post.author?.username ?? "user";
  const avatar = page?.avatar_url ?? post.author?.avatar_url ?? undefined;
  const isFollowing = !!page && !!following?.has(page.id);

  return (
    <section className="relative h-dvh w-full shrink-0 snap-start overflow-hidden bg-black">
      {post.kind === "clip" ? (
        <ClipPlayer
          src={post.media_url}
          poster={post.poster_url}
          active={active}
          trimStart={post.trim_start ?? 0}
          trimEnd={post.trim_end}
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <img src={post.media_url} alt={post.caption ?? ""} className="absolute inset-0 h-full w-full object-cover" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/50" />

      <div className="absolute bottom-28 right-3 flex flex-col items-center gap-5">
        <div className="relative">
          {page ? (
            <Link to="/c/$handle" params={{ handle: page.handle }}>
              <img src={avatar} alt={handle} className="h-11 w-11 rounded-full border-2 border-white/80 bg-surface-2 object-cover" />
            </Link>
          ) : (
            <img src={avatar} alt={handle} className="h-11 w-11 rounded-full border-2 border-white/80 bg-surface-2 object-cover" />
          )}
          {page && page.owner_id !== user?.id && (
            <button
              onClick={() => follow.mutate({ pageId: page.id, ownerId: page.owner_id, following: isFollowing })}
              aria-label="Follow creator"
              className="bg-gradient-brand absolute -bottom-2 left-1/2 grid h-5 w-5 -translate-x-1/2 place-items-center rounded-full text-primary-foreground"
            >
              {isFollowing ? <Check className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
            </button>
          )}
        </div>

        <Action
          icon={Heart}
          label={compact(post.likes)}
          active={post.likedByMe}
          onClick={() => toggleLike.mutate({ post, liked: post.likedByMe })}
        />
        <Action icon={MessageCircle} label={compact(post.comments)} onClick={() => setCommentsOpen(true)} />
        <Action
          icon={Share2}
          label="Share"
          onClick={() => {
            const url = `${window.location.origin}/p/${post.id}`;
            if (navigator.share) void navigator.share({ url, title: post.caption ?? "Flip Chat" });
            else void navigator.clipboard.writeText(url);
          }}
        />
        <Action
          icon={Bookmark}
          label={post.savedByMe ? "Saved" : "Save"}
          active={post.savedByMe}
          onClick={() => toggleSave.mutate({ postId: post.id, saved: post.savedByMe })}
        />
        <Action
          icon={Flag}
          label="Report"
          onClick={() => {
            const reason = window.prompt("Why are you reporting this post?");
            if (reason) report.mutate({ postId: post.id, reason });
          }}
        />
      </div>

      <div className="absolute inset-x-0 bottom-24 max-w-[70%] px-4">
        <p className="text-sm font-semibold">
          @{handle}
          {page?.verified && <span className="ml-1 text-brand-cyan">✔</span>}
        </p>
        <p className="mt-1 text-sm text-white/90">{post.caption}</p>
        {post.hashtags.length > 0 && (
          <p className="mt-1 text-xs text-brand-cyan">{post.hashtags.map((h) => `#${h}`).join(" ")}</p>
        )}
      </div>

      <CommentsSheet
        postId={post.id}
        authorId={post.author_id}
        open={commentsOpen}
        onOpenChange={setCommentsOpen}
      />
    </section>
  );
}

function Action({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: typeof Heart;
  label: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-1 text-[11px] text-white/90">
      <Icon
        className={`h-7 w-7 transition-transform active:scale-90 ${
          active ? "animate-pop fill-brand-pink text-brand-pink" : ""
        }`}
      />
      {label}
    </button>
  );
}
