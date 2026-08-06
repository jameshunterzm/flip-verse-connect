import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Program = "gifts" | "ads";

/** Program thresholds: followers AND (watch hours OR short views). */
export const PROGRAM_RULES = {
  gifts: { followers: 2_000, watchHours: 4_000, shortViews: 5_000_000, label: "Gifts, donations & memberships" },
  ads: { followers: 7_000, watchHours: 6_000, shortViews: 12_000_000, label: "Ads revenue sharing" },
} as const;

export type MonetizationStats = {
  followers: number;
  watchHours: number;
  shortViews: number;
};

/** Followers, public watch hours (12 months) and short views (3 months). */
export function useMonetizationStats(pageId: string | undefined) {
  return useQuery({
    enabled: !!pageId,
    queryKey: ["monetization-stats", pageId],
    queryFn: async (): Promise<MonetizationStats> => {
      const yearAgo = new Date(Date.now() - 365 * 864e5).toISOString();
      const quarterAgo = new Date(Date.now() - 90 * 864e5).toISOString();
      const [followers, posts] = await Promise.all([
        supabase.from("follows").select("follower_id", { count: "exact", head: true }).eq("page_id", pageId!),
        supabase
          .from("posts")
          .select("format,views_count,watch_seconds,created_at")
          .eq("creator_page_id", pageId!)
          .eq("visibility", "public")
          .eq("removed", false)
          .gte("created_at", yearAgo),
      ]);
      const rows = posts.data ?? [];
      const watchSeconds = rows.reduce((s, p) => s + Number(p.watch_seconds ?? 0), 0);
      const shortViews = rows
        .filter((p) => p.format === "short" && p.created_at >= quarterAgo)
        .reduce((s, p) => s + (p.views_count ?? 0), 0);
      return { followers: followers.count ?? 0, watchHours: watchSeconds / 3600, shortViews };
    },
  });
}

export function isEligible(program: Program, stats?: MonetizationStats) {
  if (!stats) return false;
  const rule = PROGRAM_RULES[program];
  return (
    stats.followers >= rule.followers &&
    (stats.watchHours >= rule.watchHours || stats.shortViews >= rule.shortViews)
  );
}

export function useMyApplications(pageId: string | undefined) {
  return useQuery({
    enabled: !!pageId,
    queryKey: ["monetization-apps", pageId],
    queryFn: async () => {
      const { data } = await supabase
        .from("monetization_applications")
        .select("*")
        .eq("page_id", pageId!)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });
}

export function useApplyForProgram(pageId: string | undefined, ownerId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (program: Program) => {
      if (!pageId || !ownerId) throw new Error("Create a Creator Page first");
      const { error } = await supabase
        .from("monetization_applications")
        .insert({ page_id: pageId, owner_id: ownerId, program });
      if (error) throw error;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["monetization-apps", pageId] }),
  });
}

/* --------------------------------------------------------------- admin side */

export type AdminApplication = Tables<"monetization_applications"> & {
  page?: { name: string; handle: string } | null;
};

export function useAdminApplications(enabled: boolean) {
  return useQuery({
    enabled,
    queryKey: ["admin-monetization-apps"],
    queryFn: async (): Promise<AdminApplication[]> => {
      const { data } = await supabase
        .from("monetization_applications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      const apps = data ?? [];
      if (apps.length === 0) return [];
      const { data: pages } = await supabase
        .from("creator_pages")
        .select("id,name,handle")
        .in("id", [...new Set(apps.map((a) => a.page_id))]);
      const byId = new Map((pages ?? []).map((p) => [p.id, p]));
      return apps.map((a) => ({ ...a, page: byId.get(a.page_id) ?? null }));
    },
  });
}

export function useReviewApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "approved" | "rejected" }) => {
      const { data: auth } = await supabase.auth.getUser();
      const { error } = await supabase
        .from("monetization_applications")
        .update({ status, reviewed_at: new Date().toISOString(), reviewed_by: auth.user?.id ?? null })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["admin-monetization-apps"] });
      void qc.invalidateQueries({ queryKey: ["monetization-apps"] });
    },
  });
}
