import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import type { SpyInstance } from 'jest-mock';
import { DiffDisplay } from '../../../../src/cli/ui/diff.js';

describe('DiffDisplay', () => {
  let diffDisplay: DiffDisplay;
  let consoleLogSpy: SpyInstance;

  beforeEach(() => {
    diffDisplay = new DiffDisplay();
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  it('should display unified diff with file path', () => {
    const diff = `--- a/test.ts
+++ b/test.ts
@@ -1,3 +1,3 @@
 const x = 1;
-const y = 2;
+const y = 3;
 const z = 4;
`;

    diffDisplay.display(diff, 'test.ts');

    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('📝 Changes to test.ts:'));
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('--- a/test.ts'));
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('+++ b/test.ts'));
  });

  it('should format additions with green color codes', () => {
    const diff = `--- a/test.ts
+++ b/test.ts
@@ -1,1 +1,2 @@
 const x = 1;
+const y = 2;
`;

    diffDisplay.display(diff, 'test.ts');

    // Check that addition line contains green color code
    const calls = consoleLogSpy.mock.calls.map((call: unknown[]) => call[0]);
    const additionCall = calls.find(
      (call: unknown) => typeof call === 'string' && call.includes('+const y = 2')
    );
    expect(additionCall).toContain('\x1b[32m'); // Green color code
  });

  it('should format deletions with red color codes', () => {
    const diff = `--- a/test.ts
+++ b/test.ts
@@ -1,2 +1,1 @@
 const x = 1;
-const y = 2;
`;

    diffDisplay.display(diff, 'test.ts');

    // Check that deletion line contains red color code
    const calls = consoleLogSpy.mock.calls.map((call: unknown[]) => call[0]);
    const deletionCall = calls.find(
      (call: unknown) => typeof call === 'string' && call.includes('-const y = 2')
    );
    expect(deletionCall).toContain('\x1b[31m'); // Red color code
  });

  it('should display hunk headers', () => {
    const diff = `--- a/test.ts
+++ b/test.ts
@@ -1,3 +1,3 @@
 const x = 1;
`;

    diffDisplay.display(diff, 'test.ts');

    const calls = consoleLogSpy.mock.calls.map((call: unknown[]) => call[0]);
    expect(calls.some((call: unknown) => typeof call === 'string' && call.startsWith('@@'))).toBe(
      true
    );
  });

  it('should handle no newline indicator', () => {
    const diff = `--- a/test.ts
+++ b/test.ts
@@ -1,1 +1,1 @@
-const x = 1;
+const x = 1
\\ No newline at end of file
`;

    diffDisplay.display(diff, 'test.ts');

    const calls = consoleLogSpy.mock.calls.map((call: unknown[]) => call[0]);
    expect(
      calls.some((call: unknown) => typeof call === 'string' && call.includes('\\ No newline'))
    ).toBe(true);
  });

  it('should display context lines without color', () => {
    const diff = `--- a/test.ts
+++ b/test.ts
@@ -1,3 +1,3 @@
 const x = 1;
-const y = 2;
+const y = 3;
 const z = 4;
`;

    diffDisplay.display(diff, 'test.ts');

    const calls = consoleLogSpy.mock.calls.map((call: unknown[]) => call[0]);
    const contextCall = calls.find(
      (call: unknown) => typeof call === 'string' && call.includes(' const x = 1;')
    );
    expect(contextCall).toBeDefined();
    // Context lines should not have color codes
    if (contextCall && typeof contextCall === 'string' && contextCall.includes(' const x = 1;')) {
      expect(contextCall).not.toContain('\x1b[32m');
      expect(contextCall).not.toContain('\x1b[31m');
    }
  });

  it('should display summary of multiple file changes', () => {
    const changes = ['test1.ts', 'test2.ts', 'test3.ts'];

    diffDisplay.displaySummary(changes);

    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('📋 Proposed changes to 3 file(s):')
    );
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('  - test1.ts'));
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('  - test2.ts'));
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('  - test3.ts'));
  });

  it('should handle empty changes array in summary', () => {
    diffDisplay.displaySummary([]);

    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('📋 Proposed changes to 0 file(s):')
    );
  });

  it('should handle single file change in summary', () => {
    diffDisplay.displaySummary(['test.ts']);

    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('📋 Proposed changes to 1 file(s):')
    );
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('  - test.ts'));
  });
});
