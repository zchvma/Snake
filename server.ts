import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { create, verify, getNumericDate, type Payload } from "https://deno.land/x/djwt@v2.8/mod.ts";
import { corsHeaders } from "./cors.ts";

// Load .env if present
import { config as loadEnv } from "https://deno.land/std@0.201.0/dotenv/mod.ts";
await loadEnv({ export: true });

const ADMIN_TOKEN = Deno.env.get("ADMIN_TOKEN");
if (!ADMIN_TOKEN) {
    console.warn("⚠️ ADMIN_TOKEN not set — protected routes will return 401");
}

const kv = await Deno.openKv();

// Issue JWT to client (e.g. guest)
async function issueJwt(userId: string): Promise<string> {
    const header = { alg: "HS256", typ: "JWT" };
    const payload: Payload = { sub: userId, exp: getNumericDate(60 * 60) };
    return await create(header, payload, ADMIN_TOKEN!);
}

serve(async (req: Request) => {
    const url = new URL(req.url);
    const path = url.pathname;

    // CORS preflight
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    // 1) /api/login → returns a temporary JWT
    if (path === "/api/login" && req.method === "POST") {
        const token = await issueJwt("guest");
        return new Response(JSON.stringify({ token }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
    }

    // 2) GET highscores
    if (path === "/api/highscores" && req.method === "GET") {
        const stored = await kv.get<unknown[]>(["highscores"]);
        return new Response(JSON.stringify(stored.value ?? []), {
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
    }

    // 3) POST highscores (requires valid Bearer JWT)
    if (path === "/api/highscores" && req.method === "POST") {
        const authHeader = req.headers.get("Authorization") || "";
        const token = authHeader.replace(/^Bearer\s+/, "");
        try {
            await verify(token, ADMIN_TOKEN!, "HS256");
        } catch {
            return new Response(JSON.stringify({ error: "Unauthorized" }), {
                status: 401,
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
        }

        let data: unknown[];
        try {
            data = await req.json();
        } catch {
            return new Response(JSON.stringify({ error: "Invalid JSON" }), {
                status: 400,
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
        }

        // Sort and keep top 10
        data.sort((a: any, b: any) => b.score - a.score);
        await kv.set(["highscores"], data.slice(0, 10));
        return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
    }

    // 4) Serve static files from project root (match structure)
    const filePath = path === "/" ? "/index.html" : path;
    try {
        let fsPath = `.${filePath}`;
        // try under /js or /styles if not found at root
        try { await Deno.stat(fsPath); } catch {
            // fallback directories
            if (filePath.startsWith("/js/")) fsPath = `.${filePath}`;
            else if (filePath.startsWith("/styles/")) fsPath = `.${filePath}`;
            else fsPath = `./public${filePath}`;
        }
        const file = await Deno.readFile(fsPath);
        const ext = fsPath.split('.').pop()?.toLowerCase() || '';
        const mimes: Record<string,string> = {
            html: "text/html",
            js: "application/javascript",
            css: "text/css",
            json: "application/json",
            png: "image/png",
            jpg: "image/jpeg",
            svg: "image/svg+xml",
        };
        return new Response(file, {
            headers: { ...corsHeaders, "Content-Type": mimes[ext] || "application/octet-stream" }
        });
    } catch (e) {
        if (e instanceof Deno.errors.NotFound) {
            return new Response("Not Found", { status: 404, headers: corsHeaders });
        }
        return new Response("Internal Server Error", { status: 500, headers: corsHeaders });
    }
});
