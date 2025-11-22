# Implementation Plan: [FEATURE]

**Branch**: `[###-feature-name]` | **Date**: [DATE] | **Spec**: [link]
**Input**: Feature specification from `/specs/[###-feature-name]/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

[Extract from feature spec: primary requirement + technical approach from research]

## Research Summary

_MANDATORY: Every plan.md must include this section per Constitution - Research-Driven Planning_

- **Technology Choices**: [List with versions and rationale]
- **Alternatives Considered**: [What was evaluated and why rejected]
- **Key Research Sources**: [Links to official docs, articles, case studies]
- **Known Limitations**: [Trade-offs and constraints identified]
- **Integration Patterns**: [How components work together based on research]
- **Version Information**: [Specific versions researched and their stability/maturity]

## Test & Coverage Strategy

_MANDATORY: Every plan.md must include this section per Constitution - Testing Standards_

- **Testing Framework**: [Tool and version, e.g., Jest 29.x, xUnit 2.5.x]
- **Coverage Tool**: [Tool and version, e.g., Istanbul, Coverlet, JaCoCo]
- **Coverage Targets**:
  - Overall: 80% minimum, 90% target
  - Unit tests: 85% minimum
  - Integration tests: 75% minimum
  - Critical paths: 100% (authentication, payment, etc.)
- **Test File Structure**: [Naming convention, organization]
- **Mocking Strategy**: [Tools and patterns for test isolation]
- **CI Integration**: [Coverage reporting service, badge setup]
- **Coverage Exemptions**: [Known gaps and justification]

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: [e.g., Python 3.11, Swift 5.9, Rust 1.75 or NEEDS CLARIFICATION]  
**Primary Dependencies**: [e.g., FastAPI, UIKit, LLVM or NEEDS CLARIFICATION]  
**Storage**: [if applicable, e.g., PostgreSQL, CoreData, files or N/A]  
**Testing**: [e.g., pytest, XCTest, cargo test or NEEDS CLARIFICATION]  
**Target Platform**: [e.g., Linux server, iOS 15+, WASM or NEEDS CLARIFICATION]
**Project Type**: [single/web/mobile - determines source structure]  
**Performance Goals**: [domain-specific, e.g., 1000 req/s, 10k lines/sec, 60 fps or NEEDS CLARIFICATION]  
**Constraints**: [domain-specific, e.g., <200ms p95, <100MB memory, offline-capable or NEEDS CLARIFICATION]  
**Scale/Scope**: [domain-specific, e.g., 10k users, 1M LOC, 50 screens or NEEDS CLARIFICATION]

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

**Research Requirements** (from Constitution - Research-Driven Planning):

- [ ] At least 3 alternatives evaluated with pros/cons analysis
- [ ] Current stable versions verified
- [ ] Real-world usage examples found
- [ ] Integration compatibility researched
- [ ] Community health assessed
- [ ] Research documented with sources and version numbers

**Test & Coverage Strategy** (from Constitution - Testing Standards):

- [ ] Testing framework selected (Jest for TypeScript/JavaScript)
- [ ] Coverage targets defined per component/layer
- [ ] Test file structure and naming convention determined
- [ ] Mocking strategy defined
- [ ] CI integration plan for coverage reporting

**Quality Gates** (from Constitution - Automated Quality Gates):

- [ ] Pre-commit hooks configured
- [ ] Coverage thresholds meet minimums (80% unit, 70% integration, 75% overall)
- [ ] Critical paths identified for 100% coverage requirement
- [ ] Security scanning tools selected

[Additional gates determined based on constitution file]

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

<!--
  ACTION REQUIRED: Replace the placeholder tree below with the concrete layout
  for this feature. Delete unused options and expand the chosen structure with
  real paths (e.g., apps/admin, packages/something). The delivered plan must
  not include Option labels.
-->

```text
# [REMOVE IF UNUSED] Option 1: Single project (DEFAULT)
src/
├── models/
├── services/
├── cli/
└── lib/

tests/
├── contract/
├── integration/
└── unit/

# [REMOVE IF UNUSED] Option 2: Web application (when "frontend" + "backend" detected)
backend/
├── src/
│   ├── models/
│   ├── services/
│   └── api/
└── tests/

frontend/
├── src/
│   ├── components/
│   ├── pages/
│   └── services/
└── tests/

# [REMOVE IF UNUSED] Option 3: Mobile + API (when "iOS/Android" detected)
api/
└── [same as backend above]

ios/ or android/
└── [platform-specific structure: feature modules, UI flows, platform tests]
```

**Structure Decision**: [Document the selected structure and reference the real
directories captured above]

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation                  | Why Needed         | Simpler Alternative Rejected Because |
| -------------------------- | ------------------ | ------------------------------------ |
| [e.g., 4th project]        | [current need]     | [why 3 projects insufficient]        |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient]  |
