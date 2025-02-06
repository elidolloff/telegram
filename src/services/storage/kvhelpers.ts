const ADMIN_TOKEN_KEY = "admintoken";
const SESSION_PREFIX = "session:";
const TOKEN_EXPIRY = 7200; // 2 hours in seconds

export async function saveAdminToken(env: any, token: string) {
  await env.TELEGRAM_BOT_SESSIONS.put(ADMIN_TOKEN_KEY, token, { expirationTtl: TOKEN_EXPIRY });
}

export async function getAdminToken(env: any): Promise<string | null> {
  return await env.TELEGRAM_BOT_SESSIONS.get(ADMIN_TOKEN_KEY);
}

export async function saveUserSession(env: any, chatId: number, token: string) {
  await env.TELEGRAM_BOT_SESSIONS.put(`${SESSION_PREFIX}${chatId}`, token, { expirationTtl: TOKEN_EXPIRY });
}

export async function getUserSession(env: any, chatId: number): Promise<string | null> {
  return await env.TELEGRAM_BOT_SESSIONS.get(`${SESSION_PREFIX}${chatId}`);
}

export async function removeUserSession(env: any, chatId: number) {
  await env.TELEGRAM_BOT_SESSIONS.delete(`${SESSION_PREFIX}${chatId}`);
}