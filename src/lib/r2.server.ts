/** Cloudflare R2 presigned-URL signing (AWS SigV4, query-string form). Server only. */

const enc = new TextEncoder();

function hex(buf: ArrayBuffer) {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function sha256Hex(value: string) {
  return hex(await crypto.subtle.digest("SHA-256", enc.encode(value)));
}

async function hmac(key: ArrayBuffer | Uint8Array, value: string) {
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    key as BufferSource,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return crypto.subtle.sign("HMAC", cryptoKey, enc.encode(value));
}

function uriEncode(value: string, encodeSlash = true) {
  return value
    .split("")
    .map((c) => {
      if (/[A-Za-z0-9\-._~]/.test(c)) return c;
      if (c === "/") return encodeSlash ? "%2F" : "/";
      return [...enc.encode(c)].map((b) => `%${b.toString(16).toUpperCase().padStart(2, "0")}`).join("");
    })
    .join("");
}

export type R2Config = {
  accountId: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
  publicBaseUrl: string;
};

export function readR2Config(): R2Config {
  const cfg = {
    accountId: process.env["R2_ACCOUNT_ID"] ?? "",
    bucket: process.env["R2_BUCKET"] ?? "",
    accessKeyId: process.env["R2_ACCESS_KEY_ID"] ?? "",
    secretAccessKey: process.env["R2_SECRET_ACCESS_KEY"] ?? "",
    publicBaseUrl: (process.env["R2_PUBLIC_BASE_URL"] ?? "").replace(/\/+$/, ""),
  };
  const missing = Object.entries(cfg)
    .filter(([, v]) => !v)
    .map(([k]) => k);
  if (missing.length) throw new Error(`Media storage is not configured (${missing.join(", ")})`);
  return cfg;
}

/** Presigned PUT URL valid for `expiresIn` seconds. */
export async function presignPut(key: string, expiresIn = 900): Promise<string> {
  const { accountId, bucket, accessKeyId, secretAccessKey } = readR2Config();
  const host = `${accountId}.r2.cloudflarestorage.com`;
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
  const dateStamp = amzDate.slice(0, 8);
  const scope = `${dateStamp}/auto/s3/aws4_request`;

  const canonicalUri = `/${uriEncode(bucket, false)}/${uriEncode(key, false)}`;
  const params: [string, string][] = [
    ["X-Amz-Algorithm", "AWS4-HMAC-SHA256"],
    ["X-Amz-Credential", `${accessKeyId}/${scope}`],
    ["X-Amz-Date", amzDate],
    ["X-Amz-Expires", String(expiresIn)],
    ["X-Amz-SignedHeaders", "host"],
  ];
  const canonicalQuery = params
    .map(([k, v]) => [uriEncode(k), uriEncode(v)] as const)
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .map(([k, v]) => `${k}=${v}`)
    .join("&");

  const canonicalRequest = [
    "PUT",
    canonicalUri,
    canonicalQuery,
    `host:${host}\n`,
    "host",
    "UNSIGNED-PAYLOAD",
  ].join("\n");

  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    scope,
    await sha256Hex(canonicalRequest),
  ].join("\n");

  let signingKey: ArrayBuffer | Uint8Array = enc.encode(`AWS4${secretAccessKey}`);
  for (const part of [dateStamp, "auto", "s3", "aws4_request"]) {
    signingKey = await hmac(signingKey, part);
  }
  const signature = hex(await hmac(signingKey, stringToSign));

  return `https://${host}${canonicalUri}?${canonicalQuery}&X-Amz-Signature=${signature}`;
}
