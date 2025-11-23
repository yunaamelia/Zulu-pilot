# Quality Gates Quick Reference

**Print this and keep it handy!** 📋

## Constitution Location

📄 `.specify/memory/constitution.md`

## Quick Commands

```bash
# Run tests with coverage
npm test -- --coverage

# View coverage report
open coverage/index.html

# Run linting
npm run lint

# Auto-fix linting issues
npm run lint:fix

# Format code
npm run format

# Check formatting without changes
npm run format:check

# Type check
npm run type-check

# Build project
npm run build

# Run all checks (pre-push simulation)
npm run type-check && npm run lint && npm test
```

## Pre-Commit Checklist (Runs Automatically)

✅ **Code Formatting** (Prettier)  
✅ **Linting** (ESLint - max complexity 10)  
✅ **Type Checking** (TypeScript strict mode)  
✅ **Unit Tests** (changed files with coverage)  
✅ **Security Scan** (secrets, vulnerabilities)  
✅ **Commit Message** (conventional commits format)

## Pre-Push Checklist (Runs Automatically)

✅ **Full Test Suite** (all tests with coverage)  
✅ **Build Verification** (production build)  
✅ **Coverage Trend Check** (must not decrease)  
✅ **Test Performance** (max 5 minutes)

## Coverage Requirements (MANDATORY)

| Category              | Minimum | Target |
| --------------------- | ------- | ------ |
| **Overall**           | 75%     | 85%    |
| **Unit Tests**        | 80%     | 90%    |
| **Integration Tests** | 70%     | 80%    |
| **New Code**          | 85%     | 95%    |
| **Critical Paths**    | 100%    | 100%   |

### Critical Paths Requiring 100% Coverage

- Authentication
- Authorization
- Security validation
- Public API endpoints
- Error handling

## Code Quality Standards

### Cyclomatic Complexity

- **Maximum**: 10 per function (ENFORCED)
- **Target**: <7 per function
- **Enforcement**: ESLint error

### Code Duplication

- **Maximum**: 3% duplication
- **Enforcement**: SonarQube

### Nesting Depth

- **Maximum**: 4 levels (ENFORCED)
- **Enforcement**: ESLint error

### File Length

- **Maximum**: 500 lines per file
- **Warning**: 100 lines per function

## TDD Workflow (Red-Green-Refactor)

```
1. 🔴 Write failing test that defines desired behavior
2. 🟢 Implement minimum code to make test pass
3. 🔵 Refactor while keeping tests green
4. 📊 Generate and verify coverage report
5. ✅ Add tests for edge cases until coverage threshold met
```

## Test Naming Convention

```typescript
// Source file
src / services / UserService.ts;

// Test file
tests / unit / services / UserService.test.ts;
// OR
src / services / UserService.test.ts;
```

## Test Performance Budgets

| Test Type            | Maximum Time         |
| -------------------- | -------------------- |
| **Unit Test**        | <5 seconds per test  |
| **Integration Test** | <30 seconds per test |
| **E2E Test**         | <5 minutes per test  |
| **Pre-commit Tests** | <60 seconds total    |

## Commit Message Format (Conventional Commits)

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Valid Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Test changes
- `chore`: Build process, tooling changes
- `ci`: CI/CD configuration changes

### Examples

```bash
# Good
git commit -m "feat(cli): add streaming response support"
git commit -m "fix(provider): handle connection timeout errors"
git commit -m "test(coverage): increase unit test coverage to 85%"

# Bad (will fail)
git commit -m "fixed stuff"  # Too short, wrong format
git commit -m "WIP"          # Not conventional format
```

## Emergency Bypass (USE SPARINGLY!)

```bash
# Only for emergency hotfixes or reverting broken commits
git commit --no-verify -m "fix: emergency hotfix [BYPASS: ticket #123]"

# MUST follow up with cleanup commit within 24 hours!
```

### Allowed Bypass Scenarios

1. ⚠️ Emergency hotfix during production incident
2. ⚠️ Reverting broken commits
3. ⚠️ Time-sensitive security patch

**Note**: All bypasses are logged and flagged for review.

## Coverage Troubleshooting

### Coverage not generating?

1. Check `collectCoverageFrom` in `jest.config.js`
2. Verify test files match `testMatch` pattern
3. Ensure source files are not excluded

### Coverage below threshold?

1. Run `npm test -- --coverage`
2. Open `coverage/index.html`
3. Identify uncovered lines (shown in red)
4. Add tests for uncovered code
5. Focus on:
   - Error handling branches
   - Edge cases
   - Boundary conditions
   - All if/else paths

### Coverage decreasing?

1. Check recent changes for untested code
2. Ensure new features include tests
3. Verify no test files were deleted
4. Check coverage configuration hasn't changed

## Common ESLint Issues

### Complexity too high (> 10)

**Error**: "Function has a complexity of X. Maximum allowed is 10"

**Solution**: Refactor function into smaller functions

```typescript
// Before (complexity 15)
function processUser(user) {
  if (...) {
    if (...) {
      if (...) {
        // Too many nested conditions!
      }
    }
  }
}

// After (complexity 5 each)
function processUser(user) {
  validateUser(user);
  enrichUserData(user);
  saveUser(user);
}

function validateUser(user) { ... }
function enrichUserData(user) { ... }
function saveUser(user) { ... }
```

### Nesting too deep (> 4 levels)

**Error**: "Blocks are nested too deeply (X). Maximum allowed is 4"

**Solution**: Extract nested logic into functions, use early returns

```typescript
// Before (depth 6)
function process() {
  if (a) {
    if (b) {
      if (c) {
        if (d) {
          if (e) {
            if (f) { ... }
          }
        }
      }
    }
  }
}

// After (depth 2)
function process() {
  if (!a) return;
  if (!b) return;
  processC();
}

function processC() {
  if (!c) return;
  if (!d) return;
  processE();
}
```

## Test Structure Template

```typescript
describe('ComponentName', () => {
  // Setup and teardown
  beforeEach(() => {
    // Per-test setup
  });

  afterEach(() => {
    // Per-test cleanup
  });

  // Group by method/function
  describe('methodName()', () => {
    it('should handle valid input', () => {
      // Arrange
      const input = 'valid';

      // Act
      const result = component.methodName(input);

      // Assert
      expect(result).toBe('expected');
    });

    it('should throw error for invalid input', () => {
      // Arrange
      const input = 'invalid';

      // Act & Assert
      expect(() => component.methodName(input)).toThrow();
    });

    it('should handle edge case: empty input', () => {
      // ...
    });
  });
});
```

## Performance Checklist

### CLI Performance

- ⚡ Startup: <500ms
- ⚡ Model connection (local): <2s
- ⚡ Model connection (remote): <5s
- ⚡ First token latency: <1s
- ⚡ File context loading: <100ms per file

### Test Performance

- 🏃 Unit tests: Complete in <5s
- 🏃 Integration tests: Complete in <30s
- 🏃 E2E tests: Complete in <5min
- 🏃 Pre-commit tests: Complete in <60s

## Resources

### Documentation

- 📘 **Constitution**: `.specify/memory/constitution.md`
- 📗 **Compliance Report**: `docs/constitution-compliance.md`
- 📙 **Configuration Guide**: `docs/configuration-guide.md`
- 📕 **Quality Gates Config**: `.quality-gates.yml`

### Configuration Files

- `jest.config.js` - Test and coverage configuration
- `eslint.config.js` - Linting rules
- `.prettierrc.json` - Code formatting rules
- `tsconfig.json` - TypeScript configuration
- `.husky/` - Git hooks
- `.pre-commit-config.yaml` - Pre-commit checks

### External Resources

- Jest: https://jestjs.io/docs/getting-started
- ESLint: https://eslint.org/docs/latest/
- TypeScript: https://www.typescriptlang.org/docs/
- Conventional Commits: https://www.conventionalcommits.org/

## Getting Help

### Question: Can I bypass quality gates?

**Answer**: Only for emergencies (hotfixes, reverts). Use `git commit --no-verify` and document why. Follow up within 24 hours.

### Question: My tests are slow

**Answer**:

1. Check for slow tests: `npm test -- --detectSlowTests`
2. Optimize slow tests (reduce I/O, use mocks)
3. Consider splitting into unit/integration suites

### Question: Coverage dropped below threshold

**Answer**: Coverage gates will block your commit/push. Add tests to increase coverage above threshold before committing.

### Question: Complexity too high

**Answer**: Refactor the complex function into smaller, single-purpose functions. Each function should do one thing well.

### Question: How do I know what to test?

**Answer**:

1. Test all public methods
2. Test all error paths
3. Test all edge cases
4. Test all if/else branches
5. Aim for 100% branch coverage

---

**Remember**: Quality gates exist to help us ship better code faster. They catch issues early when they're cheap to fix! 🚀

**Questions?** Check the constitution at `.specify/memory/constitution.md` or ask the team.
