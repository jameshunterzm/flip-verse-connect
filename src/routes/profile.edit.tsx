import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Camera } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { TopBar } from "@/components/TopBar";
import { useFlip } from "@/lib/flip-store";
import { supabase } from "@/integrations/supabase/client";
import { uploadToR2 } from "@/lib/media";

export const Route = createFileRoute("/profile/edit")({
  head: () => ({
    meta: [
      { title: "Edit Personal Account — Flip Chat" },
      { name: "description", content: "Update your display name, photo and bio on your private Flip Chat account." },
      { property: "og:title", content: "Edit your Flip Chat profile" },
      { property: "og:description", content: "Change your photo anytime; display name twice every 90 days." },
    ],
  }),
  component: EditProfilePage,
});

const DAY = 864e5;

function EditProfilePage() {
  const { user, profile, refresh } = useFlip();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setName(profile?.display_name ?? "");
    setBio(profile?.bio ?? "");
  }, [profile?.display_name, profile?.bio]);

  const recent = (profile?.name_changes ?? []).filter((t) => Date.now() - new Date(t).getTime() < 90 * DAY);
  const remaining = Math.max(0, 2 - recent.length);
  const oldest = recent.length ? new Date(recent[0]!).getTime() : 0;
  const nextAllowed = oldest ? new Date(oldest + 90 * DAY).toLocaleDateString() : null;
  const nameLocked = remaining === 0;

  const pickAvatar = async (file: File) => {
    if (!user) return;
    setUploading(true);
    setError(null);
    try {
      const url = await uploadToR2(file, "avatars", file.name);
      const { error: err } = await supabase.from("profiles").update({ avatar_url: url }).eq("id", user.id);
      if (err) throw err;
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not upload that photo");
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    if (!user) return;
    setSaving(true);
    setError(null);
    const patch: { bio: string; display_name?: string } = { bio };
    if (!nameLocked && name.trim() && name.trim() !== profile?.display_name) patch.display_name = name.trim();
    const { error: err } = await supabase.from("profiles").update(patch).eq("id", user.id);
    setSaving(false);
    if (err) {
      setError(err.message);
      return;
    }
    await refresh();
    void navigate({ to: "/profile" });
  };

  return (
    <AppShell>
      <TopBar title="Edit profile" back="/profile" />
      <div className="space-y-5 p-4">
        <div className="flex flex-col items-center gap-3">
          <label className="relative cursor-pointer">
            <img
              src={profile?.avatar_url ?? undefined}
              alt=""
              className="h-24 w-24 rounded-full bg-surface-2 object-cover ring-2 ring-brand"
            />
            <span className="bg-gradient-brand absolute bottom-0 right-0 grid h-8 w-8 place-items-center rounded-full text-primary-foreground">
              <Camera className="h-4 w-4" />
            </span>
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              aria-label="Change profile photo"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void pickAvatar(f);
              }}
            />
          </label>
          <p className="text-xs text-muted-foreground">
            {uploading ? "Uploading photo…" : "You can change your photo anytime"}
          </p>
        </div>

        <Field label="Display name">
          <input
            value={name}
            disabled={nameLocked}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            className="w-full rounded-2xl bg-surface px-4 py-3 text-sm outline-none disabled:opacity-50"
          />
          <p className="mt-1.5 text-[11px] text-muted-foreground">
            {nameLocked
              ? `Name change limit reached. You can change it again on ${nextAllowed}.`
              : `You can change your name ${remaining} more time${remaining === 1 ? "" : "s"} in the next 90 days.`}
          </p>
        </Field>

        <Field label="Bio">
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={4}
            placeholder="Tell your friends about you"
            className="w-full resize-none rounded-2xl bg-surface px-4 py-3 text-sm outline-none"
          />
        </Field>

        <p className="text-xs text-muted-foreground">@{profile?.username} · usernames can't be changed.</p>

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
