#!/usr/bin/env node
/**
 * Test GPT OSS 120B with global region and v1 endpoint
 */

import { GoogleCloudProvider } from '../src/core/llm/GoogleCloudProvider.js';
import { GoogleCloudAuth } from '../src/core/auth/GoogleCloudAuth.js';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import axios from 'axios';

async function main() {
  console.log('Testing GPT OSS 120B with global region and v1 endpoint\n');
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
  const region = 'global'; // Updated: global instead of us-central1
  const model = 'openai/gpt-oss-120b-maas';
  const endpoint = 'v1'; // Updated: v1 instead of v1beta1
  const url = `https://aiplatform.googleapis.com/${endpoint}/projects/${projectId}/locations/${region}/endpoints/openapi/chat/completions`;

  // Build request body - content as string (not array)
  const requestBody = {
    model: model,
    stream: true,
    messages: [
      {
        role: 'user',
        content: 'Summer travel plan to Paris', // String, not array
      },
    ],
  };

  console.log('📤 Request Details:');
  console.log(`   URL: ${url}`);
  console.log(`   Method: POST`);
  console.log(`   Model: ${model}`);
  console.log(`   Region: ${region}`);
  console.log(`   Endpoint: ${endpoint}`);
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
      responseType: 'stream',
    });

    console.log('✅ Connection established!');
    console.log(`   Status: ${response.status}`);
    console.log('\n📥 Response stream:');
    console.log('─'.repeat(80));

    let buffer = '';
    let hasData = false;
    let tokenCount = 0;
    const responseParts: string[] = [];

    for await (const chunk of response.data) {
      const chunkStr = chunk.toString();
      hasData = true;
      buffer += chunkStr;

      // Parse SSE format
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.trim() === '' || !line.startsWith('data: ')) {
          continue;
        }

        const data = line.slice(6).trim();
        if (data === '[DONE]') {
          console.log('\n─'.repeat(80));
          console.log('\n✅ Stream completed!');
          const fullResponse = responseParts.join('');
          console.log(`   Full response: "${fullResponse}"`);
          console.log(`   Tokens received: ${tokenCount}`);
          console.log(`   Response length: ${fullResponse.length} characters`);
          return;
        }

        try {
          const parsed = JSON.parse(data);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) {
            process.stdout.write(content);
            responseParts.push(content);
            tokenCount++;
          }
        } catch {
          // Ignore parse errors
        }
      }
    }

    if (!hasData) {
      console.log('\n⚠️  No data received in stream');
    } else {
      const fullResponse = responseParts.join('');
      console.log('\n─'.repeat(80));
      console.log('\n✅ Response received!');
      console.log(`   Full response: "${fullResponse}"`);
      console.log(`   Tokens received: ${tokenCount}`);
      console.log(`   Response length: ${fullResponse.length} characters`);
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('\n❌ Axios Error:');
      console.error(`   Status: ${error.response?.status}`);
      console.error(`   Status Text: ${error.response?.statusText}`);

      // Try to read error response if it's a stream
      if (error.response?.data && typeof error.response.data === 'object') {
        try {
          let errorData = '';
          for await (const chunk of error.response.data) {
            errorData += chunk.toString();
            if (errorData.length > 1000) break; // Limit error data
          }
          console.error(`   Error Response: ${errorData.substring(0, 500)}`);
          
          // Try to parse as JSON
          try {
            const errorJson = JSON.parse(errorData);
            console.error(`   Parsed Error:`, JSON.stringify(errorJson, null, 2));
          } catch {
            // Not JSON, just show raw
          }
        } catch {
          // Ignore stream read errors
        }
      }
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

