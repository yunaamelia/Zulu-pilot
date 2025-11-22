#!/usr/bin/env node
/**
 * Simple test for Gemini 3.0 Pro Preview - based on user's example code
 */

// Load .env file if exists (optional)
try {
  const dotenv = await import('dotenv');
  dotenv.config();
} catch {
  // dotenv is optional
}

import { GoogleGenAI } from '@google/genai';

// Check for API key
const apiKey = process.env.GOOGLE_CLOUD_API_KEY;
if (!apiKey) {
  console.error('❌ Error: GOOGLE_CLOUD_API_KEY environment variable not set');
  console.error('Please set it with: export GOOGLE_CLOUD_API_KEY="YOUR_API_KEY"');
  process.exit(1);
}

// Initialize GoogleGenAI with Vertex AI mode
// Use global location as per user's configuration
const projectId = process.env.GOOGLE_CLOUD_PROJECT;
if (!projectId) {
  console.error('❌ Error: GOOGLE_CLOUD_PROJECT environment variable not set');
  console.error('Please set it in .env file: GOOGLE_CLOUD_PROJECT=your-project-id');
  process.exit(1);
}

const location = 'global'; // Use global location as per user's config

console.log(`Using Vertex AI mode: project=${projectId}, location=${location}`);
const ai = new GoogleGenAI({
  vertexai: true,
  project: projectId,
  location: location,
});

// Model ID as per user's configuration
const model = 'gemini-3-pro-preview';

async function generateContent(): Promise<void> {
  // Request structure as per user's curl configuration
  const req = {
    model: model,
    contents: [
      {
        role: 'user',
        parts: [
          {
            text: 'halo',
          },
        ],
      },
    ],
    config: {
      temperature: 1,
      maxOutputTokens: 65535,
      topP: 0.95,
      thinkingConfig: {
        thinkingLevel: 'HIGH',
      },
    },
    safetySettings: [
      {
        category: 'HARM_CATEGORY_HATE_SPEECH',
        threshold: 'OFF',
      },
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'OFF',
      },
      {
        category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        threshold: 'OFF',
      },
      {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'OFF',
      },
    ],
    tools: [
      {
        googleSearch: {},
      },
    ],
  };

  console.log('Testing Gemini 3.0 Pro Preview');
  console.log('='.repeat(80));
  console.log(`Model: ${model}`);
  console.log(`API Key: ${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 4)}`);
  console.log('Sending request...\n');

  try {
    const streamingResp = await ai.models.generateContentStream(req);
    let hasText = false;

    for await (const chunk of streamingResp) {
      if (chunk.text) {
        process.stdout.write(chunk.text);
        hasText = true;
      } else {
        process.stdout.write(JSON.stringify(chunk) + '\n');
      }
    }

    console.log('\n' + '='.repeat(80));
    if (hasText) {
      console.log('✅ Test successful! Model responded with text.');
    } else {
      console.log('⚠️  No text in response, but no errors occurred.');
    }
  } catch (error) {
    console.error('\n❌ Error occurred:');
    console.error(error instanceof Error ? error.message : String(error));
    if (error instanceof Error && error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
    process.exit(1);
  }
}

generateContent().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
