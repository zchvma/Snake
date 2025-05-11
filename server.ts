import {serve} from "https://deno.land/std@0.177.0/http/server.ts"
import {corsHeaders} from "./cors.ts"

// kv storage
const kv = await Deno.openKv()

interface HighScore {
    name: string
    score: number
    level: number
    date: number
}

// Load admin token from environment
const ADMIN_TOKEN = Deno.env.get("ADMIN_TOKEN")
if (!ADMIN_TOKEN) {
    console.warn("Warning: ADMIN_TOKEN environment variable is not set. Protected endpoints will not work.")
}

serve(async (req: Request): Promise<Response> => {
    const url = new URL(req.url)
    const path = url.pathname

    // Preflight
    if (req.method === "OPTIONS") {
        return new Response(null, {
            headers: corsHeaders,
        })
    }

    // Helper to validate admin access
    function isAdmin(req: Request): boolean {
        const auth = req.headers.get("authorization") || ""
        return auth === `Bearer ${ADMIN_TOKEN}`
    }

    // GET high scores (public)
    if (path === "/api/highscores" && req.method === "GET") {
        const highScores = await getHighScores()
        return new Response(JSON.stringify(highScores), {
            headers: {
                ...corsHeaders,
                "Content-Type": "application/json",
            },
        })
    }

    // POST high scores (protected)
    if (path === "/api/highscores" && req.method === "POST") {
        if (!isAdmin(req)) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } })
        }
        try {
            const highScores = (await req.json()) as HighScore[]
            await saveHighScores(highScores)
            return new Response(JSON.stringify({ success: true }), {
                headers: {
                    ...corsHeaders,
                    "Content-Type": "application/json",
                },
            })
        } catch (error) {
            return new Response(JSON.stringify({ error: "Failed to save high scores" }), {
                status: 400,
                headers: {
                    ...corsHeaders,
                    "Content-Type": "application/json",
                },
            })
        }
    }

    // Serve static files
    try {
        const filePath = path === "/" ? "/index.html" : path
        const file = await Deno.readFile(`.${filePath}`)
        const contentType = getContentType(filePath)

        return new Response(file, {
            headers: {
                ...corsHeaders,
                "Content-Type": contentType,
            },
        })
    } catch (error) {
        if (error instanceof Deno.errors.NotFound) {
            return new Response("Not Found", { status: 404, headers: corsHeaders })
        }
        return new Response("Internal Server Error", {
            status: 500,
            headers: corsHeaders,
        })
    }
})

async function getHighScores(): Promise<HighScore[]> {
    const result = await kv.get<HighScore[]>(["highscores"])
    return result.value || []
}

async function saveHighScores(highScores: HighScore[]): Promise<void> {
    highScores.sort((a, b) => b.score - a.score)
    const topScores = highScores.slice(0, 10)
    await kv.set(["highscores"], topScores)
}

function getContentType(path: string): string {
    const extension = path.split(".").pop()?.toLowerCase() || ""
    const contentTypes: Record<string, string> = {
        html: "text/html",
        css: "text/css",
        js: "text/javascript",
        json: "application/json",
        png: "image/png",
        jpg: "image/jpeg",
        jpeg: "image/jpeg",
        gif: "image/gif",
        svg: "image/svg+xml",
        ico: "image/x-icon",
    }
    return contentTypes[extension] || "text/plain"
}