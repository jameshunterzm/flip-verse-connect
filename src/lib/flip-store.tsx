import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  conversations as seedConversations,
  incomingRequests as seedIncoming,
  sentRequests as seedSent,
  type Conversation,
  type Person,
} from "./mock";

export type AccountMode = "personal" | "creator";

type Store = {
  mode: AccountMode;
  setMode: (m: AccountMode) => void;
  hasCreatorPage: boolean;
  createCreatorPage: () => void;
  deleteCreatorPage: () => void;

  requests: Person[];
  sent: Person[];
  friends: Person[];
  blocked: Person[];
  acceptRequest: (id: string) => void;
  declineRequest: (id: string) => void;
  removeFriend: (id: string) => void;
  blockFriend: (id: string) => void;

  threads: Conversation[];
  sendMessage: (threadId: string, text: string) => void;

  liked: Set<string>;
  saved: Set<string>;
  following: Set<string>;
  toggleLike: (id: string) => void;
  toggleSave: (id: string) => void;
  toggleFollow: (id: string) => void;

  adFrequency: number;
  setAdFrequency: (n: number) => void;

  privacy: { privateAccount: boolean; friendsOnlyComments: boolean; showOnline: boolean };
  setPrivacy: (key: keyof Store["privacy"], value: boolean) => void;
};

const StoreContext = createContext<Store | null>(null);

function toggleIn(set: Set<string>, id: string) {
  const next = new Set(set);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  return next;
}

export function FlipStoreProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<AccountMode>("personal");
  const [hasCreatorPage, setHasCreatorPage] = useState(true);
  const [requests, setRequests] = useState<Person[]>(seedIncoming);
  const [sent] = useState<Person[]>(seedSent);
  const [friends, setFriends] = useState<Person[]>(
    seedConversations.map((c) => c.person),
  );
  const [blocked, setBlocked] = useState<Person[]>([]);
  const [threads, setThreads] = useState<Conversation[]>(seedConversations);
  const [liked, setLiked] = useState<Set<string>>(new Set());
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [following, setFollowing] = useState<Set<string>>(new Set(["c2"]));
  const [adFrequency, setAdFrequency] = useState(5);
  const [privacy, setPrivacyState] = useState({
    privateAccount: true,
    friendsOnlyComments: true,
    showOnline: true,
  });

  const value = useMemo<Store>(
    () => ({
      mode,
      setMode,
      hasCreatorPage,
      createCreatorPage: () => setHasCreatorPage(true),
      deleteCreatorPage: () => {
        setHasCreatorPage(false);
        setMode("personal");
      },
      requests,
      sent,
      friends,
      blocked,
      acceptRequest: (id) => {
        const person = requests.find((r) => r.id === id);
        setRequests((r) => r.filter((x) => x.id !== id));
        if (person && !friends.some((f) => f.id === person.id)) {
          setFriends((f) => [...f, person]);
          setThreads((t) => [
            ...t,
            { id: `t-${person.id}`, person, online: false, typing: false, messages: [] },
          ]);
        }
      },
      declineRequest: (id) => setRequests((r) => r.filter((x) => x.id !== id)),
      removeFriend: (id) => {
        setFriends((f) => f.filter((x) => x.id !== id));
        setThreads((t) => t.filter((x) => x.person.id !== id));
      },
      blockFriend: (id) => {
        const person = friends.find((f) => f.id === id);
        setFriends((f) => f.filter((x) => x.id !== id));
        setThreads((t) => t.filter((x) => x.person.id !== id));
        if (person) setBlocked((b) => [...b, person]);
      },
      threads,
      sendMessage: (threadId, text) =>
        setThreads((t) =>
          t.map((thread) =>
            thread.id === threadId
              ? {
                  ...thread,
                  messages: [
                    ...thread.messages,
                    {
                      id: `m${thread.messages.length + 1}-${Date.now()}`,
                      from: "me" as const,
                      text,
                      time: "now",
                      read: false,
                    },
                  ],
                }
              : thread,
          ),
        ),
      liked,
      saved,
      following,
      toggleLike: (id) => setLiked((s) => toggleIn(s, id)),
      toggleSave: (id) => setSaved((s) => toggleIn(s, id)),
      toggleFollow: (id) => setFollowing((s) => toggleIn(s, id)),
      adFrequency,
      setAdFrequency,
      privacy,
      setPrivacy: (key, val) => setPrivacyState((p) => ({ ...p, [key]: val })),
    }),
    [mode, hasCreatorPage, requests, sent, friends, blocked, threads, liked, saved, following, adFrequency, privacy],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useFlip() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useFlip must be used inside FlipStoreProvider");
  return ctx;
}
