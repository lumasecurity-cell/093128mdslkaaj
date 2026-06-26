// Serves obfuscated script content — executor-only delivery
// Blocks browsers via User-Agent / header fingerprinting

function isBrowser(request) {
    const ua = (request.headers.get("User-Agent") || "").toLowerCase();
    const accept = (request.headers.get("Accept") || "").toLowerCase();

    // Check for browser-like User-Agent
    const browserUA = /mozilla|chrome|safari|firefox|edge|opera/i;
    if (browserUA.test(ua)) return true;

    // Check for browser Accept header (executors usually don't send this)
    if (accept.includes("text/html") && accept.includes("application/xhtml")) return true;

    // Check for browser-specific headers
    if (request.headers.get("Sec-Fetch-Site") ||
        request.headers.get("Sec-Fetch-Mode") ||
        request.headers.get("Sec-Fetch-Dest") ||
        request.headers.get("Sec-Fetch-User")) return true;

    // Check for typical browser headers
    if (request.headers.get("Accept-Language") &&
        !ua.includes("curl") &&
        !ua.includes("wget")) return true;

    return false;
}

export async function onRequest(context) {
    const { request, env, params } = context;

    const id = params.id;

    if (!id) {
        return new Response("not found", { status: 404 });
    }

    // Block browser access
    if (isBrowser(request)) {
        return new Response("access denied", {
            status: 403,
            headers: {
                "Content-Type": "text/plain",
                "X-Robots-Tag": "noindex, nofollow",
                "Cache-Control": "no-store"
            }
        });
    }

    if (!env.SLEEPY_KV) {
        return new Response("storage unavailable", { status: 500 });
    }

    const content = await env.SLEEPY_KV.get("script_content_" + id);

    if (!content) {
        return new Response("script not found", { status: 404 });
    }

    return new Response(content, {
        headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "X-Robots-Tag": "noindex, nofollow",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET"
        }
    });
}
