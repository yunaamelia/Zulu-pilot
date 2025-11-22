#!/usr/bin/env node
/**
 * Test Gemini 3.0 Pro Preview with @google/genai package
 */

// Load .env file if exists (optional)
try {
  const dotenv = await import('dotenv');
  dotenv.config();
} catch {
  // dotenv is optional
}

import { GoogleGenAI } from '@google/genai';

async function main(): Promise<void> {
  console.log('Testing Gemini 3.0 Pro Preview\n');
  console.log('='.repeat(80));

  // Check for API key
  const apiKey = process.env.GOOGLE_CLOUD_API_KEY;
  if (!apiKey) {
    console.error('❌ Error: GOOGLE_CLOUD_API_KEY environment variable not set');
    console.error('Please set it with: export GOOGLE_CLOUD_API_KEY="YOUR_API_KEY"');
    process.exit(1);
  }

  console.log(
    `✅ API Key found: ${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 4)}\n`
  );

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

  const tools = [
    {
      googleSearch: {},
    },
  ];

  // Set up generation config as per user's configuration
  const generationConfig = {
    temperature: 1, // Updated per user config
    maxOutputTokens: 65535,
    topP: 0.95,
    thinkingConfig: {
      thinkingLevel: 'HIGH',
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
    tools: tools,
  };

  console.log('📤 Request Configuration:');
  console.log(`   Model: ${model}`);
  console.log(`   Mode: ${projectId ? 'Vertex AI' : 'Gemini API'}`);
  console.log(`   Max Output Tokens: ${generationConfig.maxOutputTokens}`);
  console.log(`   Temperature: ${generationConfig.temperature}`);
  console.log(`   Top P: ${generationConfig.topP}`);
  console.log(`   Thinking Level: ${generationConfig.thinkingConfig.thinkingLevel}`);
  console.log(`   Tools: Google Search enabled`);
  console.log('\n' + '-'.repeat(80));
  console.log('Sending request...\n');

  try {
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
      config: generationConfig,
    };

    console.log('Response:');
    console.log('─'.repeat(80));

    const streamingResp = await ai.models.generateContentStream(req);
    let hasResponse = false;
    let responseText = '';

    for await (const chunk of streamingResp) {
      if (chunk.text) {
        process.stdout.write(chunk.text);
        responseText += chunk.text;
        hasResponse = true;
      } else {
        // Log non-text chunks for debugging
        if (process.env.DEBUG) {
          process.stdout.write(JSON.stringify(chunk) + '\n');
        }
      }
    }

    console.log('\n─'.repeat(80));

    if (hasResponse) {
      console.log('\n✅ Success!');
      console.log(`   Response length: ${responseText.length} characters`);
      console.log(
        `   Response: "${responseText.substring(0, 100)}${responseText.length > 100 ? '...' : ''}"`
      );
    } else {
      console.log('\n⚠️  No text response received');
      console.log('   Check DEBUG output for chunk details');
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
