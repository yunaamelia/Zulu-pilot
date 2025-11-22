import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { Spinner } from '../../../../src/cli/ui/spinner.js';

describe('Spinner', () => {
  let originalStdoutWrite: typeof process.stdout.write;
  let stdoutOutput: string[];
  let spinners: Spinner[];

  beforeEach(() => {
    stdoutOutput = [];
    spinners = [];
    originalStdoutWrite = process.stdout.write.bind(process.stdout);
    process.stdout.write = jest.fn((chunk: string) => {
      stdoutOutput.push(chunk);
      return true;
    }) as typeof process.stdout.write;
  });

  afterEach(() => {
    // Clean up all spinners
    for (const spinner of spinners) {
      spinner.stop();
    }
    spinners = [];
    process.stdout.write = originalStdoutWrite;
  });

  describe('spinner display', () => {
    it('should start spinner and display loading message', async () => {
      const spinner = new Spinner('Loading...');
      spinners.push(spinner);
      spinner.start();
      // Wait a bit for spinner to render
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(process.stdout.write).toHaveBeenCalled();
      const output = stdoutOutput.join('');
      expect(output).toContain('Loading...');
      spinner.stop();
    });

    it('should update spinner message', async () => {
      const spinner = new Spinner('Initial message');
      spinners.push(spinner);
      spinner.start();
      await new Promise((resolve) => setTimeout(resolve, 200));
      spinner.update('Updated message');
      await new Promise((resolve) => setTimeout(resolve, 200));

      const output = stdoutOutput.join('');
      // The updated message should appear in subsequent frames
      expect(output).toContain('Updated message');
      spinner.stop();
    });

    it('should stop spinner and clear line', () => {
      const spinner = new Spinner('Loading...');
      spinners.push(spinner);
      spinner.start();
      spinner.stop();

      const output = stdoutOutput.join('');
      expect(output).toContain('\r'); // Carriage return to clear line
    });

    it('should succeed with success message', () => {
      const spinner = new Spinner('Loading...');
      spinners.push(spinner);
      spinner.start();
      spinner.succeed('Done!');

      const output = stdoutOutput.join('');
      expect(output).toContain('Done!');
    });

    it('should fail with error message', () => {
      const spinner = new Spinner('Loading...');
      spinners.push(spinner);
      spinner.start();
      spinner.fail('Error occurred');

      const output = stdoutOutput.join('');
      expect(output).toContain('Error occurred');
    });
  });

  describe('cleanup', () => {
    it('should cleanup on stop', () => {
      const spinner = new Spinner('Loading...');
      spinner.start();
      spinner.stop();

      // Should clear the spinner line
      expect(process.stdout.write).toHaveBeenCalled();
    });

    it('should cleanup on succeed', () => {
      const spinner = new Spinner('Loading...');
      spinner.start();
      spinner.succeed('Done');

      // Should clear and show success message
      expect(process.stdout.write).toHaveBeenCalled();
    });

    it('should cleanup on fail', () => {
      const spinner = new Spinner('Loading...');
      spinner.start();
      spinner.fail('Error');

      // Should clear and show error message
      expect(process.stdout.write).toHaveBeenCalled();
    });

    it('should handle multiple start/stop cycles', () => {
      const spinner = new Spinner('Loading...');
      spinners.push(spinner);
      spinner.start();
      spinner.stop();
      spinner.start();
      spinner.stop();

      expect(process.stdout.write).toHaveBeenCalled();
    });
  });
});

