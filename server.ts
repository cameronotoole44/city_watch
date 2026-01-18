import "dotenv/config";
import { getStreams } from "./functions/api/streams";

const PORT = process.env.PORT || 3000;

async function handleRequest(req: Request): Promise<Response> {
  const url = new URL(req.url);

  if (url.pathname === "/api/streams") {
    try {
      const streams = await getStreams();
      return new Response(JSON.stringify(streams, null, 2), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      return new Response(
        JSON.stringify({ error: "Failed to fetch streams" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }
  }

  if (url.pathname === "/" || url.pathname === "/index.html") {
    const html = await Bun.file("./public/index.html").text();
    return new Response(html, {
      headers: { "Content-Type": "text/html" },
    });
  }

  return new Response("Not Found", { status: 404 });
}

console.log(`Server running at http://localhost:${PORT}`);

Bun.serve({
  port: PORT,
  fetch: handleRequest,
});
