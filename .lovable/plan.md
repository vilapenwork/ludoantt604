

## Goal
Move image storage from Supabase Storage to Cloudflare R2. Compress images to ~200KB in the browser, upload securely via an Edge Function (secrets never exposed), and store only the public URL in the database.

## Why this works with the current code
- DB tables (`articles`, `activities`, `leaders`) already store image URLs as text — no schema change.
- Two upload spots today: `src/components/RichTextEditor.tsx` (inline images) and `src/pages/AdminEditor.tsx` (header / leader avatar). Both call `supabase.storage.from("images").upload(...)`.
- Lovable Cloud is enabled, so an Edge Function can hold R2 secrets safely.

## Architecture

```text
Browser                          Edge Function (r2-upload)        Cloudflare R2
-------                          -------------------------         -------------
1. user picks file
2. compress to ~200KB     ─────► 3. verify JWT + admin role  ────► 4. PutObject (S3 SDK)
   (browser-image-compression)      5. return { url }                (Cache-Control: 1y immutable)
6. store URL in Supabase
7. <img src=publicUrl>  ◄──── served via Cloudflare CDN
```

## Implementation Steps

### 1. R2 secrets (server only)
Request via `add_secret`:
- `R2_ACCOUNT_ID` = `a0d0462fe159c871fcf1036a20231636`
- `R2_ACCESS_KEY_ID` = `a0d0462fe159c871fcf1036a20231636`
- `R2_SECRET_ACCESS_KEY` = `cfat_gIKf3maQErE4vqNsS1lmaObuMjsCASTSmkZ9BvLi41c5e6a9`
- `R2_BUCKET` = `my-images`
- `R2_PUBLIC_BASE_URL` = bucket's public URL (see clarification below)

These never reach the frontend.

### 2. Edge function `supabase/functions/r2-upload/index.ts`
- Auth: read `Authorization` header, `getClaims()`, then `has_role(uid,'admin')` — only admins can upload.
- Accepts `multipart/form-data` with one `file` field.
- Validates: image MIME type, max ~1 MB safety cap, sanitized filename.
- Uses `npm:@aws-sdk/client-s3@3` with `region:"auto"`, `endpoint: https://<account>.r2.cloudflarestorage.com`, `forcePathStyle:true`.
- Object key: `content/<timestamp>-<rand>.<ext>`.
- Sets `ContentType` and `CacheControl: public, max-age=31536000, immutable`.
- Returns `{ url: "<R2_PUBLIC_BASE_URL>/<key>" }`. CORS enabled.

### 3. Frontend helper `src/lib/uploadImage.ts`
- Add dependency `browser-image-compression`.
- `compressImage(file)`: target 200 KB, max dimension 1920 px, output `image/jpeg` (keep PNG when transparency detected).
- `uploadImage(file)`: compress → `supabase.functions.invoke("r2-upload", { body: formData })` → return public URL.

### 4. Swap call sites
- `RichTextEditor.tsx`: replace the Supabase Storage upload inside `uploadAndInsertImage` with `uploadImage(file)`.
- `AdminEditor.tsx`: replace header-image / avatar uploads with `uploadImage(file)`.
- Leave existing Supabase `images` bucket in place so previously uploaded images keep working.

### 5. Performance
- Long-lived `Cache-Control` set at upload time → Cloudflare CDN handles edge caching.
- Add `loading="lazy" decoding="async"` to gallery/list images.

## One clarification needed before building

R2 buckets are **not public by default**. You need a public URL to serve images. Which option do you want?

1. **r2.dev dev URL** — enable "Public access" on the `my-images` bucket in Cloudflare → it gives you a `https://pub-xxxxx.r2.dev` URL. Fast to set up, fine for low traffic.
2. **Custom Cloudflare domain** — bind e.g. `images.yourdomain.com` to the bucket. Best for production (full CDN + caching rules).
3. **You already have it** — paste the URL in your reply and I'll use it as `R2_PUBLIC_BASE_URL`.

Reply with your choice (and the URL if you have it) and I'll proceed.

