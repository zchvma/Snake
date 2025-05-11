import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { create, verify, getNumericDate, type Payload } from "https://deno.land/x/djwt@v2.8/mod.ts";
import { corsHeaders } from "./cors.ts";

const ADMIN_TOKEN = Deno.env.get("ADMIN_TOKEN");
if (!ADMIN_TOKEN) {
    console.warn("⚠️ ADMIN_TOKEN not set—protected routes will 401.");
}

const kv = await Deno.openKv();

// Issue a JWT to “guest”
async function issueJwt(userId: string): Promise<string> {
    const header = { alg: "HS256", typ: "JWT" };
    const payload: Payload = {
        sub: userId,
        exp: getNumericDate(60 * 60),
    };
    return await create(header, payload, ADMIN_TOKEN!);
}

serve(async (req) => {
    const url = new URL(req.url);

    // CORS preflight
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    // 1) /api/login → returns { token }
    if (url.pathname === "/api/login" && req.method === "POST") {
        const token = await issueJwt("guest");
        return new Response(JSON.stringify({ token }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    // 2) GET /api/highscores → returns stored highs
    if (url.pathname === "/api/highscores" && req.method === "GET") {
        const result = await kv.get<unknown[]>(["highscores"]);
        return new Response(JSON.stringify(result.value ?? []), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    // 3) POST /api/highscores → saves highs, only with valid JWT
    if (url.pathname === "/api/highscores" && req.method === "POST") {
        const auth = req.headers.get("Authorization")?.replace("Bearer ", "");
        try {
            await verify(auth!, ADMIN_TOKEN!, "HS256");
        } catch {
            return new Response(JSON.stringify({ error: "Unauthorized" }), {
                status: 401,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        let data: unknown[];
        try {
            data = await req.json();
        } catch {
            return new Response(JSON.stringify({ error: "Invalid JSON" }), {
                status: 400,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        data.sort((a: any, b: any) => b.score - a.score);
        await kv.set(["highscores"], data.slice(0, 10));

        return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    try {
        const path = url.pathname === "/" ? "/index.html" : url.pathname;
        const file = await Deno.readFile(`${path}`);
        const ext = path.split(".").pop()?.toLowerCase() ?? "";
        const mimes: Record<string,string> = {
            html: "text/html", js: "application/javascript", css: "text/css",
            json: "application/json", png: "image/png", jpg: "image/jpeg",
            svg: "image/svg+xml"
        };
        return new Response(file, {
            headers: { ...corsHeaders, "Content-Type": mimes[ext] ?? "application/octet-stream" },
        });
    } catch (err) {
        if (err instanceof Deno.errors.NotFound) {
            return new Response("Not Found", { status: 404, headers: corsHeaders });
        }
        return new Response("Internal Server Error", { status: 500, headers: corsHeaders });
    }
});
