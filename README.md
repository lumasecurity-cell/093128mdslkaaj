# sleepy.ud

Premium utility software for Rivals. Clean, undetected, built for performance.

## Stack

- [Tailwind CSS](https://tailwindcss.com) (Play CDN)
- Vanilla JS
- Cloudflare Pages + Functions

## Deploy

Push to `main` — Cloudflare Pages auto-deploys from the `public/` directory.

```
pages_build_output_dir = "public"
```

## Backend Setup (Required for Admin Dashboard)

The admin panel at `/dds9?token=<token>` requires Cloudflare KV:

1. Go to **Cloudflare Dashboard → Workers & Pages → KV**
2. Create a new KV namespace named `sleepy-kv`
3. Copy the namespace ID
4. Go to your Pages project → **Settings → Functions → KV namespace bindings**
5. Add a binding:
   - **Variable name**: `SLEEPY_KV`
   - **KV namespace**: `sleepy-kv` (the one you created)
6. Wait for redeployment (or trigger one)

### Admin Access

- URL: `https://your-site.pages.dev/dds9?token=WcsN9H9M1wvlnkN3X2KDxoZi8aKEQFlZpfX9vFzJ4MySMZOxbVwiKh0bAbg65KUQ`
- Generate keys in format: `SLEEPY-XXXX-XXXX-XXXX`
- Release scripts with built-in Lua obfuscation
- Raw script links are protected from browser access

### Raw Link Security

The `/api/raw/:id` endpoint blocks browser access by fingerprinting User-Agent and headers. Only Roblox executors (which lack browser-specific headers) can fetch the script.

[Join our Discord](https://discord.gg/TCBTRcnvDa)
