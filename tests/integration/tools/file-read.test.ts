/**
 * Integration test for file read operation with custom adapter
 *
 * T065 [P] [US2] - Write integration test for file read operation
 *
 * @package @zulu-pilot/tests
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { ReadFileTool } from '../../../packages/core/src/tools/read-file.js';
import type { Config } from '@google/gemini-cli-core';
import { GeminiCLIModelAdapter } from '@zulu-pilot/adapter';
import { UnifiedConfigManager } from '@zulu-pilot/core';
import { ProviderRegistry } from '@zulu-pilot/adapter';
import { MultiProviderRouter } from '@zulu-pilot/adapter';
import { OllamaProvider } from '@zulu-pilot/providers';
import { writeFile, unlink, mkdir } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';

describe('File Read Operation Integration', () => {
  let testDir: string;
  let testFile: string;
  let mockConfig: Config;
  let adapter: GeminiCLIModelAdapter;
  let abortSignal: AbortSignal;

  beforeEach(async () => {
    // Create AbortSignal
    const controller = new AbortController();
    abortSignal = controller.signal;

    // Create test directory and file
    const tmpDir = tmpdir() || '/tmp';
    const dirPath = join(tmpDir, `zulu-pilot-test-${Date.now()}`);
    testDir = (await mkdir(dirPath, {
      recursive: true,
    })) as string;
    testFile = join(testDir, 'test.txt');
    await writeFile(testFile, 'Hello, World!\nThis is a test file.', 'utf-8');

    // Setup mock config
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
    // Clean up test files
    try {
      await unlink(testFile);
      await import('fs/promises').then((fs) => fs.rmdir(testDir));
    } catch {
      // Ignore cleanup errors
    }
  });

  it('should read file using ReadFileTool with custom adapter', async () => {
    const readFileTool = new ReadFileTool(mockConfig);
    const invocation = readFileTool.build({
      file_path: 'test.txt',
    });

    const result = await invocation.execute(abortSignal);

    expect(result).toBeDefined();
    expect(result.llmContent).toContain('Hello, World!');
    expect(result.llmContent).toContain('This is a test file.');
  });

  it('should handle file not found error gracefully', async () => {
    const readFileTool = new ReadFileTool(mockConfig);
    const invocation = readFileTool.build({
      file_path: 'nonexistent.txt',
    });

    const result = await invocation.execute(abortSignal);

    expect(result).toBeDefined();
    expect(result.error).toBeDefined();
    expect(result.error?.type).toBe('FILE_NOT_FOUND');
  });

  it('should read file with offset and limit', async () => {
    const readFileTool = new ReadFileTool(mockConfig);
    const invocation = readFileTool.build({
      file_path: 'test.txt',
      offset: 1,
      limit: 1,
    });

    const result = await invocation.execute(abortSignal);

    expect(result).toBeDefined();
    expect(result.llmContent).toContain('This is a test file.');
  });
});
