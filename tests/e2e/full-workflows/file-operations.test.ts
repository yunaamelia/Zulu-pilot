/**
 * E2E test for file operations workflow with custom adapter
 *
 * T068 [P] [US2] - Write E2E test for file operations workflow
 *
 * @package @zulu-pilot/tests
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { ReadFileTool } from '../../../packages/core/src/tools/read-file.js';
import { WriteFileTool } from '../../../packages/core/src/tools/write-file.js';
import { GlobTool } from '../../../packages/core/src/tools/glob.js';
import type { Config } from '@google/gemini-cli-core';
import { GeminiCLIModelAdapter } from '@zulu-pilot/adapter';
import { UnifiedConfigManager } from '@zulu-pilot/core';
import { ProviderRegistry } from '@zulu-pilot/adapter';
import { MultiProviderRouter } from '@zulu-pilot/adapter';
import { OllamaProvider } from '@zulu-pilot/providers';
import { mkdir } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';

describe('E2E: File Operations Workflow', () => {
  let testDir: string;
  let mockConfig: Config;
  let adapter: GeminiCLIModelAdapter;
  let abortSignal: AbortSignal;

  beforeEach(async () => {
    // Create AbortSignal
    const controller = new AbortController();
    abortSignal = controller.signal;

    // Create test directory
    const tmpDir = tmpdir() || '/tmp';
    const dirPath = join(tmpDir, `zulu-pilot-e2e-${Date.now()}`);
    testDir = (await mkdir(dirPath, {
      recursive: true,
    })) as string;

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
      getApprovalMode: jest.fn().mockReturnValue('auto'),
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
      await import('fs/promises').then((fs) => fs.rm(testDir, { recursive: true, force: true }));
    } catch {
      // Ignore cleanup errors
    }
  });

  it('should complete full file operations workflow: create, read, search, update', async () => {
    const writeFileTool = new WriteFileTool(mockConfig);
    const readFileTool = new ReadFileTool(mockConfig);
    const globTool = new GlobTool(mockConfig);

    // 1. Create a new file
    const writeInvocation = writeFileTool.build({
      file_path: 'workflow-test.txt',
      content: 'Initial content\nLine 2\nLine 3',
    });
    const writeResult = await writeInvocation.execute(abortSignal);
    expect(writeResult).toBeDefined();

    // 2. Read the file
    const readInvocation = readFileTool.build({
      file_path: 'workflow-test.txt',
    });
    const readResult = await readInvocation.execute(abortSignal);
    expect(readResult.llmContent).toContain('Initial content');
    expect(readResult.llmContent).toContain('Line 2');

    // 3. Search for the file
    const searchInvocation = globTool.build({
      pattern: 'workflow-test.txt',
    });
    const searchResult = await searchInvocation.execute(abortSignal);
    expect(searchResult.llmContent).toContain('workflow-test.txt');

    // 4. Update the file
    const updateInvocation = writeFileTool.build({
      file_path: 'workflow-test.txt',
      content: 'Updated content\nNew line',
    });
    const updateResult = await updateInvocation.execute(abortSignal);
    expect(updateResult).toBeDefined();

    // 5. Verify update
    const verifyInvocation = readFileTool.build({
      file_path: 'workflow-test.txt',
    });
    const verifyResult = await verifyInvocation.execute(abortSignal);
    expect(verifyResult.llmContent).toContain('Updated content');
    expect(verifyResult.llmContent).not.toContain('Initial content');
  });

  it('should handle multiple file operations in sequence', async () => {
    const writeFileTool = new WriteFileTool(mockConfig);
    const readFileTool = new ReadFileTool(mockConfig);
    const globTool = new GlobTool(mockConfig);

    // Create multiple files
    await writeFileTool
      .build({ file_path: 'file1.txt', content: 'Content 1' })
      .execute(abortSignal);
    await writeFileTool
      .build({ file_path: 'file2.txt', content: 'Content 2' })
      .execute(abortSignal);
    await writeFileTool
      .build({ file_path: 'file3.txt', content: 'Content 3' })
      .execute(abortSignal);

    // Search for all txt files
    const searchInvocation = globTool.build({ pattern: '*.txt' });
    const searchResult = await searchInvocation.execute(abortSignal);
    expect(searchResult.llmContent).toContain('file1.txt');
    expect(searchResult.llmContent).toContain('file2.txt');
    expect(searchResult.llmContent).toContain('file3.txt');

    // Read each file
    const read1 = await readFileTool.build({ file_path: 'file1.txt' }).execute(abortSignal);
    const read2 = await readFileTool.build({ file_path: 'file2.txt' }).execute(abortSignal);
    const read3 = await readFileTool.build({ file_path: 'file3.txt' }).execute(abortSignal);

    expect(read1.llmContent).toContain('Content 1');
    expect(read2.llmContent).toContain('Content 2');
    expect(read3.llmContent).toContain('Content 3');
  });
});
