#!/usr/bin/env node
/**
 * Test DeepSeek R1 with specific configuration
 */

import { GoogleCloudProvider } from '../src/core/llm/GoogleCloudProvider.js';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

async function main() {
  console.log('Testing DeepSeek R1 with specific configuration\n');
  console.log('='.repeat(80));

  // Check if request.json exists
  const requestJsonPath = join(process.cwd(), 'request.json');
  if (!existsSync(requestJsonPath)) {
    console.error('❌ request.json not found in current directory');
    process.exit(1);
  }

  console.log(`✅ Found request.json at: ${requestJsonPath}\n`);

  // Create provider with DeepSeek R1 config
  const provider = new GoogleCloudProvider({
    projectId: 'protean-tooling-476420-i8',
    region: 'us-central1',
    model: 'deepseek-ai/deepseek-r1-0528-maas',
    endpoint: 'v1beta1',
    maxTokens: 32138,
    temperature: 0.4,
    topP: 0.95,
    credentialsPath: requestJsonPath,
  });

  const testPrompt = 'halo';

  console.log('Configuration:');
  console.log(`  Model: deepseek-ai/deepseek-r1-0528-maas`);
  console.log(`  Region: us-central1`);
  console.log(`  Endpoint: v1beta1`);
  console.log(`  Max Tokens: 32138`);
  console.log(`  Temperature: 0.4`);
  console.log(`  Top P: 0.95`);
  console.log(`  Prompt: "${testPrompt}"`);
  console.log(`  Content Format: Array with type/text structure`);
  console.log('\n' + '-'.repeat(80));
  console.log('Sending request...\n');

  try {
    const startTime = Date.now();
    const responseParts: string[] = [];
    let tokenCount = 0;

    console.log('Response:');
    console.log('─'.repeat(80));

    const stream = provider.streamResponse(testPrompt, []);
    for await (const token of stream) {
      responseParts.push(token);
      tokenCount++;
      process.stdout.write(token);
    }

    const duration = Date.now() - startTime;
    const fullResponse = responseParts.join('');

    console.log('\n' + '─'.repeat(80));
    console.log('\n✅ Success!');
    console.log(`   Response: "${fullResponse}"`);
    console.log(`   Tokens received: ${tokenCount}`);
    console.log(`   Duration: ${(duration / 1000).toFixed(2)}s`);
    console.log(`   Response length: ${fullResponse.length} characters`);
  } catch (error) {
    console.error('\n❌ Error:');
    console.error(error instanceof Error ? error.message : String(error));
    if (error instanceof Error && error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

