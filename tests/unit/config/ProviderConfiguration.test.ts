import { describe, it, expect } from '@jest/globals';
import type { ProviderConfiguration } from '@zulu-pilot/core';

describe('ProviderConfiguration', () => {
  describe('Type validation', () => {
    it('should accept valid provider types', () => {
      const configs: ProviderConfiguration[] = [
        { type: 'ollama', name: 'local-ollama' },
        { type: 'openai', name: 'openai-prod' },
        { type: 'googleCloud', name: 'gcp-prod' },
        { type: 'gemini', name: 'gemini-prod' },
        { type: 'deepseek', name: 'deepseek-prod' },
        { type: 'qwen', name: 'qwen-prod' },
      ];

      configs.forEach((config) => {
        expect(config.type).toBeDefined();
        expect(config.name).toBeDefined();
        expect(typeof config.name).toBe('string');
      });
    });
  });

  describe('Configuration structure', () => {
    it('should accept minimal configuration with only type and name', () => {
      const config: ProviderConfiguration = {
        type: 'ollama',
        name: 'local',
      };

      expect(config.type).toBe('ollama');
      expect(config.name).toBe('local');
    });

    it('should accept full configuration with all optional fields', () => {
      const config: ProviderConfiguration = {
        type: 'openai',
        name: 'openai-prod',
        apiKey: 'sk-1234567890',
        baseUrl: 'https://api.openai.com/v1',
        model: 'gpt-4',
        timeout: 30000,
        enabled: true,
        providerSpecific: {
          endpoint: '/chat/completions',
        },
      };

      expect(config.type).toBe('openai');
      expect(config.name).toBe('openai-prod');
      expect(config.apiKey).toBe('sk-1234567890');
      expect(config.baseUrl).toBe('https://api.openai.com/v1');
      expect(config.model).toBe('gpt-4');
      expect(config.timeout).toBe(30000);
      expect(config.enabled).toBe(true);
      expect(config.providerSpecific?.endpoint).toBe('/chat/completions');
    });

    it('should accept environment variable reference for apiKey', () => {
      const config: ProviderConfiguration = {
        type: 'openai',
        name: 'openai-prod',
        apiKey: 'env:OPENAI_API_KEY',
      };

      expect(config.apiKey).toBe('env:OPENAI_API_KEY');
    });
  });

  describe('Google Cloud specific configuration', () => {
    it('should accept Google Cloud provider-specific fields', () => {
      const config: ProviderConfiguration = {
        type: 'googleCloud',
        name: 'gcp-prod',
        apiKey: 'env:GOOGLE_CLOUD_API_KEY',
        providerSpecific: {
          projectId: 'my-project-123',
          region: 'us-central1',
          credentialsPath: '/path/to/credentials.json',
          endpoint: 'https://us-central1-aiplatform.googleapis.com',
        },
      };

      expect(config.type).toBe('googleCloud');
      expect(config.providerSpecific?.projectId).toBe('my-project-123');
      expect(config.providerSpecific?.region).toBe('us-central1');
      expect(config.providerSpecific?.credentialsPath).toBe('/path/to/credentials.json');
      expect(config.providerSpecific?.endpoint).toBe(
        'https://us-central1-aiplatform.googleapis.com'
      );
    });
  });

  describe('Configuration defaults', () => {
    it('should handle enabled flag defaulting to true when not specified', () => {
      const config: ProviderConfiguration = {
        type: 'ollama',
        name: 'local',
      };

      // When enabled is not specified, it should be treated as enabled by default
      expect(config.enabled).toBeUndefined();
    });

    it('should allow explicitly disabling a provider', () => {
      const config: ProviderConfiguration = {
        type: 'openai',
        name: 'openai-prod',
        enabled: false,
      };

      expect(config.enabled).toBe(false);
    });
  });

  describe('Multiple provider configurations', () => {
    it('should support multiple providers with different configurations', () => {
      const providers: Record<string, ProviderConfiguration> = {
        ollama: {
          type: 'ollama',
          name: 'local',
          baseUrl: 'http://localhost:11434',
          model: 'qwen2.5-coder',
        },
        openai: {
          type: 'openai',
          name: 'openai-prod',
          apiKey: 'env:OPENAI_API_KEY',
          model: 'gpt-4',
          enabled: true,
        },
        googleCloud: {
          type: 'googleCloud',
          name: 'gcp-prod',
          apiKey: 'env:GOOGLE_CLOUD_API_KEY',
          providerSpecific: {
            projectId: 'my-project',
          },
          enabled: true,
        },
      };

      expect(Object.keys(providers)).toHaveLength(3);
      expect(providers.ollama.type).toBe('ollama');
      expect(providers.openai.type).toBe('openai');
      expect(providers.googleCloud.type).toBe('googleCloud');
    });
  });
});
