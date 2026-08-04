import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type AccountMode = "personal" | "creator";
export type Profile = Tables<"profiles">;
export type CreatorPage = Tables<"creator_pages">;

type Store = {
  loading: boolean;
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  creatorPage: CreatorPage | null;
  hasCreatorPage: boolean;
  isAdmin: boolean;
  mode: AccountMode;
  setMode: (m: AccountMode) => void;
  adFrequency: number;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
};

const StoreContext = createContext<Store | null>(null);

export function FlipStoreProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [creatorPage, setCreatorPage] = useState<CreatorPage | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adFrequency, setAdFrequency] = useState(6);
  const [mode, setModeState] = useState<AccountMode>("personal");

  const loadFor = useCallback(async (userId: string | undefined) => {
    if (!userId) {
      setProfile(null);
      setCreatorPage(null);
      setIsAdmin(false);
      setModeState("personal");
      return;
    }
    const [profileRes, pageRes, roleRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
      supabase.from("creator_pages").select("*").eq("owner_id", userId).maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", userId),
    ]);
    setProfile(profileRes.data ?? null);
    setCreatorPage(pageRes.data ?? null);
    setIsAdmin((roleRes.data ?? []).some((r) => r.role === "admin"));
    if (!pageRes.data) setModeState("personal");
  }, []);

  useEffect(() => {
    let active = true;

    const { data: sub } = supabase.auth.onAuthStateChange((event, next) => {
      if (!active) return;
      setSession(next);
      if (event === "SIGNED_OUT") {
        void loadFor(undefined);
        queryClient.clear();
      }
    });

    void (async () => {
      const { data } = await supabase.auth.getSession();
      if (!active) return;
      setSession(data.session);
      await loadFor(data.session?.user.id);
      const { data: settings } = await supabase
        .from("platform_settings")
        .select("ad_frequency")
        .maybeSingle();
      if (settings?.ad_frequency) setAdFrequency(settings.ad_frequency);
      if (active) setLoading(false);
    })();

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [loadFor, queryClient]);

  const userId = session?.user.id;
  useEffect(() => {
    if (userId) void loadFor(userId);
  }, [userId, loadFor]);

  const refresh = useCallback(async () => {
    await loadFor(session?.user.id);
  }, [loadFor, session]);

  const value = useMemo<Store>(
    () => ({
      loading,
      session,
      user: session?.user ?? null,
      profile,
      creatorPage,
      hasCreatorPage: !!creatorPage,
      isAdmin,
      mode: creatorPage ? mode : "personal",
      setMode: (m) => setModeState(creatorPage ? m : "personal"),
      adFrequency,
      refresh,
      signOut: async () => {
        await supabase.auth.signOut();
        queryClient.clear();
      },
    }),
    [loading, session, profile, creatorPage, isAdmin, mode, adFrequency, refresh, queryClient],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useFlip() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useFlip must be used inside FlipStoreProvider");
  return ctx;
}
