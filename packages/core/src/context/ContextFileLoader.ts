import fs from 'node:fs/promises';
import path from 'node:path';

/**
 * Configuration for ContextFileLoader.
 */
export interface ContextFileLoaderConfig {
  /** Base directory to search for context files */
  baseDir?: string;
  /** Context file names to look for (default: ['.zulu-pilot-context.md', 'ZULU-PILOT.md', 'GEMINI.md']) */
  fileNames?: string[];
  /** Maximum depth to search subdirectories (default: 10) */
  maxDepth?: number;
}

/**
 * Represents a loaded context file.
 */
export interface LoadedContextFile {
  /** File path relative to base directory */
  filePath: string;
  /** Absolute file path */
  absolutePath: string;
  /** Content of the context file */
  content: string;
  /** Depth level (0 = root, 1 = first subdirectory, etc.) */
  depth: number;
}

/**
 * T186-T190: ContextFileLoader - Loads custom context files (GEMINI.md style)
 * 
 * Discovers and loads context files from project root and subdirectories.
 * Supports priority system: subdirectory context files override root ones.
 */
export class ContextFileLoader {
  private readonly baseDir: string;
  private readonly fileNames: string[];
  private readonly maxDepth: number;

  constructor(config: ContextFileLoaderConfig = {}) {
    this.baseDir = config.baseDir ?? process.cwd();
    this.fileNames = config.fileNames ?? [
      '.zulu-pilot-context.md',
      'ZULU-PILOT.md',
      'GEMINI.md',
    ];
    this.maxDepth = config.maxDepth ?? 10;
  }

  /**
   * T187: Discover context files in project root and subdirectories.
   * 
   * @param startDir - Directory to start searching from (default: baseDir)
   * @param currentDepth - Current depth level (default: 0)
   * @returns Promise resolving to array of discovered context files
   */
  async discoverContextFiles(
    startDir: string = this.baseDir,
    currentDepth: number = 0
  ): Promise<LoadedContextFile[]> {
    const contextFiles: LoadedContextFile[] = [];

    // Stop if max depth reached
    if (currentDepth > this.maxDepth) {
      return contextFiles;
    }

    try {
      const entries = await fs.readdir(startDir, { withFileTypes: true });

      // Check for context files in current directory
      for (const entry of entries) {
        if (entry.isFile() && this.fileNames.includes(entry.name)) {
          const absolutePath = path.join(startDir, entry.name);
          const relativePath = path.relative(this.baseDir, absolutePath);

          try {
            const content = await fs.readFile(absolutePath, 'utf-8');
            contextFiles.push({
              filePath: relativePath,
              absolutePath,
              content,
              depth: currentDepth,
            });
          } catch (error) {
            // Skip files that can't be read
            continue;
          }
        }
      }

      // Recursively search subdirectories (depth-first)
      // T190: Subdirectory context files have higher priority
      if (currentDepth < this.maxDepth) {
        for (const entry of entries) {
          if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
            const subDir = path.join(startDir, entry.name);
            const subFiles = await this.discoverContextFiles(subDir, currentDepth + 1);
            contextFiles.push(...subFiles);
          }
        }
      }
    } catch (error) {
      // If directory can't be read, return empty array
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error;
      }
    }

    return contextFiles;
  }

  /**
   * T188: Load and merge context files.
   * 
   * Files are merged in priority order: deeper files override shallower ones,
   * and files found later (alphabetically) override earlier ones at same depth.
   * 
   * @returns Promise resolving to merged context content
   */
  async loadContext(): Promise<string> {
    const contextFiles = await this.discoverContextFiles();

    if (contextFiles.length === 0) {
      return '';
    }

    // Sort by depth (deeper = higher priority), then by file path (alphabetical)
    // T190: Subdirectory context files have higher priority than root ones
    contextFiles.sort((a, b) => {
      if (a.depth !== b.depth) {
        return b.depth - a.depth; // Deeper files first (higher priority)
      }
      return b.filePath.localeCompare(a.filePath); // Alphabetical (later = higher priority)
    });

    // Merge context files
    const mergedContext: string[] = [];
    const seenFiles = new Set<string>();

    for (const file of contextFiles) {
      // Skip if we've already seen this file path (can happen with symlinks)
      if (seenFiles.has(file.filePath)) {
        continue;
      }
      seenFiles.add(file.filePath);

      // Add header with file path for clarity
      mergedContext.push(`<!-- Context from ${file.filePath} -->`);
      mergedContext.push(file.content.trim());
      mergedContext.push(''); // Empty line separator
    }

    return mergedContext.join('\n').trim();
  }

  /**
   * Get all discovered context files (without loading content).
   * Useful for debugging or listing available context files.
   * 
   * @returns Promise resolving to array of context file paths
   */
  async listContextFiles(): Promise<string[]> {
    const contextFiles = await this.discoverContextFiles();
    return contextFiles.map((f) => f.filePath);
  }

  /**
   * Get base directory.
   * 
   * @returns Base directory path
   */
  getBaseDir(): string {
    return this.baseDir;
  }

  /**
   * Check if a context file exists at the root level.
   * 
   * @returns Promise resolving to true if any context file exists at root
   */
  async hasRootContextFile(): Promise<boolean> {
    try {
      const entries = await fs.readdir(this.baseDir, { withFileTypes: true });
      return entries.some((entry) => entry.isFile() && this.fileNames.includes(entry.name));
    } catch {
      return false;
    }
  }
}

