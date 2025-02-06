import { removeUserSession } from "../../services/storage/kvhelpers.ts";
import { sendTelegramMessage, clearChatHistory } from "../../services/telegramclient.ts";

export async function handleLogout(env: any, chatId: number): Promise<Response> {
  try {
    await removeUserSession(env, chatId);
    
    // Clear chat history before showing logout message
    await clearChatHistory(env, chatId);
    
    // Show simple logout message
    await sendTelegramMessage(env, chatId, "✅ Successfully logged out!");
    
    return new Response("OK");
  } catch (error) {
    console.error("Error in handleLogout:", error);
    await sendTelegramMessage(env, chatId, "An error occurred while logging out. Please try again later.");
    return new Response("OK");
  }
}