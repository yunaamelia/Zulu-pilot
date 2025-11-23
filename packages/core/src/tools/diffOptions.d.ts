/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { DiffStat } from './tools.js';
interface PatchOptions {
  context?: number;
  ignoreWhitespace?: boolean;
}
export declare const DEFAULT_DIFF_OPTIONS: PatchOptions;
export declare function getDiffStat(
  fileName: string,
  oldStr: string,
  aiStr: string,
  userStr: string
): DiffStat;
export {};
//# sourceMappingURL=diffOptions.d.ts.map
