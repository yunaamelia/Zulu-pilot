#!/usr/bin/env node
/**
 * Test authentication configuration against vertex-config.md
 */

import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

interface AuthTest {
  name: string;
  check: (content: string) => boolean;
  description: string;
}

const AUTH_TESTS: AuthTest[] = [
  {
    name: 'GoogleCloudProvider uses gcloud auth',
    check: (content) => content.includes('gcloud auth print-access-token'),
    description: 'Should use gcloud auth print-access-token for authentication',
  },
  {
    name: 'GoogleCloudProvider uses Bearer token',
    check: (content) => /Authorization.*Bearer/.test(content),
    description: 'Should use Bearer token format in Authorization header',
  },
  {
    name: 'GoogleCloudProvider uses aiplatform.googleapis.com',
    check: (content) => content.includes('aiplatform.googleapis.com'),
    description: 'Should use aiplatform.googleapis.com as endpoint',
  },
  {
    name: 'GoogleCloudProvider supports v1beta1 and v1',
    check: (content) => /v1beta1|v1/.test(content),
    description: 'Should support both v1beta1 and v1 endpoint versions',
  },
  {
    name: 'GoogleCloudProvider URL format correct',
    check: (content) =>
      /aiplatform\.googleapis\.com\/[^/]+\/projects\/[^/]+\/locations\/[^/]+\/endpoints\/openapi/.test(
        content
      ),
    description: 'Should use correct URL format: .../projects/{id}/locations/{region}/endpoints/openapi',
  },
  {
    name: 'GeminiProvider uses API key',
    check: (content) => /apiKey/.test(content),
    description: 'Should use API key for authentication',
  },
  {
    name: 'GeminiProvider uses key query parameter',
    check: (content) => /key=.*apiKey|key=\$\{/.test(content),
    description: 'Should use API key in query parameter (?key=...)',
  },
  {
    name: 'GeminiProvider uses correct endpoint',
    check: (content) =>
      /publishers\/google\/models\/.*:streamGenerateContent/.test(content),
    description: 'Should use /publishers/google/models/{model}:streamGenerateContent endpoint',
  },
];

async function testAuthConfig(): Promise<void> {
  console.log('========================================');
  console.log('Testing Authentication Configuration');
  console.log('Against vertex-config.md');
  console.log('========================================\n');

  const projectDir = process.cwd();
  const googleCloudPath = join(projectDir, 'src/core/llm/GoogleCloudProvider.ts');
  const geminiPath = join(projectDir, 'src/core/llm/GeminiProvider.ts');

  const googleCloudSource = await readFile(googleCloudPath, 'utf-8');
  const geminiSource = await readFile(geminiPath, 'utf-8');

  let passed = 0;
  let failed = 0;
  const failures: string[] = [];

  for (const test of AUTH_TESTS) {
    const content =
      test.name.includes('Gemini') || test.name.includes('gemini')
        ? geminiSource
        : googleCloudSource;

    const result = test.check(content);
    if (result) {
      console.log(`✅ ${test.name}`);
      console.log(`   ${test.description}`);
      passed++;
    } else {
      console.log(`❌ ${test.name}`);
      console.log(`   ${test.description}`);
      failures.push(test.name);
      failed++;
    }
    console.log('');
  }

  // Summary
  console.log('========================================');
  console.log('Test Summary');
  console.log('========================================');
  console.log(`✅ Passed: ${passed}/${AUTH_TESTS.length}`);
  console.log(`❌ Failed: ${failed}/${AUTH_TESTS.length}`);

  if (failures.length > 0) {
    console.log('\nFailed Tests:');
    failures.forEach((failure) => console.log(`  - ${failure}`));
  }

  if (failed === 0) {
    console.log('\n✅ All authentication configurations match vertex-config.md!');
    process.exit(0);
  } else {
    console.log('\n❌ Some authentication configurations need to be updated.');
    process.exit(1);
  }
}

testAuthConfig().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

