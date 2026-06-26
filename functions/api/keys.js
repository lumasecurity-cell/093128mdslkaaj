import { verifyToken, unauthorized } from "../_utils/auth.js";

function generateKey() {
    const seg = () => Math.random().toString(36).substring(2, 6).toUpperCase();
    return "SLEEPY-" + seg() + "-" + seg() + "-" + seg();
}

export async function onRequest(context) {
    const { request, env } = context;
    if (!verifyToken(request)) return unauthorized();

    const url = new URL(request.url);
    const method = request.method;

    // Ensure KV is available
    if (!env.SLEEPY_KV) {
        return new Response(JSON.stringify({ error: "KV not bound" }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }

    // GET — list all keys
    if (method === "GET") {
        const raw = await env.SLEEPY_KV.get("keys", "json");
        return new Response(JSON.stringify({ keys: raw || [] }), {
            headers: { "Content-Type": "application/json" }
        });
    }

    // POST — generate keys
    if (method === "POST") {
        const body = await request.json();
        const amount = Math.min(Math.max(parseInt(body.amount) || 1, 1), 100);
        const duration = parseInt(body.duration) || 30;
        const lifetime = body.lifetime === true;

        const raw = await env.SLEEPY_KV.get("keys", "json");
        const keys = raw || [];

        const now = Date.now();
        const expiryDate = lifetime ? null : now + duration * 86400000;

        for (let i = 0; i < amount; i++) {
            keys.push({
                key: generateKey(),
                created: now,
                expires: expiryDate,
                duration: lifetime ? -1 : duration
            });
        }

        await env.SLEEPY_KV.put("keys", JSON.stringify(keys));

        return new Response(JSON.stringify({ success: true, count: amount }), {
            headers: { "Content-Type": "application/json" }
        });
    }

    // DELETE — remove a key
    if (method === "DELETE") {
        const body = await request.json();
        const target = body.key;

        const raw = await env.SLEEPY_KV.get("keys", "json");
        const keys = raw || [];
        const filtered = keys.filter(k => k.key !== target);

        if (filtered.length === keys.length) {
            return new Response(JSON.stringify({ success: false, error: "key not found" }), {
                status: 404,
                headers: { "Content-Type": "application/json" }
            });
        }

        await env.SLEEPY_KV.put("keys", JSON.stringify(filtered));

        return new Response(JSON.stringify({ success: true }), {
            headers: { "Content-Type": "application/json" }
        });
    }

    return new Response("method not allowed", { status: 405 });
}
