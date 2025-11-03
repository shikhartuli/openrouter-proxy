// api/chat.js — Vercel Serverless Function (Node runtime)

const ALLOWED_ORIGINS = new Set([
  "https://illumia-ai.github.io",    // your GitHub Pages origin
  "https://illumia.ai"
]);

function cors(origin) {
  const allowed = origin && ALLOWED_ORIGINS.has(origin) ? origin : "";
  return {
    "Access-Control-Allow-Origin": allowed || "https://illumia-ai.github.io",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "content-type, x-client-token",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin"
  };
}

export default async function handler(req, res) {
  const origin = req.headers.origin || "";
  const headers = cors(origin);

  if (req.method === "OPTIONS") {
    Object.entries(headers).forEach(([k, v]) => res.setHeader(k, v));
    return res.status(204).end();
  }
  if (req.method !== "POST") {
    Object.entries(headers).forEach(([k, v]) => res.setHeader(k, v));
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const upstream = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://illumia-ai.github.io",
      "X-Title": "Your App Name"
    },
    body: JSON.stringify(req.body || {})
  });

  Object.entries(headers).forEach(([k, v]) => res.setHeader(k, v));
  res.status(upstream.status);
  res.setHeader("Content-Type", upstream.headers.get("content-type") || "application/json");

  if (!upstream.body) {
    const j = await upstream.json().catch(() => ({}));
    return res.json(j);
  }
  upstream.body.pipe(res);
}
