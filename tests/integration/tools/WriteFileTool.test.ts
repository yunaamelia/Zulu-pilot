/**
 * Integration test for WriteFileTool with custom providers
 *
 * T071 [US2] - Test WriteFileTool with custom providers
 *
 * @package @zulu-pilot/tests
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { WriteFileTool } from '../../../packages/core/src/tools/write-file.js';
import type { Config } from '@google/gemini-cli-core';
import { GeminiCLIModelAdapter } from '@zulu-pilot/adapter';
import { UnifiedConfigManager } from '@zulu-pilot/core';
import { ProviderRegistry } from '@zulu-pilot/adapter';
import { MultiProviderRouter } from '@zulu-pilot/adapter';
import { OllamaProvider } from '@zulu-pilot/providers';
import { readFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';

describe('WriteFileTool with Custom Providers', () => {
  let testDir: string;
  let testFile: string;
  let mockConfig: Config;
  let adapter: GeminiCLIModelAdapter;
  let abortSignal: AbortSignal;

  beforeEach(async () => {
    // Create AbortSignal
    const controller = new AbortController();
    abortSignal = controller.signal;

    // Create test directory
    const tmpDir = tmpdir() || '/tmp';
    const dirPath = join(tmpDir, `zulu-pilot-test-${Date.now()}`);
    testDir = (await mkdir(dirPath, { recursive: true })) as string;
    testFile = join(testDir, 'output.txt');

    // Setup mock config with custom adapter
    const configManager = new UnifiedConfigManager();
    const unifiedConfig = await configManager.loadConfig();

    const registry = new ProviderRegistry();
    registry.registerFactory('ollama', (config: any) => {
      return new OllamaProvider({
        baseUrl: config.baseUrl || 'http://localhost:11434',
        model: config.model || 'qwen2.5-coder',
        timeout: config.timeout || 30000,
      });
    });

    for (const [name, providerConfig] of Object.entries(unifiedConfig.providers)) {
      if (providerConfig.enabled !== false) {
        registry.registerProvider(name, providerConfig);
      }
    }

    const router = new MultiProviderRouter(registry, unifiedConfig);
    adapter = new GeminiCLIModelAdapter(router, unifiedConfig);

    mockConfig = {
      getBaseLlmClient: jest.fn().mockReturnValue({
        getContentGenerator: jest.fn().mockReturnValue({
          generateContent: jest.fn(),
        }),
      }),
      getContentGenerator: jest.fn().mockReturnValue({
        generateContent: jest.fn(),
      }),
      setZuluPilotAdapter: jest.fn(),
      getZuluPilotAdapter: jest.fn().mockReturnValue(adapter),
      getCwd: jest.fn().mockReturnValue(testDir),
      getTargetDir: jest.fn().mockReturnValue(testDir),
      getApprovalMode: jest.fn().mockReturnValue('auto'),
      getFileSystemService: jest.fn().mockReturnValue({
        readFile: jest.fn(),
        writeFile: jest.fn(),
        exists: jest.fn(),
      }),
    } as unknown as Config;
  });

  afterEach(async () => {
    try {
      await unlink(testFile);
      await import('fs/promises').then((fs) => fs.rmdir(testDir));
    } catch {
      // Ignore cleanup errors
    }
  });

  it('should write file successfully with custom adapter configured', async () => {
    const writeFileTool = new WriteFileTool(mockConfig);
    const invocation = writeFileTool.build({
      file_path: 'output.txt',
      content: 'Test content\nLine 2',
    });

    const result = await invocation.execute(abortSignal);

    expect(result).toBeDefined();

    // Verify file was created
    const content = await readFile(testFile, 'utf-8');
    expect(content).toBe('Test content\nLine 2');
  });

  it('should verify adapter is accessible through config', () => {
    const adapterFromConfig = mockConfig.getZuluPilotAdapter();
    expect(adapterFromConfig).toBe(adapter);
    expect(adapterFromConfig).toBeInstanceOf(GeminiCLIModelAdapter);
  });
});
