#!/usr/bin/env node
/**
 * Test E5 Embeddings model with region-specific endpoint
 * Note: This is an embeddings model, not a chat completion model
 */

import { GoogleCloudAuth } from '../src/core/auth/GoogleCloudAuth.js';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import axios from 'axios';

async function main() {
  console.log('Testing E5 Embeddings Model\n');
  console.log('='.repeat(80));

  // Check if request.json exists
  const requestJsonPath = join(process.cwd(), 'request.json');
  if (!existsSync(requestJsonPath)) {
    console.error('❌ request.json not found in current directory');
    process.exit(1);
  }

  console.log(`✅ Found request.json at: ${requestJsonPath}\n`);

  // Get access token
  console.log('🔐 Getting access token from service account...');
  const auth = new GoogleCloudAuth({
    credentialsPath: requestJsonPath,
  });
  const token = await auth.getAccessToken();
  console.log(`✅ Token obtained: ${token.substring(0, 20)}...${token.substring(token.length - 10)}\n`);

  // Configuration per user request
  const projectId = 'protean-tooling-476420-i8';
  const region = 'us-central1';
  const model = 'intfloat/multilingual-e5-large-instruct-maas';
  const endpoint = 'v1';
  // Region-specific endpoint: us-central1-aiplatform.googleapis.com
  // Note: Embeddings use /embeddings endpoint, not /chat/completions
  const url = `https://${region}-aiplatform.googleapis.com/${endpoint}/projects/${projectId}/locations/${region}/endpoints/openapi/embeddings`;

  // Build request body for embeddings
  const requestBody = {
    model: model,
    input: 'Embed me.',
  };

  console.log('📤 Request Details:');
  console.log(`   URL: ${url}`);
  console.log(`   Method: POST`);
  console.log(`   Model: ${model}`);
  console.log(`   Region: ${region}`);
  console.log(`   Endpoint: ${endpoint}`);
  console.log(`   Endpoint Type: Region-specific (${region}-aiplatform.googleapis.com)`);
  console.log(`   API Type: Embeddings (not chat completions)`);
  console.log(`\n   Request Body:`);
  console.log(JSON.stringify(requestBody, null, 2));
  console.log('\n' + '-'.repeat(80));
  console.log('Sending request...\n');

  try {
    const response = await axios.post(url, requestBody, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('✅ Request successful!');
    console.log(`   Status: ${response.status}`);
    console.log(`\n📥 Response:`);
    console.log('─'.repeat(80));
    console.log(JSON.stringify(response.data, null, 2));
    console.log('─'.repeat(80));

    // Extract embedding if available
    if (response.data.data && response.data.data.length > 0) {
      const embedding = response.data.data[0].embedding;
      if (embedding && Array.isArray(embedding)) {
        console.log(`\n✅ Embedding generated!`);
        console.log(`   Embedding dimensions: ${embedding.length}`);
        console.log(`   First 10 values: [${embedding.slice(0, 10).join(', ')}...]`);
      }
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('\n❌ Axios Error:');
      console.error(`   Status: ${error.response?.status}`);
      console.error(`   Status Text: ${error.response?.statusText}`);
      console.error(`   Response Data:`, error.response?.data);
    } else {
      console.error('\n❌ Error:');
      console.error(error instanceof Error ? error.message : String(error));
    }
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

