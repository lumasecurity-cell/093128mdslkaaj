const ADMIN_TOKEN = "WcsN9H9M1wvlnkN3X2KDxoZi8aKEQFlZpfX9vFzJ4MySMZOxbVwiKh0bAbg65KUQ";

export function verifyToken(request) {
    const url = new URL(request.url);
    const token = url.searchParams.get("token") ||
                  (request.headers.get("Authorization") || "").replace("Bearer ", "");
    return token === ADMIN_TOKEN;
}

export function unauthorized() {
    return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
    });
}
