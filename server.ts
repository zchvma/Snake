import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { corsHeaders } from "./cors.ts"

// Open the KV store
const kv = await Deno.openKv()

interface HighScore {
  name: string
  score: number
  level: number
  date: number
}

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
    })
  }

  const url = new URL(req.url)
  const path = url.pathname

  // API routes
  if (path === "/api/highscores") {
    if (req.method === "GET") {
      // Get high scores
      const highScores = await getHighScores()
      return new Response(JSON.stringify(highScores), {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      })
    } else if (req.method === "POST") {
      // Save high scores
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
  }

  // Serve static files
  try {
    // Default to index.html for the root path
    const filePath = path === "/" ? "/index.html" : path

    // Read the file from the file system
    const file = await Deno.readFile(`.${filePath}`)

    // Determine content type based on file extension
    const contentType = getContentType(filePath)

    return new Response(file, {
      headers: {
        ...corsHeaders,
        "Content-Type": contentType,
      },
    })
  } catch (error) {
    // If file not found, return 404
    if (error instanceof Deno.errors.NotFound) {
      return new Response("Not Found", { status: 404, headers: corsHeaders })
    }

    // For other errors, return 500
    return new Response("Internal Server Error", {
      status: 500,
      headers: corsHeaders,
    })
  }
})

async function getHighScores(): Promise<HighScore[]> {
  // Get high scores from KV store
  const result = await kv.get<HighScore[]>(["highscores"])
  return result.value || []
}

async function saveHighScores(highScores: HighScore[]): Promise<void> {
  // Sort high scores by score (descending)
  highScores.sort((a, b) => b.score - a.score)

  // Limit to top 10 scores
  const topScores = highScores.slice(0, 10)

  // Save to KV store
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
