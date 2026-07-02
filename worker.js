// Cloudflare Worker — shared key/value store for the floor-plan app.
// Exposes GET / PUT / DELETE on /<key>, backed by a KV namespace.
//
// Deploy (dashboard route):
//   1. Cloudflare dashboard → Workers & Pages → Create → Worker. Paste this file.
//   2. Storage & Databases → KV → create a namespace (e.g. "FLOORPLAN").
//   3. Worker → Settings → Bindings → add KV namespace binding:
//        Variable name: LAYOUTS   →   your namespace.
//   4. Deploy. Copy the *.workers.dev URL and paste it into REMOTE_URL in index.html.
//
// Deploy (wrangler CLI) — wrangler.toml:
//   name = "floorplan-store"
//   main = "worker.js"
//   compatibility_date = "2024-01-01"
//   [[kv_namespaces]]
//   binding = "LAYOUTS"
//   id = "<your-kv-id>"        # from: npx wrangler kv namespace create LAYOUTS
//
// "One shared set for everyone": reads and writes are open. Anyone with the URL
// can edit. To limit which site may call it, set ALLOW_ORIGIN to your Pages origin
// (e.g. "https://<you>.github.io"). To stop casual write abuse, uncomment the
// SECRET check below and send the same value from the page as an "x-key" header.

const ALLOW_ORIGIN = "*";                 // e.g. "https://<you>.github.io"
// const SECRET = "choose-a-long-random-string";

export default {
  async fetch(request, env) {
    const cors = {
      "Access-Control-Allow-Origin": ALLOW_ORIGIN,
      "Access-Control-Allow-Methods": "GET,PUT,DELETE,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, x-key",
      "Access-Control-Max-Age": "86400",
    };
    if (request.method === "OPTIONS") return new Response(null, { headers: cors });

    const key = decodeURIComponent(new URL(request.url).pathname.replace(/^\/+/, "")) || "default";

    // // Optional write protection — require a shared secret for mutations:
    // if (request.method !== "GET" && request.headers.get("x-key") !== SECRET)
    //   return new Response("forbidden", { status: 403, headers: cors });

    if (request.method === "GET") {
      const val = await env.LAYOUTS.get(key);
      return new Response(val ?? "", {
        headers: { ...cors, "Content-Type": "text/plain; charset=utf-8" },
      });
    }
    if (request.method === "PUT") {
      await env.LAYOUTS.put(key, await request.text());
      return new Response("ok", { headers: cors });
    }
    if (request.method === "DELETE") {
      await env.LAYOUTS.delete(key);
      return new Response("ok", { headers: cors });
    }
    return new Response("method not allowed", { status: 405, headers: cors });
  },
};
