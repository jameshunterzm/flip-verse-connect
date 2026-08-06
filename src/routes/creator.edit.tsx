import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Camera } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { TopBar } from "@/components/TopBar";
import { useFlip } from "@/lib/flip-store";
import { supabase } from "@/integrations/supabase/client";
import { uploadToR2 } from "@/lib/media";

export const Route = createFileRoute("/creator/edit")({
  head: () => ({
    meta: [
      { title: "Edit Creator Page — Flip Chat" },
      { name: "description", content: "Update your public creator name, photo, bio and link on Flip Chat." },
      { property: "og:title", content: "Edit your Flip Chat Creator Page" },
      { property: "og:description", content: "Photo changes anytime; the page name can change once every 90 days." },
    ],
  }),
  component: EditCreatorPage,
});

const DAY = 864e5;

function EditCreatorPage() {
  const { creatorPage, refresh } = useFlip();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [link, setLink] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setName(creatorPage?.name ?? "");
    setBio(creatorPage?.bio ?? "");
    setLink(creatorPage?.link_url ?? "");
  }, [creatorPage?.name, creatorPage?.bio, creatorPage?.link_url]);

  const changedAt = creatorPage?.name_changed_at ? new Date(creatorPage.name_changed_at).getTime() : 0;
  const nameLocked = changedAt > 0 && Date.now() - changedAt < 90 * DAY;
  const nextAllowed = changedAt ? new Date(changedAt + 90 * DAY).toLocaleDateString() : null;

  if (!creatorPage) {
    return (
      <AppShell>
        <TopBar title="Edit Creator Page" back="/creator" />
        <p className="p-8 text-center text-sm text-muted-foreground">You don't have a Creator Page yet.</p>
      </AppShell>
    );
  }

  const pickAvatar = async (file: File) => {
    setUploading(true);
    setError(null);
    try {
      const url = await uploadToR2(file, "avatars", file.name);
      const { error: err } = await supabase.from("creator_pages").update({ avatar_url: url }).eq("id", creatorPage.id);
      if (err) throw err;
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not upload that photo");
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    const patch: { bio: string; link_url: string | null; name?: string } = {
      bio,
      link_url: link.trim() || null,
    };
    if (!nameLocked && name.trim() && name.trim() !== creatorPage.name) patch.name = name.trim();
    const { error: err } = await supabase.from("creator_pages").update(patch).eq("id", creatorPage.id);
    setSaving(false);
    if (err) {
      setError(err.message);
      return;
    }
    await refresh();
    void navigate({ to: "/creator" });
  };

  return (
    <AppShell>
      <TopBar title="Edit Creator Page" back="/creator" />
      <div className="space-y-5 p-4">
        <div className="flex flex-col items-center gap-3">
          <label className="relative cursor-pointer">
            <img
              src={creatorPage.avatar_url ?? undefined}
              alt=""
              className="h-24 w-24 rounded-full bg-surface-2 object-cover ring-2 ring-brand-pink"
            />
            <span className="bg-gradient-brand absolute bottom-0 right-0 grid h-8 w-8 place-items-center rounded-full text-primary-foreground">
              <Camera className="h-4 w-4" />
            </span>
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              aria-label="Change page photo"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void pickAvatar(f);
              }}
            />
          </label>
          <p className="text-xs text-muted-foreground">
            {uploading ? "Uploading photo…" : "Page photo can be changed anytime"}
          </p>
        </div>

        <Field label="Page name">
          <input
            value={name}
            disabled={nameLocked}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-2xl bg-surface px-4 py-3 text-sm outline-none disabled:opacity-50"
          />
          <p className="mt-1.5 text-[11px] text-muted-foreground">
            {nameLocked
              ? `Creator name already changed — next change available on ${nextAllowed}.`
              : "You can change your Creator Page name once every 90 days."}
          </p>
        </Field>

        <Field label="Bio">
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={4}
            className="w-full resize-none rounded-2xl bg-surface px-4 py-3 text-sm outline-none"
          />
        </Field>

        <Field label="Link">
          <input
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="https://"
            className="w-full rounded-2xl bg-surface px-4 py-3 text-sm outline-none"
          />
        </Field>

        <p className="text-xs text-muted-foreground">@{creatorPage.handle} · handles can't be changed.</p>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <button
          onClick={() => void save()}
          disabled={saving}
          className="bg-gradient-brand shadow-glow w-full rounded-2xl py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
      </div>
    </AppShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1.5 px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      {children}
    </div>
  );
}
