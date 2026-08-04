import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const schema = z.object({
  folder: z.enum(["videos", "images", "avatars", "posters"]),
  extension: z
    .string()
    .min(1)
    .max(8)
    .regex(/^[a-z0-9]+$/i),
  contentType: z.string().min(3).max(120),
  sizeBytes: z.number().int().positive().max(600 * 1024 * 1024),
});

/** Returns a short-lived direct-to-R2 upload URL plus the final public URL. */
export const createUploadUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => schema.parse(input))
  .handler(async ({ data, context }) => {
    const { presignPut, readR2Config } = await import("@/lib/r2.server");
    const { publicBaseUrl } = readR2Config();

    const key = `${data.folder}/${context.userId}/${crypto.randomUUID()}.${data.extension.toLowerCase()}`;
    const uploadUrl = await presignPut(key);

    return { uploadUrl, publicUrl: `${publicBaseUrl}/${key}`, key };
  });
