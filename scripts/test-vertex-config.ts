#!/usr/bin/env node
/**
 * Test configuration against vertex-config.md specifications
 */

import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

interface ModelConfig {
  model: string;
  region: string;
  endpoint: 'v1beta1' | 'v1';
  maxTokens: number;
  temperature: number;
  topP: number;
}

// Expected configs from vertex-config.md
const EXPECTED_CONFIGS: Record<string, ModelConfig> = {
  'deepseek-ai/deepseek-v3.1-maas': {
    model: 'deepseek-ai/deepseek-v3.1-maas',
    region: 'us-west2',
    endpoint: 'v1beta1',
    maxTokens: 32768,
    temperature: 0.4,
    topP: 0.95,
  },
  'qwen/qwen3-coder-480b-a35b-instruct-maas': {
    model: 'qwen/qwen3-coder-480b-a35b-instruct-maas',
    region: 'us-south1',
    endpoint: 'v1beta1',
    maxTokens: 32768,
    temperature: 0.4,
    topP: 0.8,
  },
  'deepseek-ai/deepseek-r1-0528-maas': {
    model: 'deepseek-ai/deepseek-r1-0528-maas',
    region: 'us-central1',
    endpoint: 'v1beta1',
    maxTokens: 32768,
    temperature: 0.4,
    topP: 0.95,
  },
  'moonshotai/kimi-k2-thinking-maas': {
    model: 'moonshotai/kimi-k2-thinking-maas',
    region: 'global',
    endpoint: 'v1',
    maxTokens: 32768,
    temperature: 0.4,
    topP: 0.95,
  },
  'openai/gpt-oss-120b-maas': {
    model: 'openai/gpt-oss-120b-maas',
    region: 'us-central1',
    endpoint: 'v1beta1',
    maxTokens: 8192,
    temperature: 0.4,
    topP: 0.95,
  },
  'meta/llama-3.1-405b-instruct-maas': {
    model: 'meta/llama-3.1-405b-instruct-maas',
    region: 'us-central1',
    endpoint: 'v1beta1',
    maxTokens: 4096, // Per vertex-config.md
    temperature: 0.4,
    topP: 0.95,
  },
};

async function testConfig(): Promise<void> {
  console.log('========================================');
  console.log('Testing Configuration Against vertex-config.md');
  console.log('========================================\n');

  // Read GoogleCloudProvider source
  const providerPath = join(process.cwd(), 'src/core/llm/GoogleCloudProvider.ts');
  const providerSource = await readFile(providerPath, 'utf-8');

  const errors: string[] = [];
  const warnings: string[] = [];
  let passed = 0;

  for (const [modelName, expected] of Object.entries(EXPECTED_CONFIGS)) {
    console.log(`Testing: ${modelName}`);
    console.log(`  Region: ${expected.region}`);
    console.log(`  Endpoint: ${expected.endpoint}`);
    console.log(`  Max Tokens: ${expected.maxTokens}`);
    console.log(`  Temperature: ${expected.temperature}`);
    console.log(`  Top P: ${expected.topP}`);

    // Check endpoint
    const endpointPattern = new RegExp(
      `['"]${modelName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"]:[^}]*endpoint:\\s*['"](${expected.endpoint})['"]`,
      's'
    );
    const endpointMatch = providerSource.match(endpointPattern);
    if (!endpointMatch || endpointMatch[1] !== expected.endpoint) {
      errors.push(`${modelName}: endpoint should be '${expected.endpoint}'`);
      console.log(`  ❌ Endpoint mismatch`);
    } else {
      console.log(`  ✅ Endpoint: ${expected.endpoint}`);
      passed++;
    }

    // Check maxTokens
    const maxTokensPattern = new RegExp(
      `['"]${modelName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"]:[^}]*maxTokens:\\s*(\\d+)`,
      's'
    );
    const maxTokensMatch = providerSource.match(maxTokensPattern);
    if (!maxTokensMatch || parseInt(maxTokensMatch[1], 10) !== expected.maxTokens) {
      errors.push(
        `${modelName}: maxTokens should be ${expected.maxTokens}, found ${maxTokensMatch ? maxTokensMatch[1] : 'none'}`
      );
      console.log(`  ❌ Max Tokens mismatch`);
    } else {
      console.log(`  ✅ Max Tokens: ${expected.maxTokens}`);
      passed++;
    }

    // Check temperature
    const tempPattern = new RegExp(
      `['"]${modelName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"]:[^}]*temperature:\\s*([\\d.]+)`,
      's'
    );
    const tempMatch = providerSource.match(tempPattern);
    if (!tempMatch || parseFloat(tempMatch[1]) !== expected.temperature) {
      errors.push(
        `${modelName}: temperature should be ${expected.temperature}, found ${tempMatch ? tempMatch[1] : 'none'}`
      );
      console.log(`  ❌ Temperature mismatch`);
    } else {
      console.log(`  ✅ Temperature: ${expected.temperature}`);
      passed++;
    }

    // Check topP
    const topPPattern = new RegExp(
      `['"]${modelName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"]:[^}]*topP:\\s*([\\d.]+)`,
      's'
    );
    const topPMatch = providerSource.match(topPPattern);
    if (!topPMatch || parseFloat(topPMatch[1]) !== expected.topP) {
      errors.push(
        `${modelName}: topP should be ${expected.topP}, found ${topPMatch ? topPMatch[1] : 'none'}`
      );
      console.log(`  ❌ Top P mismatch`);
    } else {
      console.log(`  ✅ Top P: ${expected.topP}`);
      passed++;
    }

    // Check region (in test script)
    const regionPattern = new RegExp(
      `['"]${modelName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"]:[^}]*region:\\s*['"]([^'"]+)['"]`,
      's'
    );
    // Region is set in test script, not in provider config, so we just note it
    console.log(`  ℹ️  Region: ${expected.region} (set in test script)`);
    console.log('');
  }

  // Summary
  console.log('========================================');
  console.log('Test Summary');
  console.log('========================================');
  console.log(`✅ Passed: ${passed}/${Object.keys(EXPECTED_CONFIGS).length * 4}`);
  console.log(`❌ Errors: ${errors.length}`);
  console.log(`⚠️  Warnings: ${warnings.length}`);

  if (errors.length > 0) {
    console.log('\nErrors:');
    errors.forEach((error) => console.log(`  - ${error}`));
  }

  if (warnings.length > 0) {
    console.log('\nWarnings:');
    warnings.forEach((warning) => console.log(`  - ${warning}`));
  }

  if (errors.length === 0) {
    console.log('\n✅ All configurations match vertex-config.md!');
    process.exit(0);
  } else {
    console.log('\n❌ Configuration mismatches found. Please update GoogleCloudProvider.ts');
    process.exit(1);
  }
}

testConfig().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

