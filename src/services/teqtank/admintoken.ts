import { saveAdminToken, getAdminToken } from "../storage/kvhelpers.ts";

interface TeqTankResponse<T> {
  data: T;
  success: boolean;
  errorMessage: string;
  errorCode: string;
  transaction: string;
}

interface TeqTankAuthData {
  token: string;
}

export async function fetchAdminToken(env: any): Promise<string | null> {
  // Debug log environment variables
  console.log("Environment check:", {
    hasApiBaseUrl: !!env.TEQTANK_API_BASE_URL,
    hasCompanyId: !!env.TEQTANK_COMPANY_ID,
    hasUsername: !!env.TEQTANK_USERNAME,
    hasPassword: !!env.TEQTANK_PASSWORD
  });

  if (!env.TEQTANK_API_BASE_URL || !env.TEQTANK_COMPANY_ID || !env.TEQTANK_USERNAME || !env.TEQTANK_PASSWORD) {
    console.error("Missing required TeqTank environment variables");
    return null;
  }

  const url = `${env.TEQTANK_API_BASE_URL}/Authorize/CompanyId/${env.TEQTANK_COMPANY_ID}/3`;
  console.log("Fetching admin token...");
  
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "accept": "text/plain",
        "MakoUsername": env.TEQTANK_USERNAME,
        "MakoPassword": env.TEQTANK_PASSWORD
      }
    });

    if (!response.ok) {
      console.error("Failed to fetch admin token. Status:", response.status);
      return null;
    }

    const data = await response.json() as TeqTankResponse<TeqTankAuthData>;
    console.log("Admin token response:", {
      success: data.success,
      hasToken: !!data.data?.token,
      errorMessage: data.errorMessage
    });

    if (!data.success || !data.data?.token) {
      console.error("Failed to get token:", data.errorMessage || "No token in response");
      return null;
    }

    await saveAdminToken(env, data.data.token);
    return data.data.token;
  } catch (error) {
    console.error("Error fetching admin token:", error);
    return null;
  }
}

export async function getValidAdminToken(env: any): Promise<string | null> {
  try {
    const existingToken = await getAdminToken(env);
    if (existingToken) return existingToken;
    
    return fetchAdminToken(env);
  } catch (error) {
    console.error("Error getting valid admin token:", error);
    return null;
  }
}