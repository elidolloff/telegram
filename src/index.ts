import { Hono } from "hono";
import { handleTelegramUpdate } from "./bot/telegram.ts";

const app = new Hono();

// Handle Telegram Webhook at root path
app.post("/", async (c) => {
  try {
    const body = await c.req.json();
    const result = await handleTelegramUpdate(c.env, body);
    return new Response(JSON.stringify({ ok: true }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return new Response(
      JSON.stringify({ ok: false, error: "Error processing webhook" }), 
      { 
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
});

// Health check endpoint
app.get("/", (c) => {
  return c.json({ status: "ok", message: "Telegram bot webhook is running!" });
});

export default app;