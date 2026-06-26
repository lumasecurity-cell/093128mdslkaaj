import { verifyToken, unauthorized } from "../../_utils/auth.js";

// Basic Lua obfuscator — strips comments, renames locals, encodes strings
function obfuscateLua(source) {
    let code = source;

    // Strip comments (single-line and multi-line)
    code = code.replace(/--\[\[[\s\S]*?\]\]/g, "")
               .replace(/--[^\n]*/g, "")
               .replace(/\[\[[\s\S]*?\]\]/g, "");

    // Collect local variable names
    const localVars = [];
    const localRegex = /\blocal\s+(\w+)/g;
    let match;
    while ((match = localRegex.exec(code)) !== null) {
        if (!localVars.includes(match[1])) localVars.push(match[1]);
    }

    // Build replacement map (skip common names)
    const skip = {"true":1,"false":1,"nil":1,"function":1,"end":1,"then":1,"do":1,"repeat":1,"until":1,"if":1,"else":1,"elseif":1,"for":1,"in":1,"while":1,"local":1,"return":1,"break":1,"goto":1,"and":1,"or":1,"not":1};
    const replacements = {};
    let idx = 0;
    const chars = "abcdefghijklmnopqrstuvwxyz";
    for (const v of localVars) {
        if (skip[v]) continue;
        let newName = "_" + chars[idx % 26];
        if (idx >= 26) newName += Math.floor(idx / 26);
        replacements[v] = newName;
        idx++;
    }

    // Apply replacements (word-boundary safe)
    for (const [orig, repl] of Object.entries(replacements)) {
        const re = new RegExp("\\b" + orig + "\\b", "g");
        code = code.replace(re, repl);
    }

    // Obfuscate string literals
    code = code.replace(/(["'])((?:(?!\1)[^\\]|\\.)*?)\1/g, (m, q, s) => {
        if (s.length < 3) return m;
        const encoded = [];
        for (let i = 0; i < s.length; i++) {
            encoded.push(s.charCodeAt(i));
        }
        return "(function() local s='';for _,c in ipairs({" + encoded.join(",") + "}) do s=s..string.char(c) end;return s end)()";
    });

    // Wrap in loader
    const loader = [
        "-- sleepy.ud | obfuscated",
        "-- do not share or redistribute",
        "",
        code
    ].join("\n");

    return loader;
}

export async function onRequest(context) {
    const { request, env } = context;
    if (!verifyToken(request)) return unauthorized();

    const method = request.method;

    if (!env.SLEEPY_KV) {
        return new Response(JSON.stringify({ error: "KV not bound" }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }

    // GET — list scripts
    if (method === "GET") {
        const raw = await env.SLEEPY_KV.get("scripts", "json");
        return new Response(JSON.stringify({ scripts: raw || [] }), {
            headers: { "Content-Type": "application/json" }
        });
    }

    // POST — release new script
    if (method === "POST") {
        const body = await request.json();
        const name = (body.name || "").trim();
        const source = (body.source || "").trim();

        if (!name || !source) {
            return new Response(JSON.stringify({ success: false, error: "name and source required" }), {
                status: 400,
                headers: { "Content-Type": "application/json" }
            });
        }

        const obfuscated = obfuscateLua(source);
        const id = Date.now().toString(36) + Math.random().toString(36).substring(2, 6);

        // Store obfuscated content in KV
        await env.SLEEPY_KV.put("script_content_" + id, obfuscated);

        const raw = await env.SLEEPY_KV.get("scripts", "json");
        const scripts = raw || [];

        scripts.unshift({
            id,
            name,
            version: 1,
            released: Date.now(),
            updated: Date.now()
        });

        await env.SLEEPY_KV.put("scripts", JSON.stringify(scripts));

        const url = "/api/raw/" + id;

        return new Response(JSON.stringify({ success: true, url }), {
            headers: { "Content-Type": "application/json" }
        });
    }

    return new Response("method not allowed", { status: 405 });
}
