import { fetchAdminToken } from "./admintoken.ts";

interface CRMCustomerContract {
  customerId: number;
  userName: string;
  firstName: string;
  lastName: string;
  emailAddress: string;
  userCanLogIn: boolean;
}

interface TeqTankResponse<T> {
  data: T;
  success: boolean;
  errorMessage: string;
  errorCode: string;
  transaction: string;
  totalRecords: number;
}

export async function getRepToken(env: any, username: string, password: string): Promise<string | null> {
  try {
    // First get the admin token
    const adminToken = await fetchAdminToken(env);
    if (!adminToken) {
      console.error("Failed to get admin token");
      return null;
    }

    // Then authenticate the customer
    const url = `${env.TEQTANK_API_BASE_URL}/Crm/Customers/Authenticate`;
    console.log("Authenticating customer:", { username });
    
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "accept": "application/json",
        "CustomerUsername": username,
        "CustomerPassword": password,
        "Authorization": `Bearer ${adminToken}`
      }
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Failed to authenticate customer. Status:", response.status);
      return null;
    }

    const result = await response.json() as TeqTankResponse<CRMCustomerContract>;
    console.log("Customer authentication:", {
      success: result.success,
      hasData: !!result.data,
      canLogin: result.data?.userCanLogIn,
      errorMessage: result.errorMessage
    });

    if (!result.success || !result.data) {
      console.error("Authentication failed:", result.errorMessage || "No customer data in response");
      return null;
    }

    if (!result.data.userCanLogIn) {
      console.error("Customer account cannot log in");
      return null;
    }

    // Since the customer was found and can log in, we can use the admin token
    // The CRM authenticate endpoint just verifies the customer exists
    return adminToken;
  } catch (error) {
    console.error("Failed to get rep token:", error);
    return null;
  }
}