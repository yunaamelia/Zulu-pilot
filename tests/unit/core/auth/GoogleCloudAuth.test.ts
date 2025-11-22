import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { GoogleCloudAuth } from '../../../../src/core/auth/GoogleCloudAuth.js';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';

// Mock google-auth-library
jest.mock('google-auth-library', () => {
  const mockGetAccessToken = jest.fn<() => Promise<{ token: string }>>().mockResolvedValue({
    token: 'mock-token-123',
  });
  const mockGetClient = jest
    .fn<() => Promise<{ getAccessToken: () => Promise<{ token: string }> }>>()
    .mockResolvedValue({
      getAccessToken: mockGetAccessToken,
    });
  const mockGetProjectId = jest
    .fn<() => Promise<string | undefined>>()
    .mockResolvedValue('test-project-id');

  return {
    GoogleAuth: jest.fn().mockImplementation(() => {
      return {
        getClient: mockGetClient,
        getProjectId: mockGetProjectId,
      };
    }),
  };
});

describe('GoogleCloudAuth', () => {
  let tempDir: string;
  let credentialsPath: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'zulu-pilot-test-'));
    credentialsPath = path.join(tempDir, 'credentials.json');
  });

  afterEach(async () => {
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('getAccessToken', () => {
    it('should get access token from service account credentials file', async () => {
      const credentials = {
        type: 'service_account',
        project_id: 'test-project',
        private_key_id: 'test-key-id',
        private_key: '-----BEGIN PRIVATE KEY-----\ntest-key\n-----END PRIVATE KEY-----\n',
        client_email: 'test@test.iam.gserviceaccount.com',
        client_id: '123456',
        auth_uri: 'https://accounts.google.com/o/oauth2/auth',
        token_uri: 'https://oauth2.googleapis.com/token',
        auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
        client_x509_cert_url:
          'https://www.googleapis.com/robot/v1/metadata/x509/test%40test.iam.gserviceaccount.com',
      };

      await fs.writeFile(credentialsPath, JSON.stringify(credentials), 'utf-8');

      const auth = new GoogleCloudAuth({ credentialsPath });
      const token = await auth.getAccessToken();

      expect(token).toBe('mock-token-123');
    });

    it('should get access token from credentials object', async () => {
      const credentials = {
        type: 'service_account',
        project_id: 'test-project',
        private_key: '-----BEGIN PRIVATE KEY-----\ntest-key\n-----END PRIVATE KEY-----\n',
        client_email: 'test@test.iam.gserviceaccount.com',
      };

      const auth = new GoogleCloudAuth({ credentials });
      const token = await auth.getAccessToken();

      expect(token).toBe('mock-token-123');
    });

    it('should throw error if credentials file does not exist', async () => {
      const auth = new GoogleCloudAuth({
        credentialsPath: path.join(tempDir, 'nonexistent.json'),
      });

      await expect(auth.getAccessToken()).rejects.toThrow('Credentials file not found');
    });

    it('should throw error if credentials file has invalid JSON', async () => {
      await fs.writeFile(credentialsPath, 'invalid json', 'utf-8');

      const auth = new GoogleCloudAuth({ credentialsPath });

      await expect(auth.getAccessToken()).rejects.toThrow('Invalid JSON');
    });

    it('should throw error if credentials file has invalid structure', async () => {
      const invalidCredentials = {
        type: 'invalid_type',
        project_id: 'test-project',
      };

      await fs.writeFile(credentialsPath, JSON.stringify(invalidCredentials), 'utf-8');

      const auth = new GoogleCloudAuth({ credentialsPath });

      await expect(auth.getAccessToken()).rejects.toThrow('Invalid credentials');
    });
  });

  describe('getProjectId', () => {
    it('should get project ID from credentials file', async () => {
      const credentials = {
        type: 'service_account',
        project_id: 'test-project-123',
        private_key: '-----BEGIN PRIVATE KEY-----\ntest-key\n-----END PRIVATE KEY-----\n',
        client_email: 'test@test.iam.gserviceaccount.com',
      };

      await fs.writeFile(credentialsPath, JSON.stringify(credentials), 'utf-8');

      const auth = new GoogleCloudAuth({ credentialsPath });
      const projectId = await auth.getProjectId();

      expect(projectId).toBe('test-project-123');
    });

    it('should get project ID from credentials object', async () => {
      const credentials = {
        type: 'service_account',
        project_id: 'test-project-456',
        private_key: '-----BEGIN PRIVATE KEY-----\ntest-key\n-----END PRIVATE KEY-----\n',
        client_email: 'test@test.iam.gserviceaccount.com',
      };

      const auth = new GoogleCloudAuth({ credentials });
      const projectId = await auth.getProjectId();

      expect(projectId).toBe('test-project-456');
    });
  });
});
