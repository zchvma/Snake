export { serve } from "https://deno.land/std@0.177.0/http/server.ts";
export {
    create,
    verify,
    getNumericDate,
    Header,
    Payload,
} from "https://deno.land/x/djwt@v2.8/mod.ts";
import { corsHeaders } from "./cors.ts";

const ADMIN_TOKEN = Deno.env.get("ADMIN_TOKEN");
if (!ADMIN_TOKEN) {
    console.warn(
        "Warning: ADMIN_TOKEN environment variable is not set. Protected endpoints will not work.",
    );
}

const kv = await Deno.openKv();
const header: Header = { alg: "HS256", typ: "JWT" };

// Выпускаем JWT клиенту (в данном примере без реального логина — просто guest)
async function issueJwt(userId: string): Promise<string> {
    const payload: Payload = {
        sub: userId,
        exp: getNumericDate(60 * 60), // 1 час
    };
    return await create(header, payload, ADMIN_TOKEN!);
}

async function getHighScores() {
    const result = await kv.get(["highscores"]);
    return result.value ?? [];
}

async function saveHighScores(highScores: unknown[]) {
    // Опционально: сортировка и ограничение длины
    highScores.sort((a: any, b: any) => b.score - a.score);
    const top = highScores.slice(0, 10);
    await kv.set(["highscores"], top);
}

serve(async (req) => {
    const { pathname } = new URL(req.url);

    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    // 1) Эндпоинт для получения JWT
    if (pathname === "/api/login" && req.method === "POST") {
        // Здесь у вас могла быть проверка user/pass, сейчас сразу guest
        const token = await issueJwt("guest");
        return new Response(JSON.stringify({ token }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    // 2) GET: возвращаем текущие рекорды
    if (pathname === "/api/highscores" && req.method === "GET") {
        const highs = await getHighScores();
        return new Response(JSON.stringify(highs), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    // 3) POST: сохраняем новые рекорды (только с валидным JWT)
    if (pathname === "/api/highscores" && req.method === "POST") {
        const authHeader = req.headers.get("Authorization") || "";
        const token = authHeader.replace("Bearer ", "");

        try {
            await verify(token, ADMIN_TOKEN!, "HS256");
        } catch {
            return new Response(JSON.stringify({ error: "Unauthorized" }), {
                status: 401,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        let data: unknown;
        try {
            data = await req.json();
        } catch {
            return new Response(JSON.stringify({ error: "Invalid JSON" }), {
                status: 400,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        await saveHighScores(data as any[]);
        return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    // 4) Статические файлы (index.html, скрипты, стили...)
    try {
        const filePath = pathname === "/" ? "/index.html" : pathname;
        const file = await Deno.readFile(`./public${filePath}`);
        const ext = filePath.split(".").pop()?.toLowerCase() ?? "";
        const mimes: Record<string, string> = {
            html: "text/html",
            js: "application/javascript",
            css: "text/css",
            json: "application/json",
            png: "image/png",
            jpg: "image/jpeg",
            svg: "image/svg+xml",
        };
        const contentType = mimes[ext] ?? "application/octet-stream";
        return new Response(file, {
            headers: { ...corsHeaders, "Content-Type": contentType },
        });
    } catch (err) {
        if (err instanceof Deno.errors.NotFound) {
            return new Response("Not Found", { status: 404, headers: corsHeaders });
        }
        return new Response("Internal Error", { status: 500, headers: corsHeaders });
    }
});