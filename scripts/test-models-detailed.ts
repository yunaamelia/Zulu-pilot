#!/usr/bin/env node
/**
 * Detailed test for each Google Cloud model with comprehensive error reporting
 */

import { GoogleCloudProvider } from '../src/core/llm/GoogleCloudProvider.js';
import { GoogleCloudAuth } from '../src/core/auth/GoogleCloudAuth.js';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

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
  authStatus: 'SUCCESS' | 'FAILED';
  tokenObtained: boolean;
  errorType?: 'AUTH' | 'MODEL_NOT_FOUND' | 'NETWORK' | 'RATE_LIMIT' | 'UNKNOWN';
  errorMessage?: string;
  errorDetails?: string;
  response?: string;
  duration?: number;
  requestUrl?: string;
}

async function testModel(model: ModelConfig): Promise<TestResult> {
  const startTime = Date.now();
  const result: TestResult = {
    model,
    status: 'FAIL',
    authStatus: 'FAILED',
    tokenObtained: false,
  };

  console.log(`\n${'='.repeat(80)}`);
  console.log(`Testing: ${model.description}`);
  console.log(`Model: ${model.model}`);
  console.log(`Region: ${model.region}`);
  console.log(`Endpoint: ${model.endpoint || 'v1beta1'}`);
  console.log('-'.repeat(80));

  // Check if request.json exists
  const requestJsonPath = join(process.cwd(), 'request.json');
  if (!existsSync(requestJsonPath)) {
    result.status = 'SKIP';
    result.errorMessage = 'request.json not found';
    return result;
  }

  // Test authentication first
  try {
    console.log('🔐 Testing authentication...');
    const auth = new GoogleCloudAuth({
      credentialsPath: requestJsonPath,
    });

    const token = await auth.getAccessToken();
    result.tokenObtained = true;
    result.authStatus = 'SUCCESS';
    console.log(`✅ Authentication successful`);
    console.log(`   Token: ${token.substring(0, 20)}...${token.substring(token.length - 10)}`);

    const projectId = await auth.getProjectId();
    console.log(`   Project ID: ${projectId}`);
  } catch (error) {
    result.authStatus = 'FAILED';
    result.errorType = 'AUTH';
    result.errorMessage = error instanceof Error ? error.message : String(error);
    console.log(`❌ Authentication failed: ${result.errorMessage}`);
    return result;
  }

  // Create provider
  try {
    console.log('\n📡 Creating provider...');
    const provider = new GoogleCloudProvider({
      projectId: 'protean-tooling-476420-i8',
      region: model.region,
      model: model.model,
      endpoint: model.endpoint,
      credentialsPath: requestJsonPath,
    });

    // Build request URL for display
    const endpoint = model.endpoint || 'v1beta1';
    result.requestUrl = `https://aiplatform.googleapis.com/${endpoint}/projects/protean-tooling-476420-i8/locations/${model.region}/endpoints/openapi/chat/completions`;
    console.log(`   Request URL: ${result.requestUrl}`);

    // Test streaming response
    console.log('\n💬 Testing model response...');
    console.log(`   Prompt: "${TEST_PROMPT}"`);

    const responseParts: string[] = [];
    let hasError = false;
    let errorMessage = '';

    try {
      const stream = provider.streamResponse(TEST_PROMPT, []);
      let tokenCount = 0;

      for await (const token of stream) {
        responseParts.push(token);
        tokenCount++;
        if (tokenCount <= 3) {
          process.stdout.write(token);
        } else if (tokenCount === 4) {
          process.stdout.write('...');
        }
      }

      const fullResponse = responseParts.join('');
      result.response = fullResponse;
      result.status = 'PASS';
      result.duration = Date.now() - startTime;

      console.log('\n✅ Model response received!');
      console.log(`   Response length: ${fullResponse.length} characters`);
      console.log(`   Tokens received: ${tokenCount}`);
      console.log(`   Duration: ${(result.duration / 1000).toFixed(1)}s`);
      if (fullResponse.length > 0) {
        const preview = fullResponse.substring(0, 150);
        console.log(`   Preview: ${preview}${fullResponse.length > 150 ? '...' : ''}`);
      }
    } catch (streamError) {
      hasError = true;
      errorMessage = streamError instanceof Error ? streamError.message : String(streamError);

      // Categorize error
      if (errorMessage.includes('not found') || errorMessage.includes('Model or endpoint')) {
        result.errorType = 'MODEL_NOT_FOUND';
      } else if (errorMessage.includes('Rate limit') || errorMessage.includes('429')) {
        result.errorType = 'RATE_LIMIT';
      } else if (
        errorMessage.includes('Failed to connect') ||
        errorMessage.includes('ECONNREFUSED') ||
        errorMessage.includes('network')
      ) {
        result.errorType = 'NETWORK';
      } else if (errorMessage.includes('Invalid credentials') || errorMessage.includes('401') || errorMessage.includes('403')) {
        result.errorType = 'AUTH';
      } else {
        result.errorType = 'UNKNOWN';
      }

      result.errorMessage = errorMessage;
      result.status = 'FAIL';
      result.duration = Date.now() - startTime;

      console.log(`\n❌ Model test failed:`);
      console.log(`   Error type: ${result.errorType}`);
      console.log(`   Error: ${errorMessage}`);

      // Provide detailed error analysis
      console.log(`\n📋 Error Analysis:`);
      if (result.errorType === 'MODEL_NOT_FOUND') {
        console.log(`   • Model "${model.model}" may not be available in region "${model.region}"`);
        console.log(`   • Verify model availability: gcloud ai models list --region=${model.region}`);
        console.log(`   • Check if endpoint "${model.endpoint || 'v1beta1'}" is correct for this model`);
        console.log(`   • Ensure API is enabled: gcloud services enable aiplatform.googleapis.com`);
        console.log(`   • Verify service account has access to this model`);
      } else if (result.errorType === 'AUTH') {
        console.log(`   • Authentication failed even though token was obtained`);
        console.log(`   • Check if service account has necessary permissions`);
        console.log(`   • Verify project ID is correct: protean-tooling-476420-i8`);
        console.log(`   • Check if service account has Vertex AI User role`);
      } else if (result.errorType === 'RATE_LIMIT') {
        console.log(`   • Rate limit exceeded`);
        console.log(`   • Wait a few minutes and try again`);
      } else if (result.errorType === 'NETWORK') {
        console.log(`   • Network connection issue`);
        console.log(`   • Check internet connection`);
        console.log(`   • Verify firewall settings`);
      }

      // Show request details
      console.log(`\n📤 Request Details:`);
      console.log(`   URL: ${result.requestUrl}`);
      console.log(`   Method: POST`);
      console.log(`   Model: ${model.model}`);
      console.log(`   Region: ${model.region}`);
      console.log(`   Endpoint: ${model.endpoint || 'v1beta1'}`);
    }
  } catch (error) {
    result.status = 'FAIL';
    result.errorType = 'UNKNOWN';
    result.errorMessage = error instanceof Error ? error.message : String(error);
    result.duration = Date.now() - startTime;
    console.log(`\n❌ Provider creation failed: ${result.errorMessage}`);
  }

  return result;
}

async function main(): Promise<void> {
  console.log('='.repeat(80));
  console.log('Zulu Pilot - Detailed Model Testing');
  console.log('Using request.json for service account authentication');
  console.log('='.repeat(80));
  console.log(`Test prompt: "${TEST_PROMPT}"`);
  console.log(`Total models: ${GOOGLE_CLOUD_MODELS.length}`);

  // Check if request.json exists
  const requestJsonPath = join(process.cwd(), 'request.json');
  if (!existsSync(requestJsonPath)) {
    console.error('\n❌ Error: request.json not found in current directory');
    console.error('Please ensure request.json (service account credentials) is in the project root.');
    process.exit(1);
  }

  console.log(`✅ Found request.json at: ${requestJsonPath}\n`);

  const results: TestResult[] = [];

  // Test each model
  for (const model of GOOGLE_CLOUD_MODELS) {
    const result = await testModel(model);
    results.push(result);
  }

  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('Test Summary');
  console.log('='.repeat(80));

  const passed = results.filter((r) => r.status === 'PASS').length;
  const failed = results.filter((r) => r.status === 'FAIL').length;
  const skipped = results.filter((r) => r.status === 'SKIP').length;

  console.log(`\n✅ Passed: ${passed}/${GOOGLE_CLOUD_MODELS.length}`);
  console.log(`❌ Failed: ${failed}/${GOOGLE_CLOUD_MODELS.length}`);
  console.log(`⏭️  Skipped: ${skipped}/${GOOGLE_CLOUD_MODELS.length}`);

  console.log('\n📊 Detailed Results:');
  for (const result of results) {
    const statusIcon = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⏭️';
    const authIcon = result.authStatus === 'SUCCESS' ? '🔐' : '🔒';
    const duration = result.duration ? ` (${(result.duration / 1000).toFixed(1)}s)` : '';
    
    console.log(`\n${statusIcon} ${result.model.description} (${result.model.model})`);
    console.log(`   ${authIcon} Auth: ${result.authStatus}${result.tokenObtained ? ' (token obtained)' : ''}`);
    console.log(`   Status: ${result.status}${duration}`);
    
    if (result.errorType) {
      console.log(`   Error Type: ${result.errorType}`);
    }
    if (result.errorMessage) {
      const shortError = result.errorMessage.length > 100 
        ? result.errorMessage.substring(0, 97) + '...' 
        : result.errorMessage;
      console.log(`   Error: ${shortError}`);
    }
    if (result.response) {
      const preview = result.response.length > 100 
        ? result.response.substring(0, 97) + '...' 
        : result.response;
      console.log(`   Response: ${preview}`);
    }
    if (result.requestUrl) {
      console.log(`   URL: ${result.requestUrl}`);
    }
  }

  // Recommendations
  if (failed > 0) {
    console.log('\n💡 Recommendations:');
    const modelNotFoundErrors = results.filter(r => r.errorType === 'MODEL_NOT_FOUND');
    if (modelNotFoundErrors.length > 0) {
      console.log(`\n   • ${modelNotFoundErrors.length} model(s) returned "not found" errors:`);
      console.log(`     - Verify model availability in their respective regions`);
      console.log(`     - Check if service account has Vertex AI User role`);
      console.log(`     - Ensure API is enabled: gcloud services enable aiplatform.googleapis.com`);
      console.log(`     - Some models may require special access or may not be available yet`);
    }

    const authErrors = results.filter(r => r.errorType === 'AUTH' && r.status === 'FAIL');
    if (authErrors.length > 0) {
      console.log(`\n   • ${authErrors.length} model(s) had authentication issues:`);
      console.log(`     - Verify service account permissions`);
      console.log(`     - Check if service account has access to Vertex AI`);
    }
  }

  process.exit(failed > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

