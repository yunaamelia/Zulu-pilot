<!--
Sync Impact Report:
- Version change: [none] → 1.0.0 (initial constitution)
- Modified principles: N/A (new document)
- Added sections:
  - Core Principles: Code Quality, Testing & Coverage, User Experience Consistency, Pre-Commit Requirements, Performance Requirements
  - Development Workflow: Pre-Commit Gates, Code Review Standards, Quality Gates
  - Governance: Amendment Procedure, Versioning Policy, Compliance Review
- Removed sections: N/A
- Templates requiring updates:
  - ✅ .specify/templates/plan-template.md (Constitution Check section exists, will reference new principles)
  - ✅ .specify/templates/spec-template.md (no changes needed - already supports testing requirements)
  - ✅ .specify/templates/tasks-template.md (no changes needed - already supports test tasks)
- Follow-up TODOs: None
-->

# Zulu Pilot Constitution

## Core Principles

### I. Code Quality (NON-NEGOTIABLE)

All code MUST adhere to established quality standards before merge. Code quality is
enforced through automated tooling and manual review.

**Requirements:**

- All code MUST pass static analysis checks (linters, type checkers, code quality
  scanners) with zero blocking issues
- Code MUST follow project-specific style guides and formatting standards
- Code complexity MUST be justified; cyclomatic complexity exceeding thresholds
  requires explicit documentation of rationale
- Code smells, technical debt, and maintainability issues MUST be addressed or
  documented with remediation plans
- All public APIs, classes, and functions MUST have clear documentation
- Code MUST be reviewed by at least one peer before merge

**Rationale:** High code quality reduces bugs, improves maintainability, and
accelerates development velocity. Automated enforcement ensures consistency and
catches issues early.

### II. Testing & Coverage Standards (NON-NEGOTIABLE)

All code changes MUST be accompanied by appropriate tests with measurable coverage
targets. Testing is a first-class requirement, not an afterthought.

**Requirements:**

- All new code MUST have corresponding tests (unit, integration, or contract tests
  as appropriate)
- Overall code coverage MUST maintain a minimum of 80% for the entire codebase
- New code contributions MUST achieve at least 85% coverage for the changed modules
- Critical paths (authentication, payment processing, data validation) MUST achieve
  95%+ coverage
- Coverage reports MUST be generated and reviewed as part of the pre-commit process
- Tests MUST be fast, reliable, and independent (no test interdependencies)
- Test failures MUST block commits and merges
- Flaky tests MUST be fixed or removed immediately

**Coverage Measurement:**

- Line coverage: minimum 80% overall, 85% for new code
- Branch coverage: minimum 75% overall, 80% for new code
- Function coverage: minimum 80% overall, 85% for new code
- Coverage reports MUST be generated in multiple formats (terminal, HTML, XML)
  for different use cases

**Rationale:** Comprehensive testing prevents regressions, enables confident
refactoring, and serves as living documentation. Coverage standards ensure
meaningful test coverage across the codebase.

### III. User Experience Consistency

User-facing features MUST provide consistent, predictable experiences across all
interfaces and touchpoints.

**Requirements:**

- UI/UX patterns MUST follow established design systems and style guides
- User-facing text MUST be clear, consistent, and free of technical jargon
- Error messages MUST be user-friendly, actionable, and consistent in tone
- Loading states, error states, and empty states MUST be handled consistently
- Accessibility standards (WCAG 2.1 Level AA minimum) MUST be met for all
  user-facing features
- Responsive design MUST be maintained across supported device sizes
- User workflows MUST be intuitive and follow established patterns
- Breaking changes to user-facing APIs MUST be versioned and documented

**Rationale:** Consistent user experience reduces cognitive load, improves
usability, and builds user trust. Consistency is a competitive advantage.

### IV. Pre-Commit Requirements (NON-NEGOTIABLE)

All commits MUST pass automated quality gates before being accepted. Pre-commit
hooks enforce standards automatically and prevent substandard code from entering
the repository.

**Required Pre-Commit Checks:**

- **Code Quality**: Linting, formatting, static analysis, type checking
- **Testing**: All tests MUST pass; coverage thresholds MUST be met
- **Security**: Secret detection, dependency vulnerability scanning, security
  linting
- **Formatting**: Code formatting (auto-fixable issues MUST be auto-fixed)
- **Documentation**: Required documentation present and valid
- **Build**: Project MUST build successfully
- **Commit Message**: Commit messages MUST follow conventional commit format

**Pre-Commit Hook Configuration:**

- Hooks MUST run on `pre-commit` and `pre-push` stages
- Hooks MUST be fast (<30 seconds for typical changes)
- Hooks MUST provide clear, actionable error messages
- Failed hooks MUST block the commit/push
- Hooks MUST be version-controlled and reproducible across environments

**Exemptions:**

- Emergency hotfixes may bypass pre-commit with explicit approval (post-commit
  validation still required)
- All exemptions MUST be documented and remediated within 24 hours

**Rationale:** Pre-commit enforcement prevents technical debt accumulation,
reduces review burden, and maintains code quality standards automatically.

### V. Performance Requirements

All features MUST meet defined performance criteria. Performance is a feature, not
an optimization to be deferred.

**Requirements:**

- API endpoints MUST respond within defined SLA thresholds (e.g., p95 < 200ms for
  standard operations)
- Database queries MUST be optimized; N+1 queries and missing indexes are
  blocking issues
- Frontend pages MUST achieve Core Web Vitals thresholds (LCP < 2.5s, FID < 100ms,
  CLS < 0.1)
- Background jobs MUST complete within defined time windows
- Resource usage (memory, CPU, disk) MUST remain within acceptable bounds
- Performance regressions MUST be identified and addressed before merge
- Performance tests MUST be included for critical paths

**Performance Monitoring:**

- Performance metrics MUST be tracked and monitored in production
- Performance budgets MUST be defined and enforced
- Performance regressions detected in production MUST be prioritized for
  remediation

**Rationale:** Performance directly impacts user experience and system scalability.
Proactive performance requirements prevent costly retrofitting.

## Development Workflow

### Pre-Commit Gates

All code changes MUST pass the following gates before commit:

1. Code quality checks (linting, formatting, static analysis)
2. All tests passing with coverage thresholds met
3. Security scans (secrets, vulnerabilities)
4. Build success
5. Documentation validation

### Code Review Standards

- All code MUST be reviewed by at least one peer
- Reviewers MUST verify compliance with constitution principles
- Reviews MUST check: code quality, test coverage, performance implications,
  security considerations, user experience consistency
- Reviews MUST be completed within 48 hours (or escalated)
- Approval requires explicit confirmation of constitution compliance

### Quality Gates

The following quality gates MUST pass before merge:

- All pre-commit checks passing
- Code review approval with constitution compliance verified
- CI/CD pipeline passing (includes extended test suites, integration tests)
- Coverage reports meeting thresholds
- Performance benchmarks within acceptable ranges
- Security scans passing

## Governance

### Amendment Procedure

This constitution supersedes all other development practices and guidelines.
Amendments to this constitution require:

1. **Proposal**: Document the proposed change with rationale, impact analysis,
   and migration plan
2. **Review**: Technical lead and at least two team members review the proposal
3. **Approval**: Consensus or majority approval from the development team
4. **Implementation**: Update constitution, propagate changes to dependent
   templates and documentation
5. **Communication**: Announce changes to the team and update onboarding materials

### Versioning Policy

Constitution versions follow semantic versioning (MAJOR.MINOR.PATCH):

- **MAJOR**: Backward incompatible changes (principle removals, redefinitions
  that break existing practices)
- **MINOR**: New principles added, existing principles materially expanded
- **PATCH**: Clarifications, wording improvements, typo fixes, non-semantic
  refinements

### Compliance Review

- All pull requests MUST include a constitution compliance checklist
- Quarterly reviews MUST assess adherence to principles and identify improvement
  opportunities
- Violations MUST be documented with remediation plans
- Constitution compliance is a factor in code review approval

### Technical Decision Guidance

When making technical decisions, this constitution MUST be consulted:

- **Architecture decisions**: Evaluate against performance, code quality, and
  testing principles
- **Technology choices**: Consider impact on code quality tooling, testing
  frameworks, and pre-commit integration
- **Feature implementation**: Ensure user experience consistency and performance
  requirements are met
- **Process changes**: Verify alignment with pre-commit and quality gate
  requirements

All technical decisions that conflict with constitution principles MUST be
explicitly justified and documented, with a plan to align with principles over
time.

**Version**: 1.0.0 | **Ratified**: 2025-01-27 | **Last Amended**: 2025-01-27
