import { zodToJsonSchema } from 'zod-to-json-schema';
import { CodebaseInvestigationReportSchema } from '../packages/core/dist/agents/codebase-investigator.js';

const jsonSchema = zodToJsonSchema(CodebaseInvestigationReportSchema);

console.log(JSON.stringify(jsonSchema, null, 2));
