import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { ContextFileLoader } from '../../../packages/core/src/context/ContextFileLoader.js';

/**
 * T185: E2E test for context file workflow
 *
 * This test simulates the full workflow:
 * 1. Developer creates .zulu-pilot-context.md at project root
 * 2. Developer creates context files in subdirectories for specific features
 * 3. AI loads and uses context from these files in conversations
 */
describe('T185: Context File Workflow E2E', () => {
  let tempDir: string;
  let loader: ContextFileLoader;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'zulu-pilot-e2e-context-'));
    loader = new ContextFileLoader({ baseDir: tempDir });
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('should complete full workflow: create context files -> load -> use in conversation', async () => {
    // Step 1: Developer creates root context file
    const rootContext = `# Project: My TypeScript Application

## Overview
This is a TypeScript application built with Node.js.

## Architecture
- Backend: Express.js
- Database: PostgreSQL
- Frontend: React

## Coding Standards
- Use TypeScript strict mode
- Follow ESLint rules
- Write tests for all features
`;

    await fs.writeFile(path.join(tempDir, '.zulu-pilot-context.md'), rootContext);

    // Step 2: Developer creates feature-specific context file
    const featureDir = path.join(tempDir, 'src', 'auth');
    await fs.mkdir(featureDir, { recursive: true });
    const featureContext = `# Authentication Feature

## Purpose
Handles user authentication and authorization.

## Key Files
- auth.service.ts - Main authentication logic
- auth.controller.ts - API endpoints
- auth.middleware.ts - Authentication middleware

## Important Notes
- Uses JWT tokens
- Password hashing with bcrypt
- Session management with Redis
`;

    await fs.writeFile(path.join(featureDir, '.zulu-pilot-context.md'), featureContext);

    // Step 3: Load context (simulates AI loading context at conversation start)
    const mergedContext = await loader.loadContext();

    // Step 4: Verify context was loaded correctly
    expect(mergedContext).toBeTruthy();

    // Root context should be present
    expect(mergedContext).toContain('My TypeScript Application');
    expect(mergedContext).toContain('TypeScript application');
    expect(mergedContext).toContain('Express.js');
    expect(mergedContext).toContain('PostgreSQL');
    expect(mergedContext).toContain('React');

    // Feature context should be present
    expect(mergedContext).toContain('Authentication Feature');
    expect(mergedContext).toContain('JWT tokens');
    expect(mergedContext).toContain('bcrypt');
    expect(mergedContext).toContain('Redis');

    // Feature context should appear before root context (higher priority)
    const featureIndex = mergedContext.indexOf('Authentication Feature');
    const rootIndex = mergedContext.indexOf('My TypeScript Application');
    expect(featureIndex).toBeLessThan(rootIndex);

    // Verify file paths are included in comments
    expect(mergedContext).toContain('<!-- Context from');
    expect(mergedContext).toContain('.zulu-pilot-context.md');
    expect(mergedContext).toContain('src/auth');
  });

  it('should handle multiple context files at different levels', async () => {
    // Create a realistic project structure
    const srcDir = path.join(tempDir, 'src');
    const componentsDir = path.join(srcDir, 'components');
    const apiDir = path.join(srcDir, 'api');

    await fs.mkdir(componentsDir, { recursive: true });
    await fs.mkdir(apiDir, { recursive: true });

    // Root context
    await fs.writeFile(path.join(tempDir, '.zulu-pilot-context.md'), '# Root Context\n\nProject-wide settings.');

    // Component context
    await fs.writeFile(path.join(componentsDir, '.zulu-pilot-context.md'), '# Component Context\n\nComponent library guidelines.');

    // API context
    await fs.writeFile(path.join(apiDir, '.zulu-pilot-context.md'), '# API Context\n\nAPI design patterns.');

    const mergedContext = await loader.loadContext();

    // All contexts should be present
    expect(mergedContext).toContain('Root Context');
    expect(mergedContext).toContain('Component Context');
    expect(mergedContext).toContain('API Context');

    // Verify priority ordering (deeper = higher priority)
    const componentIndex = mergedContext.indexOf('Component Context');
    const apiIndex = mergedContext.indexOf('API Context');
    const rootIndex = mergedContext.indexOf('Root Context');

    // Both subdirectory contexts should appear before root
    expect(componentIndex).toBeLessThan(rootIndex);
    expect(apiIndex).toBeLessThan(rootIndex);
  });

  it('should handle context file discovery across entire project structure', async () => {
    // Create a complex project structure
    const structure = [
      { path: tempDir, file: '.zulu-pilot-context.md', content: 'Root' },
      { path: path.join(tempDir, 'src'), file: 'ZULU-PILOT.md', content: 'Source' },
      { path: path.join(tempDir, 'src', 'features'), file: '.zulu-pilot-context.md', content: 'Features' },
      { path: path.join(tempDir, 'src', 'utils'), file: 'GEMINI.md', content: 'Utils' },
    ];

    for (const item of structure) {
      await fs.mkdir(item.path, { recursive: true });
      await fs.writeFile(path.join(item.path, item.file), item.content);
    }

    const files = await loader.discoverContextFiles();

    expect(files.length).toBe(4);

    // Verify all files were discovered
    const filePaths = files.map((f) => f.filePath).sort();
    expect(filePaths).toContain('.zulu-pilot-context.md');
    expect(filePaths.some((p) => p.includes('src/ZULU-PILOT.md'))).toBe(true);
    expect(filePaths.some((p) => p.includes('src/features'))).toBe(true);
    expect(filePaths.some((p) => p.includes('src/utils'))).toBe(true);
  });

  it('should work with GEMINI.md style context files', async () => {
    // Test compatibility with GEMINI.md naming convention
    await fs.writeFile(path.join(tempDir, 'GEMINI.md'), `# Project Context

This project uses the GEMINI.md naming convention for context files.
This is compatible with existing Gemini CLI workflows.
`);

    const mergedContext = await loader.loadContext();

    expect(mergedContext).toContain('GEMINI.md');
    expect(mergedContext).toContain('Project Context');
    expect(mergedContext).toContain('Gemini CLI workflows');
  });

  it('should handle empty directories gracefully', async () => {
    // Create nested empty directories
    const emptyDir = path.join(tempDir, 'empty', 'nested', 'directory');
    await fs.mkdir(emptyDir, { recursive: true });

    // Create context file at root
    await fs.writeFile(path.join(tempDir, '.zulu-pilot-context.md'), 'Root context');

    const mergedContext = await loader.loadContext();

    expect(mergedContext).toContain('Root context');
    expect(mergedContext).not.toContain('empty');
  });
});

