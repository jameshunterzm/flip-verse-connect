import feed1 from "@/assets/feed-1.jpg";
import feed2 from "@/assets/feed-2.jpg";
import feed3 from "@/assets/feed-3.jpg";
import feed4 from "@/assets/feed-4.jpg";
import ad1 from "@/assets/ad-1.jpg";
import avatar1 from "@/assets/avatar-1.jpg";
import avatar2 from "@/assets/avatar-2.jpg";
import avatar3 from "@/assets/avatar-3.jpg";

export const media = { feed1, feed2, feed3, feed4, ad1, avatar1, avatar2, avatar3 };

export type Creator = {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  verified: boolean;
  followers: number;
  bio: string;
};

export type Clip = {
  id: string;
  kind: "clip";
  poster: string;
  creatorId: string;
  caption: string;
  hashtags: string[];
  likes: number;
  comments: number;
  shares: number;
  views: number;
  sound: string;
};

export type Ad = {
  id: string;
  kind: "ad";
  poster: string;
  advertiser: string;
  caption: string;
  cta: "Learn More" | "Install" | "Shop Now" | "Visit Website";
  allowSocial: boolean;
};

export type FeedItem = Clip | Ad;

export const creators: Creator[] = [
  {
    id: "c1",
    name: "Alex King",
    handle: "alexking",
    avatar: avatar1,
    verified: true,
    followers: 25600,
    bio: "Creating. Inspiring. Earning.\nDream big, work hard.",
  },
  {
    id: "c2",
    name: "Luna Love",
    handle: "lunalove",
    avatar: avatar2,
    verified: true,
    followers: 184200,
    bio: "Dance, light and late nights.",
  },
  {
    id: "c3",
    name: "Dre Smith",
    handle: "dresmith",
    avatar: avatar3,
    verified: false,
    followers: 9400,
    bio: "Street food hunter. Flavor first.",
  },
];

export const creatorById = (id: string) => creators.find((c) => c.id === id) ?? creators[0]!;

export const clips: Clip[] = [
  {
    id: "v1",
    kind: "clip",
    poster: feed1,
    creatorId: "c1",
    caption: "Nothing is impossible 🚀",
    hashtags: ["skate", "vibes", "fyp"],
    likes: 12400,
    comments: 345,
    shares: 1200,
    views: 1200000,
    sound: "Night Drive — Kova",
  },
  {
    id: "v2",
    kind: "clip",
    poster: feed2,
    creatorId: "c2",
    caption: "Studio at 2am hits different 💜",
    hashtags: ["dance", "neon", "flipchat"],
    likes: 98700,
    comments: 2140,
    shares: 8600,
    views: 5400000,
    sound: "Pulse — Ayo Deep",
  },
  {
    id: "v3",
    kind: "clip",
    poster: feed3,
    creatorId: "c1",
    caption: "Skyline therapy 🌆",
    hashtags: ["citylife", "sunset"],
    likes: 45300,
    comments: 890,
    shares: 3100,
    views: 2100000,
    sound: "Rooftop — Mila J",
  },
  {
    id: "v4",
    kind: "clip",
    poster: feed4,
    creatorId: "c3",
    caption: "Night market run 🔥 which one first?",
    hashtags: ["foodie", "nightmarket"],
    likes: 22100,
    comments: 540,
    shares: 990,
    views: 843000,
    sound: "Sizzle — Loop Kitchen",
  },
];

export const ads: Ad[] = [
  {
    id: "a1",
    kind: "ad",
    poster: ad1,
    advertiser: "Volt Runners",
    caption: "Step into the glow. New Volt AirFlow drops today.",
    cta: "Shop Now",
    allowSocial: true,
  },
];

/** Interleaves sponsored posts every `frequency` clips (admin-configurable). */
export function buildFeed(frequency: number, length = 16): FeedItem[] {
  const out: FeedItem[] = [];
  let sinceAd = 0;
  for (let i = 0; i < length; i++) {
    const clip = clips[i % clips.length]!;
    out.push({ ...clip, id: `${clip.id}-${i}` });
    sinceAd++;
    if (sinceAd >= frequency) {
      const ad = ads[0]!;
      out.push({ ...ad, id: `${ad.id}-${i}` });
      sinceAd = 0;
    }
  }
  return out;
}

export const trendingHashtags = [
  { tag: "flipchat", posts: "2.4M" },
  { tag: "neonnights", posts: "980K" },
  { tag: "skate", posts: "764K" },
  { tag: "dancechallenge", posts: "612K" },
  { tag: "foodie", posts: "540K" },
  { tag: "citylife", posts: "402K" },
];

export type Person = { id: string; name: string; handle: string; avatar: string };

export const incomingRequests: Person[] = [
  { id: "p1", name: "Luna Love", handle: "luna.vibes", avatar: avatar2 },
  { id: "p2", name: "Dre Smith", handle: "dre.smith", avatar: avatar3 },
  { id: "p3", name: "Maya Reign", handle: "mayareign", avatar: avatar2 },
  { id: "p4", name: "Jay World", handle: "jay.world", avatar: avatar1 },
];

export const sentRequests: Person[] = [
  { id: "p5", name: "Sara Vibes", handle: "saravibes", avatar: avatar2 },
];

export type Message = { id: string; from: "me" | "them"; text: string; time: string; read?: boolean };

export type Conversation = {
  id: string;
  person: Person;
  online: boolean;
  typing: boolean;
  messages: Message[];
};

export const conversations: Conversation[] = [
  {
    id: "t1",
    person: { id: "p1", name: "Luna Love", handle: "luna.vibes", avatar: avatar2 },
    online: true,
    typing: true,
    messages: [
      { id: "m1", from: "them", text: "Hey! 👋", time: "10:30 AM" },
      { id: "m2", from: "me", text: "Hi there! 😄", time: "10:31 AM", read: true },
      { id: "m3", from: "them", text: "How's your day going?", time: "10:33 AM" },
      { id: "m4", from: "me", text: "Pretty good! Just posted a new clip 🎬", time: "10:34 AM", read: true },
      { id: "m5", from: "them", text: "Just watched it. Awesome! 🔥", time: "10:36 AM" },
    ],
  },
  {
    id: "t2",
    person: { id: "p2", name: "Dre Smith", handle: "dre.smith", avatar: avatar3 },
    online: false,
    typing: false,
    messages: [
      { id: "m1", from: "them", text: "Night market tomorrow?", time: "Yesterday" },
      { id: "m2", from: "me", text: "I'm in 🙌", time: "Yesterday", read: true },
    ],
  },
  {
    id: "t3",
    person: { id: "p3", name: "Maya Reign", handle: "mayareign", avatar: avatar2 },
    online: true,
    typing: false,
    messages: [{ id: "m1", from: "them", text: "Sent you a photo 📸", time: "Mon" }],
  },
];

export type Notification = {
  id: string;
  type: "follow" | "request" | "accepted" | "like" | "comment" | "share" | "monetization" | "gift";
  text: string;
  time: string;
  avatar?: string;
};

export const notifications: Notification[] = [
  { id: "n1", type: "monetization", text: "You're now eligible for the Gifts Program 🎁", time: "2m" },
  { id: "n2", type: "gift", text: "Luna Love sent you 250 gems", time: "18m", avatar: avatar2 },
  { id: "n3", type: "follow", text: "Dre Smith started following your Creator Page", time: "1h", avatar: avatar3 },
  { id: "n4", type: "request", text: "Maya Reign sent you a friend request", time: "3h", avatar: avatar2 },
  { id: "n5", type: "accepted", text: "Jay World accepted your friend request", time: "5h", avatar: avatar1 },
  { id: "n6", type: "like", text: "Luna Love liked your clip", time: "8h", avatar: avatar2 },
  { id: "n7", type: "comment", text: "Dre Smith: “this is unreal 🔥”", time: "1d", avatar: avatar3 },
  { id: "n8", type: "share", text: "Your clip was shared 128 times today", time: "1d" },
];

export const personalPosts = [feed3, feed1, feed2, feed4, feed2, feed1];
export const creatorVideos = [
  { poster: feed1, views: "1.2M" },
  { poster: feed2, views: "987K" },
  { poster: feed3, views: "2.1M" },
  { poster: feed4, views: "843K" },
  { poster: feed2, views: "1.5M" },
  { poster: feed1, views: "1.3M" },
];

export const monetization = {
  gifts: {
    followers: { current: 1250, target: 1000 },
    views: { current: 620000, target: 500000, window: "60 days" },
  },
  ads: {
    followers: { current: 12450, target: 10000 },
    views: { current: 5600000, target: 5000000, window: "90 days" },
  },
  earnings: { total: 4560.75, gifts: 1840.5, ads: 2720.25, month: "This month" },
  watchTime: "412K hrs",
  revenueShare: 55,
};

export const adminUsers = [
  { id: "u1", name: "Alex King", handle: "alexking", status: "Active", creator: true, verified: true },
  { id: "u2", name: "Luna Love", handle: "lunalove", status: "Active", creator: true, verified: true },
  { id: "u3", name: "Dre Smith", handle: "dresmith", status: "Suspended", creator: true, verified: false },
  { id: "u4", name: "Maya Reign", handle: "mayareign", status: "Active", creator: false, verified: false },
];

export const adminReports = [
  { id: "r1", target: "Clip · v2 “Studio at 2am”", reason: "Copyrighted audio", reporter: "@jay.world", time: "12m" },
  { id: "r2", target: "Ad · Volt Runners", reason: "Misleading claim", reporter: "@mayareign", time: "1h" },
  { id: "r3", target: "User · @dresmith", reason: "Harassment", reporter: "@luna.vibes", time: "4h" },
];

export const adminMonetizationQueue = [
  { id: "q1", page: "Alex King", program: "Gifts", followers: "25.6K", views: "620K / 60d" },
  { id: "q2", page: "Dre Smith", program: "Gifts", followers: "9.4K", views: "410K / 60d" },
  { id: "q3", page: "Luna Love", program: "Ads", followers: "184K", views: "5.6M / 90d" },
];

export const platformStats = [
  { label: "Daily actives", value: "1.42M", delta: "+8.2%" },
  { label: "Clips posted", value: "312K", delta: "+3.1%" },
  { label: "Ad revenue", value: "$284K", delta: "+11.4%" },
  { label: "Reports open", value: "37", delta: "-12%" },
];

export const futureFeatures = [
  "Live streaming",
  "Stories",
  "AI captions",
  "AI moderation",
  "Creator subscriptions",
  "Collaborations",
  "Music library",
  "Creator marketplace",
  "Premium memberships",
];

export function compact(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return `${n}`;
}
