import { getRepToken } from "../../services/teqtank/repauth.ts";
import { saveUserSession } from "../../services/storage/kvhelpers.ts";
import { sendTelegramMessage } from "../../services/telegramclient.ts";

interface UserState {
  username?: string;
  messageIds: number[];
}

// Store user state in memory (you might want to move this to KV later)
const userStates = new Map<number, UserState>();

// Track users who just logged in to ignore commands
const recentLogins = new Map<number, boolean>();

async function deleteMessage(env: any, chatId: number, messageId: number) {
  try {
    await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/deleteMessage`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: chatId,
        message_id: messageId
      })
    });
  } catch (error) {
    console.error(`Failed to delete message ${messageId}:`, error);
  }
}

export async function handleAuth(env: any, chatId: number, text?: string): Promise<Response> {
  try {
    // Get existing state or create new one
    let state = userStates.get(chatId);
    
    // If no text or direct /login command, start the login flow
    if (!text || text === "/login") {
      if (!state) {
        state = { messageIds: [] };
        userStates.set(chatId, state);
      }
      const response = await sendTelegramMessage(env, chatId, "Please enter your username:");
      state.messageIds.push(response.message_id);
      return new Response("OK");
    }

    // Handle one-line login command: /login username password
    if (text.startsWith("/login")) {
      const [_, username, password] = text.split(" ");
      if (!username || !password) {
        if (!state) {
          state = { messageIds: [] };
          userStates.set(chatId, state);
        }
        const response = await sendTelegramMessage(env, chatId, "Please provide both username and password. Format: /login username password");
        state.messageIds.push(response.message_id);
        return new Response("OK");
      }

      return await authenticateUser(env, chatId, username, password);
    }

    // Handle interactive login flow
    if (!state) {
      await sendTelegramMessage(env, chatId, "❌ Session expired. Please start over with /login");
      return new Response("OK");
    }

    if (!state.username) {
      // Username step
      state.username = text;
      userStates.set(chatId, state);
      const response = await sendTelegramMessage(env, chatId, "Great! Now please enter your password:");
      state.messageIds.push(response.message_id);
      return new Response("OK");
    } else {
      // Password step
      const result = await authenticateUser(env, chatId, state.username, text);
      return result;
    }
  } catch (error) {
    console.error("Error in handleAuth:", error);
    await sendTelegramMessage(env, chatId, "An error occurred while processing your request. Please try again later.");
    return new Response("OK");
  }
}

// Helper function to authenticate user and save session
async function authenticateUser(env: any, chatId: number, username: string, password: string): Promise<Response> {
  const state = userStates.get(chatId);
  if (!state) {
    await sendTelegramMessage(env, chatId, "❌ Session expired. Please start over with /login");
    return new Response("OK");
  }

  const token = await getRepToken(env, username, password);
  if (!token) {
    const response = await sendTelegramMessage(env, chatId, "❌ Authentication failed. Please check your username and password and try again with /login");
    state.messageIds.push(response.message_id);
    return new Response("OK");
  }

  try {
    // Save session first
    await saveUserSession(env, chatId, token);
    
    // Delete all messages from the start and login flow
    const deletePromises = state.messageIds.map(messageId => deleteMessage(env, chatId, messageId));
    await Promise.all(deletePromises);
    
    // Send success message
    await sendTelegramMessage(env, chatId, "✅ Successfully logged in! You can now use the bot's features.");
    
    // Mark user as recently logged in
    recentLogins.set(chatId, true);
    
    // Clean up state
    userStates.delete(chatId);
    
    // Clear recent login after 2 seconds
    setTimeout(() => {
      recentLogins.delete(chatId);
    }, 2000);
    
    return new Response("OK");
  } catch (error) {
    console.error("Error in authenticateUser cleanup:", error);
    return new Response("OK");
  }
}

export { userStates, recentLogins };