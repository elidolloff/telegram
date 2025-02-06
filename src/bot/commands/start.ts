import { sendTelegramMessage } from "../../services/telegramclient.ts";
import { getUserSession } from "../../services/storage/kvhelpers.ts";

export async function handleStart(env: any, chatId: number): Promise<Response> {
  try {
    // Check if user is already logged in
    const session = await getUserSession(env, chatId);
    if (session) {
      // User is already logged in, show a friendly message
      await sendTelegramMessage(env, chatId, "You're already logged in! Use /help to see available commands.");
      return new Response("OK");
    }

    // Only show login menu if user is not logged in
    const message = {
      text: "👋 Welcome to the TeqTank Bot! What would you like to do?",
      reply_markup: {
        inline_keyboard: [
          [
            { text: "🔑 Login", callback_data: "cmd_login_username" },
            { text: "❓ Help", callback_data: "cmd_help" }
          ]
        ]
      }
    };

    const response = await sendTelegramMessage(env, chatId, message);
    return new Response("OK");
  } catch (error) {
    console.error("Error in handleStart:", error);
    await sendTelegramMessage(env, chatId, "An error occurred. Please try again later.");
    return new Response("OK");
  }
}
