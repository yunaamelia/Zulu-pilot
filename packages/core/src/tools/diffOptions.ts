/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { structuredPatch } from 'diff';
import type { DiffStat } from './tools.js';

interface PatchOptions {
  context?: number;
  ignoreWhitespace?: boolean;
}

interface ParsedDiff {
  hunks: Hunk[];
}

interface Hunk {
  lines: string[];
}

export const DEFAULT_DIFF_OPTIONS: PatchOptions = {
  context: 3,
  ignoreWhitespace: true,
};

export function getDiffStat(
  fileName: string,
  oldStr: string,
  aiStr: string,
  userStr: string
): DiffStat {
  const getStats = (patch: ParsedDiff) => {
    let addedLines = 0;
    let removedLines = 0;
    let addedChars = 0;
    let removedChars = 0;

    patch.hunks.forEach((hunk: Hunk) => {
      hunk.lines.forEach((line: string) => {
        if (line.startsWith('+')) {
          addedLines++;
          addedChars += line.length - 1;
        } else if (line.startsWith('-')) {
          removedLines++;
          removedChars += line.length - 1;
        }
      });
    });
    return { addedLines, removedLines, addedChars, removedChars };
  };

  const modelPatch = structuredPatch(
    fileName,
    fileName,
    oldStr,
    aiStr,
    'Current',
    'Proposed',
    DEFAULT_DIFF_OPTIONS
  );
  const modelStats = getStats(modelPatch);

  const userPatch = structuredPatch(
    fileName,
    fileName,
    aiStr,
    userStr,
    'Proposed',
    'User',
    DEFAULT_DIFF_OPTIONS
  );
  const userStats = getStats(userPatch);

  return {
    model_added_lines: modelStats.addedLines,
    model_removed_lines: modelStats.removedLines,
    model_added_chars: modelStats.addedChars,
    model_removed_chars: modelStats.removedChars,
    user_added_lines: userStats.addedLines,
    user_removed_lines: userStats.removedLines,
    user_added_chars: userStats.addedChars,
    user_removed_chars: userStats.removedChars,
  };
}
