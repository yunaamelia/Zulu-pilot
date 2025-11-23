/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { AgentDefinition } from './types.js';
import { z } from 'zod';
export declare const CodebaseInvestigationReportSchema: z.ZodObject<
  {
    SummaryOfFindings: z.ZodString;
    ExplorationTrace: z.ZodArray<z.ZodString, 'many'>;
    RelevantLocations: z.ZodArray<
      z.ZodObject<
        {
          FilePath: z.ZodString;
          Reasoning: z.ZodString;
          KeySymbols: z.ZodArray<z.ZodString, 'many'>;
        },
        'strip',
        z.ZodTypeAny,
        {
          FilePath: string;
          Reasoning: string;
          KeySymbols: string[];
        },
        {
          FilePath: string;
          Reasoning: string;
          KeySymbols: string[];
        }
      >,
      'many'
    >;
  },
  'strip',
  z.ZodTypeAny,
  {
    SummaryOfFindings: string;
    ExplorationTrace: string[];
    RelevantLocations: {
      FilePath: string;
      Reasoning: string;
      KeySymbols: string[];
    }[];
  },
  {
    SummaryOfFindings: string;
    ExplorationTrace: string[];
    RelevantLocations: {
      FilePath: string;
      Reasoning: string;
      KeySymbols: string[];
    }[];
  }
>;
export declare const CodebaseInvestigationReportJsonSchema: {
  type: string;
  properties: {
    SummaryOfFindings: {
      type: string;
    };
    ExplorationTrace: {
      type: string;
      items: {
        type: string;
      };
    };
    RelevantLocations: {
      type: string;
      items: {
        type: string;
        properties: {
          FilePath: {
            type: string;
          };
          Reasoning: {
            type: string;
          };
          KeySymbols: {
            type: string;
            items: {
              type: string;
            };
          };
        };
        required: string[];
      };
    };
  };
  required: string[];
};
/**
 * A Proof-of-Concept subagent specialized in analyzing codebase structure,
 * dependencies, and technologies.
 */
export declare const CodebaseInvestigatorAgent: AgentDefinition<
  typeof CodebaseInvestigationReportSchema
>;
//# sourceMappingURL=codebase-investigator.d.ts.map
