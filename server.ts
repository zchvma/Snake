import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { corsHeaders } from "./cors.ts";

// KV storage
const kv = await Deno.openKv();

interface HighScore {
    name: string;
    score: number;
    level: number;
    date: number;
}

interface AllowedToken {
    valid: true;
}

// Helpers
async function getHighScores(): Promise<HighScore[]> {
    const result = await kv.get<HighScore[]>(["highscores"]);
    return result.value || [];
}

async function saveHighScores(highScores: HighScore[]): Promise<void> {
    highScores.sort((a, b) => b.score - a.score);
    const top = highScores.slice(0, 10);
    await kv.set(["highscores"], top);
}

serve(async (req: Request): Promise<Response> => {
    const { method, headers, url } = req;
    const u = new URL(url);

    // Preflight
    if (method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    if (u.pathname === "/api/highscores") {
        // POST: save scores + issue token
        if (method === "POST") {
            try {
                const scores = (await req.json()) as HighScore[];
                await saveHighScores(scores);

                // Generate and store token
                const token = crypto.randomUUID();
                await kv.set(["allowedTokens", token], { valid: true } as AllowedToken);

                // Set cookie
                const cookie = [
                    `hs_token=${token}`,
                    `HttpOnly`,            // JS cannot read
                    `Secure`,              // HTTPS only
                    `SameSite=Strict`,     // no cross-site
                    `Path=/`,
                    `Max-Age=${60 * 60 * 24 * 365}` // 1 year
                ].join("; ");

                const respHeaders = new Headers({
                    ...corsHeaders,
                    "Content-Type": "application/json",
                    "Set-Cookie": cookie,
                });

                return new Response(JSON.stringify({ success: true }), { headers: respHeaders });
            } catch (e) {
                const respHeaders = new Headers({
                    ...corsHeaders,
                    "Content-Type": "application/json",
                });

                return new Response(
                    JSON.stringify({ error: "Failed to save high scores" }),
                    { status: 400, headers: respHeaders }
                );
            }
        }

        // GET: return scores if token valid
        if (method === "GET") {
            const cookieHeader = headers.get("cookie") || "";
            const match = cookieHeader.match(/(?:^|;\s*)hs_token=([^;]+)/);
            const token = match ? match[1] : null;
            if (!token) {
                return new Response("Forbidden", { status: 403, headers: corsHeaders });
            }

            const entry = await kv.get<AllowedToken>(["allowedTokens", token]);
            if (!entry.value?.valid) {
                return new Response("Forbidden", { status: 403, headers: corsHeaders });
            }

            const highScores = await getHighScores();
            return new Response(JSON.stringify(highScores), {
                headers: {
                    ...corsHeaders,
                    "Content-Type": "application/json",
                },
            });
        }
    }

    // Static files & fallback
    try {
        const path = u.pathname === "/" ? "/index.html" : u.pathname;
        const file = await Deno.readFile(`.${path}`);
        const contentType = getContentType(path);
        return new Response(file, { headers: { ...corsHeaders, "Content-Type": contentType } });
    } catch (err) {
        if (err instanceof Deno.errors.NotFound) {
            return new Response("Not Found", { status: 404, headers: corsHeaders });
        }
        return new Response("Internal Server Error", { status: 500, headers: corsHeaders });
    }
});

function getContentType(path: string): string {
    const ext = path.split('.').pop()?.toLowerCase() || '';
    const map: Record<string,string> = {
        html: 'text/html', css: 'text/css', js: 'application/javascript', json: 'application/json',
        png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', svg: 'image/svg+xml', ico: 'image/x-icon'
    };
    return map[ext] || 'application/octet-stream';
}