#!/usr/bin/env node
/**
 * Test DeepSeek R1 with debug output to see actual request being sent
 */

import { GoogleCloudProvider } from '../src/core/llm/GoogleCloudProvider.js';
import { GoogleCloudAuth } from '../src/core/auth/GoogleCloudAuth.js';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import axios from 'axios';

async function main() {
  console.log('Testing DeepSeek R1 with Debug Output\n');
  console.log('='.repeat(80));

  // Check if request.json exists
  const requestJsonPath = join(process.cwd(), 'request.json');
  if (!existsSync(requestJsonPath)) {
    console.error('❌ request.json not found in current directory');
    process.exit(1);
  }

  console.log(`✅ Found request.json at: ${requestJsonPath}\n`);

  // Get access token
  console.log('🔐 Getting access token...');
  const auth = new GoogleCloudAuth({
    credentialsPath: requestJsonPath,
  });
  const token = await auth.getAccessToken();
  console.log(`✅ Token obtained: ${token.substring(0, 20)}...${token.substring(token.length - 10)}\n`);

  // Build request manually to see what we're sending
  const projectId = 'protean-tooling-476420-i8';
  const region = 'us-central1';
  const model = 'deepseek-ai/deepseek-r1-0528-maas';
  const endpoint = 'v1beta1';
  const url = `https://aiplatform.googleapis.com/${endpoint}/projects/${projectId}/locations/${region}/endpoints/openapi/chat/completions`;

  // Build request body exactly as specified
  const requestBody = {
    model: model,
    stream: true,
    max_tokens: 32138,
    temperature: 0.4,
    top_p: 0.95,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: 'halo',
          },
        ],
      },
    ],
  };

  console.log('📤 Request Details:');
  console.log(`   URL: ${url}`);
  console.log(`   Method: POST`);
  console.log(`   Headers:`);
  console.log(`     Authorization: Bearer ${token.substring(0, 20)}...`);
  console.log(`     Content-Type: application/json`);
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
    console.log(`   Headers:`, JSON.stringify(response.headers, null, 2));
    console.log('\n📥 Response stream:');
    console.log('─'.repeat(80));

    let buffer = '';
    let hasData = false;
    let tokenCount = 0;

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
          console.log(`   Tokens received: ${tokenCount}`);
          return;
        }

        try {
          const parsed = JSON.parse(data);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) {
            process.stdout.write(content);
            tokenCount++;
          }
        } catch {
          // Ignore parse errors
        }
      }
    }

    if (!hasData) {
      console.log('\n⚠️  No data received in stream');
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('\n❌ Axios Error:');
      console.error(`   Status: ${error.response?.status}`);
      console.error(`   Status Text: ${error.response?.statusText}`);
      console.error(`   Response Data:`, error.response?.data);

      // Try to read error response if it's a stream
      if (error.response?.data && typeof error.response.data === 'object') {
        try {
          let errorData = '';
          for await (const chunk of error.response.data) {
            errorData += chunk.toString();
          }
          console.error(`   Error Stream: ${errorData.substring(0, 500)}`);
        } catch {
          // Ignore
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

