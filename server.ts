import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { create, verify, getNumericDate, type Payload } from "https://deno.land/x/djwt@v2.8/mod.ts";

const ADMIN_TOKEN = Deno.env.get("ADMIN_TOKEN");
if (!ADMIN_TOKEN) {
    console.warn("⚠️ ADMIN_TOKEN not set — protected routes will return 401");
}

const kv = await Deno.openKv();

// CORS headers
const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

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

    // 1) Login endpoint
    if (path === "/api/login" && req.method === "POST") {
        const token = await issueJwt("guest");
        return Response.json({ token }, { headers: corsHeaders });
    }

    // 2) Get highscores
    if (path === "/api/highscores" && req.method === "GET") {
        const stored = await kv.get<unknown[]>(["highscores"]);
        return Response.json(stored.value ?? [], { headers: corsHeaders });
    }

    // 3) Save highscores (protected)
    if (path === "/api/highscores" && req.method === "POST") {
        const authHeader = req.headers.get("Authorization") || "";
        const token = authHeader.replace(/^Bearer\s+/, "");
        try {
            await verify(token, ADMIN_TOKEN!, "HS256");
        } catch {
            return Response.json({ error: "Unauthorized" }, {
                status: 401,
                headers: corsHeaders
            });
        }

        let data: unknown[];
        try {
            data = await req.json();
        } catch {
            return Response.json({ error: "Invalid JSON" }, {
                status: 400,
                headers: corsHeaders
            });
        }

        data.sort((a: any, b: any) => b.score - a.score);
        await kv.set(["highscores"], data.slice(0, 10));
        return Response.json({ success: true }, { headers: corsHeaders });
    }

    // 4) Static files handling
    try {
        const baseDir = Deno.cwd();
        let filePath = decodeURIComponent(url.pathname);

        // Default to index.html
        if (filePath === "/") filePath = "/index.html";

        // Security check
        const fullPath = `${baseDir}/public${filePath}`;
        if (!fullPath.startsWith(baseDir + "/public/")) {
            return new Response("Forbidden", { status: 403 });
        }

        const file = await Deno.readFile(fullPath);
        const ext = filePath.split('.').pop()?.toLowerCase() || '';
        const mimeMap: Record<string, string> = {
            "html": "text/html",
            "js": "application/javascript",
            "css": "text/css",
            "json": "application/json",
            "png": "image/png",
            "jpg": "image/jpeg",
            "jpeg": "image/jpeg",
            "gif": "image/gif",
            "svg": "image/svg+xml",
            "ico": "image/x-icon",
            "txt": "text/plain"
        };

        return new Response(file, {
            headers: {
                ...corsHeaders,
                "Content-Type": mimeMap[ext] || "application/octet-stream"
            }
        });
    } catch (error) {
        if (error instanceof Deno.errors.NotFound) {
            return new Response("Not Found", { status: 404, headers: corsHeaders });
        }
        return new Response("Internal Server Error", { status: 500, headers: corsHeaders });
    }
});