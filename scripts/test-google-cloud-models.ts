#!/usr/bin/env node
/**
 * Test all Google Cloud models using request.json service account credentials
 */

import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { existsSync } from 'node:fs';

const execAsync = promisify(exec);

interface ModelConfig {
  model: string;
  region: string;
  description: string;
  endpoint?: 'v1beta1' | 'v1';
}

const TEST_PROMPT = 'Hello! Please respond with "OK" to confirm you are working.';

const GOOGLE_CLOUD_MODELS: ModelConfig[] = [
  {
    model: 'deepseek-ai/deepseek-v3.1-maas',
    region: 'us-west2',
    description: 'DeepSeek V3.1',
    endpoint: 'v1beta1',
  },
  {
    model: 'qwen/qwen3-coder-480b-a35b-instruct-maas',
    region: 'us-south1',
    description: 'Qwen Coder 480B',
    endpoint: 'v1beta1',
  },
  {
    model: 'deepseek-ai/deepseek-r1-0528-maas',
    region: 'us-central1',
    description: 'DeepSeek R1 0528',
    endpoint: 'v1beta1',
  },
  {
    model: 'moonshotai/kimi-k2-thinking-maas',
    region: 'global',
    description: 'Kimi K2 Thinking',
    endpoint: 'v1',
  },
  {
    model: 'openai/gpt-oss-120b-maas',
    region: 'us-central1',
    description: 'GPT OSS 120B',
    endpoint: 'v1beta1',
  },
  {
    model: 'meta/llama-3.1-405b-instruct-maas',
    region: 'us-central1',
    description: 'Llama 3.1 405B',
    endpoint: 'v1beta1',
  },
];

interface TestResult {
  model: ModelConfig;
  status: 'PASS' | 'FAIL' | 'SKIP';
  reason?: string;
  response?: string;
  duration?: number;
}

async function checkRequestJson(): Promise<boolean> {
  return existsSync(join(process.cwd(), 'request.json'));
}

async function testModel(model: ModelConfig, projectDir: string): Promise<TestResult> {
  const startTime = Date.now();
  console.log(`\n${'='.repeat(70)}`);
  console.log(`Testing: ${model.description}`);
  console.log(`Model: ${model.model}`);
  console.log(`Region: ${model.region}`);
  console.log(`Endpoint: ${model.endpoint || 'v1beta1'}`);
  console.log('-'.repeat(70));

  // Check if request.json exists
  const hasRequestJson = await checkRequestJson();
  if (!hasRequestJson) {
    return {
      model,
      status: 'SKIP',
      reason: 'request.json not found in current directory',
    };
  }

  // Update config for this model
  try {
    const configPath = join(homedir(), '.zulu-pilotrc');
    let config: any = {};
    
    try {
      const configContent = await readFile(configPath, 'utf-8');
      config = JSON.parse(configContent);
    } catch {
      // Config doesn't exist, create default
      config = {
        provider: 'googleClaude',
        model: model.model,
        providers: {},
      };
    }

    if (!config.providers) {
      config.providers = {};
    }

    // Configure googleClaude provider with this model
    config.provider = 'googleClaude';
    config.model = model.model;
    config.providers.googleClaude = {
      projectId: 'protean-tooling-476420-i8',
      region: model.region,
      model: model.model,
      endpoint: model.endpoint,
      credentialsPath: join(process.cwd(), 'request.json'),
    };

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
    // Try different possible paths
    const possiblePaths = [
      join(projectDir, 'dist/cli/index.js'),
      join(projectDir, 'dist/src/cli/index.js'),
    ];
    
    let cliPath = possiblePaths.find(p => existsSync(p));
    if (!cliPath) {
      // Fallback: use npx tsx to run from source
      cliPath = join(projectDir, 'src/cli/index.ts');
    }
    
    const command = cliPath.endsWith('.ts') 
      ? `npx tsx "${cliPath}" chat "${TEST_PROMPT}" --provider googleClaude`
      : `node "${cliPath}" chat "${TEST_PROMPT}" --provider googleClaude`;

    let output = '';
    let stderr = '';
    try {
      const result = await execAsync(command, {
        timeout: 120000, // 2 minutes timeout
        cwd: projectDir,
        maxBuffer: 10 * 1024 * 1024, // 10MB buffer
      });
      output = result.stdout || '';
      stderr = result.stderr || '';
    } catch (execError: unknown) {
      // execAsync throws error on non-zero exit, but we still want to check output
      if (
        execError &&
        typeof execError === 'object' &&
        'stdout' in execError &&
        'stderr' in execError
      ) {
        output = String((execError as { stdout: string }).stdout || '');
        stderr = String((execError as { stderr: string }).stderr || '');
      } else {
        output = String(execError);
      }
    }

    const fullOutput = output + stderr;
    const duration = Date.now() - startTime;

    // Check for error patterns
    const errorPatterns = [
      /Error:\s*([^\n]+)/i,
      /ConnectionError[^\n]*/i,
      /RateLimitError[^\n]*/i,
      /Failed to connect[^\n]*/i,
      /Model or endpoint not found[^\n]*/i,
      /Invalid credentials[^\n]*/i,
      /Authentication failed[^\n]*/i,
      /Failed to authenticate[^\n]*/i,
    ];

    let errorMessage: string | undefined;
    for (const pattern of errorPatterns) {
      const match = fullOutput.match(pattern);
      if (match) {
        errorMessage = (match[1] || match[0]).trim();
        // Clean up error message
        errorMessage = errorMessage
          .replace(/\\n/g, ' ')
          .replace(/at\s+.*/g, '')
          .replace(/file:\/\/\/[^\s]+/g, '')
          .replace(/\s+/g, ' ')
          .trim();
        if (errorMessage.length > 100) {
          errorMessage = errorMessage.substring(0, 97) + '...';
        }
        break;
      }
    }

    if (errorMessage) {
      return {
        model,
        status: 'FAIL',
        reason: errorMessage,
        duration,
      };
    }

    // Extract actual response (remove debug logs, loading messages, etc.)
    const lines = fullOutput.split('\n');
    const responseLines = lines.filter(
      (line) =>
        line.trim().length > 0 &&
        !line.startsWith('[DEBUG]') &&
        !line.startsWith('Error:') &&
        !line.includes('ConnectionError') &&
        !line.includes('RateLimitError') &&
        !line.includes('Failed to connect') &&
        !line.includes('Initializing provider') &&
        !line.includes('Connecting to AI model') &&
        !line.includes('Loading context') &&
        !line.match(/^\s*$/) &&
        !line.match(/^[─=]+$/) &&
        !line.match(/^Testing:/) &&
        !line.match(/^Description:/) &&
        !line.match(/^Provider determined/) &&
        !line.match(/^Configuration loaded/) &&
        !line.match(/^Available models/) &&
        !line.match(/^Current default/)
    );

    // Check if we have meaningful response
    const hasResponse = responseLines.length > 0 && 
      responseLines.some(line => {
        const trimmed = line.trim();
        return trimmed.length > 3 && 
               trimmed.toLowerCase().includes('ok') ||
               trimmed.length > 10; // Any substantial response
      });

    if (hasResponse) {
      const response = responseLines.join(' ').trim().substring(0, 200);
      return {
        model,
        status: 'PASS',
        response,
        duration,
      };
    }

    // If output is very short, likely no response
    if (fullOutput.length < 200) {
      return {
        model,
        status: 'FAIL',
        reason: 'No response received (output too short)',
        duration,
      };
    }

    // Default: assume failure
    return {
      model,
      status: 'FAIL',
      reason: 'Unable to determine response status',
      duration,
    };
  } catch (error) {
    return {
      model,
      status: 'FAIL',
      reason:
        error instanceof Error ? error.message.substring(0, 100) : String(error).substring(0, 100),
      duration: Date.now() - startTime,
    };
  }
}

async function main(): Promise<void> {
  const projectDir = process.cwd();
  const results: TestResult[] = [];

  console.log('='.repeat(70));
  console.log('Zulu Pilot - Test Google Cloud Models');
  console.log('Using request.json for service account authentication');
  console.log('='.repeat(70));
  console.log(`Test prompt: "${TEST_PROMPT}"`);
  console.log(`Total models: ${GOOGLE_CLOUD_MODELS.length}`);

  // Check if request.json exists
  const hasRequestJson = await checkRequestJson();
  if (!hasRequestJson) {
    console.error('\n❌ Error: request.json not found in current directory');
    console.error('Please ensure request.json (service account credentials) is in the project root.');
    process.exit(1);
  }

  console.log('✅ request.json found');

  // Check if project is built
  const distPath = join(projectDir, 'dist/cli/index.js');
  if (!existsSync(distPath)) {
    console.log('\n📦 Building project...');
    try {
      await execAsync('npm run build', { cwd: projectDir });
      console.log('✅ Build complete');
    } catch (error) {
      console.error('❌ Build failed:', error);
      process.exit(1);
    }
  }

  // Test each model
  for (const model of GOOGLE_CLOUD_MODELS) {
    const result = await testModel(model, projectDir);
    results.push(result);

    // Print result
    const statusIcon = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⏭️';
    const statusColor =
      result.status === 'PASS' ? '\x1b[32m' : result.status === 'FAIL' ? '\x1b[31m' : '\x1b[33m';
    const duration = result.duration ? ` (${(result.duration / 1000).toFixed(1)}s)` : '';
    console.log(
      `${statusIcon} ${statusColor}${result.status}\x1b[0m${result.reason ? `: ${result.reason}` : ''}${duration}`
    );
    if (result.response) {
      console.log(`   Response: ${result.response.substring(0, 100)}...`);
    }
  }

  // Summary
  console.log('\n' + '='.repeat(70));
  console.log('Test Summary');
  console.log('='.repeat(70));

  const passed = results.filter((r) => r.status === 'PASS').length;
  const failed = results.filter((r) => r.status === 'FAIL').length;
  const skipped = results.filter((r) => r.status === 'SKIP').length;

  console.log(`\n✅ Passed: ${passed}/${GOOGLE_CLOUD_MODELS.length}`);
  console.log(`❌ Failed: ${failed}/${GOOGLE_CLOUD_MODELS.length}`);
  console.log(`⏭️  Skipped: ${skipped}/${GOOGLE_CLOUD_MODELS.length}`);

  console.log('\nDetailed Results:');
  for (const result of results) {
    const statusIcon = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⏭️';
    const statusColor =
      result.status === 'PASS' ? '\x1b[32m' : result.status === 'FAIL' ? '\x1b[31m' : '\x1b[33m';
    const duration = result.duration ? ` (${(result.duration / 1000).toFixed(1)}s)` : '';
    console.log(
      `${statusIcon} ${statusColor}${result.status}\x1b[0m: ${result.model.description} (${result.model.model})${result.reason ? ` - ${result.reason}` : ''}${duration}`
    );
  }

  process.exit(failed > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

