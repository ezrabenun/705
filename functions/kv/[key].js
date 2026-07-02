// Cloudflare Pages Function — shared key/value store for the floor-plan app.
// Route: /kv/<key>  ·  GET / PUT / DELETE, backed by the KV namespace bound as LAYOUTS.
// Same-origin as the page, so no CORS handling is needed.
//
// One-time setup in the Cloudflare dashboard (your Pages project):
//   1. Storage & Databases → KV → create a namespace (e.g. "floorplan").
//   2. Pages project → Settings → Functions → KV namespace bindings →
//        Variable name: LAYOUTS   →   that namespace.
//      Add it under BOTH Production and Preview if you use preview deploys.
//   3. Redeploy (push, or "Retry deployment" on the latest deploy).

export async function onRequestGet({ env, params }) {
  const val = await env.LAYOUTS.get(params.key);
  return new Response(val ?? "", { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}

export async function onRequestPut({ env, params, request }) {
  await env.LAYOUTS.put(params.key, await request.text());
  return new Response("ok");
}

export async function onRequestDelete({ env, params }) {
  await env.LAYOUTS.delete(params.key);
  return new Response("ok");
}
