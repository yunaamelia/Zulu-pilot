<!--
Sync Impact Report:
Version change: Template → 1.0.0
Modified principles: All placeholders replaced with concrete principles
Added sections:
  - Research-Driven Planning Methodology
  - Automated Quality Gates & Pre-Commit Standards
  - Testing Standards & Mandatory Coverage
  - Code Quality Standards
  - UX Consistency Guidelines
  - Performance Requirements
  - Governance Framework
  - Implementation Guidelines
Templates requiring updates:
  ✅ .specify/templates/plan-template.md (will be checked for consistency)
  ✅ .specify/templates/spec-template.md (will be checked for consistency)
  ✅ .specify/templates/tasks-template.md (will be checked for consistency)
Follow-up TODOs: None - all placeholders filled
-->

# Zulu Pilot Constitution

## Executive Summary

This constitution establishes the foundational governance principles for the Zulu Pilot project—a CLI coding assistant with multi-provider AI model support. Our approach is **research-driven, quality-first, and test-coverage-mandatory**. Every technical decision must be backed by research evidence, every quality standard is automatically enforced through pre-commit hooks and CI/CD gates, and every line of code must be covered by tests before reaching production. This document supersedes all other development practices and serves as the single source of truth for technical decision-making.

## Table of Contents

1. [Core Principles](#core-principles)
2. [Measurable Standards](#measurable-standards)
   - [Code Quality](#code-quality)
   - [Testing Standards & Mandatory Coverage](#testing-standards--mandatory-coverage)
   - [UX Consistency](#ux-consistency)
   - [Performance Requirements](#performance-requirements)
   - [Research-Driven Planning](#research-driven-planning)
   - [Automated Quality Gates & Pre-Commit Standards](#automated-quality-gates--pre-commit-standards)
3. [Governance Framework](#governance-framework)
4. [Implementation Guidelines](#implementation-guidelines)
5. [Quick Reference](#quick-reference)

---

## Core Principles

### I. Research-First Decision Making

**Every technical decision in the planning phase MUST be backed by research findings.** Planning without adequate research leads to choosing outdated technologies, missing critical integration issues, over-engineering, or under-engineering. Research is not optional overhead—it's foundational to quality.

**Non-negotiable rules:**

- All major technical choices require documented research with at least 3 alternatives evaluated
- Version-specific research mandatory: verify current stable versions, breaking changes, migration paths
- Production readiness assessment: find real-world usage examples, case studies, known limitations
- Integration compatibility research: understand how chosen technologies work together, identify common pitfalls
- Community and ecosystem health: check activity, maintenance status, available libraries/tooling
- Research sources hierarchy: Official docs → Context7 MCP Server → Production case studies → Community best practices → Performance benchmarks

**Rationale:** Insufficient research leads to technical debt, integration failures, and production issues that could have been prevented. Research upfront saves 10-100x the cost of fixing issues later.

### II. Quality-First Development

**Automated quality gates are not bureaucracy—they're protection.** Manual quality checks lead to inconsistent enforcement, technical debt accumulation, production bugs, team friction, and increased code review burden. Every quality standard MUST be automatically enforced before code enters the repository.

**Non-negotiable rules:**

- Pre-commit checks are MANDATORY—no commits without passing all checks
- CI checks are BLOCKING—no merges without passing quality gates
- Zero tolerance for quality gate violations in protected branches
- Quality metrics trends monitored weekly
- Technical debt tracked and remediated within 1 sprint

**Rationale:** Automated enforcement ensures consistency, catches issues early (shift-left), reduces human error, and enables rapid development with confidence.

### III. Test-Coverage-Mandatory (NON-NEGOTIABLE)

**Untested code is broken code. Coverage is not a metric—it's a requirement.** Code without tests is untested and therefore broken, impossible to refactor safely, difficult to maintain, prone to production bugs, and expensive to fix.

**Non-negotiable rules:**

- TDD mandatory: Write tests BEFORE implementation (Red-Green-Refactor cycle)
- Minimum coverage thresholds: 80% unit, 70% integration, 75% overall, 100% critical paths
- New code must have 85% minimum coverage (stricter than legacy)
- Coverage cannot decrease between commits
- Test files created simultaneously with source files
- Coverage reports generated automatically with every test run
- Coverage failures are build failures

**Rationale:** Tests provide a safety net for refactoring, catch regressions early, document expected behavior, and enable confident deployment. Late bug detection costs 10-100x more than early detection.

### IV. Shift-Left Quality Assurance

**Catch issues before they enter version control.** Quality checks must run automatically at the earliest possible stage—pre-commit, pre-push, and in CI—to prevent defects from propagating through the development lifecycle.

**Non-negotiable rules:**

- Pre-commit hooks run on every commit attempt
- Pre-push hooks run full test suite before remote push
- CI pipeline validates all quality gates on every PR
- Branch protection enforces quality gates before merge
- Fast feedback loops: pre-commit checks complete in <60 seconds

**Rationale:** Early detection reduces cost, prevents technical debt accumulation, maintains code quality standards, and enables rapid iteration with confidence.

### V. Documentation-Driven Development

**Code is only as good as its documentation.** Every public API, architectural decision, and significant change must be documented. Documentation is written alongside code, not as an afterthought.

**Non-negotiable rules:**

- JSDoc/TSDoc required for all public APIs
- Architecture Decision Records (ADR) for significant changes
- README.md updated when public interface changes
- CHANGELOG.md entry for user-facing changes
- API documentation generation and validation in CI

**Rationale:** Documentation enables onboarding, reduces maintenance burden, facilitates code reviews, and serves as a knowledge base for the team.

---

## Measurable Standards

### Code Quality

#### Metrics & Thresholds

**Cyclomatic Complexity:**

- Maximum: 10 per function/method
- Target: <7 per function/method
- Enforcement: ESLint rule `complexity: ["error", 10]`

**Code Coverage:**

- Unit tests: 80% minimum (target: 90%+)
- Integration tests: 70% minimum (target: 80%+)
- Overall project: 75% minimum (target: 85%+)
- Critical business logic: 100% (no exceptions)
- Public APIs: 100% (all endpoints, all status codes)
- Database operations: 90% (all CRUD operations)
- Security functions: 100% (authentication, authorization, encryption)
- Error handling: 100% (all catch blocks, error paths)

**Code Duplication:**

- Maximum: 3% duplication
- Enforcement: SonarQube duplication detection

**Maintainability Rating:**

- Minimum: B rating (SonarQube)
- Target: A rating

**Technical Debt Ratio:**

- Maximum: 5%
- Target: <3%

#### Coding Conventions

**TypeScript/JavaScript:**

- Use ESLint with recommended rules + project-specific overrides
- Use Prettier for code formatting (enforced in pre-commit)
- Strict TypeScript mode enabled (`strict: true` in tsconfig.json)
- Maximum file length: 500 lines
- Import ordering: external → internal → relative (enforced by ESLint)
- Line endings: LF (Unix-style)
- Trailing whitespace: not allowed

**Naming Conventions:**

- Functions/methods: `camelCase`
- Classes: `PascalCase`
- Constants: `UPPER_SNAKE_CASE`
- Files: `kebab-case.ts` for source, `*.test.ts` for tests
- Private members: prefix with `_` (e.g., `_privateMethod`)

**Architectural Patterns:**

- **Enforced:** Dependency Injection, Single Responsibility Principle, Interface Segregation
- **Anti-patterns to avoid:** God objects, circular dependencies, tight coupling, magic numbers/strings

#### Code Review Requirements

**Mandatory checks:**

- [ ] Code follows project style guide
- [ ] Tests written and passing (TDD followed)
- [ ] Coverage meets thresholds
- [ ] No new security vulnerabilities
- [ ] Documentation updated
- [ ] Performance impact assessed
- [ ] Breaking changes documented

**Approval criteria:**

- Minimum 2 approvers for changes to critical paths (auth, payment, encryption)
- Minimum 1 approver for standard changes
- All reviewers must verify compliance with constitution
- No approval if quality gates fail

---

### Testing Standards & Mandatory Coverage

#### Test-Driven Development (TDD) Mandate

**MANDATORY TDD for all new features:**

- Write tests BEFORE implementation (Red-Green-Refactor cycle)
- No production code without corresponding tests
- Tests must fail first, then pass after implementation

**Test-first workflow:**

1. Write failing test that defines desired behavior
2. Implement minimum code to make test pass
3. Refactor while keeping tests green
4. Generate and verify coverage report
5. Add tests for edge cases until coverage threshold met

#### Coverage Requirements (MANDATORY - NO EXCEPTIONS)

**Minimum Coverage Thresholds** (enforced automatically):

- **Unit Tests**: 80% minimum coverage (target: 90%+)
- **Integration Tests**: 70% minimum coverage (target: 80%+)
- **Overall Project Coverage**: 75% minimum (target: 85%+)
- **Critical Business Logic**: 100% coverage (no exceptions)
- **Public APIs**: 100% coverage (all endpoints, all status codes)
- **Database Operations**: 90% coverage (all CRUD operations)
- **Security Functions**: 100% coverage (authentication, authorization, encryption)
- **Error Handling**: 100% coverage (all catch blocks, error paths)

**Coverage Types (ALL must be measured):**

1. **Line Coverage**: Percentage of code lines executed
2. **Branch Coverage**: Percentage of decision branches taken (if/else, switch cases)
3. **Function Coverage**: Percentage of functions called
4. **Statement Coverage**: Percentage of statements executed
5. **Condition Coverage**: Percentage of boolean sub-expressions tested
6. **Path Coverage**: Percentage of execution paths tested (for critical functions)

**New Code Coverage Standards:**

- New code must have **85% minimum coverage** (stricter than legacy)
- New files must have **90% minimum coverage**
- No new code can reduce overall project coverage
- Coverage trend must be upward (tracked in CI dashboard)

**Project-Specific Coverage Thresholds** (from jest.config.js):

```javascript
coverageThreshold: {
  global: {
    branches: 80,
    functions: 80,
    lines: 80,
    statements: 80,
  },
  // Critical paths require 95% coverage
  'src/core/llm/**/*.ts': {
    branches: 95,
    functions: 95,
    lines: 95,
    statements: 95,
  },
  'src/core/parser/**/*.ts': {
    branches: 95,
    functions: 95,
    lines: 95,
    statements: 95,
  },
  'src/core/context/**/*.ts': {
    branches: 95,
    functions: 95,
    lines: 95,
    statements: 95,
  },
}
```

#### Test File Structure & Organization

**File Naming Convention** (STRICTLY ENFORCED):

- Source file: `UserService.ts`
- Test file: `UserService.test.ts` (or `UserService.spec.ts`)
- Coverage: Automatically generated

**Test File Co-location:**

- Option A (Separate test directory): Mirror source structure
  ```
  src/
    services/
      UserService.ts
  tests/
    services/
      UserService.test.ts
  ```
- Option B (Co-located): Keep tests near source
  ```
  src/
    services/
      UserService.ts
      UserService.test.ts
  ```

**Test Class/Suite Organization:**

```typescript
describe('UserService', () => {
  // Setup and teardown
  beforeAll(() => {
    /* global setup */
  });
  afterAll(() => {
    /* global cleanup */
  });
  beforeEach(() => {
    /* per-test setup */
  });
  afterEach(() => {
    /* per-test cleanup */
  });

  // Group by method/function
  describe('createUser()', () => {
    it('should create user with valid data', () => {
      /* test */
    });
    it('should throw error for invalid email', () => {
      /* test */
    });
    // ... more test cases
  });

  // Edge cases and integration scenarios
  describe('edge cases', () => {
    /* ... */
  });
  describe('integration scenarios', () => {
    /* ... */
  });
});
```

#### Testing Pyramid Balance

**Recommended distribution:**

- **Unit Tests**: 70% of test suite (fast, isolated, high coverage)
- **Integration Tests**: 20% of test suite (component interactions)
- **End-to-End Tests**: 10% of test suite (full user workflows)

**Test Performance Budgets:**

- Unit tests: <5 seconds for full suite
- Integration tests: <30 seconds for full suite
- E2E tests: <5 minutes for full suite
- Pre-commit test execution: <60 seconds total

#### Mutation Testing

**Required for critical business logic:**

- Authentication/authorization flows
- Payment processing
- Data encryption/decryption
- Security validation
- Critical business rules

**Tools:**

- JavaScript/TypeScript: Stryker Mutator
- Run mutation tests in CI for critical paths
- Target: 80%+ mutation score for critical code

---

### UX Consistency

#### Design Tokens

**Color System:**

- Primary, secondary, accent colors defined in design system
- WCAG AA contrast ratios enforced (4.5:1 for normal text, 3:1 for large text)
- Dark mode support required

**Typography:**

- Font family, sizes, weights, line heights standardized
- Responsive typography scales defined

**Spacing:**

- 8px base unit grid system
- Consistent spacing scale (4px, 8px, 16px, 24px, 32px, 48px, 64px)

**Breakpoints:**

- Mobile: <768px
- Tablet: 768px - 1024px
- Desktop: >1024px

#### Accessibility Standards

**WCAG Level:** AA compliance required (AAA for critical user flows)

**Mandatory checks:**

- Automated a11y testing (axe-core, pa11y) in pre-commit
- Alt text validation for images
- ARIA attributes validation
- Color contrast ratio checks
- Keyboard navigation verification
- Screen reader compatibility testing

**Enforcement:**

- Pre-commit hook: `pa11y` or `axe-core` on staged files
- CI: Lighthouse accessibility score ≥95
- Manual audit required for new UI components

#### Component Reusability Standards

**Component requirements:**

- Self-contained and independently testable
- Documented props/API
- Storybook/Storybook-like documentation
- Visual regression tests
- Accessibility tested

**Reusability criteria:**

- Used in 2+ places → extract to shared component
- Used in 1 place but likely to be reused → extract to shared component
- Complex logic → extract to utility/hook

#### User Feedback & Validation

**Required feedback mechanisms:**

- Loading states for async operations
- Error messages with actionable guidance
- Success confirmations for user actions
- Form validation with inline feedback
- Progress indicators for long-running operations

**Validation requirements:**

- Client-side validation for immediate feedback
- Server-side validation for security
- Clear, actionable error messages
- Accessibility: errors announced to screen readers

#### Visual Regression Testing

**Required for:**

- UI component changes
- Layout modifications
- Styling updates
- Responsive design changes

**Tools:**

- Percy, Chromatic, or similar
- Run in CI on every PR
- Manual approval required for visual changes

---

### Performance Requirements

#### Web Performance Targets

**Core Web Vitals:**

- **Largest Contentful Paint (LCP)**: <2.5 seconds
- **First Input Delay (FID)**: <100 milliseconds
- **Cumulative Layout Shift (CLS)**: <0.1

**Time to Interactive (TTI):** <3 seconds

**First Contentful Paint (FCP):** <1.8 seconds

#### API Response Times

**Targets:**

- P50 (median): <200ms
- P95: <500ms
- P99: <1000ms

**Critical endpoints:**

- Authentication: <300ms
- Data retrieval: <500ms
- Data mutation: <1000ms

#### Lighthouse Score Minimums

**Required scores:**

- **Performance**: 90+
- **Accessibility**: 100
- **Best Practices**: 100
- **SEO**: 90+

**Enforcement:**

- Lighthouse CI in pre-push hook for UI changes
- CI pipeline blocks merge if scores below thresholds
- Performance budget enforcement

#### Performance Budget

**Asset size limits:**

- JavaScript bundle: <500KB (gzipped)
- CSS bundle: <100KB (gzipped)
- Images: optimized, WebP format preferred
- Fonts: subsetted, WOFF2 format

**Bundle size enforcement:**

- Pre-commit: fail if bundle increase >10% without justification
- CI: track bundle size trends
- Alert on bundle size regressions

#### Monitoring & Observability

**Required metrics:**

- Application Performance Monitoring (APM)
- Error tracking and alerting
- Real User Monitoring (RUM)
- API response time tracking
- Resource usage monitoring (CPU, memory, disk)

**Tools:**

- Application: New Relic, Datadog, or similar
- Error tracking: Sentry or similar
- Logging: Structured logging (JSON format)
- Metrics: Prometheus + Grafana or similar

---

### Research-Driven Planning

#### Mandatory Research Depth

**Every technical decision in the planning phase MUST be backed by research findings.** Planning cannot proceed to implementation without:

1. **Documented research for all major technical choices**
2. **Validation of chosen stack against latest stable versions**
3. **Identification of potential integration issues through research**
4. **Clear evidence that alternatives were evaluated**

#### Research Scope Requirements

**Technology Stack Evaluation:**

- Compare at least 3 alternatives with pros/cons analysis
- Document rejected alternatives with reasoning
- Include version numbers, release dates, stability assessment

**Version-Specific Research:**

- Always verify current stable versions
- Check for breaking changes and migration paths
- Review changelog for recent versions
- Assess backward compatibility

**Production Readiness Assessment:**

- Find real-world usage examples
- Review case studies and post-mortems
- Identify known limitations and gotchas
- Check GitHub issues/PRs for common problems

**Integration Compatibility:**

- Research how chosen technologies work together
- Identify common pitfalls and integration patterns
- Verify compatibility with existing stack
- Test integration in proof-of-concept if uncertain

**Community and Ecosystem Health:**

- Check GitHub activity (stars, commits, issues)
- Verify maintenance status (recent commits, releases)
- Assess available libraries/tooling
- Review community support and documentation quality

#### Research Sources Hierarchy

**Priority order:**

1. **Official documentation** (latest version)
2. **Authoritative sources via Context7 MCP Server**
3. **Production case studies and post-mortems**
4. **Community best practices and design patterns**
5. **Performance benchmarks and comparative studies**

#### Research Documentation Standard

**Every plan.md must include:**

```markdown
## Research Summary

- **Technology Choices**: [List with versions and rationale]
- **Alternatives Considered**: [What was evaluated and why rejected]
- **Key Research Sources**: [Links to official docs, articles, case studies]
- **Known Limitations**: [Trade-offs and constraints identified]
- **Integration Patterns**: [How components work together based on research]
- **Version Information**: [Specific versions researched and their stability/maturity]

## Test & Coverage Strategy

- **Testing Framework**: [Tool and version, e.g., Jest 29.x]
- **Coverage Tool**: [Tool and version, e.g., Istanbul]
- **Coverage Targets**: [Overall: 80% minimum, 90% target, etc.]
- **Test File Structure**: [Naming convention, organization]
- **Mocking Strategy**: [Tools and patterns for test isolation]
- **CI Integration**: [Coverage reporting service, badge setup]
```

#### Research Validation Checkpoints

**Research must be validated before:**

- Finalizing tech stack selection
- Committing to architectural patterns
- Defining data models and APIs
- Implementing rapidly-evolving technologies

**Research inadequacy indicators** (triggers for additional research):

- Generic technology overviews instead of specific version details
- Missing comparison with alternatives
- Lack of real-world production examples
- Uncertainty about integration patterns or best practices
- Rapidly-changing technology without recent research
- No testing/coverage strategy for chosen tech stack

#### Parallel Research Execution

**For complex features:**

- Spawn multiple targeted research tasks simultaneously
- Avoid broad general research—focus on specific implementation questions
- Research specific "how to implement X with Y" questions
- Seek code examples, implementation patterns, configuration samples

---

### Automated Quality Gates & Pre-Commit Standards

**Philosophy**: "If it's not automated, it won't be consistent." Every quality check must run automatically before code enters the repository.

#### Pre-Commit Hook Requirements (Git Hooks)

**MANDATORY PRE-COMMIT CHECKS** - Code CANNOT be committed unless ALL checks pass:

**1. Code Formatting & Style**

- Auto-format code using Prettier
- Lint code for style violations (ESLint)
- Check for consistent indentation, line endings (LF), trailing whitespace
- Validate import/using statements ordering
- Maximum file length enforcement (500 lines)

**2. Code Quality Analysis**

- Static code analysis (ESLint with TypeScript rules)
- Cyclomatic complexity check (max complexity: 10 per method)
- Code duplication detection (max 3% duplication)
- Dead code detection
- Unused variable/import detection

**3. Security Scanning**

- Secret detection (git-secrets, truffleHog)
- Dependency vulnerability scanning (`npm audit`)
- SAST (Static Application Security Testing) for common vulnerabilities
- License compliance check for dependencies
- Hardcoded credentials detection

**4. Test Execution with Coverage** ⭐ **MANDATORY**

- Run ALL unit tests for changed files with coverage enabled
- Generate coverage report automatically
- Verify test file exists for every changed source file
- Enforce minimum coverage threshold (80% for existing, 85% for new code)
- Block commit if coverage decreases
- Run integration tests if service layer modified
- Minimum code coverage enforcement (fail if below threshold)
- Test performance check (fail if tests take > 5 minutes)
- No skipped/ignored tests allowed without documented justification

**5. Type Safety & Compilation**

- TypeScript type checking (strict mode)
- Compile checks for compiled languages
- Schema validation for JSON/YAML/config files
- API contract validation (OpenAPI/Swagger spec)

**6. Documentation Requirements**

- JSDoc/TSDoc documentation for public APIs
- README.md updates if public interface changed
- CHANGELOG.md entry for user-facing changes
- API documentation generation and validation

**7. Commit Message Standards**

- Conventional commits format enforcement (`feat:`, `fix:`, `docs:`, etc.)
- Minimum commit message length (20 characters)
- Issue/ticket number reference requirement
- No profanity or inappropriate language
- Commit message spell-check

**8. File & Structure Validation**

- No large files (> 1MB) without LFS
- No binary files in source control (except approved types)
- Filename convention compliance
- Directory structure validation
- No TODO/FIXME comments without linked issues

**9. Performance Checks**

- Bundle size analysis (fail if increase > 10% without justification)
- Image optimization verification
- CSS/JS minification check for production builds

**10. Accessibility Checks**

- Automated a11y testing (axe-core, pa11y)
- Alt text validation for images
- ARIA attributes validation
- Color contrast ratio checks
- Keyboard navigation verification

#### Pre-Push Hook Requirements

**Additional checks before pushing to remote** (heavier operations):

**1. Full Test Suite Execution with Coverage** ⭐ **MANDATORY**

- Run complete unit test suite with coverage (all projects/modules)
- Run integration test suite with coverage
- Generate comprehensive coverage report (HTML + LCOV + JSON)
- Upload coverage to CI dashboard (Codecov, Coveralls, etc.)
- Verify overall project coverage meets minimum threshold (75%)
- Check coverage trend (must not decrease)
- Run end-to-end tests for affected features

**2. Build Verification**

- Full production build succeeds
- All build warnings treated as errors
- Build artifact size within budget
- Multi-platform build verification

**3. Advanced Security Scanning**

- Dynamic dependency analysis
- Container image scanning (if using Docker)
- Infrastructure-as-Code security scanning

**4. Code Coverage Analysis** ⭐ **MANDATORY**

- Overall coverage meets/exceeds baseline (75%)
- No coverage regression in modified files
- New code has minimum 85% coverage
- Branch coverage meets requirements (75%)
- Critical paths have 100% coverage

#### Commit-msg Hook Requirements

**Message Format Validation:**

- Enforce conventional commits: `type(scope): description`
- Valid types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`, `ci`
- Maximum subject length (72 characters)
- Body wrapping at 72 characters
- Reference to issue/ticket required for `feat`/`fix`

#### Hook Implementation Standards

**Configuration Management:**

- Use Husky for Git hooks (already configured in project)
- Store hook configurations in repository (`.husky/` directory)
- Version control all hook scripts and configurations
- Document hook setup in CONTRIBUTING.md

**Performance Optimization:**

- Run checks only on staged files (not entire codebase)
- Cache results where possible
- Parallel execution of independent checks
- Fail fast: stop on first critical error
- Progressive checks: fast checks first, slow checks last

**Developer Experience:**

- Clear, actionable error messages
- Auto-fix capability where possible (formatters, linters)
- Easy bypass for emergencies (with justification required)
- Hook installation automation (`npm install` runs `husky install`)
- Local vs. CI parity (same checks in both environments)

**Bypass Policy:**

- Emergency bypass: `git commit --no-verify` allowed ONLY for:
  - Hotfixes during production incidents
  - Reverting broken commits
  - Must be followed by cleanup commit within 24 hours
- Document bypass usage in commit message
- Bypass commits flagged in CI for mandatory review

#### CI/CD Pipeline Integration

**Branch Protection Rules:**

- Main/master branch: require all status checks to pass
- No direct pushes to protected branches
- Require pull request reviews (minimum 2 approvers)
- Require up-to-date branches before merge
- Dismiss stale reviews on new commits
- Require coverage checks to pass

**Continuous Integration Checks** (runs on PR):

**1. Comprehensive Testing with Coverage** ⭐ **MANDATORY**

- Unit tests with coverage (all platforms/browsers if applicable)
- Integration tests with coverage
- End-to-end tests
- Coverage report generation (multiple formats)
- Coverage upload to dashboard (Codecov, Coveralls, Code Climate)
- Coverage trend analysis and comparison
- Coverage badge generation and update
- PR comment with coverage diff and summary

**2. Quality Gates with Coverage Enforcement** ⭐ **MANDATORY**

- SonarQube quality gate (A rating required)
- Code coverage > 80% (configurable per project) - BLOCKING
- New code coverage > 85% - BLOCKING
- Coverage trend must not decrease - BLOCKING
- No critical/blocker issues
- Technical debt ratio < 5%
- Maintainability rating: A

**3. Security & Compliance**

- SAST (Static Application Security Testing)
- DAST (Dynamic Application Security Testing)
- Container scanning
- License compliance verification
- SBOM (Software Bill of Materials) generation
- Security-critical code requires 100% test coverage

**4. Documentation & Standards**

- API documentation build succeeds
- Architecture diagrams up-to-date
- Breaking change detection
- Semantic versioning compliance
- Test documentation completeness check

**5. Deployment Readiness**

- Production build succeeds
- Database migrations validated
- Environment configurations validated
- Rollback plan documented
- All tests pass with required coverage

**Continuous Deployment Pipeline:**

- Automated deployment to staging on PR merge
- Smoke tests on staging environment
- Manual approval gate for production
- Blue-green or canary deployment strategy
- Automatic rollback on health check failures
- Coverage monitoring in production (error tracking correlation)

#### Tool Recommendations by Tech Stack

**JavaScript/TypeScript (Current Stack):**

- **Testing**: Jest (already configured)
- **Coverage**: Istanbul (nyc), c8
- **Git Hooks**: Husky (already configured)
- **Linting**: ESLint + Prettier
- **CI Integration**: Codecov, Coveralls
- **Configuration**: See `jest.config.js` and `.husky/` directory

**Configuration Example:**

```json
{
  "jest": {
    "collectCoverage": true,
    "collectCoverageFrom": ["src/**/*.{js,ts,jsx,tsx}"],
    "coverageThreshold": {
      "global": {
        "branches": 75,
        "functions": 80,
        "lines": 80,
        "statements": 80
      }
    },
    "coverageReporters": ["text", "text-summary", "lcov", "html", "json-summary"],
    "coverageDirectory": "coverage"
  }
}
```

---

## Governance Framework

### Decision-Making Process

**How engineers should apply principles when faced with technical choices:**

1. **Research evidence required** for all non-trivial technical decisions
2. **Documentation of decision rationale** with research citations mandatory
3. **All architectural decisions** must pass automated quality gates
4. **All new features** must include tests with coverage before implementation

**Decision workflow:**

1. Identify the technical choice/decision point
2. Conduct research (following Research-Driven Planning methodology)
3. Document alternatives considered and rationale
4. Get approval from technical lead if decision affects architecture
5. Implement with tests and documentation
6. Verify quality gates pass

### Trade-off Resolution

**Process when principles conflict:**

**Example: Performance vs. Code Maintainability**

- Research both approaches with benchmarks
- Document trade-offs explicitly
- Choose approach that best serves user needs
- Mitigate downsides (e.g., add documentation for performance optimizations)
- Monitor and adjust based on metrics

**Research depth vs. Analysis paralysis:**

- Set time-boxed research periods (e.g., 2-4 hours for standard decisions)
- Use parallel research tasks for complex features
- Make decisions when 80% of information is available
- Document assumptions and revisit if proven wrong

**Acceptable risk levels:**

- **Low risk**: Standard libraries, well-documented patterns → Proceed with standard research
- **Medium risk**: New technology, integration complexity → Extended research, proof-of-concept
- **High risk**: Core architecture changes, security-critical → Extensive research, multiple approvals, phased rollout

**Quality gates adjustment:**

- Stricter for production code (all gates enforced)
- Relaxed for prototypes (60% coverage minimum, time-boxed exemption)
- Emergency hotfixes: post-fix quality remediation required

### Research Quality Gates

**Planning phase cannot proceed to implementation without:**

- Documented research for all major technical choices
- Validation of chosen stack against latest stable versions
- Identification of potential integration issues through research
- Clear evidence that alternatives were evaluated
- Test strategy defined with coverage targets per component

**Research inadequacy indicators** (triggers for additional research):

- Generic technology overviews instead of specific version details
- Missing comparison with alternatives
- Lack of real-world production examples
- Uncertainty about integration patterns or best practices
- Rapidly-changing technology without recent research
- No testing/coverage strategy for chosen tech stack

### Quality Gate Enforcement

**Pre-commit checks are MANDATORY** - no commits without passing tests and coverage

**CI checks are BLOCKING** - no merges without passing coverage gates

**Quality gate bypass requires:**

- Technical lead approval
- Documented justification in commit/PR
- Technical debt ticket created
- Remediation plan within 1 sprint
- Coverage exemption explicitly documented

**Quality metrics trends monitored:**

- Weekly quality dashboards
- Coverage trend analysis (must be upward or stable)
- Technical debt accumulation tracking
- Uncovered code hotspots identified

**Coverage-specific enforcement:**

- Coverage cannot decrease between commits
- New files must have 90%+ coverage
- Critical paths must have 100% coverage
- Coverage reports reviewed in PR
- Coverage badges must be green before merge

### Exception Handling

**When principles can be temporarily violated:**

**Time-sensitive prototypes or spikes:**

- Reduced quality gates: 60% coverage minimum
- Time-boxed exemption (2 weeks maximum)
- Explicit technical debt ticket
- Post-prototype cleanup required

**Emergency hotfix process:**

- Bypass quality gates with `--no-verify` (documented in commit message)
- Post-fix quality remediation within 24 hours
- Technical debt ticket created
- Coverage gaps addressed in next sprint

**Legacy code refactor:**

- Gradual coverage increase plan required
- Document current state and target state
- Track progress in technical debt backlog
- No new code can reduce overall coverage

**Coverage exemptions:**

- Prototype/spike: 60% minimum (time-boxed to 2 weeks)
- Legacy code refactor: gradual increase plan required
- Third-party wrapper: integration tests may substitute unit tests
- Auto-generated code: marked with coverage exemption comments
- **All exemptions require technical lead sign-off and tracking ticket**

### Review Checkpoints

**Stages where compliance must be validated:**

1. **Every commit** (pre-commit hooks with coverage)
2. **Every push** (pre-push hooks with full coverage)
3. **Every PR** (CI pipeline with coverage reporting)
4. **Before merge** (branch protection with coverage gate)
5. **Before deployment** (staging validation with coverage verification)
6. **Post-deployment** (production monitoring)
7. **Weekly coverage review meeting**
8. **Monthly coverage trend analysis**

**Research audit:**

- Before plan approval: verify research completeness
- Implementation review: ensure plan research was sufficient
- Post-implementation: validate research accuracy

---

## Implementation Guidelines

### Research Best Practices

**Targeted over broad:**

- Research specific implementation questions, not general technology overviews
- Focus on "how to implement X with Y" over "what is X"
- Seek code examples, implementation patterns, configuration samples

**Parallel research tasks:**

- Spawn multiple focused research threads for complex features
- Avoid broad general research—target specific questions

**Version-aware:**

- Always include version numbers and release dates in research findings
- Verify current stable versions, breaking changes, migration paths

**Practical focus:**

- Prioritize implementation guidance over theoretical knowledge
- Find real-world examples and case studies
- Test integration in proof-of-concept if uncertain

**Test-aware:**

- Research testing strategies and coverage tools for chosen technologies
- Identify testing best practices for the stack
- Verify test framework compatibility

### Code Quality Practices

**Good vs. Bad Examples:**

**Good:**

```typescript
// Clear, single responsibility, testable
export class UserService {
  async createUser(data: UserData): Promise<User> {
    this.validateUserData(data);
    const hashedPassword = await this.hashPassword(data.password);
    return this.userRepository.create({ ...data, password: hashedPassword });
  }

  private validateUserData(data: UserData): void {
    if (!data.email || !this.isValidEmail(data.email)) {
      throw new ValidationError('Invalid email');
    }
  }
}
```

**Bad:**

```typescript
// God object, multiple responsibilities, untestable
export class UserService {
  async createUser(data: any): Promise<any> {
    // Validation, hashing, database, email, logging all mixed together
    if (data.email) {
      const hash = crypto.createHash('md5').update(data.password).digest('hex');
      db.query(`INSERT INTO users VALUES ('${data.email}', '${hash}')`);
      emailService.send(data.email, 'Welcome!');
      console.log('User created');
    }
    return { success: true };
  }
}
```

**Enforcement mechanisms:**

- Automated linting (ESLint) in pre-commit
- Code review checklists
- CI/CD quality gates
- SonarQube static analysis

**Documentation requirements:**

- JSDoc/TSDoc for all public APIs
- Architecture Decision Records (ADR) for significant changes
- README.md updates for public interface changes
- CHANGELOG.md entries for user-facing changes

### Automated Quality Gates Setup

**Phase 1: Project Initialization** (must be completed before first commit)

1. ✅ Install and configure pre-commit framework/tool (Husky already configured)
2. ✅ Set up commit message validation (commitlint already configured)
3. ✅ Configure code formatters and linters (Prettier, ESLint)
4. ✅ Install and configure test framework with coverage (Jest already configured)
5. ✅ Configure coverage thresholds in project config (jest.config.js)
6. ✅ Set up coverage report generation (HTML + LCOV + JSON)
7. ✅ Configure coverage badge generation
8. ⚠️ Integrate security scanners (TODO: add git-secrets, npm audit in pre-commit)
9. ✅ Test hooks locally with sample violations and coverage failures
10. ⚠️ Document coverage commands in README (TODO: add to README)

**Phase 2: CI/CD Integration** (before first PR)

1. ⚠️ Configure CI pipeline (GitHub Actions, GitLab CI, Jenkins, Azure DevOps)
2. ⚠️ Set up quality reporting (SonarQube, Code Climate)
3. ⚠️ Integrate coverage reporting service (Codecov, Coveralls, Code Climate)
4. ⚠️ Configure coverage PR comments and badges
5. ⚠️ Configure branch protection rules with coverage gates
6. ⚠️ Set up automated deployment pipelines
7. ⚠️ Integrate monitoring and alerting
8. ⚠️ Set up coverage trend tracking dashboard

**Phase 3: Continuous Improvement**

1. Monitor quality metrics and adjust thresholds
2. Review coverage reports weekly, identify gaps
3. Add new checks as project matures
4. Optimize check performance
5. Gather developer feedback
6. Update documentation
7. Increase coverage targets gradually (80% → 85% → 90%)
8. Gamify coverage: leaderboard, achievements

### Quality Gates Configuration Template

**Create `.quality-gates.yml` in repository root:**

```yaml
quality_gates:
  pre_commit:
    - name: 'Code Formatting'
      tools: [prettier]
      auto_fix: true
      blocking: true

    - name: 'Linting'
      tools: [eslint]
      blocking: true
      max_warnings: 0

    - name: 'Unit Tests with Coverage'
      scope: changed_files
      min_coverage: 80
      min_new_code_coverage: 85
      max_duration: 60s
      blocking: true
      fail_on_coverage_decrease: true
      reports:
        - terminal
        - html
        - lcov
      badge: true

    - name: 'Security Scan'
      tools: [git-secrets, npm-audit]
      blocking: true

    - name: 'Type Checking'
      tools: [typescript]
      blocking: true

    - name: 'Test File Validation'
      check_test_file_exists: true
      naming_convention: true
      blocking: true

  pre_push:
    - name: 'Full Test Suite with Coverage'
      types: [unit, integration]
      min_coverage:
        overall: 75
        unit: 80
        integration: 70
        new_code: 85
      branch_coverage: 75
      blocking: true
      reports:
        - html
        - lcov
        - json
        - cobertura
      upload_to: [codecov, coveralls]

    - name: 'Build Verification'
      environments: [development, production]
      blocking: true

    - name: 'Code Quality with Coverage'
      tool: sonarqube
      min_rating: B
      min_coverage: 80
      max_coverage_decrease: 0
      blocking: true

  ci_pipeline:
    - name: 'Comprehensive Testing with Coverage'
      types: [unit, integration, e2e]
      browsers: [chrome, firefox, safari]
      min_coverage:
        overall: 80
        unit: 85
        integration: 75
        new_code: 90
      coverage_trend: must_not_decrease
      reports:
        - html
        - lcov
        - json
        - cobertura
        - text-summary
      upload_to:
        - codecov
        - coveralls
        - code_climate
        - sonarqube
      pr_comment: true
      badge_update: true

    - name: 'Security Analysis'
      tools: [sonarqube, snyk, trivy]
      fail_on: critical
      require_100_percent_coverage_for: [auth, payment, encryption]

    - name: 'Performance Testing'
      lighthouse_min: 90
      load_test_duration: 5m

    - name: 'Accessibility'
      wcag_level: AA
      min_score: 95

    - name: 'Coverage Report Publication'
      generate_badge: true
      update_readme: true
      trend_analysis: true
      alert_on_decrease: true

thresholds:
  code_coverage:
    overall_min: 75
    unit_min: 80
    integration_min: 70
    new_code_min: 85
    branch_coverage_min: 75

    overall_target: 85
    unit_target: 90
    integration_target: 80
    new_code_target: 95

    critical_paths:
      - authentication
      - authorization
      - payment_processing
      - data_encryption
      - security_validation
      - public_api_endpoints

    layers:
      models: 85
      services: 90
      controllers: 80
      repositories: 85
      utilities: 85
      validators: 95

  complexity:
    cyclomatic: 10
    cognitive: 15

  duplication:
    max_percentage: 3

  maintainability:
    min_rating: B

  security:
    max_critical: 0
    max_high: 0

  performance:
    lighthouse_performance: 90
    lighthouse_accessibility: 100
    bundle_size_kb: 500
```

### Developer Onboarding Checklist

Every new developer must:

- [ ] Install Git hooks (automated in setup script via `npm install`)
- [ ] Install coverage tools and configure IDE integration
- [ ] Review coverage requirements and thresholds
- [ ] Run quality checks locally and verify all pass
- [ ] Run tests with coverage and verify reports generate
- [ ] Practice TDD: write failing test → implement → verify coverage
- [ ] Review quality gates documentation
- [ ] Understand bypass policy and consequences
- [ ] Set up IDE integration for linters/formatters
- [ ] Set up IDE coverage highlighting (VS Code, IntelliJ, etc.)
- [ ] Complete commit message format training
- [ ] Review security scanning results interpretation
- [ ] Complete test coverage training module
- [ ] Review coverage dashboard and understand metrics

---

## Quick Reference

### Coverage Quick Reference Card

**Print this and keep it handy:**

```
✅ Write test first (TDD)
✅ Run with coverage: npm test -- --coverage
✅ Check coverage: open coverage/index.html
✅ Target: 90%+, Minimum: 80%
✅ Critical paths: 100%
✅ Fix uncovered (red) lines
✅ Commit when coverage passes
```

### Quality Gates Quick Reference Card

**Pre-Commit (runs on every commit):**

- ✅ Code formatting (Prettier)
- ✅ Linting (ESLint)
- ✅ Type checking (TypeScript)
- ✅ Unit tests with coverage (changed files only)
- ✅ Security scan (secrets, vulnerabilities)
- ✅ Commit message validation

**Pre-Push (runs before push):**

- ✅ Full test suite with coverage
- ✅ Build verification
- ✅ Coverage trend check (must not decrease)

**CI Pipeline (runs on PR):**

- ✅ Comprehensive testing (unit, integration, e2e)
- ✅ Quality gates (SonarQube)
- ✅ Security analysis
- ✅ Performance testing
- ✅ Accessibility checks
- ✅ Coverage reporting and PR comments

### Research Checklist

**Before implementing any feature:**

- [ ] Research at least 3 alternatives
- [ ] Verify current stable versions
- [ ] Find real-world usage examples
- [ ] Check integration compatibility
- [ ] Assess community health
- [ ] Document research findings in plan.md
- [ ] Define test strategy with coverage targets

### Common Commands

```bash
# Run tests with coverage
npm test -- --coverage

# View coverage report
open coverage/index.html

# Run linting
npm run lint

# Format code
npm run format

# Type check
npm run type-check

# Bypass hooks (emergency only, document why)
git commit --no-verify -m "fix: emergency hotfix [BYPASS: documented in ticket #123]"
```

---

## Appendix

### Research Sources

**Official Documentation:**

- Jest: https://jestjs.io/docs/getting-started
- Husky: https://typicode.github.io/husky/
- Pre-commit: https://pre-commit.com/
- SonarQube: https://docs.sonarsource.com/sonarqube/

**Best Practices:**

- Node.js Testing Best Practices: https://github.com/goldbergyoni/nodejs-testing-best-practices
- Testing Library: https://testing-library.com/
- Conventional Commits: https://www.conventionalcommits.org/

**Standards:**

- WCAG 2.1: https://www.w3.org/WAI/WCAG21/quickref/
- SOLID Principles: https://en.wikipedia.org/wiki/SOLID
- 12-Factor App: https://12factor.net/

### Examples

**Well-Researched Plan:**

- Includes version numbers, alternatives considered, real-world examples
- Documents integration patterns and known limitations
- Defines test strategy with coverage targets
- References authoritative sources

**Poorly-Researched Plan:**

- Generic technology overviews without version details
- No comparison with alternatives
- Missing real-world usage examples
- No test strategy defined
- Vague or missing research sources

### Quality Gates Troubleshooting

**Common Issues:**

**Pre-commit hook fails:**

1. Check error message for specific failure
2. Run command manually to see detailed output
3. Fix issues or use `--no-verify` (with documented justification)
4. Follow up with cleanup commit

**Coverage below threshold:**

1. Run `npm test -- --coverage` to see detailed report
2. Open `coverage/index.html` to identify uncovered lines
3. Add tests for uncovered code
4. Re-run coverage check

**Tests taking too long:**

1. Check for slow tests (Jest `--detectSlowTests`)
2. Optimize slow tests (reduce I/O, use mocks)
3. Consider splitting into unit/integration suites
4. Use test parallelization

### Coverage Troubleshooting

**Common Coverage Issues:**

**Coverage not generating:**

- Verify `collectCoverageFrom` in jest.config.js
- Check that test files match `testMatch` pattern
- Ensure source files are not excluded

**Coverage below threshold:**

- Identify uncovered lines in HTML report
- Add tests for uncovered branches/conditions
- Verify edge cases are tested
- Check for dead code that should be removed

**Coverage decreasing:**

- Review recent changes for untested code
- Ensure new features include tests
- Check for test file deletions
- Verify coverage configuration hasn't changed

**How to increase coverage effectively:**

- Focus on business logic first
- Test error handling paths
- Cover edge cases and boundary conditions
- Use branch coverage to find untested conditions
- Avoid testing framework code or third-party libraries

---

**Version**: 1.0.0 | **Ratified**: 2025-11-22 | **Last Amended**: 2025-11-22
