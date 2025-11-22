#!/usr/bin/env node
/**
 * Simple test to verify service account authentication works
 */

import { GoogleCloudAuth } from '../src/core/auth/GoogleCloudAuth.js';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

async function main() {
  console.log('Testing Google Cloud Authentication with request.json\n');

  // Check if request.json exists
  const requestJsonPath = join(process.cwd(), 'request.json');
  if (!existsSync(requestJsonPath)) {
    console.error('❌ request.json not found in current directory');
    process.exit(1);
  }

  console.log(`✅ Found request.json at: ${requestJsonPath}\n`);

  try {
    // Test authentication
    console.log('Testing authentication...');
    const auth = new GoogleCloudAuth({
      credentialsPath: requestJsonPath,
    });

    console.log('Getting access token...');
    const token = await auth.getAccessToken();
    console.log(`✅ Access token obtained: ${token.substring(0, 20)}...${token.substring(token.length - 10)}\n`);

    console.log('Getting project ID...');
    const projectId = await auth.getProjectId();
    console.log(`✅ Project ID: ${projectId}\n`);

    console.log('✅ Authentication test PASSED!');
    console.log('\nYou can now use request.json for Google Cloud authentication.');
  } catch (error) {
    console.error('❌ Authentication test FAILED:');
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

