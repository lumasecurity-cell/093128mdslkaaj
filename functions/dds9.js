// Redirect /dds9 → /api/dashboard with token preserved
export async function onRequest(context) {
    const { request } = context;
    const url = new URL(request.url);
    const token = url.searchParams.get("token") || "";
    const dest = "/api/dashboard" + (token ? "?token=" + encodeURIComponent(token) : "");
    return new Response(null, {
        status: 302,
        headers: { "Location": dest }
    });
}
