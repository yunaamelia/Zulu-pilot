#!/usr/bin/env node
/**
 * Test DeepSeek R1 using curl with service account token
 */

import { GoogleCloudAuth } from '../src/core/auth/GoogleCloudAuth.js';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const execAsync = promisify(exec);

async function main() {
  console.log('Testing DeepSeek R1 with curl (using service account token)\n');
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

  // Create request body file
  const requestBody = {
    model: 'deepseek-ai/deepseek-r1-0528-maas',
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

  const requestBodyPath = join(process.cwd(), 'test-request-body.json');
  writeFileSync(requestBodyPath, JSON.stringify(requestBody, null, 2), 'utf-8');
  console.log(`📝 Request body saved to: ${requestBodyPath}`);
  console.log(JSON.stringify(requestBody, null, 2));
  console.log('\n' + '-'.repeat(80));

  // Build curl command
  const endpoint = 'aiplatform.googleapis.com';
  const region = 'us-central1';
  const projectId = 'protean-tooling-476420-i8';
  const url = `https://${endpoint}/v1beta1/projects/${projectId}/locations/${region}/endpoints/openapi/chat/completions`;

  console.log('\n📤 Sending request with curl...');
  console.log(`   URL: ${url}`);
  console.log(`   Method: POST`);
  console.log(`   Using service account token\n`);

  const curlCommand = `curl -X POST \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ${token}" \\
  "${url}" \\
  -d '@${requestBodyPath}'`;

  console.log('Command:');
  console.log(curlCommand);
  console.log('\n' + '-'.repeat(80));
  console.log('Response:\n');

  try {
    const { stdout, stderr } = await execAsync(
      `curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer ${token}" "${url}" -d '@${requestBodyPath}'`,
      {
        maxBuffer: 10 * 1024 * 1024, // 10MB
      }
    );

    if (stdout) {
      console.log(stdout);
    }
    if (stderr) {
      console.error('stderr:', stderr);
    }

    // Parse SSE response
    const lines = stdout.split('\n');
    let hasResponse = false;
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6).trim();
        if (data === '[DONE]') {
          console.log('\n✅ Stream completed');
          break;
        }
        try {
          const parsed = JSON.parse(data);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) {
            process.stdout.write(content);
            hasResponse = true;
          }
        } catch {
          // Ignore parse errors
        }
      }
    }

    if (!hasResponse) {
      console.log('\n⚠️  No content in response. Full output:');
      console.log(stdout);
    }
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'stdout' in error && 'stderr' in error) {
      const execError = error as { stdout: string; stderr: string };
      console.error('❌ Error response:');
      console.error(execError.stdout);
      console.error(execError.stderr);

      // Try to parse error
      const errorLines = (execError.stdout + execError.stderr).split('\n');
      for (const line of errorLines) {
        if (line.includes('error') || line.includes('Error') || line.includes('404') || line.includes('403')) {
          console.error(`\n   ${line}`);
        }
      }
    } else {
      console.error('❌ Error:', error);
    }
    process.exit(1);
  } finally {
    // Cleanup
    try {
      const fs = await import('node:fs/promises');
      await fs.unlink(requestBodyPath);
    } catch {
      // Ignore cleanup errors
    }
  }
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

