import { handleAuth, userStates, recentLogins } from "./commands/auth.ts";
import { handleLogout } from "./commands/logout.ts";
import { handleStart } from "./commands/start.ts";
import { handleHelp } from "./commands/help.ts";
import { sendTelegramMessage } from "../services/telegramclient.ts";

export async function handleTelegramUpdate(env: any, update: any): Promise<Response> {
  try {
    const chatId = update.callback_query?.message.chat.id || update.message?.chat.id;
    if (!chatId) {
      return new Response("OK");
    }

    // Ignore all commands if user just logged in
    if (recentLogins.has(chatId)) {
      console.log("Ignoring command right after login");
      return new Response("OK");
    }

    // Track message IDs for both start and login flows
    const messageId = update.message?.message_id;
    const callbackMessageId = update.callback_query?.message?.message_id;
    if (messageId || callbackMessageId) {
      const state = userStates.get(chatId);
      if (state) {
        if (messageId) state.messageIds.push(messageId);
        if (callbackMessageId) state.messageIds.push(callbackMessageId);
      }
    }

    // Handle callback queries (button clicks)
    if (update.callback_query) {
      const data = update.callback_query.data;

      if (data === 'cmd_login_username') {
        return handleAuth(env, chatId);
      } else if (data === 'cmd_help') {
        return handleHelp(env, chatId);
      }

      return new Response("OK");
    }

    // Handle text messages
    const text = update.message?.text;
    if (!text) {
      return new Response("OK");
    }

    // Handle commands
    if (text.startsWith("/start")) {
      // Create a new state to track messages from /start
      const state: { username?: string; messageIds: number[] } = { messageIds: [] };
      if (messageId) state.messageIds.push(messageId);
      userStates.set(chatId, state);
      return handleStart(env, chatId);
    }
    if (text.startsWith("/login")) {
      return handleAuth(env, chatId, text);
    }
    if (text.startsWith("/logout")) {
      return handleLogout(env, chatId);
    }
    if (text.startsWith("/help")) return handleHelp(env, chatId);

    // Handle login flow text input
    const userState = userStates.get(chatId);
    if (userState !== undefined) {
      return handleAuth(env, chatId, text);
    }

    await sendTelegramMessage(env, chatId, "I don't understand that command. Type /help to see available commands.");
    return new Response("OK");
  } catch (error) {
    console.error("Error handling telegram update:", error);
    return new Response("Error handling update", { status: 500 });
  }
}