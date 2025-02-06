import { Hono } from 'hono';

const app = new Hono();

// GET route for testing
app.get('/', (c) => c.text("GET route is working!"));

// POST route to handle Telegram webhook requests.
app.post('/', async (c) => {
  try {
    const update = await c.req.json();
    console.log("Received Telegram update:", update);
  } catch (error) {
    console.error("Error parsing Telegram update:", error);
  }
  return c.text("Hello, World!");
});

export default {
  fetch: app.fetch,
};