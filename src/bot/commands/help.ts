import { sendTelegramMessage } from "../../services/telegramclient.ts";

export async function handleHelp(env: any, chatId: number): Promise<Response> {
  try {
    const helpMessage = `
🤖 <b>TeqTank Bot Help</b>

Available commands:
• /start - Start the bot and show main menu
• /login - Login to your account
• /logout - Logout from your account
• /help - Show this help message

Need more help? Contact support at support@teqtank.com
`;

    await sendTelegramMessage(env, chatId, helpMessage);
    return new Response("OK");
  } catch (error) {
    console.error("Error in handleHelp:", error);
    await sendTelegramMessage(env, chatId, "An error occurred. Please try again later.");
    return new Response("OK");
  }
}
