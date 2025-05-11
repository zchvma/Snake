import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { create, verify, getNumericDate, type Payload } from "https://deno.land/x/djwt@v2.8/mod.ts";
import { corsHeaders } from "./cors.ts";

const ADMIN_TOKEN = Deno.env.get("ADMIN_TOKEN");
if (!ADMIN_TOKEN) {
    console.warn("⚠️ ADMIN_TOKEN not set — protected routes will return 401");
}

const kv = await Deno.openKv();

// Issue a JWT signed with ADMIN_TOKEN
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

    // 1) Issue JWT
    if (path === "/api/login" && req.method === "POST") {
        const token = await issueJwt("guest");
        return new Response(JSON.stringify({ token }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
    }

    // 2) Get highscores
    if (path === "/api/highscores" && req.method === "GET") {
        const stored = await kv.get<unknown[]>(["highscores"]);
        return new Response(JSON.stringify(stored.value ?? []), {
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
    }

    // 3) Save highscores (protected)
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

        data.sort((a: any, b: any) => b.score - a.score);
        await kv.set(["highscores"], data.slice(0, 10));
        return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
    }

    // 4) Static file serving from root, js/, styles/, images/
    // Map "/" -> "./index.html", otherwise serve file from filesystem
    let fsPath = path === "/" ? "./index.html" : `.${path}`;

    try {
        const file = await Deno.readFile(fsPath);
        const ext = fsPath.split('.').pop()?.toLowerCase() || '';
        const mimeMap: Record<string,string> = {
            html: "text/html",
            js: "application/javascript",
            css: "text/css",
            json: "application/json",
            png: "image/png",
            jpg: "image/jpeg",
            jpeg: "image/jpeg",
            gif: "image/gif",
            svg: "image/svg+xml",
            ico: "image/x-icon",
        };
        const contentType = mimeMap[ext] ?? "application/octet-stream";
        return new Response(file, {
            headers: { ...corsHeaders, "Content-Type": contentType }
        });
    } catch (e) {
        if (e instanceof Deno.errors.NotFound) {
            return new Response("Not Found", { status: 404, headers: corsHeaders });
        }
        return new Response("Internal Server Error", { status: 500, headers: corsHeaders });
    }
});