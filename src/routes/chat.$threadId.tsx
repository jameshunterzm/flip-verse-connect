import { createFileRoute, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Send, Check, CheckCheck } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { TopBar } from "@/components/TopBar";
import { useFlip } from "@/lib/flip-store";
import { useConversation, useFriends, useSendMessage } from "@/lib/data";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

export const Route = createFileRoute("/chat/$threadId")({
  head: () => ({
    meta: [
      { title: "Chat — Flip Chat" },
      { name: "description", content: "Private one-to-one chat between accepted Flip Chat friends." },
      { property: "og:title", content: "Private chat on Flip Chat" },
      { property: "og:description", content: "Text and images with read receipts." },
    ],
  }),
  component: ChatPage,
});

function ChatPage() {
  const { threadId } = useParams({ from: "/chat/$threadId" });
  const { user } = useFlip();
  const qc = useQueryClient();
  const { data: friends = [] } = useFriends(user?.id);
  const { data: messages = [] } = useConversation(user?.id, threadId);
  const send = useSendMessage(user?.id, threadId);
  const [draft, setDraft] = useState("");
  const person = friends.find((f) => f.id === threadId);

  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel(`chat-${threadId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, () => {
        void qc.invalidateQueries({ queryKey: ["conversation", user.id, threadId] });
      })
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [threadId, user?.id, qc]);

  if (!person) {
    return (
      <AppShell>
        <TopBar title="Chat" back="/inbox" />
        <p className="p-6 text-center text-sm text-muted-foreground">
          This conversation is unavailable. You may have removed or blocked this person.
        </p>
      </AppShell>
    );
  }

  const submit = () => {
    if (!draft.trim()) return;
    send.mutate({ body: draft.trim() });
    setDraft("");
  };

  return (
    <AppShell>
      <TopBar title="" back="/inbox" />
      <div className="glass-strong sticky top-[52px] z-20 -mt-[52px] flex items-center gap-3 px-14 py-3">
        <img src={person.avatar_url ?? undefined} alt="" className="h-9 w-9 rounded-full bg-surface-2 object-cover" />
        <div>
          <p className="text-sm font-semibold">{person.display_name || person.username}</p>
          <p className="text-[11px] text-brand-cyan">@{person.username}</p>
        </div>
      </div>

      <div className="space-y-3 px-4 py-4 pb-28">
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.sender_id === user?.id ? "justify-end" : "justify-start"}`}>
            <div
              className={`animate-rise max-w-[76%] rounded-2xl px-3.5 py-2.5 text-sm ${
                m.sender_id === user?.id
                  ? "bg-gradient-brand rounded-br-md text-primary-foreground"
                  : "rounded-bl-md bg-surface"
              }`}
            >
              {m.image_url && <img src={m.image_url} alt="" className="mb-1.5 rounded-xl" />}
              {m.body && <p>{m.body}</p>}
              <p className="mt-1 flex items-center justify-end gap-1 text-[10px] opacity-70">
                {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                {m.sender_id === user?.id &&
                  (m.read_at ? <CheckCheck className="h-3 w-3" /> : <Check className="h-3 w-3" />)}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="glass-strong fixed inset-x-0 bottom-0 mx-auto flex max-w-[480px] items-center gap-2 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="Type a message…"
          className="min-w-0 flex-1 rounded-full bg-surface px-4 py-2.5 text-sm outline-none placeholder:text-muted-foreground"
        />
        <button
          onClick={submit}
          aria-label="Send"
          className="bg-gradient-brand grid h-9 w-9 shrink-0 place-items-center rounded-full text-primary-foreground"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </AppShell>
  );
}
