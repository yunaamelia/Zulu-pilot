import { GoogleAuth } from 'google-auth-library';
import fs from 'node:fs/promises';
import path from 'node:path';
import type { JWTInput } from 'google-auth-library';

/**
 * Service account credentials interface.
 */
export interface ServiceAccountCredentials {
  type: string;
  project_id: string;
  private_key_id: string;
  private_key: string;
  client_email: string;
  client_id: string;
  auth_uri: string;
  token_uri: string;
  auth_provider_x509_cert_url: string;
  client_x509_cert_url: string;
  universe_domain?: string;
}

/**
 * Options for Google Cloud authentication.
 */
export interface GoogleCloudAuthOptions {
  /**
   * Path to service account credentials JSON file.
   * If not provided, will try to use gcloud CLI or default credentials.
   */
  credentialsPath?: string;
  /**
   * Service account credentials object.
   * If provided, will be used directly instead of reading from file.
   */
  credentials?: ServiceAccountCredentials | JWTInput;
  /**
   * Scopes for the access token.
   * Default: ['https://www.googleapis.com/auth/cloud-platform']
   */
  scopes?: string[];
}

/**
 * Google Cloud authentication utility.
 * Supports service account credentials from JSON file or gcloud CLI.
 */
export class GoogleCloudAuth {
  private readonly credentialsPath?: string;
  private readonly credentials?: ServiceAccountCredentials | JWTInput;
  private readonly scopes: string[];

  constructor(options: GoogleCloudAuthOptions = {}) {
    this.credentialsPath = options.credentialsPath;
    this.credentials = options.credentials;
    this.scopes = options.scopes ?? ['https://www.googleapis.com/auth/cloud-platform'];
  }

  /**
   * Get access token using service account credentials or gcloud CLI.
   */
  async getAccessToken(): Promise<string> {
    // If credentials are provided, use them
    if (this.credentials) {
      return this.getAccessTokenFromCredentials(this.credentials);
    }

    // If credentials path is provided, load and use them
    if (this.credentialsPath) {
      const credentials = await this.loadCredentials(this.credentialsPath);
      return this.getAccessTokenFromCredentials(credentials);
    }

    // Try to use default credentials (Application Default Credentials)
    // This will work if GOOGLE_APPLICATION_CREDENTIALS is set or
    // if running on GCP with default service account
    try {
      const auth = new GoogleAuth({
        scopes: this.scopes,
      });
      const client = await auth.getClient();
      const tokenResponse = await client.getAccessToken();
      if (!tokenResponse.token) {
        throw new Error('Failed to get access token from default credentials');
      }
      return tokenResponse.token;
    } catch (error) {
      throw new Error(
        `Failed to get access token: ${error instanceof Error ? error.message : String(error)}. ` +
          `Please provide credentialsPath, credentials, or set GOOGLE_APPLICATION_CREDENTIALS environment variable.`
      );
    }
  }

  /**
   * Load service account credentials from JSON file.
   */
  private async loadCredentials(filePath: string): Promise<ServiceAccountCredentials> {
    try {
      const resolvedPath = path.isAbsolute(filePath)
        ? filePath
        : path.resolve(process.cwd(), filePath);

      const content = await fs.readFile(resolvedPath, 'utf-8');
      const credentials = JSON.parse(content) as ServiceAccountCredentials;

      // Validate required fields
      if (!credentials.type || credentials.type !== 'service_account') {
        throw new Error('Invalid credentials: type must be "service_account"');
      }
      if (!credentials.private_key) {
        throw new Error('Invalid credentials: private_key is required');
      }
      if (!credentials.client_email) {
        throw new Error('Invalid credentials: client_email is required');
      }
      if (!credentials.project_id) {
        throw new Error('Invalid credentials: project_id is required');
      }

      return credentials;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        throw new Error(
          `Credentials file not found: ${filePath}. Please provide a valid path to service account credentials JSON file.`
        );
      }
      if (error instanceof SyntaxError) {
        throw new Error(`Invalid JSON in credentials file: ${filePath}. ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Get access token from service account credentials.
   */
  private async getAccessTokenFromCredentials(
    credentials: ServiceAccountCredentials | JWTInput
  ): Promise<string> {
    try {
      // Initialize GoogleAuth with credentials
      const auth = new GoogleAuth({
        credentials: credentials as JWTInput,
        scopes: this.scopes,
      });

      const client = await auth.getClient();
      const tokenResponse = await client.getAccessToken();

      if (!tokenResponse.token) {
        throw new Error('Failed to get access token from credentials');
      }

      return tokenResponse.token;
    } catch (error) {
      throw new Error(
        `Failed to authenticate with service account: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Get the project ID from credentials.
   */
  async getProjectId(): Promise<string | undefined> {
    if (this.credentials) {
      const creds = this.credentials as ServiceAccountCredentials;
      return creds.project_id;
    }

    if (this.credentialsPath) {
      const credentials = await this.loadCredentials(this.credentialsPath);
      return credentials.project_id;
    }

    // Try to get from default credentials
    try {
      const auth = new GoogleAuth({
        scopes: this.scopes,
      });
      return await auth.getProjectId();
    } catch {
      return undefined;
    }
  }
}
