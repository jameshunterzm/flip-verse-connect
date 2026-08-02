import { Link } from "@tanstack/react-router";
import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  Flag,
  Music2,
  Plus,
  Check,
} from "lucide-react";
import { compact, creatorById, type FeedItem } from "@/lib/mock";
import { useFlip } from "@/lib/flip-store";

export function FeedCard({ item }: { item: FeedItem }) {
  const { liked, saved, following, toggleLike, toggleSave, toggleFollow } = useFlip();

  if (item.kind === "ad") {
    return (
      <section className="relative h-dvh w-full shrink-0 snap-start overflow-hidden">
        <img
          src={item.poster}
          alt={item.caption}
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/25 to-black/40" />
        <span className="absolute left-4 top-16 rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest backdrop-blur-md">
          Sponsored
        </span>
        <div className="absolute inset-x-0 bottom-0 p-4 pb-28">
          <p className="text-sm font-semibold">{item.advertiser}</p>
          <p className="mt-1 text-sm text-white/80">{item.caption}</p>
          <button className="bg-gradient-brand shadow-glow mt-3 w-full rounded-2xl py-3 text-sm font-semibold text-primary-foreground transition-transform active:scale-[0.98]">
            {item.cta}
          </button>
          {item.allowSocial && (
            <p className="mt-2 text-center text-[11px] text-white/50">
              Likes, comments and shares enabled by advertiser
            </p>
          )}
        </div>
      </section>
    );
  }

  const creator = creatorById(item.creatorId);
  const isLiked = liked.has(item.id);
  const isSaved = saved.has(item.id);
  const isFollowing = following.has(creator.id);

  return (
    <section className="relative h-dvh w-full shrink-0 snap-start overflow-hidden">
      <img
        src={item.poster}
        alt={item.caption}
        loading="lazy"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/50" />

      <div className="absolute bottom-28 right-3 flex flex-col items-center gap-5">
        <Link to="/creator" className="relative">
          <img
            src={creator.avatar}
            alt={creator.name}
            className="h-11 w-11 rounded-full border-2 border-white/80 object-cover"
          />
          <button
            onClick={(e) => {
              e.preventDefault();
              toggleFollow(creator.id);
            }}
            aria-label="Follow creator"
            className="bg-gradient-brand absolute -bottom-2 left-1/2 grid h-5 w-5 -translate-x-1/2 place-items-center rounded-full text-primary-foreground"
          >
            {isFollowing ? <Check className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
          </button>
        </Link>

        <Action
          icon={Heart}
          label={compact(item.likes + (isLiked ? 1 : 0))}
          active={isLiked}
          onClick={() => toggleLike(item.id)}
        />
        <Action icon={MessageCircle} label={compact(item.comments)} />
        <Action icon={Share2} label={compact(item.shares)} />
        <Action
          icon={Bookmark}
          label={isSaved ? "Saved" : "Save"}
          active={isSaved}
          onClick={() => toggleSave(item.id)}
        />
        <Action icon={Flag} label="Report" />
      </div>

      <div className="absolute inset-x-0 bottom-24 max-w-[70%] px-4">
        <p className="text-sm font-semibold">
          @{creator.handle}
          {creator.verified && <span className="ml-1 text-brand-cyan">✔</span>}
        </p>
        <p className="mt-1 text-sm text-white/90">{item.caption}</p>
        <p className="mt-1 text-xs text-brand-cyan">
          {item.hashtags.map((h) => `#${h}`).join(" ")}
        </p>
        <p className="mt-2 flex items-center gap-1.5 text-[11px] text-white/70">
          <Music2 className="h-3 w-3" /> {item.sound}
        </p>
      </div>
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
