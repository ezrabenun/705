# 705 — First Floor Plan

A single-file interactive floor-plan editor ([index.html](index.html)). Drag rooms
to move, drag corners to resize; edit the frame, plot, and wall thickness in the
tabs. Save/Export/Import layouts, and save named **versions**.

## Hosting

Deployed on **Cloudflare Pages** (connected to this GitHub repo — every push to
`main` auto-deploys). No build step: it's a static `index.html` plus one Pages
Function for shared storage.

- **Build command:** _(none)_
- **Build output directory:** `/` (repo root)
- **Functions:** auto-detected from `functions/`

## Shared saved versions

Named layout versions ("Save version") are shared across all visitors via
Cloudflare KV. Each browser's live working draft stays local (localStorage);
only named versions are shared.

[functions/kv/\[key\].js](functions/kv/[key].js) exposes `/kv/<key>`
(GET/PUT/DELETE) backed by a KV namespace. The page talks to it at the relative
path `/kv` (`REMOTE_URL` in `index.html`), so shared versions only work when the
app is served by Cloudflare Pages — not from a `file://` open or the old
GitHub Pages URL.

### One-time KV setup (manual, in the Cloudflare dashboard)

1. **Storage & Databases → KV →** create a namespace (e.g. `floorplan`).
2. **Pages project → Settings → Functions → KV namespace bindings:**
   add `LAYOUTS` → that namespace. (Set it for Production, and Preview if used.)
3. Redeploy.

Writes are open by default (the "shared for everyone" model). To restrict
origins or require a secret, adapt the handlers in
[functions/kv/\[key\].js](functions/kv/[key].js).
