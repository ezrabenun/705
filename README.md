# 705 — First Floor Plan

A single-file interactive floor-plan editor ([index.html](index.html)). Tap a
room to select it, then drag to move or drag a corner to resize. In the
**Doors / Windows** tab, pick a tool (Door / Doorway / Window) and click a wall
to drop it there — it snaps to the wall and the tool disengages. Tap a placed
opening to select it, then drag to move (it stays snapped to walls, and
reorients when moved onto a perpendicular wall) or drag an end dot to resize.
Edit the frame, plot, and wall thickness in the tabs. Export/Import layouts, and save
named **versions** — pick one from the dropdown to load it, or type a name and
hit Save to create/overwrite one. Star (☆) a version to make it the
**default**: what new visitors see and what "Reset to default" restores.

## Hosting

Deployed on **Cloudflare Pages** (connected to this GitHub repo — every push to
`main` auto-deploys). No build step: it's a static `index.html` plus one Pages
Function for shared storage.

- **Build command:** _(none)_
- **Build output directory:** `/` (repo root)
- **Functions:** auto-detected from `functions/`

## Versions, the default, and local autosave

Named layout versions are shared across all visitors via Cloudflare KV, along
with which one is the **default** (`defaultVersionName`).

- **On load, the shared default always wins.** Editing autosaves to a
  per-browser working copy that appears in the picker as
  **"local-auto-save (this browser)"** — but it never auto-overrides the
  default. Select it from the dropdown to restore your in-progress work.
- **The built-in layout isn't a separate fallback.** On the first load against
  an empty store, it's seeded into KV as a version named **"Original"** and set
  as the default — from then on it's an ordinary version anyone can change,
  re-star, or replace.
- Starring a version writes its name to `defaultVersionName`; "Reset to
  default" reloads whatever that points to. If the shared store is unreachable
  (e.g. a `file://` open), the in-memory built-in layout is used.

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
