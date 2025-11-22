#!/usr/bin/env node
/**
 * Test chat on all registered models
 */

import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { homedir } from 'node:os';

const execAsync = promisify(exec);

interface ModelTest {
  provider: string;
  model: string;
  description: string;
  requiresAuth?: boolean;
  requiresService?: boolean;
}

const TEST_PROMPT = 'Hello, this is a test message. Please respond briefly with "OK".';

const MODELS: ModelTest[] = [
  // Ollama models
  {
    provider: 'ollama',
    model: 'qwen2.5-coder',
    description: 'Qwen 2.5 Coder',
    requiresService: true,
  },
  { provider: 'ollama', model: 'llama3.2', description: 'Llama 3.2', requiresService: true },
  { provider: 'ollama', model: 'mistral', description: 'Mistral', requiresService: true },
  { provider: 'ollama', model: 'codellama', description: 'CodeLlama', requiresService: true },
  {
    provider: 'ollama',
    model: 'deepseek-coder',
    description: 'DeepSeek Coder',
    requiresService: true,
  },

  // Gemini models
  {
    provider: 'gemini',
    model: 'gemini-2.5-pro',
    description: 'Gemini 2.5 Pro',
    requiresAuth: true,
  },
  {
    provider: 'gemini',
    model: 'gemini-1.5-pro',
    description: 'Gemini 1.5 Pro',
    requiresAuth: true,
  },
  {
    provider: 'gemini',
    model: 'gemini-1.5-flash',
    description: 'Gemini 1.5 Flash',
    requiresAuth: true,
  },

  // OpenAI models
  { provider: 'openai', model: 'gpt-4', description: 'GPT-4', requiresAuth: true },
  { provider: 'openai', model: 'gpt-4-turbo', description: 'GPT-4 Turbo', requiresAuth: true },
  { provider: 'openai', model: 'gpt-3.5-turbo', description: 'GPT-3.5 Turbo', requiresAuth: true },

  // Google Cloud models
  {
    provider: 'googleCloud',
    model: 'deepseek-ai/deepseek-v3.1-maas',
    description: 'DeepSeek V3.1 (us-west2)',
    requiresAuth: true,
  },
  {
    provider: 'googleCloud',
    model: 'qwen/qwen3-coder-480b-a35b-instruct-maas',
    description: 'Qwen Coder 480B (us-south1)',
    requiresAuth: true,
  },
  {
    provider: 'googleCloud',
    model: 'deepseek-ai/deepseek-r1-0528-maas',
    description: 'DeepSeek R1 (us-central1)',
    requiresAuth: true,
  },
  {
    provider: 'googleCloud',
    model: 'moonshotai/kimi-k2-thinking-maas',
    description: 'Kimi K2 (global)',
    requiresAuth: true,
  },
  {
    provider: 'googleCloud',
    model: 'openai/gpt-oss-120b-maas',
    description: 'GPT OSS 120B (us-central1)',
    requiresAuth: true,
  },
  {
    provider: 'googleCloud',
    model: 'meta/llama-3.1-405b-instruct-maas',
    description: 'Llama 3.1 405B (us-central1)',
    requiresAuth: true,
  },
];

interface TestResult {
  model: ModelTest;
  status: 'PASS' | 'FAIL' | 'SKIP';
  reason?: string;
  output?: string;
}

async function checkOllamaRunning(): Promise<boolean> {
  try {
    await execAsync('curl -s http://localhost:11434/api/tags');
    return true;
  } catch {
    return false;
  }
}

async function checkGcloudAuth(): Promise<boolean> {
  try {
    await execAsync('gcloud auth print-access-token');
    return true;
  } catch {
    return false;
  }
}

async function checkConfigHasApiKey(provider: string): Promise<boolean> {
  try {
    const configPath = join(homedir(), '.zulu-pilotrc');
    const configContent = await readFile(configPath, 'utf-8');
    const config = JSON.parse(configContent);
    return !!config.providers?.[provider]?.apiKey;
  } catch {
    return false;
  }
}

async function testModel(model: ModelTest, projectDir: string): Promise<TestResult> {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Testing: ${model.provider} - ${model.model}`);
  console.log(`Description: ${model.description}`);
  console.log('-'.repeat(60));

  // Check prerequisites
  if (model.requiresService && model.provider === 'ollama') {
    const isRunning = await checkOllamaRunning();
    if (!isRunning) {
      return {
        model,
        status: 'SKIP',
        reason: 'Ollama service not running',
      };
    }
  }

  if (model.requiresAuth) {
    if (model.provider === 'googleCloud') {
      const hasAuth = await checkGcloudAuth();
      if (!hasAuth) {
        return {
          model,
          status: 'SKIP',
          reason: 'gcloud not authenticated',
        };
      }
    } else {
      const hasApiKey = await checkConfigHasApiKey(model.provider);
      if (!hasApiKey) {
        return {
          model,
          status: 'SKIP',
          reason: `${model.provider} API key not configured`,
        };
      }
    }
  }

  // Update config for this model
  try {
    const configPath = join(homedir(), '.zulu-pilotrc');
    const configContent = await readFile(configPath, 'utf-8');
    const config = JSON.parse(configContent);

    // Update provider config
    if (!config.providers) {
      config.providers = {};
    }

    if (model.provider === 'googleCloud') {
      config.providers.googleCloud = {
        projectId: config.providers.googleCloud?.projectId || 'protean-tooling-476420-i8',
        region: getRegionForModel(model.model),
        model: model.model,
      };
    } else if (model.provider === 'ollama') {
      config.providers.ollama = {
        baseUrl: 'http://localhost:11434',
        model: model.model,
      };
    } else {
      // Keep existing API key
      config.providers[model.provider] = {
        ...config.providers[model.provider],
        model: model.model,
      };
    }

    await writeFile(configPath, JSON.stringify(config, null, 2));
  } catch (error) {
    return {
      model,
      status: 'SKIP',
      reason: `Failed to update config: ${error instanceof Error ? error.message : String(error)}`,
    };
  }

  // Run test
  try {
    const cliPath = join(projectDir, 'dist/src/cli/index.js');
    const command = `node "${cliPath}" --debug chat "${TEST_PROMPT}" --provider ${model.provider}`;

    let output = '';
    try {
      const { stdout, stderr } = await execAsync(command, {
        timeout: 60000, // 60 seconds timeout
        cwd: projectDir,
        maxBuffer: 10 * 1024 * 1024, // 10MB buffer
      });
      output = stdout + stderr;
    } catch (execError: unknown) {
      // execAsync throws error on non-zero exit, but we still want to check output
      if (
        execError &&
        typeof execError === 'object' &&
        'stdout' in execError &&
        'stderr' in execError
      ) {
        output =
          String((execError as { stdout: string }).stdout) +
          String((execError as { stderr: string }).stderr);
      } else {
        output = String(execError);
      }
    }

    // Check for various error patterns
    const errorPatterns = [
      /Error:\s*([^\n]+)/i,
      /ConnectionError[^\n]*/i,
      /RateLimitError[^\n]*/i,
      /Failed to connect[^\n]*/i,
      /Model or endpoint not found[^\n]*/i,
      /Invalid credentials[^\n]*/i,
      /Authentication failed[^\n]*/i,
      /API key[^\n]*/i,
    ];

    let errorMessage: string | undefined;
    for (const pattern of errorPatterns) {
      const match = output.match(pattern);
      if (match) {
        errorMessage = (match[1] || match[0]).trim();
        // Clean up error message - remove stack traces and long paths
        errorMessage = errorMessage
          .replace(/\\n/g, ' ') // Replace \n with space
          .replace(/at\s+.*/g, '') // Remove stack trace lines
          .replace(/file:\/\/\/[^\s]+/g, '') // Remove file paths
          .replace(/\s+/g, ' ') // Normalize whitespace
          .trim();
        // Truncate long error messages
        if (errorMessage.length > 60) {
          errorMessage = errorMessage.substring(0, 57) + '...';
        }
        break;
      }
    }

    if (errorMessage) {
      return {
        model,
        status: 'FAIL',
        reason: errorMessage,
        output: output.substring(0, 500),
      };
    }

    // Check if we got actual response content
    // Look for content that's not debug logs or errors
    const lines = output.split('\n');
    const nonDebugLines = lines.filter(
      (line) =>
        line.trim().length > 0 &&
        !line.startsWith('[DEBUG]') &&
        !line.startsWith('Error:') &&
        !line.includes('ConnectionError') &&
        !line.includes('RateLimitError') &&
        !line.includes('Failed to connect') &&
        !line.includes('Initializing provider') &&
        !line.includes('Connecting to AI model') &&
        !line.match(/^\s*$/) // Not just whitespace
    );

    // Check if we have meaningful response content
    const hasActualResponse =
      nonDebugLines.length > 3 &&
      nonDebugLines.some((line) => {
        const trimmed = line.trim();
        return (
          trimmed.length > 5 &&
          !trimmed.match(/^[─=]+$/) && // Not separator lines
          !trimmed.match(/^Testing:/) &&
          !trimmed.match(/^Description:/) &&
          !trimmed.match(/^Provider determined/) &&
          !trimmed.match(/^Configuration loaded/)
        );
      });

    if (hasActualResponse) {
      return {
        model,
        status: 'PASS',
        output: output.substring(0, 500),
      };
    }

    // If output is very short, likely no response
    if (output.length < 500) {
      return {
        model,
        status: 'FAIL',
        reason: 'No response received (output too short)',
        output: output.substring(0, 500),
      };
    }

    // Default: assume failure if we can't determine success
    return {
      model,
      status: 'FAIL',
      reason: 'Unable to determine response status',
      output: output.substring(0, 500),
    };
  } catch (error) {
    return {
      model,
      status: 'FAIL',
      reason:
        error instanceof Error ? error.message.substring(0, 80) : String(error).substring(0, 80),
    };
  }
}

function getRegionForModel(model: string): string {
  const regionMap: Record<string, string> = {
    'deepseek-ai/deepseek-v3.1-maas': 'us-west2',
    'qwen/qwen3-coder-480b-a35b-instruct-maas': 'us-south1',
    'deepseek-ai/deepseek-r1-0528-maas': 'us-central1',
    'moonshotai/kimi-k2-thinking-maas': 'global',
    'openai/gpt-oss-120b-maas': 'global', // Updated: uses global region with v1 endpoint
    'intfloat/multilingual-e5-large-instruct-maas': 'us-central1', // Embeddings model
  };
  return regionMap[model] || 'us-central1';
}

async function main(): Promise<void> {
  const projectDir = process.cwd();
  const results: TestResult[] = [];

  console.log('========================================');
  console.log('Zulu Pilot - Test All Models');
  console.log('========================================');
  console.log(`Test prompt: "${TEST_PROMPT}"`);
  console.log(`Total models: ${MODELS.length}`);

  for (const model of MODELS) {
    const result = await testModel(model, projectDir);
    results.push(result);

    // Print result
    const statusColor =
      result.status === 'PASS' ? '\x1b[32m' : result.status === 'FAIL' ? '\x1b[31m' : '\x1b[33m';
    console.log(
      `${statusColor}${result.status}\x1b[0m${result.reason ? `: ${result.reason}` : ''}`
    );
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('Test Summary');
  console.log('='.repeat(60));

  const passed = results.filter((r) => r.status === 'PASS').length;
  const failed = results.filter((r) => r.status === 'FAIL').length;
  const skipped = results.filter((r) => r.status === 'SKIP').length;

  console.log(`\x1b[32mPassed: ${passed}\x1b[0m`);
  console.log(`\x1b[31mFailed: ${failed}\x1b[0m`);
  console.log(`\x1b[33mSkipped: ${skipped}\x1b[0m`);

  console.log('\nDetailed Results:');
  for (const result of results) {
    const statusColor =
      result.status === 'PASS' ? '\x1b[32m' : result.status === 'FAIL' ? '\x1b[31m' : '\x1b[33m';
    console.log(
      `${statusColor}${result.status}\x1b[0m: ${result.model.provider}/${result.model.model}${result.reason ? ` - ${result.reason}` : ''}`
    );
  }

  process.exit(failed > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
