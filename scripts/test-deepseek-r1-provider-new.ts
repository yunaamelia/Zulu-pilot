#!/usr/bin/env node
/**
 * Test DeepSeek R1 using GoogleCloudProvider with region-specific endpoint
 */

import { GoogleCloudProvider } from '../src/core/llm/GoogleCloudProvider.js';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

async function main() {
  console.log('Testing DeepSeek R1 with GoogleCloudProvider\n');
  console.log('Configuration: us-central1 region, v1 endpoint, region-specific URL\n');
  console.log('='.repeat(80));

  // Check if request.json exists
  const requestJsonPath = join(process.cwd(), 'request.json');
  if (!existsSync(requestJsonPath)) {
    console.error('❌ request.json not found in current directory');
    process.exit(1);
  }

  console.log(`✅ Found request.json at: ${requestJsonPath}\n`);

  // Create provider with DeepSeek R1 config (us-central1 region, v1 endpoint)
  const provider = new GoogleCloudProvider({
    projectId: 'protean-tooling-476420-i8',
    region: 'us-central1', // Region for DeepSeek R1
    model: 'deepseek-ai/deepseek-r1-0528-maas',
    endpoint: 'v1', // Updated: v1 instead of v1beta1
    credentialsPath: requestJsonPath,
  });

  const testPrompt = 'Summer travel plan to Paris';

  console.log('Provider Configuration:');
  console.log(`  Model: deepseek-ai/deepseek-r1-0528-maas`);
  console.log(`  Region: us-central1`);
  console.log(`  Endpoint: v1`);
  console.log(`  Endpoint URL: us-central1-aiplatform.googleapis.com (region-specific)`);
  console.log(`  Content Format: String (not array)`);
  console.log(`  Prompt: "${testPrompt}"`);
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
    console.log(`   Response length: ${fullResponse.length} characters`);
    console.log(`   Tokens received: ${tokenCount}`);
    console.log(`   Duration: ${(duration / 1000).toFixed(2)}s`);
    if (fullResponse.length > 0) {
      const preview = fullResponse.substring(0, 200);
      console.log(`   Preview: ${preview}${fullResponse.length > 200 ? '...' : ''}`);
    }
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

