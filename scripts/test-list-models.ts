#!/usr/bin/env node
/**
 * List available models to check if gemini-3-pro-preview is available
 */

// Load .env file if exists (optional)
try {
  const dotenv = await import('dotenv');
  dotenv.config();
} catch {
  // dotenv is optional
}

import { GoogleGenAI } from '@google/genai';

const apiKey = process.env.GOOGLE_CLOUD_API_KEY;
const projectId = process.env.GOOGLE_CLOUD_PROJECT;
const location = process.env.GOOGLE_CLOUD_LOCATION || 'us-central1';

let ai: GoogleGenAI;
if (projectId) {
  console.log('Using Vertex AI mode');
  ai = new GoogleGenAI({
    vertexai: true,
    project: projectId,
    location: location,
  });
} else {
  console.log('Using Gemini API mode');
  ai = new GoogleGenAI({
    apiKey: apiKey,
    vertexai: false,
  });
}

async function listModels(): Promise<void> {
  try {
    console.log('\n📋 Listing available models...\n');
    const models = await ai.models.list();

    let count = 0;
    const geminiModels: string[] = [];

    for await (const model of models) {
      count++;
      const modelName = model.name || 'unknown';
      if (modelName.includes('gemini') || modelName.includes('3')) {
        geminiModels.push(modelName);
        console.log(`  ✅ ${modelName}`);
      }
    }

    console.log(`\n📊 Total models found: ${count}`);
    console.log(`🔍 Gemini/3.x models: ${geminiModels.length}`);

    if (geminiModels.length > 0) {
      console.log('\n🎯 Relevant models:');
      geminiModels.forEach((m) => console.log(`   - ${m}`));
    }

    // Check specifically for gemini-3-pro-preview
    const hasPreview = geminiModels.some(
      (m) => m.includes('3-pro-preview') || m.includes('gemini-3-pro')
    );
    if (!hasPreview) {
      console.log('\n⚠️  gemini-3-pro-preview not found in available models');
      console.log('   Try checking:');
      console.log('   1. Model availability in your region');
      console.log('   2. API enablement status');
      console.log('   3. Alternative model names');
    }
  } catch (error) {
    console.error('\n❌ Error listing models:');
    console.error(error instanceof Error ? error.message : String(error));
    if (error instanceof Error && error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
  }
}

listModels().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
