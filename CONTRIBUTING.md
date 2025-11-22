# Contributing to Zulu Pilot

Thank you for your interest in contributing to Zulu Pilot! This document provides guidelines and standards for contributing to the project.

## 📜 Project Constitution

**All contributions must comply with the [Project Constitution](.specify/memory/constitution.md).**

The constitution defines our non-negotiable principles for:

- Code quality standards
- Testing and coverage requirements
- Development workflows
- Automated quality gates

**Please read the constitution before making your first contribution.**

## 🚀 Quick Start

### 1. Set Up Development Environment

```bash
# Clone the repository
git clone https://github.com/yunaamelia/Zulu-pilot.git
cd Zulu-pilot

# Install dependencies (automatically installs Git hooks)
npm install

# Verify setup
npm run type-check && npm run lint && npm test
```

### 2. Development Workflow (TDD - Test-Driven Development)

**We follow Test-Driven Development (TDD) for all new features:**

```
1. 🔴 RED: Write a failing test that defines the desired behavior
2. 🟢 GREEN: Write minimum code to make the test pass
3. 🔵 REFACTOR: Improve code while keeping tests green
4. 📊 VERIFY: Check coverage meets requirements (≥80%)
5. ✅ COMMIT: Commit with quality gates passing
```

### 3. Make Your Changes

```bash
# Create a feature branch
git checkout -b feat/your-feature-name

# Write tests first (TDD)
# Create test file: tests/unit/path/YourFeature.test.ts
npm test -- --watch

# Implement feature
# Create source file: src/path/YourFeature.ts

# Verify coverage
npm test -- --coverage

# Lint and format
npm run lint:fix
npm run format

# Verify all checks pass
npm run type-check && npm run lint && npm test
```

### 4. Commit Your Changes

Commits must follow [Conventional Commits](https://www.conventionalcommits.org/) format:

```bash
# Format: <type>(<scope>): <subject>
git commit -m "feat(cli): add streaming response support"
git commit -m "fix(provider): handle connection timeout errors"
git commit -m "test(coverage): increase coverage to 85%"
```

**Valid types**: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`, `ci`

**Pre-commit checks will run automatically** and enforce:

- ✅ Code formatting (Prettier)
- ✅ Linting (ESLint)
- ✅ Type checking (TypeScript)
- ✅ Unit tests with coverage
- ✅ Security scans
- ✅ Commit message format

### 5. Push and Create Pull Request

```bash
# Push your changes (pre-push hooks will run)
git push origin feat/your-feature-name

# Create a pull request on GitHub
```

## 📊 Quality Standards (MANDATORY)

### Code Coverage

- **Overall**: ≥75% (target: 85%)
- **Unit tests**: ≥80% (target: 90%)
- **Integration tests**: ≥70% (target: 80%)
- **New code**: ≥85% (target: 95%)
- **Critical paths**: 100% (authentication, security, public APIs)

### Code Quality

- **Cyclomatic Complexity**: ≤10 per function (ENFORCED)
- **Nesting Depth**: ≤4 levels (ENFORCED)
- **Code Duplication**: ≤3%
- **Maintainability**: B rating minimum

### Test Performance

- **Unit tests**: <5 seconds
- **Integration tests**: <30 seconds
- **E2E tests**: <5 minutes
- **Pre-commit tests**: <60 seconds

## 🧪 Testing Guidelines

### Test Structure

```typescript
// tests/unit/services/UserService.test.ts
import { UserService } from '../../../src/services/UserService';

describe('UserService', () => {
  let service: UserService;

  beforeEach(() => {
    service = new UserService();
  });

  describe('createUser()', () => {
    it('should create user with valid data', () => {
      // Arrange
      const userData = { email: 'test@example.com', name: 'Test' };

      // Act
      const result = service.createUser(userData);

      // Assert
      expect(result).toBeDefined();
      expect(result.email).toBe(userData.email);
    });

    it('should throw error for invalid email', () => {
      // Arrange
      const userData = { email: 'invalid', name: 'Test' };

      // Act & Assert
      expect(() => service.createUser(userData)).toThrow('Invalid email');
    });

    it('should handle edge case: empty name', () => {
      // Test edge cases
    });
  });
});
```

### Coverage Tips

1. **Branch Coverage**: Test all if/else paths
2. **Error Paths**: Test all error handling
3. **Edge Cases**: Test boundary conditions
4. **Null/Undefined**: Test null and undefined inputs
5. **Integration**: Test component interactions

### Running Tests

```bash
# Run all tests
npm test

# Run tests with coverage
npm test -- --coverage

# Run tests in watch mode
npm test -- --watch

# Run specific test file
npm test -- UserService.test.ts

# View coverage report
open coverage/index.html
```

## 🔒 Security Guidelines

- **Never commit secrets** (API keys, passwords, tokens)
- **Use environment variables** for sensitive configuration
- **Scan dependencies** for vulnerabilities
- **100% coverage required** for authentication and security code
- **Follow OWASP Top 10** best practices

## 📝 Documentation Standards

### Code Documentation

- **JSDoc/TSDoc** for all public APIs
- **Architecture Decision Records (ADR)** for significant changes
- **README updates** when public interface changes
- **CHANGELOG entries** for user-facing changes

### Example

````typescript
/**
 * Creates a new user with the provided data.
 *
 * @param userData - The user data including email and name
 * @returns The created user object with generated ID
 * @throws {ValidationError} If email format is invalid
 * @throws {DuplicateError} If email already exists
 *
 * @example
 * ```typescript
 * const user = await userService.createUser({
 *   email: 'test@example.com',
 *   name: 'Test User'
 * });
 * ```
 */
async createUser(userData: UserData): Promise<User> {
  // Implementation
}
````

## 🔄 Pull Request Process

### PR Checklist

Before submitting a pull request, verify:

- [ ] All tests pass with required coverage
- [ ] No linting errors or warnings
- [ ] Type checking passes
- [ ] Code follows style guide
- [ ] Documentation is updated
- [ ] CHANGELOG entry added (if user-facing change)
- [ ] Commit messages follow conventional commits
- [ ] PR description explains the change
- [ ] Tests cover edge cases

### PR Template

```markdown
## Description

Brief description of what this PR does

## Type of Change

- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing

- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] E2E tests added/updated
- [ ] Coverage meets requirements (≥85% for new code)

## Checklist

- [ ] Code follows project style guide
- [ ] Tests are passing
- [ ] Documentation updated
- [ ] CHANGELOG updated
- [ ] No breaking changes (or documented)
```

## ⚠️ Common Issues and Solutions

### Issue: Pre-commit hook fails

**Solution**: Fix the issues reported by the hook. Common causes:

- Linting errors: Run `npm run lint:fix`
- Test failures: Fix tests or add missing tests
- Coverage below threshold: Add more tests
- Type errors: Fix TypeScript errors

### Issue: Complexity too high

**Error**: "Function has a complexity of X. Maximum allowed is 10"

**Solution**: Refactor into smaller functions

```typescript
// Instead of one complex function
function processUser(user) {
  // 15 lines of complex logic
}

// Split into smaller functions
function processUser(user) {
  validateUser(user);
  enrichUserData(user);
  saveUser(user);
}
```

### Issue: Coverage dropped

**Solution**: Add tests to increase coverage

```bash
# Check which lines are uncovered
npm test -- --coverage
open coverage/index.html

# Add tests for uncovered lines
# Focus on error paths and edge cases
```

### Issue: Tests too slow

**Solution**: Optimize slow tests

```bash
# Identify slow tests
npm test -- --detectSlowTests

# Optimize by:
# - Using mocks instead of real dependencies
# - Reducing test data size
# - Splitting into unit/integration suites
```

## 🚫 What NOT to Do

❌ **Don't bypass quality gates** without justification  
❌ **Don't commit without tests**  
❌ **Don't decrease coverage**  
❌ **Don't commit secrets or sensitive data**  
❌ **Don't use `any` type without good reason**  
❌ **Don't skip TDD workflow**  
❌ **Don't ignore linting errors**  
❌ **Don't create functions with complexity >10**

## 🆘 Emergency Bypass

In rare cases (production incidents, reverts), you can bypass quality gates:

```bash
git commit --no-verify -m "fix: emergency hotfix [BYPASS: ticket #123]"
```

**Requirements**:

- Document reason in commit message
- Create tracking ticket
- Follow up with compliant fix within 24 hours
- Technical lead approval required

## 📚 Additional Resources

- [Project Constitution](.specify/memory/constitution.md) - Complete governance document
- [Quality Gates Reference](docs/quality-gates-quick-reference.md) - Quick command reference
- [Configuration Guide](docs/configuration-guide.md) - Setup and configuration
- [Compliance Report](docs/constitution-compliance.md) - Current compliance status
- [Quality Gates Config](.quality-gates.yml) - Automated checks configuration

### External Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [ESLint Rules](https://eslint.org/docs/latest/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [TDD Guide](https://martinfowler.com/bliki/TestDrivenDevelopment.html)

## 🤝 Code of Conduct

### Our Standards

- **Be respectful** and inclusive
- **Be constructive** in code reviews
- **Focus on the code**, not the person
- **Assume good intentions**
- **Ask questions** when unclear
- **Share knowledge** generously

### Code Review Guidelines

When reviewing code:

- ✅ Verify compliance with constitution
- ✅ Check test coverage and quality
- ✅ Look for security vulnerabilities
- ✅ Suggest improvements constructively
- ✅ Approve when standards are met

When receiving reviews:

- ✅ Be open to feedback
- ✅ Ask for clarification when needed
- ✅ Make requested changes promptly
- ✅ Explain your reasoning when disagreeing
- ✅ Thank reviewers for their time

## 📞 Getting Help

### Questions About:

- **Standards**: Read the [Constitution](.specify/memory/constitution.md)
- **Setup**: See [Configuration Guide](docs/configuration-guide.md)
- **Commands**: See [Quick Reference](docs/quality-gates-quick-reference.md)
- **Coverage**: Open an issue or ask the team

### Found a Bug?

1. Check if it's already reported in [Issues](https://github.com/yunaamelia/Zulu-pilot/issues)
2. Create a new issue with:
   - Clear description
   - Steps to reproduce
   - Expected vs actual behavior
   - Environment details

### Need a Feature?

1. Check if it's already requested
2. Create a feature request issue
3. Explain the use case and benefits
4. Consider contributing the implementation!

## 🎯 Contribution Ideas

Looking for ways to contribute? Try:

- 🐛 Fix open issues
- 📚 Improve documentation
- 🧪 Add missing tests
- ⚡ Optimize performance
- 🔒 Enhance security
- 🎨 Improve UX
- 📊 Increase test coverage

---

**Thank you for contributing to Zulu Pilot!** 🙏

Your contributions help make this project better for everyone. We appreciate your time and effort in maintaining our high standards of quality.

**Happy coding!** 🚀
