/**
 * Integration test for GlobTool with custom providers
 *
 * T072 [US2] - Test GlobTool (file search) with custom providers
 *
 * @package @zulu-pilot/tests
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { GlobTool } from '../../../packages/core/src/tools/glob.js';
import type { Config } from '@google/gemini-cli-core';
import { GeminiCLIModelAdapter } from '@zulu-pilot/adapter';
import { UnifiedConfigManager } from '@zulu-pilot/core';
import { ProviderRegistry } from '@zulu-pilot/adapter';
import { MultiProviderRouter } from '@zulu-pilot/adapter';
import { OllamaProvider } from '@zulu-pilot/providers';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';

describe('GlobTool with Custom Providers', () => {
  let testDir: string;
  let mockConfig: Config;
  let adapter: GeminiCLIModelAdapter;
  let abortSignal: AbortSignal;

  beforeEach(async () => {
    // Create AbortSignal
    const controller = new AbortController();
    abortSignal = controller.signal;

    // Create test directory with files
    const tmpDir = tmpdir() || '/tmp';
    const dirPath = join(tmpDir, `zulu-pilot-test-${Date.now()}`);
    testDir = (await mkdir(dirPath, { recursive: true })) as string;

    // Create test files
    await writeFile(join(testDir, 'file1.txt'), 'Content 1', 'utf-8');
    await writeFile(join(testDir, 'file2.js'), 'Content 2', 'utf-8');
    await writeFile(join(testDir, 'file3.ts'), 'Content 3', 'utf-8');
    await mkdir(join(testDir, 'subdir'), { recursive: true });
    await writeFile(join(testDir, 'subdir', 'file4.txt'), 'Content 4', 'utf-8');

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
      getFileSystemService: jest.fn().mockReturnValue({
        readFile: jest.fn(),
        writeFile: jest.fn(),
        exists: jest.fn(),
      }),
    } as unknown as Config;
  });

  afterEach(async () => {
    try {
      await import('fs/promises').then((fs) => fs.rm(testDir, { recursive: true, force: true }));
    } catch {
      // Ignore cleanup errors
    }
  });

  it('should search files successfully with custom adapter configured', async () => {
    const globTool = new GlobTool(mockConfig);
    const invocation = globTool.build({
      pattern: '*.txt',
    });

    const result = await invocation.execute(abortSignal);

    expect(result).toBeDefined();
    expect(result.llmContent).toContain('file1.txt');
    expect(result.error).toBeUndefined();
  });

  it('should verify adapter is accessible through config', () => {
    const adapterFromConfig = mockConfig.getZuluPilotAdapter();
    expect(adapterFromConfig).toBe(adapter);
    expect(adapterFromConfig).toBeInstanceOf(GeminiCLIModelAdapter);
  });
});
