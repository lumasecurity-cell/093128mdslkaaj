import { verifyToken, unauthorized } from "../_utils/auth.js";

export async function onRequest(context) {
    const { request } = context;
    if (!verifyToken(request)) return unauthorized();

    const url = new URL(request.url);
    const token = url.searchParams.get("token") ||
                  (request.headers.get("Authorization") || "").replace("Bearer ", "");

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>sleepy.ud — admin</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<script src="https://cdn.tailwindcss.com"></script>
<script>
tailwind.config={theme:{extend:{colors:{lunar:{300:'#91c8f5'},midnight:{950:'#050512',900:'#0f0f23'}}}}}
</script>
<style>
body{font-family:'Inter',sans-serif;background:#050512;color:#fff}
.tab-btn.active{background:rgba(145,200,245,0.15);border-color:rgba(145,200,245,0.3);color:#91c8f5}
.key-input{background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:8px;padding:10px 14px;color:#fff;font-size:14px;width:100%;outline:none;transition:border-color 0.2s}
.key-input:focus{border-color:rgba(145,200,245,0.3)}
.key-input::placeholder{color:rgba(255,255,255,0.2)}
.btn{display:inline-flex;align-items:center;gap:6px;padding:10px 20px;border-radius:8px;font-size:14px;font-weight:600;border:none;cursor:pointer;transition:all 0.2s}
.btn-primary{background:#91c8f5;color:#050512}
.btn-primary:hover{background:#a8d5f7;transform:translateY(-1px)}
.btn-danger{background:rgba(255,80,80,0.15);color:#ff5050;border:1px solid rgba(255,80,80,0.2)}
.btn-danger:hover{background:rgba(255,80,80,0.25)}
.btn-ghost{background:rgba(255,255,255,0.04);color:rgba(255,255,255,0.6);border:1px solid rgba(255,255,255,0.06)}
.btn-ghost:hover{background:rgba(255,255,255,0.08);color:#fff}
.table-wrap{overflow-x:auto;border-radius:10px;border:1px solid rgba(255,255,255,0.05)}
table{width:100%;border-collapse:collapse;font-size:13px}
th{text-align:left;padding:12px 14px;background:rgba(255,255,255,0.02);color:rgba(255,255,255,0.4);font-weight:600;text-transform:uppercase;font-size:11px;letter-spacing:0.5px;border-bottom:1px solid rgba(255,255,255,0.05)}
td{padding:12px 14px;border-bottom:1px solid rgba(255,255,255,0.03);color:rgba(255,255,255,0.7)}
tr:hover td{background:rgba(255,255,255,0.01)}
.badge{display:inline-block;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:600}
.badge-active{background:rgba(80,255,80,0.1);color:#50ff50}
.badge-expired{background:rgba(255,80,80,0.1);color:#ff5050}
textarea{background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:8px;padding:12px;color:#fff;font-size:13px;font-family:'SFMono','Consolas','Monaco',monospace;width:100%;outline:none;resize:vertical;transition:border-color 0.2s}
textarea:focus{border-color:rgba(145,200,245,0.3)}
.toast{position:fixed;bottom:24px;right:24px;padding:14px 20px;border-radius:10px;font-size:13px;font-weight:500;z-index:999;transform:translateY(20px);opacity:0;transition:all 0.3s}
.toast.show{transform:translateY(0);opacity:1}
.toast-success{background:rgba(80,255,80,0.12);border:1px solid rgba(80,255,80,0.2);color:#50ff50}
.toast-error{background:rgba(255,80,80,0.12);border:1px solid rgba(255,80,80,0.2);color:#ff5050}
.loading{opacity:0.5;pointer-events:none}
</style>
</head>
<body class="min-h-screen">

<div class="max-w-6xl mx-auto px-6 py-8">
    <div class="flex items-center justify-between mb-10">
        <div>
            <h1 class="text-2xl font-extrabold tracking-tight">sleepy<span class="text-lunar-300">.ud</span></h1>
            <p class="text-sm text-white/30 mt-1">admin dashboard</p>
        </div>
        <a href="/" class="text-sm text-white/30 hover:text-white/60 transition-colors">back to site</a>
    </div>

    <div class="flex gap-2 mb-8 border-b border-white/[0.04] pb-4">
        <button class="tab-btn active px-4 py-2 text-sm font-medium rounded-lg border border-transparent transition-all" data-tab="keys">keys</button>
        <button class="tab-btn px-4 py-2 text-sm font-medium rounded-lg border border-transparent transition-all" data-tab="scripts">scripts</button>
    </div>

    <!-- Keys Tab -->
    <div id="tab-keys" class="tab-content">
        <div class="flex flex-wrap items-end gap-4 mb-8 p-5 rounded-xl bg-white/[0.02] border border-white/[0.05]">
            <div>
                <label class="text-xs font-medium text-white/40 uppercase tracking-wider mb-1.5 block">amount</label>
                <input type="number" id="keyAmount" value="1" min="1" max="100" class="key-input w-24">
            </div>
            <div>
                <label class="text-xs font-medium text-white/40 uppercase tracking-wider mb-1.5 block">duration (days)</label>
                <input type="number" id="keyDuration" value="30" min="1" class="key-input w-28">
            </div>
            <div class="flex items-end pb-2">
                <label class="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" id="keyLifetime" class="w-4 h-4 accent-lunar-300">
                    <span class="text-xs font-medium text-white/40 uppercase tracking-wider">lifetime</span>
                </label>
            </div>
            <button class="btn btn-primary" onclick="generateKeys()">generate keys</button>
        </div>

        <div class="table-wrap" id="keysTableWrap">
            <div class="p-8 text-center text-sm text-white/20">loading keys...</div>
        </div>
    </div>

    <!-- Scripts Tab -->
    <div id="tab-scripts" class="tab-content hidden">
        <div class="mb-8 p-5 rounded-xl bg-white/[0.02] border border-white/[0.05]">
            <h3 class="text-sm font-bold mb-3">release new script</h3>
            <div class="mb-3">
                <input type="text" id="scriptName" placeholder="script name..." class="key-input mb-3">
            </div>
            <div class="mb-3">
                <textarea id="scriptSource" rows="12" placeholder="paste your un-obfuscated script here..."></textarea>
            </div>
            <button class="btn btn-primary" onclick="releaseScript()">obfuscate & release</button>
        </div>

        <div class="table-wrap" id="scriptsTableWrap">
            <div class="p-8 text-center text-sm text-white/20">loading scripts...</div>
        </div>
    </div>
</div>

<div id="toast" class="toast"></div>

<script>
const TOKEN = new URLSearchParams(window.location.search).get("token") || "";

// Lifetime checkbox disables duration
document.getElementById("keyLifetime").addEventListener("change", function() {
    document.getElementById("keyDuration").disabled = this.checked;
});

// Tab switching
document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.addEventListener("click", function() {
        document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
        this.classList.add("active");
        document.querySelectorAll(".tab-content").forEach(t => t.classList.add("hidden"));
        document.getElementById("tab-" + this.dataset.tab).classList.remove("hidden");
        if (this.dataset.tab === "keys") loadKeys();
        if (this.dataset.tab === "scripts") loadScripts();
    });
});

function toast(msg, type = "success") {
    const el = document.getElementById("toast");
    el.textContent = msg;
    el.className = "toast toast-" + type + " show";
    setTimeout(() => el.classList.remove("show"), 3000);
}

// Keys
async function loadKeys() {
    const wrap = document.getElementById("keysTableWrap");
    try {
        const res = await fetch("/api/keys?token=" + TOKEN);
        const data = await res.json();
        if (!data.keys || data.keys.length === 0) {
            wrap.innerHTML = '<div class="p-8 text-center text-sm text-white/20">no keys generated yet</div>';
            return;
        }
        wrap.innerHTML = '<table><thead><tr><th>key</th><th>created</th><th>expires</th><th>status</th><th></th></tr></thead><tbody>' +
            data.keys.map(k => {
                const now = Date.now();
                const isLifetime = !k.expires;
                const exp = isLifetime ? Infinity : new Date(k.expires).getTime();
                const status = isLifetime ? '<span class="badge badge-active" style="background:rgba(145,200,245,0.1);color:#91c8f5">lifetime</span>' : (exp > now ? '<span class="badge badge-active">active</span>' : '<span class="badge badge-expired">expired</span>');
                const expiresCell = isLifetime ? '<span style="color:rgba(255,255,255,0.3)">—</span>' : new Date(k.expires).toLocaleDateString();
                return '<tr><td style="font-family:monospace;font-size:12px;letter-spacing:0.5px">' + k.key + '</td><td>' + new Date(k.created).toLocaleDateString() + '</td><td>' + expiresCell + '</td><td>' + status + '</td><td><button class="btn btn-danger text-xs px-3 py-1.5" onclick="deleteKey(\'' + k.key + '\')">delete</button></td></tr>';
            }).join('') + '</tbody></table>';
    } catch (e) {
        wrap.innerHTML = '<div class="p-8 text-center text-sm text-red-400">failed to load keys</div>';
    }
}

async function generateKeys() {
    const btn = event.target;
    btn.classList.add("loading");
    const amount = document.getElementById("keyAmount").value;
    const duration = document.getElementById("keyDuration").value;
    const lifetime = document.getElementById("keyLifetime").checked;
    try {
        const res = await fetch("/api/keys?token=" + TOKEN, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ amount: parseInt(amount), duration: parseInt(duration), lifetime })
        });
        const data = await res.json();
        if (data.success) {
            toast("generated " + amount + " key" + (amount > 1 ? "s" : ""));
            loadKeys();
        } else {
            toast(data.error || "failed to generate keys", "error");
        }
    } catch (e) {
        toast("request failed", "error");
    }
    btn.classList.remove("loading");
}

async function deleteKey(key) {
    if (!confirm("delete this key?")) return;
    try {
        const res = await fetch("/api/keys?token=" + TOKEN, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ key })
        });
        const data = await res.json();
        if (data.success) {
            toast("key deleted");
            loadKeys();
        } else {
            toast(data.error || "failed to delete", "error");
        }
    } catch (e) {
        toast("request failed", "error");
    }
}

// Scripts
async function loadScripts() {
    const wrap = document.getElementById("scriptsTableWrap");
    try {
        const res = await fetch("/api/scripts?token=" + TOKEN);
        const data = await res.json();
        if (!data.scripts || data.scripts.length === 0) {
            wrap.innerHTML = '<div class="p-8 text-center text-sm text-white/20">no scripts released yet</div>';
            return;
        }
        wrap.innerHTML = '<table><thead><tr><th>name</th><th>version</th><th>released</th><th>raw link</th><th></th></tr></thead><tbody>' +
            data.scripts.map(s => {
                const rawUrl = window.location.origin + "/api/raw/" + s.id;
                return '<tr><td style="font-weight:600">' + s.name + '</td><td style="font-family:monospace;font-size:12px">v' + s.version + '</td><td>' + new Date(s.released).toLocaleDateString() + '</td><td><code style="font-size:11px;color:#91c8f5;word-break:break-all">' + rawUrl + '</code></td><td><button class="btn btn-ghost text-xs px-3 py-1.5" onclick="updateScript(\'' + s.id + '\')">update</button></td></tr>';
            }).join('') + '</tbody></table>';
    } catch (e) {
        wrap.innerHTML = '<div class="p-8 text-center text-sm text-red-400">failed to load scripts</div>';
    }
}

async function releaseScript() {
    const btn = event.target;
    btn.classList.add("loading");
    const name = document.getElementById("scriptName").value.trim();
    const source = document.getElementById("scriptSource").value.trim();
    if (!name || !source) { toast("fill in all fields", "error"); btn.classList.remove("loading"); return; }
    try {
        const res = await fetch("/api/scripts?token=" + TOKEN, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, source })
        });
        const data = await res.json();
        if (data.success) {
            toast("script released: " + data.url);
            document.getElementById("scriptName").value = "";
            document.getElementById("scriptSource").value = "";
            loadScripts();
        } else {
            toast(data.error || "failed to release", "error");
        }
    } catch (e) {
        toast("request failed", "error");
    }
    btn.classList.remove("loading");
}

async function updateScript(id) {
    const source = prompt("paste the updated un-obfuscated script:");
    if (!source) return;
    try {
        const res = await fetch("/api/scripts/update?token=" + TOKEN, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id, source })
        });
        const data = await res.json();
        if (data.success) {
            toast("script updated: " + data.url);
            loadScripts();
        } else {
            toast(data.error || "failed to update", "error");
        }
    } catch (e) {
        toast("request failed", "error");
    }
}

// Load initial
loadKeys();
</script>
</body>
</html>`;

    return new Response(html, {
        headers: {
            "Content-Type": "text/html; charset=utf-8",
            "X-Frame-Options": "DENY"
        }
    });
}
