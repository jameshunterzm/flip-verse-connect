import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Profile = Tables<"profiles">;
export type CreatorPage = Tables<"creator_pages">;
export type Post = Tables<"posts">;
export type Ad = Tables<"ads">;
export type Message = Tables<"messages">;

export type FeedPost = Post & {
  author: Profile | null;
  page: CreatorPage | null;
  likes: number;
  comments: number;
  likedByMe: boolean;
  savedByMe: boolean;
};

export function compact(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  return String(n);
}

export function timeAgo(iso: string) {
  const diff = Math.max(0, Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86_400) return `${Math.floor(diff / 3600)}h`;
  if (diff < 604_800) return `${Math.floor(diff / 86_400)}d`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

async function hydrate(posts: Post[], viewerId?: string): Promise<FeedPost[]> {
  if (posts.length === 0) return [];
  const ids = posts.map((p) => p.id);
  const authorIds = [...new Set(posts.map((p) => p.author_id))];
  const pageIds = [...new Set(posts.map((p) => p.creator_page_id).filter(Boolean))] as string[];

  const [profiles, pages, likes, comments, mySaves] = await Promise.all([
    supabase.from("profiles").select("*").in("id", authorIds),
    pageIds.length
      ? supabase.from("creator_pages").select("*").in("id", pageIds)
      : Promise.resolve({ data: [] as CreatorPage[] }),
    supabase.from("post_likes").select("post_id,user_id").in("post_id", ids),
    supabase.from("comments").select("post_id").in("post_id", ids),
    viewerId
      ? supabase.from("post_saves").select("post_id").in("post_id", ids)
      : Promise.resolve({ data: [] as { post_id: string }[] }),
  ]);

  const profileMap = new Map((profiles.data ?? []).map((p) => [p.id, p]));
  const pageMap = new Map((pages.data ?? []).map((p) => [p.id, p]));
  const savedSet = new Set((mySaves.data ?? []).map((s) => s.post_id));

  return posts.map((post) => {
    const postLikes = (likes.data ?? []).filter((l) => l.post_id === post.id);
    return {
      ...post,
      author: profileMap.get(post.author_id) ?? null,
      page: post.creator_page_id ? (pageMap.get(post.creator_page_id) ?? null) : null,
      likes: postLikes.length,
      comments: (comments.data ?? []).filter((c) => c.post_id === post.id).length,
      likedByMe: !!viewerId && postLikes.some((l) => l.user_id === viewerId),
      savedByMe: savedSet.has(post.id),
    };
  });
}

/* ------------------------------------------------------------------ feeds */

export function usePublicFeed(viewerId?: string) {
  return useQuery({
    queryKey: ["feed", "public", viewerId ?? "anon"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("posts")
        .select("*")
        .eq("visibility", "public")
        .eq("removed", false)
        .order("created_at", { ascending: false })
        .limit(60);
      if (error) throw error;
      return hydrate(data ?? [], viewerId);
    },
  });
}

export function useFriendsFeed(viewerId?: string) {
  return useQuery({
    enabled: !!viewerId,
    queryKey: ["feed", "friends", viewerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("posts")
        .select("*")
        .eq("visibility", "friends")
        .eq("removed", false)
        .order("created_at", { ascending: false })
        .limit(60);
      if (error) throw error;
      return hydrate(data ?? [], viewerId);
    },
  });
}

export function useMyPosts(viewerId: string | undefined, pageId?: string | null) {
  return useQuery({
    enabled: !!viewerId,
    queryKey: ["posts", "mine", viewerId, pageId ?? "personal"],
    queryFn: async () => {
      let q = supabase
        .from("posts")
        .select("*")
        .eq("author_id", viewerId!)
        .eq("removed", false)
        .order("created_at", { ascending: false });
      q = pageId ? q.eq("creator_page_id", pageId) : q.is("creator_page_id", null);
      const { data, error } = await q;
      if (error) throw error;
      return hydrate(data ?? [], viewerId);
    },
  });
}

export function useApprovedAds() {
  return useQuery({
    queryKey: ["ads", "approved"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ads")
        .select("*")
        .eq("status", "approved")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

/* ------------------------------------------------------------- engagement */

export function useEngagement(viewerId?: string) {
  const qc = useQueryClient();
  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ["feed"] });
    void qc.invalidateQueries({ queryKey: ["posts"] });
  };

  const toggleLike = useMutation({
    mutationFn: async ({ post, liked }: { post: FeedPost; liked: boolean }) => {
      if (!viewerId) throw new Error("Sign in to like posts");
      if (liked) {
        await supabase.from("post_likes").delete().eq("post_id", post.id).eq("user_id", viewerId);
      } else {
        await supabase.from("post_likes").insert({ post_id: post.id, user_id: viewerId });
        if (post.author_id !== viewerId) {
          await supabase.from("notifications").insert({
            user_id: post.author_id,
            actor_id: viewerId,
            kind: "like",
            body: "liked your post",
            post_id: post.id,
          });
        }
      }
    },
    onSuccess: invalidate,
  });

  const toggleSave = useMutation({
    mutationFn: async ({ postId, saved }: { postId: string; saved: boolean }) => {
      if (!viewerId) throw new Error("Sign in to save posts");
      if (saved) {
        await supabase.from("post_saves").delete().eq("post_id", postId).eq("user_id", viewerId);
      } else {
        await supabase.from("post_saves").insert({ post_id: postId, user_id: viewerId });
      }
    },
    onSuccess: invalidate,
  });

  return { toggleLike, toggleSave };
}

export function useComments(postId: string | undefined) {
  return useQuery({
    enabled: !!postId,
    queryKey: ["comments", postId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("comments")
        .select("*")
        .eq("post_id", postId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      const authorIds = [...new Set((data ?? []).map((c) => c.user_id))];
      const { data: profiles } = authorIds.length
        ? await supabase.from("profiles").select("*").in("id", authorIds)
        : { data: [] as Profile[] };
      const map = new Map((profiles ?? []).map((p) => [p.id, p]));
      return (data ?? []).map((c) => ({ ...c, author: map.get(c.user_id) ?? null }));
    },
  });
}

export function useAddComment(postId: string | undefined, viewerId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ body, authorId }: { body: string; authorId: string }) => {
      if (!viewerId) throw new Error("Sign in to comment");
      const { error } = await supabase
        .from("comments")
        .insert({ post_id: postId!, user_id: viewerId, body });
      if (error) throw error;
      if (authorId !== viewerId) {
        await supabase.from("notifications").insert({
          user_id: authorId,
          actor_id: viewerId,
          kind: "comment",
          body: "commented on your post",
          post_id: postId!,
        });
      }
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["comments", postId] });
      void qc.invalidateQueries({ queryKey: ["feed"] });
    },
  });
}

export function useReportPost(viewerId?: string) {
  return useMutation({
    mutationFn: async ({ postId, reason }: { postId: string; reason: string }) => {
      if (!viewerId) throw new Error("Sign in to report");
      const { error } = await supabase
        .from("reports")
        .insert({ reporter_id: viewerId, post_id: postId, reason });
      if (error) throw error;
    },
  });
}

/* --------------------------------------------------------- creator pages */

export function useCreatorPages(search = "") {
  return useQuery({
    queryKey: ["creator-pages", search],
    queryFn: async () => {
      let q = supabase.from("creator_pages").select("*").eq("suspended", false);
      if (search) q = q.or(`name.ilike.%${search}%,handle.ilike.%${search}%`);
      const { data, error } = await q.order("featured", { ascending: false }).limit(50);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useCreatorPage(handle: string | undefined) {
  return useQuery({
    enabled: !!handle,
    queryKey: ["creator-page", handle],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("creator_pages")
        .select("*")
        .eq("handle", handle!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function usePageStats(pageId: string | undefined) {
  return useQuery({
    enabled: !!pageId,
    queryKey: ["page-stats", pageId],
    queryFn: async () => {
      const [followers, posts] = await Promise.all([
        supabase.from("follows").select("follower_id", { count: "exact", head: true }).eq("page_id", pageId!),
        supabase.from("posts").select("id,views_count").eq("creator_page_id", pageId!).eq("removed", false),
      ]);
      const postIds = (posts.data ?? []).map((p) => p.id);
      const { count: likeCount } = postIds.length
        ? await supabase
            .from("post_likes")
            .select("post_id", { count: "exact", head: true })
            .in("post_id", postIds)
        : { count: 0 };
      return {
        followers: followers.count ?? 0,
        posts: postIds.length,
        views: (posts.data ?? []).reduce((sum, p) => sum + (p.views_count ?? 0), 0),
        likes: likeCount ?? 0,
      };
    },
  });
}

export function useFollowing(viewerId?: string) {
  return useQuery({
    enabled: !!viewerId,
    queryKey: ["following", viewerId],
    queryFn: async () => {
      const { data } = await supabase.from("follows").select("page_id").eq("follower_id", viewerId!);
      return new Set((data ?? []).map((f) => f.page_id));
    },
  });
}

export function useToggleFollow(viewerId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      pageId,
      ownerId,
      following,
    }: {
      pageId: string;
      ownerId: string;
      following: boolean;
    }) => {
      if (!viewerId) throw new Error("Sign in to follow creators");
      if (following) {
        await supabase.from("follows").delete().eq("page_id", pageId).eq("follower_id", viewerId);
      } else {
        await supabase.from("follows").insert({ page_id: pageId, follower_id: viewerId });
        if (ownerId !== viewerId) {
          await supabase.from("notifications").insert({
            user_id: ownerId,
            actor_id: viewerId,
            kind: "follow",
            body: "started following your Creator Page",
          });
        }
      }
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["following"] });
      void qc.invalidateQueries({ queryKey: ["page-stats"] });
    },
  });
}

/* -------------------------------------------------------------- friends */

export function useFriends(viewerId?: string) {
  return useQuery({
    enabled: !!viewerId,
    queryKey: ["friends", viewerId],
    queryFn: async () => {
      const { data } = await supabase.from("friendships").select("friend_id").eq("user_id", viewerId!);
      const ids = (data ?? []).map((f) => f.friend_id);
      if (!ids.length) return [] as Profile[];
      const { data: profiles } = await supabase.from("profiles").select("*").in("id", ids);
      return profiles ?? [];
    },
  });
}

export function useFriendRequests(viewerId?: string) {
  return useQuery({
    enabled: !!viewerId,
    queryKey: ["friend-requests", viewerId],
    queryFn: async () => {
      const { data } = await supabase
        .from("friend_requests")
        .select("*")
        .eq("status", "pending")
        .order("created_at", { ascending: false });
      const rows = data ?? [];
      const ids = [...new Set(rows.flatMap((r) => [r.from_user, r.to_user]))];
      const { data: profiles } = ids.length
        ? await supabase.from("profiles").select("*").in("id", ids)
        : { data: [] as Profile[] };
      const map = new Map((profiles ?? []).map((p) => [p.id, p]));
      return {
        received: rows
          .filter((r) => r.to_user === viewerId)
          .map((r) => ({ ...r, person: map.get(r.from_user) ?? null })),
        sent: rows
          .filter((r) => r.from_user === viewerId)
          .map((r) => ({ ...r, person: map.get(r.to_user) ?? null })),
      };
    },
  });
}

export function useBlocked(viewerId?: string) {
  return useQuery({
    enabled: !!viewerId,
    queryKey: ["blocked", viewerId],
    queryFn: async () => {
      const { data } = await supabase.from("blocks").select("blocked_id").eq("blocker_id", viewerId!);
      const ids = (data ?? []).map((b) => b.blocked_id);
      if (!ids.length) return [] as Profile[];
      const { data: profiles } = await supabase.from("profiles").select("*").in("id", ids);
      return profiles ?? [];
    },
  });
}

export function useFriendActions(viewerId?: string) {
  const qc = useQueryClient();
  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ["friends"] });
    void qc.invalidateQueries({ queryKey: ["friend-requests"] });
    void qc.invalidateQueries({ queryKey: ["blocked"] });
    void qc.invalidateQueries({ queryKey: ["threads"] });
  };

  const sendRequest = useMutation({
    mutationFn: async (toUser: string) => {
      if (!viewerId) throw new Error("Sign in first");
      const { error } = await supabase
        .from("friend_requests")
        .insert({ from_user: viewerId, to_user: toUser });
      if (error) throw error;
      await supabase.from("notifications").insert({
        user_id: toUser,
        actor_id: viewerId,
        kind: "friend_request",
        body: "sent you a friend request",
      });
    },
    onSuccess: invalidate,
  });

  const accept = useMutation({
    mutationFn: async (requestId: string) => {
      const { error } = await supabase.rpc("accept_friend_request", { _request_id: requestId });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const decline = useMutation({
    mutationFn: async (requestId: string) => {
      const { error } = await supabase.from("friend_requests").delete().eq("id", requestId);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const removeFriend = useMutation({
    mutationFn: async (otherId: string) => {
      const { error } = await supabase.rpc("remove_friend", { _other: otherId });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const blockUser = useMutation({
    mutationFn: async (otherId: string) => {
      if (!viewerId) throw new Error("Sign in first");
      await supabase.rpc("remove_friend", { _other: otherId });
      const { error } = await supabase
        .from("blocks")
        .insert({ blocker_id: viewerId, blocked_id: otherId });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const unblock = useMutation({
    mutationFn: async (otherId: string) => {
      const { error } = await supabase
        .from("blocks")
        .delete()
        .eq("blocker_id", viewerId!)
        .eq("blocked_id", otherId);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  return { sendRequest, accept, decline, removeFriend, blockUser, unblock };
}

export function useSearchPeople(query: string, viewerId?: string) {
  return useQuery({
    enabled: query.trim().length > 1,
    queryKey: ["people", query, viewerId],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
        .neq("id", viewerId ?? "00000000-0000-0000-0000-000000000000")
        .limit(20);
      return data ?? [];
    },
  });
}

/* ------------------------------------------------------------- messaging */

export type Thread = { person: Profile; last: Message | null; unread: number };

export function useThreads(viewerId?: string) {
  return useQuery({
    enabled: !!viewerId,
    queryKey: ["threads", viewerId],
    queryFn: async (): Promise<Thread[]> => {
      const [{ data: friendRows }, { data: msgs }] = await Promise.all([
        supabase.from("friendships").select("friend_id").eq("user_id", viewerId!),
        supabase.from("messages").select("*").order("created_at", { ascending: false }).limit(500),
      ]);
      const ids = (friendRows ?? []).map((f) => f.friend_id);
      if (!ids.length) return [];
      const { data: profiles } = await supabase.from("profiles").select("*").in("id", ids);
      return (profiles ?? []).map((person) => {
        const thread = (msgs ?? []).filter(
          (m) =>
            (m.sender_id === viewerId && m.recipient_id === person.id) ||
            (m.sender_id === person.id && m.recipient_id === viewerId),
        );
        return {
          person,
          last: thread[0] ?? null,
          unread: thread.filter((m) => m.recipient_id === viewerId && !m.read_at).length,
        };
      });
    },
  });
}

export function useConversation(viewerId: string | undefined, otherId: string | undefined) {
  return useQuery({
    enabled: !!viewerId && !!otherId,
    queryKey: ["conversation", viewerId, otherId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .or(
          `and(sender_id.eq.${viewerId},recipient_id.eq.${otherId}),and(sender_id.eq.${otherId},recipient_id.eq.${viewerId})`,
        )
        .order("created_at", { ascending: true });
      if (error) throw error;
      const unread = (data ?? []).filter((m) => m.recipient_id === viewerId && !m.read_at);
      if (unread.length) {
        await supabase
          .from("messages")
          .update({ read_at: new Date().toISOString() })
          .in(
            "id",
            unread.map((m) => m.id),
          );
      }
      return data ?? [];
    },
  });
}

export function useSendMessage(viewerId: string | undefined, otherId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { body?: string; image_url?: string; audio_url?: string }) => {
      if (!viewerId || !otherId) throw new Error("Sign in first");
      const { error } = await supabase
        .from("messages")
        .insert({ sender_id: viewerId, recipient_id: otherId, ...payload });
      if (error) throw error;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["conversation", viewerId, otherId] });
      void qc.invalidateQueries({ queryKey: ["threads"] });
    },
  });
}

/* --------------------------------------------------------- notifications */

export function useNotifications(viewerId?: string) {
  return useQuery({
    enabled: !!viewerId,
    queryKey: ["notifications", viewerId],
    queryFn: async () => {
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(60);
      const rows = data ?? [];
      const ids = [...new Set(rows.map((n) => n.actor_id).filter(Boolean))] as string[];
      const { data: profiles } = ids.length
        ? await supabase.from("profiles").select("*").in("id", ids)
        : { data: [] as Profile[] };
      const map = new Map((profiles ?? []).map((p) => [p.id, p]));
      return rows.map((n) => ({ ...n, actor: n.actor_id ? (map.get(n.actor_id) ?? null) : null }));
    },
  });
}

export function useMarkNotificationsRead(viewerId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!viewerId) return;
      await supabase.from("notifications").update({ read: true }).eq("user_id", viewerId).eq("read", false);
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
}

/* ---------------------------------------------------------- platform/admin */

export function usePlatformSettings() {
  return useQuery({
    queryKey: ["platform-settings"],
    queryFn: async () => {
      const { data } = await supabase.from("platform_settings").select("*").maybeSingle();
      return data;
    },
  });
}

export function useAdminData(enabled: boolean) {
  return useQuery({
    enabled,
    queryKey: ["admin-data"],
    queryFn: async () => {
      const [profiles, pages, reports, ads, posts] = await Promise.all([
        supabase.from("profiles").select("*").order("created_at", { ascending: false }).limit(100),
        supabase.from("creator_pages").select("*").order("created_at", { ascending: false }).limit(100),
        supabase.from("reports").select("*").order("created_at", { ascending: false }).limit(100),
        supabase.from("ads").select("*").order("created_at", { ascending: false }).limit(100),
        supabase.from("posts").select("id,views_count,removed"),
      ]);
      return {
        profiles: profiles.data ?? [],
        pages: pages.data ?? [],
        reports: reports.data ?? [],
        ads: ads.data ?? [],
        totalPosts: (posts.data ?? []).filter((p) => !p.removed).length,
        totalViews: (posts.data ?? []).reduce((s, p) => s + (p.views_count ?? 0), 0),
      };
    },
  });
}

export function useAdminActions() {
  const qc = useQueryClient();
  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ["admin-data"] });
    void qc.invalidateQueries({ queryKey: ["platform-settings"] });
    void qc.invalidateQueries({ queryKey: ["ads"] });
  };
  return {
    setSettings: useMutation({
      mutationFn: async (patch: Partial<Tables<"platform_settings">>) => {
        const { error } = await supabase.from("platform_settings").update(patch).eq("id", true);
        if (error) throw error;
      },
      onSuccess: invalidate,
    }),
    setAdStatus: useMutation({
      mutationFn: async ({ id, status }: { id: string; status: "approved" | "rejected" | "pending" }) => {
        const { error } = await supabase.from("ads").update({ status }).eq("id", id);
        if (error) throw error;
      },
      onSuccess: invalidate,
    }),
    updatePage: useMutation({
      mutationFn: async ({ id, patch }: { id: string; patch: Partial<CreatorPage> }) => {
        const { error } = await supabase.from("creator_pages").update(patch).eq("id", id);
        if (error) throw error;
      },
      onSuccess: invalidate,
    }),
    suspendUser: useMutation({
      mutationFn: async ({ id, suspended }: { id: string; suspended: boolean }) => {
        const { error } = await supabase.from("profiles").update({ suspended }).eq("id", id);
        if (error) throw error;
      },
      onSuccess: invalidate,
    }),
    removePost: useMutation({
      mutationFn: async (postId: string) => {
        const { error } = await supabase.from("posts").update({ removed: true }).eq("id", postId);
        if (error) throw error;
      },
      onSuccess: invalidate,
    }),
    resolveReport: useMutation({
      mutationFn: async (id: string) => {
        const { error } = await supabase.from("reports").update({ resolved: true }).eq("id", id);
        if (error) throw error;
      },
      onSuccess: invalidate,
    }),
  };
}
