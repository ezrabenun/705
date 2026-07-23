// Cloudflare Pages Function — turns a rough 3D render of a room into a
// photorealistic photo via Google's Gemini 2.5 Flash Image ("nano banana").
// Route: POST /photoreal   ·   Body: { image: <data-URL>, prompt: <string> }
// Returns: { image: <data-URL of the generated photo> }  or  { error: <msg> }
//
// One-time setup in the Cloudflare dashboard (your Pages project):
//   1. Get a Google AI Studio API key: https://aistudio.google.com/apikey
//   2. Pages project → Settings → Variables and Secrets →
//        add a SECRET named  GEMINI_API_KEY  = <your key>.
//      Add it under BOTH Production and Preview if you use preview deploys.
//   3. Redeploy (push, or "Retry deployment" on the latest deploy).
//
// Same-origin as the page, so no CORS handling is needed.

const MODEL = "gemini-2.5-flash-image";
const ENDPOINT =
  `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

export async function onRequestPost({ env, request }) {
  const key = env.GEMINI_API_KEY;
  if (!key) {
    return json(
      { error: "GEMINI_API_KEY is not set. Add it as a secret in the Cloudflare Pages project settings, then redeploy." },
      500
    );
  }

  let body;
  try { body = await request.json(); }
  catch { return json({ error: "Bad request body (expected JSON)." }, 400); }

  const { image, prompt } = body || {};
  if (!image || !prompt) return json({ error: "Missing 'image' or 'prompt'." }, 400);

  // split "data:image/jpeg;base64,AAAA..." into mime + base64 payload
  const m = /^data:(image\/[a-z0-9.+-]+);base64,(.+)$/i.exec(image);
  if (!m) return json({ error: "'image' must be a base64 data URL." }, 400);
  const mimeType = m[1], data = m[2];

  const payload = {
    contents: [{
      parts: [
        { text: prompt },
        { inline_data: { mime_type: mimeType, data } },
      ],
    }],
    // nudge the model to actually return an image
    generationConfig: { responseModalities: ["IMAGE"] },
  };

  let res;
  try {
    res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "x-goog-api-key": key, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (e) {
    return json({ error: "Could not reach the Gemini API: " + (e && e.message || e) }, 502);
  }

  const text = await res.text();
  if (!res.ok) {
    // surface Gemini's own error message when we can
    let msg = text;
    try { msg = JSON.parse(text)?.error?.message || text; } catch {}
    return json({ error: `Gemini API error (${res.status}): ${msg}` }, res.status);
  }

  let out;
  try { out = JSON.parse(text); } catch { return json({ error: "Gemini returned non-JSON." }, 502); }

  // find the first image part in the response
  const parts = out?.candidates?.[0]?.content?.parts || [];
  const img = parts.find(p => p.inlineData?.data || p.inline_data?.data);
  const inline = img && (img.inlineData || img.inline_data);
  if (!inline?.data) {
    // model sometimes refuses and replies with text — pass that back
    const say = parts.map(p => p.text).filter(Boolean).join(" ").trim();
    return json({ error: say || "Gemini did not return an image." }, 502);
  }

  const outMime = inline.mimeType || inline.mime_type || "image/png";
  return json({ image: `data:${outMime};base64,${inline.data}` });
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}
