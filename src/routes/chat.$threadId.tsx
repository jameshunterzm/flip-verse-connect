import { createFileRoute, useParams } from "@tanstack/react-router";
import { useState } from "react";
import { Phone, ImagePlus, Mic, Send, Check, CheckCheck } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { TopBar } from "@/components/TopBar";
import { useFlip } from "@/lib/flip-store";

export const Route = createFileRoute("/chat/$threadId")({
  head: () => ({
    meta: [
      { title: "Chat — Flip Chat" },
      { name: "description", content: "Private one-to-one chat between accepted Flip Chat friends." },
      { property: "og:title", content: "Private chat on Flip Chat" },
      { property: "og:description", content: "Text, images and voice notes with read receipts." },
    ],
  }),
  component: ChatPage,
});

function ChatPage() {
  const { threadId } = useParams({ from: "/chat/$threadId" });
  const { threads, sendMessage } = useFlip();
  const [draft, setDraft] = useState("");
  const thread = threads.find((t) => t.id === threadId);

  if (!thread) {
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
    sendMessage(thread.id, draft.trim());
    setDraft("");
  };

  return (
    <AppShell>
      <TopBar
        title=""
        back="/inbox"
        right={<Phone className="h-5 w-5 text-muted-foreground" />}
      />
      <div className="glass-strong sticky top-[52px] z-20 -mt-[52px] flex items-center gap-3 px-14 py-3">
        <img src={thread.person.avatar} alt={thread.person.name} className="h-9 w-9 rounded-full object-cover" />
        <div>
          <p className="text-sm font-semibold">{thread.person.name}</p>
          <p className="text-[11px] text-brand-cyan">
            {thread.typing ? "typing…" : thread.online ? "Online" : "Offline"}
          </p>
        </div>
      </div>

      <div className="space-y-3 px-4 py-4">
        {thread.messages.map((m) => (
          <div key={m.id} className={`flex ${m.from === "me" ? "justify-end" : "justify-start"}`}>
            <div
              className={`animate-rise max-w-[76%] rounded-2xl px-3.5 py-2.5 text-sm ${
                m.from === "me"
                  ? "bg-gradient-brand rounded-br-md text-primary-foreground"
                  : "rounded-bl-md bg-surface"
              }`}
            >
              <p>{m.text}</p>
              <p className="mt-1 flex items-center justify-end gap-1 text-[10px] opacity-70">
                {m.time}
                {m.from === "me" &&
                  (m.read ? <CheckCheck className="h-3 w-3" /> : <Check className="h-3 w-3" />)}
              </p>
            </div>
          </div>
        ))}
        {thread.typing && (
          <div className="flex gap-1 rounded-2xl bg-surface px-3 py-3 w-fit">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground"
                style={{ animationDelay: `${i * 120}ms` }}
              />
            ))}
          </div>
        )}
      </div>

      <div className="glass-strong fixed inset-x-0 bottom-0 mx-auto flex max-w-[480px] items-center gap-2 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3">
        <ImagePlus className="h-5 w-5 shrink-0 text-muted-foreground" />
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="Type a message…"
          className="min-w-0 flex-1 rounded-full bg-surface px-4 py-2.5 text-sm outline-none placeholder:text-muted-foreground"
        />
        <Mic className="h-5 w-5 shrink-0 text-muted-foreground" />
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
