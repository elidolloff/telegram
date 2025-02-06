/*
 * src/teqtank/api.ts
 *
 * This module provides functions to interact with the Teqtank API.
 *
 * Official Documentation:
 * - Teqtank API Swagger: https://api.teqtank.com/swagger/v1/swagger.json
 *
 * Implemented Endpoints:
 * - GET /Authorize/CompanyId/{companyId}/{instanceType} : Retrieves the global admin token.
 *   (Requires headers: MakoUsername and MakoPassword)
 * - POST /Crm/Customers/Authenticate : Authenticates a sales representative.
 *
 * Environment Variables (via Worker secrets and vars):
 * - TEQTANK_API_BASE_URL : Base URL for the Teqtank API.
 * - TEQTANK_COMPANY_ID   : Company ID for authentication.
 * - TEQTANK_INSTANCE_TYPE: Instance type for authentication.
 * - TEQTANK_MAKO_USERNAME: Mako username for retrieving the global token.
 * - TEQTANK_MAKO_PASSWORD: Mako password for retrieving the global token.
 */

export interface Env {
    TEQTANK_API_BASE_URL: string;
    TEQTANK_COMPANY_ID: string;
    TEQTANK_INSTANCE_TYPE: string;
    TEQTANK_MAKO_USERNAME: string;
    TEQTANK_MAKO_PASSWORD: string;
  }
  
  // This interface represents a simplified version of the Teqtank API response.
  // Adjust the fields based on the actual API documentation.
  export interface TeqtankAPIResponse {
    token?: string;
    // Include additional fields as needed.
  }
  
  /**
   * Retrieves the global admin token from the Teqtank API.
   *
   * Uses a GET request to:
   *   /Authorize/CompanyId/{companyId}/{instanceType}
   * with required headers:
   *   - MakoUsername
   *   - MakoPassword
   *
   * @param env - The environment object containing required variables.
   * @returns A Promise that resolves to the admin token as a string.
   */
  export async function getAdminToken(env: Env): Promise<string> {
    const companyId = env.TEQTANK_COMPANY_ID;
    const instanceType = env.TEQTANK_INSTANCE_TYPE;
    const baseUrl = env.TEQTANK_API_BASE_URL;
    const url = `${baseUrl}/Authorize/CompanyId/${companyId}/${instanceType}`;
  
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'MakoUsername': env.TEQTANK_MAKO_USERNAME,
        'MakoPassword': env.TEQTANK_MAKO_PASSWORD,
      },
    });
  
    if (!response.ok) {
      throw new Error(`Failed to retrieve admin token: ${response.statusText}`);
    }
  
    const data: TeqtankAPIResponse = await response.json();
  
    if (!data.token) {
      throw new Error('Admin token not found in the response.');
    }
  
    return data.token;
  }
  
  /**
   * Authenticates a sales representative using the Teqtank API.
   *
   * First, it obtains the global admin token, then sends a POST request to:
   *   /Crm/Customers/Authenticate
   * with the provided username and password.
   *
   * @param env - The environment object containing required variables.
   * @param username - The sales rep's username.
   * @param password - The sales rep's password.
   * @returns A Promise that resolves to the Teqtank API response.
   */
  export async function authenticateRep(
    env: Env,
    username: string,
    password: string
  ): Promise<TeqtankAPIResponse> {
    // First, obtain the admin token using the Mako credentials.
    const adminToken = await getAdminToken(env);
    const baseUrl = env.TEQTANK_API_BASE_URL;
    const url = `${baseUrl}/Crm/Customers/Authenticate`;
  
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        username,
        password,
      }),
    });
  
    if (!response.ok) {
      throw new Error(`Failed to authenticate rep: ${response.statusText}`);
    }
  
    const data: TeqtankAPIResponse = await response.json();
    return data;
  }