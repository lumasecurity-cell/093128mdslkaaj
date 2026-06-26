import { verifyToken, unauthorized } from "../../_utils/auth.js";

function obfuscateLua(source) {
    let code = source;
    code = code.replace(/--\[\[[\s\S]*?\]\]/g, "")
               .replace(/--[^\n]*/g, "")
               .replace(/\[\[[\s\S]*?\]\]/g, "");

    const localVars = [];
    const localRegex = /\blocal\s+(\w+)/g;
    let match;
    while ((match = localRegex.exec(code)) !== null) {
        if (!localVars.includes(match[1])) localVars.push(match[1]);
    }

    const skip = {"true":1,"false":1,"nil":1,"function":1,"end":1,"then":1,"do":1,"repeat":1,"until":1,"if":1,"else":1,"elseif":1,"for":1,"in":1,"while":1,"local":1,"return":1,"break":1,"goto":1,"and":1,"or":1,"not":1};
    const replacements = {};
    let idx = 0;
    const chars = "abcdefghijklmnopqrstuvwxyz";
    for (const v of localVars) {
        if (skip[v]) continue;
        replacements[v] = "_" + chars[idx % 26] + (idx >= 26 ? Math.floor(idx / 26) : "");
        idx++;
    }

    for (const [orig, repl] of Object.entries(replacements)) {
        code = code.replace(new RegExp("\\b" + orig + "\\b", "g"), repl);
    }

    code = code.replace(/(["'])((?:(?!\1)[^\\]|\\.)*?)\1/g, (m, q, s) => {
        if (s.length < 3) return m;
        const encoded = [];
        for (let i = 0; i < s.length; i++) {
            encoded.push(s.charCodeAt(i));
        }
        return "(function() local s='';for _,c in ipairs({" + encoded.join(",") + "}) do s=s..string.char(c) end;return s end)()";
    });

    return "-- sleepy.ud | obfuscated\n-- do not share or redistribute\n\n" + code;
}

export async function onRequest(context) {
    const { request, env } = context;
    if (!verifyToken(request)) return unauthorized();

    if (request.method !== "POST") {
        return new Response("method not allowed", { status: 405 });
    }

    if (!env.SLEEPY_KV) {
        return new Response(JSON.stringify({ error: "KV not bound" }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }

    const body = await request.json();
    const id = (body.id || "").trim();
    const source = (body.source || "").trim();

    if (!id || !source) {
        return new Response(JSON.stringify({ success: false, error: "id and source required" }), {
            status: 400,
            headers: { "Content-Type": "application/json" }
        });
    }

    // Check script exists
    const raw = await env.SLEEPY_KV.get("scripts", "json");
    const scripts = raw || [];
    const idx = scripts.findIndex(s => s.id === id);
    if (idx === -1) {
        return new Response(JSON.stringify({ success: false, error: "script not found" }), {
            status: 404,
            headers: { "Content-Type": "application/json" }
        });
    }

    // Re-obfuscate
    const obfuscated = obfuscateLua(source);
    await env.SLEEPY_KV.put("script_content_" + id, obfuscated);

    // Bump version
    scripts[idx].version += 1;
    scripts[idx].updated = Date.now();
    await env.SLEEPY_KV.put("scripts", JSON.stringify(scripts));

    return new Response(JSON.stringify({ success: true, url: "/api/raw/" + id }), {
        headers: { "Content-Type": "application/json" }
    });
}
