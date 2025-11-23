# Technical Debt Remediation Plan

**Created**: 2025-11-22  
**Status**: Active  
**Priority**: High (Constitution Compliance)

## Overview

This document tracks technical debt items that must be addressed to achieve full compliance with the [Project Constitution](.specify/memory/constitution.md).

## Critical Items (Blocks Full Compliance)

### 1. Code Complexity Violations

**Standard**: Maximum cyclomatic complexity of 10 per function (Constitution Section: Code Quality)

**Current ESLint Configuration**: `complexity: ['warn', 10]` (temporary)

- **Rationale**: Set to 'warn' to allow establishment of standards without blocking existing code
- **Goal**: Change to `complexity: ['error', 10]` once all violations are fixed
- **Tracking**: This document tracks all 14+ complexity violations requiring remediation

#### Violations

**Total**: 14 errors (as of 2025-11-22)

| File                                  | Function                    | Current Complexity | Target | Priority | Effort |
| ------------------------------------- | --------------------------- | ------------------ | ------ | -------- | ------ |
| `src/core/llm/GoogleCloudProvider.ts` | `handleAxiosError`          | 26                 | ≤10    | P0       | High   |
| `src/core/llm/GoogleCloudProvider.ts` | `streamResponse`            | 23                 | ≤10    | P0       | High   |
| `src/cli/commands/model.ts`           | `handleModelCommand`        | 22                 | ≤10    | P1       | Medium |
| `src/utils/validators.ts`             | `validateConfiguration`     | 15                 | ≤10    | P1       | Medium |
| `src/cli/commands/chat.ts`            | `streamResponseWithSpinner` | 14                 | ≤10    | P2       | Medium |
| `src/cli/commands/chat.ts`            | `createGoogleCloudProvider` | 14                 | ≤10    | P2       | Medium |
| `src/core/parser/FilePatcher.ts`      | `applyChange`               | 14                 | ≤10    | P2       | Medium |
| `src/core/llm/GeminiProvider.ts`      | `parseStreamChunk`          | 13                 | ≤10    | P2       | Low    |
| `src/core/llm/GoogleCloudProvider.ts` | `constructor`               | 13                 | ≤10    | P3       | Low    |
| `src/core/llm/OllamaProvider.ts`      | `handleError`               | 12                 | ≤10    | P3       | Low    |

**Priority Levels**:

- **P0**: Critical - Core provider logic, blocks quality gates
- **P1**: High - CLI commands and validators, user-facing
- **P2**: Medium - UI and parser logic
- **P3**: Low - Constructors and error handlers

#### Remediation Strategy

**For `handleModelCommand` (complexity 22)**:

```typescript
// Current: Single function with multiple responsibilities
async function handleModelCommand(action, options) {
  // 22 complexity - too many branches
}

// Refactor to:
async function handleModelCommand(action, options) {
  switch (action) {
    case 'list':
      return handleListModels(options);
    case 'set':
      return handleSetModel(options);
    case 'current':
      return handleCurrentModel(options);
    default:
      return handleInvalidAction(action);
  }
}

function handleListModels(options) {
  /* complexity 5 */
}
function handleSetModel(options) {
  /* complexity 6 */
}
function handleCurrentModel(options) {
  /* complexity 4 */
}
```

**For `GoogleCloudProvider.streamResponse` (complexity 23)**:

```typescript
// Extract nested logic into helper methods
// Split error handling into separate functions
// Use early returns to reduce nesting
// Complexity should be reduced to 8-10
```

**For `GoogleCloudProvider.handleAxiosError` (complexity 26)**:

```typescript
// Create error type mapping
// Extract status code handling into separate functions
// Use strategy pattern for different error types
// Complexity should be reduced to 7-9
```

**Timeline**: 1 sprint (2 weeks)  
**Assignee**: TBD  
**Blocked By**: None  
**Blocks**: Full constitution compliance

---

### 2. Test Coverage Below Threshold

**Standard**:

- Global: 75% minimum (80% target)
- Unit tests: 80% minimum
- Integration tests: 70% minimum
- New code: 85% minimum

#### Current Status

| Category    | Current | Minimum | Target | Gap         |
| ----------- | ------- | ------- | ------ | ----------- |
| Global      | ~69%    | 75%     | 80%    | -6% to -11% |
| Unit        | ~77%    | 80%     | 90%    | -3% to -13% |
| Integration | ~70%    | 70%     | 80%    | 0% to -10%  |

#### Test Failures

**GoogleCloudProvider.test.ts** - 5 failures:

1. `should generate response successfully` - Authentication error
2. `should stream response successfully` - Authentication error
3. `should handle connection errors` - Authentication error
4. `should handle rate limit errors` - Wrong error type thrown
5. Test setup issues with gcloud CLI authentication

**Root Cause**: Tests rely on actual `gcloud auth print-access-token` command, which requires authenticated gcloud CLI.

**Remediation Strategy**:

1. Mock the `exec` function that calls gcloud
2. Stub authentication responses
3. Test error handling paths separately
4. Add integration tests for real authentication flow (marked as optional)

#### Coverage Gaps

**Priority Areas**:

1. **Error Handling**: Many error paths not covered
   - Connection timeouts
   - Rate limit handling
   - Invalid API responses
   - Network failures

2. **Edge Cases**: Boundary conditions not tested
   - Empty inputs
   - Maximum size inputs
   - Invalid configurations
   - Null/undefined handling

3. **Provider Implementations**:
   - GoogleCloudProvider: 65% coverage (target: 95%)
   - OpenAIProvider: 82% coverage (target: 95%)
   - OllamaProvider: 85% coverage (target: 95%)
   - GeminiProvider: 88% coverage (target: 95%)

**Remediation Strategy**:

```typescript
// Example: Add tests for error paths
describe('error handling', () => {
  it('should handle connection timeout', async () => {
    // Mock timeout scenario
    jest.useFakeTimers();
    const promise = provider.generateResponse(/*...*/);
    jest.advanceTimersByTime(5000);
    await expect(promise).rejects.toThrow(ConnectionError);
  });

  it('should handle rate limit with retry-after', async () => {
    // Mock 429 response with Retry-After header
    mockAxios.onPost().reply(429, {}, { 'Retry-After': '60' });
    await expect(provider.generateResponse(/*...*/)).rejects.toThrow(RateLimitError);
  });

  it('should handle empty response body', async () => {
    mockAxios.onPost().reply(200, null);
    await expect(provider.generateResponse(/*...*/)).rejects.toThrow(InvalidResponseError);
  });
});
```

**Timeline**: 2 sprints (4 weeks)  
**Assignee**: TBD  
**Blocked By**: Need to fix test failures first  
**Blocks**: Full constitution compliance

---

### 3. Nesting Depth Violations

**Standard**: Maximum nesting depth of 4 levels (Constitution Section: Code Quality)

#### Violations

| File                                  | Location | Current Depth | Target | Effort |
| ------------------------------------- | -------- | ------------- | ------ | ------ |
| `src/core/llm/GoogleCloudProvider.ts` | Line 229 | 5             | ≤4     | Low    |
| `src/core/llm/GoogleCloudProvider.ts` | Line 236 | 6             | ≤4     | Medium |
| `src/core/llm/GoogleCloudProvider.ts` | Line 238 | 7             | ≤4     | Medium |
| `src/core/llm/GoogleCloudProvider.ts` | Line 247 | 7             | ≤4     | Medium |

#### Remediation Strategy

**Use early returns and guard clauses**:

```typescript
// Before (depth 6)
if (condition1) {
  if (condition2) {
    if (condition3) {
      if (condition4) {
        if (condition5) {
          if (condition6) {
            // code
          }
        }
      }
    }
  }
}

// After (depth 2)
if (!condition1) return;
if (!condition2) return;
if (!condition3) return;

const result = processCondition4And5();
if (result) {
  handleCondition6();
}
```

**Extract nested logic into functions**:

```typescript
// Before
function processStream() {
  for (...) {
    if (...) {
      while (...) {
        if (...) {
          if (...) {
            // deeply nested
          }
        }
      }
    }
  }
}

// After
function processStream() {
  for (...) {
    if (...) {
      processStreamChunk(chunk);
    }
  }
}

function processStreamChunk(chunk) {
  while (...) {
    if (shouldProcess(chunk)) {
      handleChunkData(chunk);
    }
  }
}
```

**Timeline**: 1 sprint (2 weeks)  
**Assignee**: TBD  
**Blocked By**: Should be done with complexity refactoring  
**Blocks**: Full ESLint compliance

---

## High Priority Items

### 4. Function Length Violations

**Standard**: Warning at 100 lines per function (soft limit)

#### Violations

| File                                  | Function         | Lines | Target | Effort |
| ------------------------------------- | ---------------- | ----- | ------ | ------ |
| `src/core/llm/GoogleCloudProvider.ts` | `streamResponse` | 102   | ≤100   | Low    |

**Remediation**: Extract chunk processing logic into separate method.

**Timeline**: 1 sprint  
**Assignee**: TBD

---

### 5. Missing Documentation

**Standard**: JSDoc/TSDoc for all public APIs (Constitution Section: Documentation)

#### Gaps

- [ ] `IModelProvider` interface methods need comprehensive JSDoc
- [ ] `ContextManager` public methods need examples
- [ ] Error classes need usage documentation
- [ ] Configuration options need detailed descriptions

**Remediation**: Add JSDoc comments with examples for all public APIs.

**Timeline**: 1 sprint  
**Assignee**: TBD

---

## Medium Priority Items

### 6. Performance Optimization

**Standard**: Test suite should complete in <5 minutes

**Current Performance**:

- Unit tests: ~9 seconds ✅
- Integration tests: ~15 seconds ✅
- E2E tests: ~30 seconds ✅
- Total: ~54 seconds ✅

**Status**: Meeting requirements, but some individual tests are slow (>1 second).

**Optimization Opportunities**:

- Mock external dependencies in unit tests
- Reduce test data size
- Parallelize test execution
- Use test-specific timeout values

**Timeline**: 2 sprints (continuous improvement)  
**Assignee**: TBD

---

### 7. Security Hardening

**Current State**:

- ✅ Secret detection configured
- ✅ Dependency scanning configured
- ⚠️ Need 100% coverage for security-critical code

**Gaps**:

- [ ] Authentication code needs 100% coverage
- [ ] Input validation needs comprehensive tests
- [ ] Error messages should not leak sensitive info

**Timeline**: 2 sprints  
**Assignee**: TBD

---

## Low Priority Items

### 8. Code Duplication

**Standard**: Maximum 3% code duplication

**Current**: Need to run SonarQube analysis to measure.

**Timeline**: 3 sprints  
**Assignee**: TBD

---

### 9. Visual Regression Testing

**Standard**: Visual regression tests for UI changes (Constitution Section: UX Consistency)

**Status**: CLI-only application, less critical.

**Potential Tools**: Terminal snapshot testing with Jest.

**Timeline**: Future enhancement  
**Assignee**: TBD

---

## Tracking and Monitoring

### Weekly Metrics

Track these metrics weekly:

- [ ] Global test coverage percentage
- [ ] Number of functions with complexity >10
- [ ] Number of nesting depth violations
- [ ] Test suite execution time
- [ ] Number of linting warnings/errors

### Monthly Reviews

Review progress monthly:

- [ ] Coverage trend analysis
- [ ] Technical debt reduction progress
- [ ] New technical debt introduced
- [ ] Constitution compliance score

### Tooling

**Automated Monitoring**:

- SonarQube (when configured): Quality gates dashboard
- Codecov/Coveralls (when configured): Coverage trends
- GitHub Actions: Build status and test results

**Manual Checks**:

```bash
# Check complexity violations
npm run lint | grep "complexity"

# Check coverage
npm test -- --coverage

# Check nesting depth
npm run lint | grep "max-depth"
```

---

## Success Criteria

### Definition of "Compliant"

Project is considered fully compliant with the constitution when:

✅ **Code Quality**:

- [ ] All functions have complexity ≤10
- [ ] All code has nesting depth ≤4
- [ ] Code duplication <3%
- [ ] Zero linting errors

✅ **Test Coverage**:

- [ ] Global coverage ≥75% (target: 80%)
- [ ] Unit test coverage ≥80%
- [ ] Integration test coverage ≥70%
- [ ] Critical paths have 100% coverage
- [ ] All tests passing

✅ **Documentation**:

- [ ] All public APIs documented
- [ ] Architecture decisions recorded
- [ ] README is up-to-date
- [ ] Contributing guide exists

✅ **Quality Gates**:

- [ ] Pre-commit hooks enforced
- [ ] Pre-push hooks enforced
- [ ] CI pipeline passing
- [ ] Security scans passing

---

## Implementation Plan

### Sprint 1 (Weeks 1-2)

**Focus**: Fix test failures and critical complexity violations

- [x] Fix 5 GoogleCloudProvider test failures ✅ **COMPLETED** (2025-11-22) - All 11 tests passing
- [x] Refactor `handleModelCommand` (complexity 22 → ≤10) ✅ **COMPLETED** (2025-11-22) - Complexity reduced to ~5-6
- [x] Increase global coverage to 72% ✅ **COMPLETED** (2025-11-22) - Coverage now at 81.79%

### Sprint 2 (Weeks 3-4)

**Focus**: Refactor GoogleCloudProvider and increase coverage

- [ ] Refactor `GoogleCloudProvider.streamResponse` (complexity 23 → ≤10)
- [ ] Refactor `GoogleCloudProvider.handleAxiosError` (complexity 26 → ≤10)
- [ ] Fix nesting depth violations
- [ ] Increase global coverage to 75%

### Sprint 3 (Weeks 5-6)

**Focus**: Achieve 80% coverage target

- [ ] Add tests for error handling paths
- [ ] Add tests for edge cases
- [ ] Add tests for provider implementations
- [ ] Increase global coverage to 80%

### Sprint 4 (Weeks 7-8)

**Focus**: Polish and documentation

- [ ] Add JSDoc to all public APIs
- [ ] Update documentation
- [ ] Run SonarQube analysis
- [ ] Address remaining items

---

## Notes

### Lessons Learned

**From this assessment**:

1. Establishing standards is easier than achieving compliance
2. Test failures can cascade and affect coverage measurements
3. Authentication mocking is critical for provider tests
4. Complexity violations often correlate with nesting depth violations

**Best Practices for Future**:

1. Write tests before implementation (TDD)
2. Keep functions small and focused
3. Use early returns to reduce nesting
4. Mock external dependencies in tests
5. Monitor metrics continuously

### References

- [Project Constitution](.specify/memory/constitution.md)
- [Quality Gates Configuration](../.quality-gates.yml)
- [Contributing Guide](../CONTRIBUTING.md)
- [Compliance Report](./constitution-compliance.md)

---

**Last Updated**: 2025-11-22  
**Next Review**: 2025-12-06 (2 weeks)
