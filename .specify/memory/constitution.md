<!--
Sync Impact Report:
Version: 1.0.0 (initial creation)
Modified Principles: N/A (new constitution)
Added Sections:
  - I. Code Quality (NON-NEGOTIABLE)
  - II. Testing with Coverage Standards (NON-NEGOTIABLE)
  - III. User Experience Consistency
  - IV. Pre-commit Quality Gates (NON-NEGOTIABLE)
  - V. Performance Requirements
  - Development Workflow
  - Governance
Templates requiring updates:
  ✅ plan-template.md - Constitution Check section updated
  ✅ spec-template.md - Testing requirements aligned
  ✅ tasks-template.md - Testing tasks aligned
Follow-up TODOs: None
-->

# Zulu Pilot Constitution

## Core Principles

### I. Code Quality (NON-NEGOTIABLE)

All code MUST adhere to strict quality standards enforced through automated tooling and code review processes. Code quality is not negotiable and must be maintained at all times.

**Requirements:**

- **Linting**: All code MUST pass ESLint (or language-equivalent linter) with zero errors. Warnings MUST be addressed or explicitly justified in code comments.
- **Formatting**: Code MUST be automatically formatted using project-standard formatters (e.g., Prettier, Black, gofmt) with consistent style enforced across the codebase.
- **Type Safety**: TypeScript projects MUST have strict type checking enabled with zero type errors. Dynamically typed languages MUST use type hints/annotations where supported (e.g., Python type hints, JSDoc with @type).
- **Code Review**: All code changes MUST be reviewed by at least one other developer before merging. Reviewers MUST verify code quality standards are met.
- **Complexity**: Cyclomatic complexity MUST be kept below 15 per function/method. Functions exceeding this limit MUST be refactored or justified with documentation explaining why complexity is necessary.
- **Documentation**: Public APIs, complex algorithms, and non-obvious business logic MUST include clear documentation explaining purpose, parameters, return values, and edge cases.

**Rationale**: High code quality reduces bugs, improves maintainability, enables faster onboarding, and reduces technical debt. Automated enforcement ensures consistency and prevents quality degradation over time.

### II. Testing with Coverage Standards (NON-NEGOTIABLE)

Comprehensive testing with mandatory coverage thresholds is required for all production code. Tests MUST be written before or alongside implementation (TDD preferred).

**Requirements:**

- **Coverage Thresholds**:
  - Global minimum: 80% line coverage, 80% branch coverage, 80% function coverage
  - Critical paths (authentication, payment processing, data validation): 95% coverage minimum
  - New code: 90% coverage minimum (enforced via pre-commit hooks)
- **Test Types**: Projects MUST include:
  - Unit tests for all business logic and utilities
  - Integration tests for API endpoints, database interactions, and service integrations
  - Contract tests for external API dependencies
  - End-to-end tests for critical user journeys (minimum: P1 user stories)
- **Test Quality**: Tests MUST be:
  - Independent and isolated (no shared state between tests)
  - Fast (unit tests < 100ms each, integration tests < 5s each)
  - Deterministic (same input always produces same output)
  - Well-named (describe what is being tested and expected outcome)
- **Coverage Reporting**: Coverage reports MUST be generated on every test run and included in CI/CD pipelines. Coverage MUST NOT decrease below thresholds.

**Rationale**: High test coverage catches regressions early, enables confident refactoring, documents expected behavior, and reduces production bugs. Coverage thresholds ensure critical code paths are thoroughly tested.

### III. User Experience Consistency

User interfaces MUST maintain visual and behavioral consistency across all features and platforms. Consistency improves usability, reduces cognitive load, and builds user trust.

**Requirements:**

- **Design System**: Projects with user interfaces MUST use a design system or component library. Custom components MUST follow established design tokens (colors, typography, spacing, shadows).
- **Component Reuse**: Existing UI components MUST be reused when possible. New components MUST be added to the design system if reusable.
- **Accessibility**: All user interfaces MUST meet WCAG 2.1 Level AA standards minimum:
  - Keyboard navigation support
  - Screen reader compatibility
  - Color contrast ratios (4.5:1 for normal text, 3:1 for large text)
  - Focus indicators visible
  - Form labels and error messages
- **Responsive Design**: Interfaces MUST be responsive and tested across target device sizes. Mobile-first approach preferred.
- **Error Handling**: User-facing errors MUST be clear, actionable, and consistent in tone. Error messages MUST not expose technical implementation details.
- **Loading States**: All asynchronous operations MUST show appropriate loading indicators. Users MUST receive feedback for operations taking > 500ms.

**Rationale**: Consistent UX reduces user confusion, improves accessibility, speeds up development through component reuse, and creates a cohesive brand experience.

### IV. Pre-commit Quality Gates (NON-NEGOTIABLE)

Pre-commit hooks MUST enforce code quality, testing, and security checks before code can be committed. This prevents low-quality code from entering the repository.

**Required Pre-commit Hooks:**

- **Code Quality**:
  - Linting (ESLint, flake8, golangci-lint, etc.)
  - Formatting checks (Prettier, Black, gofmt, etc.)
  - Type checking (TypeScript, mypy, etc.)
  - Import sorting and organization
- **Testing**:
  - Run affected unit tests (fast tests only, < 30s total)
  - Verify test coverage for changed files meets minimum thresholds
  - Prevent commits if coverage decreases below thresholds
- **Security**:
  - Secret detection (prevent committing API keys, passwords, tokens)
  - Dependency vulnerability scanning
  - SQL injection and XSS pattern detection
- **Documentation**:
  - Verify required documentation exists for new public APIs
  - Check that commit messages follow conventional commit format
- **File Checks**:
  - Trailing whitespace removal
  - End-of-file newline enforcement
  - YAML/JSON validity checks
  - Large file detection (> 1MB warning)

**Configuration**: Pre-commit hooks MUST be configured via `.pre-commit-config.yaml` (or equivalent) and installed automatically via setup scripts. Hooks MUST be fast (< 30s total) to avoid developer friction.

**Rationale**: Pre-commit hooks catch issues before code review, reduce review cycle time, prevent security vulnerabilities, and maintain code quality standards automatically.

### V. Performance Requirements

Applications MUST meet defined performance benchmarks. Performance is a feature, not an optimization to defer.

**Requirements:**

- **Web Applications** (if applicable):
  - Largest Contentful Paint (LCP): < 2.5s (good), < 4.0s (acceptable)
  - First Input Delay (FID) / Interaction to Next Paint (INP): < 100ms (good), < 300ms (acceptable)
  - Cumulative Layout Shift (CLS): < 0.1 (good), < 0.25 (acceptable)
  - Time to First Byte (TTFB): < 800ms (good), < 1.8s (acceptable)
  - First Contentful Paint (FCP): < 1.8s (good), < 3.0s (acceptable)
- **API Endpoints**:
  - P95 response time: < 500ms for standard operations
  - P99 response time: < 1s for standard operations
  - P95 response time: < 2s for complex operations (data processing, reports)
  - Error rate: < 0.1% under normal load
- **Database Queries**:
  - All queries MUST complete in < 100ms under normal load
  - Queries exceeding 100ms MUST be optimized or justified with documentation
  - N+1 query patterns MUST be eliminated
- **Performance Testing**:
  - Performance benchmarks MUST be included in CI/CD pipeline
  - Performance regressions MUST fail the build
  - Load testing MUST be performed before major releases

**Rationale**: Performance directly impacts user experience, conversion rates, and infrastructure costs. Meeting performance targets ensures applications remain responsive and scalable.

## Development Workflow

### Code Review Process

1. **Pull Request Requirements**:

   - All PRs MUST pass all pre-commit hooks
   - All PRs MUST have passing CI/CD checks (tests, linting, coverage, security scans)
   - PRs MUST include tests for new functionality
   - PRs MUST not decrease test coverage below thresholds
   - PRs MUST be reviewed by at least one other developer
   - PRs MUST be approved before merging (no self-approvals)

2. **Review Checklist**:
   - Code quality standards met (linting, formatting, types)
   - Tests are comprehensive and pass
   - Coverage thresholds maintained
   - Performance impact considered
   - Security implications reviewed
   - Documentation updated if needed
   - UX consistency maintained (if applicable)

### Testing Workflow

1. **Test-First Development**: Write tests before implementation when possible (TDD). At minimum, tests MUST be written alongside implementation.
2. **Test Execution**:
   - Run tests locally before committing
   - All tests MUST pass in CI/CD before merge
   - Coverage reports MUST be reviewed in PRs
3. **Test Maintenance**: Tests MUST be updated when functionality changes. Broken tests MUST be fixed immediately.

### Performance Monitoring

1. **Metrics Collection**: Applications MUST collect and report performance metrics (Web Vitals for web, response times for APIs).
2. **Alerting**: Performance degradation beyond acceptable thresholds MUST trigger alerts.
3. **Optimization**: Performance issues identified in production MUST be prioritized and addressed within one sprint.

## Governance

### Amendment Process

1. **Proposal**: Constitution amendments MUST be proposed via pull request with:
   - Clear rationale for the change
   - Impact analysis on existing code and processes
   - Migration plan if the change affects existing code
2. **Review**: Amendments require review and approval from at least two senior team members or project maintainers.
3. **Documentation**: All amendments MUST be documented in the Sync Impact Report at the top of this file.
4. **Versioning**: Constitution versions follow semantic versioning:
   - **MAJOR**: Backward-incompatible changes (removing principles, changing mandatory requirements)
   - **MINOR**: New principles or sections added, or significant expansions to existing principles
   - **PATCH**: Clarifications, wording improvements, typo fixes, non-semantic refinements

### Compliance and Enforcement

1. **Constitution Supremacy**: This constitution supersedes all other coding standards, style guides, and development practices. When conflicts arise, the constitution takes precedence.
2. **Compliance Verification**:
   - All PRs MUST include a "Constitution Check" section verifying compliance with relevant principles
   - Automated tools (pre-commit, CI/CD) enforce technical requirements
   - Code reviews MUST verify non-automated requirements (documentation, UX consistency)
3. **Exceptions**: Exceptions to constitution principles MUST be:
   - Documented in PR descriptions with clear justification
   - Approved by project maintainers
   - Tracked in a exceptions log for future review
4. **Regular Review**: Constitution compliance MUST be reviewed quarterly. Violations MUST be addressed through refactoring, documentation updates, or constitution amendments.

### Technical Decision Guidance

When making technical decisions, developers MUST consider constitution principles in this order:

1. **Code Quality**: Does this choice maintain or improve code quality? Does it introduce technical debt?
2. **Testing**: Can this be tested effectively? Does it maintain coverage thresholds?
3. **Performance**: Does this meet performance requirements? Will it scale?
4. **UX Consistency**: Does this maintain design system consistency? Is it accessible?
5. **Pre-commit**: Can quality be enforced via pre-commit hooks?

If a decision conflicts with a principle, it MUST be:

- Justified with clear rationale
- Documented in the decision record
- Approved by maintainers
- Considered for constitution amendment if it represents a pattern

### Implementation Guidance

- **New Projects**: All new projects MUST be initialized with pre-commit hooks, test frameworks, and linting configured from day one.
- **Existing Projects**: Existing projects MUST be brought into compliance incrementally:
  - Phase 1: Add pre-commit hooks (1-2 weeks)
  - Phase 2: Increase test coverage to thresholds (ongoing, target: 3 months)
  - Phase 3: Address code quality issues (ongoing, target: 6 months)
  - Phase 4: Implement performance monitoring (1 month)
- **Legacy Code**: Legacy code that doesn't meet standards MUST be:
  - Documented as technical debt
  - Refactored when modified (boy scout rule: leave code better than you found it)
  - Gradually improved over time

**Version**: 1.0.0 | **Ratified**: 2025-01-27 | **Last Amended**: 2025-01-27
