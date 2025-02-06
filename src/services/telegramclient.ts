interface TelegramMessageOptions {
  text: string;
  parse_mode?: string;
  reply_markup?: any;
}

interface TelegramResponse {
  ok: boolean;
  result: {
    message_id: number;
    chat: {
      id: number;
    };
  };
}

// Keep track of message IDs per chat
const chatMessages = new Map<number, number[]>();

export async function sendTelegramMessage(env: any, chatId: number, message: string | TelegramMessageOptions): Promise<{ message_id: number }> {
  try {
    let messageData: TelegramMessageOptions;
    
    if (typeof message === 'string') {
      // Escape special characters for HTML parsing if it's a string
      const escapedText = message
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
      
      messageData = {
        text: escapedText,
        parse_mode: "HTML"
      };
    } else {
      messageData = message;
    }

    const response = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: chatId,
        ...messageData
      })
    });

    if (!response.ok) {
      console.error("Error sending telegram message:", await response.text());
      throw new Error("Failed to send message");
    }

    // Store message ID for later deletion
    const result = (await response.json()) as TelegramResponse;
    const messageId = result.result.message_id;
    if (!chatMessages.has(chatId)) {
      chatMessages.set(chatId, []);
    }
    chatMessages.get(chatId)?.push(messageId);

    return { message_id: messageId };
  } catch (error) {
    console.error("Error in sendTelegramMessage:", error);
    throw error;
  }
}

export async function clearChatHistory(env: any, chatId: number): Promise<boolean> {
  try {
    const messageIds = chatMessages.get(chatId) || [];
    
    // Delete each message
    for (const messageId of messageIds) {
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

    // Clear the stored message IDs
    chatMessages.set(chatId, []);

    return true;
  } catch (error) {
    console.error("Error in clearChatHistory:", error);
    return false;
  }
}
