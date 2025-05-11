export { serve } from "https://deno.land/std@0.177.0/http/server.ts";
export { create, verify, getNumericDate } from "https://deno.land/x/djwt@v2.8/mod.ts";
export type { Payload } from "https://deno.land/x/djwt@v2.8/mod.ts";
import { corsHeaders } from "./cors.ts";

const ADMIN_TOKEN = Deno.env.get("ADMIN_TOKEN");
if (!ADMIN_TOKEN) {
    console.warn("⚠️ ADMIN_TOKEN не задан — проверьте .env или переменные окружения");
}

const kv = await Deno.openKv();

// Функция выдачи JWT
async function issueJwt(userId: string): Promise<string> {
    // здесь не нужен импорт Header — просто даём литерал
    const header = { alg: "HS256", typ: "JWT" };
    const payload: Payload = {
        sub: userId,
        exp: getNumericDate(60 * 60), // через час
    };
    return await create(header, payload, ADMIN_TOKEN!);
}

serve(async (req) => {
    const url = new URL(req.url);

    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    // Эндпоинт для логина/получения JWT
    if (url.pathname === "/api/login" && req.method === "POST") {
        const token = await issueJwt("guest");
        return new Response(JSON.stringify({ token }), {
            headers: {
                ...corsHeaders,
                "Content-Type": "application/json",
            },
        });
    }

    // GET для чтения таблицы
    if (url.pathname === "/api/highscores" && req.method === "GET") {
        const stored = await kv.get<unknown[]>(["highscores"]);
        return new Response(JSON.stringify(stored.value ?? []), {
            headers: {
                ...corsHeaders,
                "Content-Type": "application/json",
            },
        });
    }

    // POST для записи — только с корректным Bearer JWT
    if (url.pathname === "/api/highscores" && req.method === "POST") {
        const auth = req.headers.get("Authorization")?.replace("Bearer ", "");
        try {
            // verify сам бросает, если что-то не так
            await verify(auth!, ADMIN_TOKEN!, "HS256");
        } catch {
            return new Response(JSON.stringify({ error: "Unauthorized" }), {
                status: 401,
                headers: {
                    ...corsHeaders,
                    "Content-Type": "application/json",
                },
            });
        }

        let data: unknown[];
        try {
            data = await req.json();
        } catch {
            return new Response(JSON.stringify({ error: "Invalid JSON" }), {
                status: 400,
                headers: {
                    ...corsHeaders,
                    "Content-Type": "application/json",
                },
            });
        }

        // сохраняем
        data.sort((a: any, b: any) => b.score - a.score);
        await kv.set(["highscores"], data.slice(0, 10));

        return new Response(JSON.stringify({ success: true }), {
            headers: {
                ...corsHeaders,
                "Content-Type": "application/json",
            },
        });
    }

    // … остальной код для отдачи статики …
});
