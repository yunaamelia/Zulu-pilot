# Quality Improvement Tasks for GitHub Agent

## ⚠️ CRITICAL: READ ALL INSTRUCTIONS BEFORE PROCEEDING

This document contains MANDATORY quality improvement tasks that MUST be completed in order.
**DO NOT SKIP ANY STEP**. Each step has verification checkpoints that MUST pass before proceeding.

## Prerequisites Check

Before starting, verify:

1. ✅ You have access to the repository
2. ✅ Node.js and npm are installed and working
3. ✅ You can run `npm test`, `npm run lint`, and `npm run type-check`
4. ✅ All dependencies are installed (`npm ci`)

## Task Execution Order

**IMPORTANT**: Tasks must be completed in this exact order. Each task has a verification checkpoint that MUST pass before moving to the next.

---

## Task 1: Ensure All Packages Meet 90%+ Coverage Threshold

### 📋 Instructions

1. **Run coverage analysis**:

   ```bash
   npm run test:coverage
   ```

2. **Analyze coverage report**:
   - Open `coverage/coverage-summary.json` or check terminal output
   - Identify all packages/directories below 90% coverage
   - Create a list of files that need additional tests

3. **Fix coverage gaps**:
   - For each file below 90% coverage:
     - Review untested code paths
     - Write additional unit tests to cover:
       - Edge cases
       - Error handling paths
       - Boundary conditions
       - All conditional branches
   - Target: **Minimum 90% coverage** for:
     - Lines
     - Statements
     - Functions
     - Branches

4. **Re-run coverage after fixes**:
   ```bash
   npm run test:coverage
   ```

### ✅ Verification Checkpoint 1 - MANDATORY

**YOU CANNOT PROCEED TO TASK 2 UNTIL THIS PASSES:**

```bash
# Run this command and verify output
npm run test:coverage | grep -E "All files|Lines|Statements|Functions|Branches"

# Expected output format:
# All files      | 92.34 | 91.23 | 93.45 | 90.12
#
# REQUIRED: All percentages MUST be >= 90.00
```

**Verification Steps**:

1. Check that **all packages** show coverage >= 90% for:
   - Lines: `>= 90.00`
   - Statements: `>= 90.00`
   - Functions: `>= 90.00`
   - Branches: `>= 90.00`

2. **If ANY package is below 90%**:
   - ❌ **STOP**: You MUST add more tests
   - Document which files/packages are below threshold
   - Write tests until coverage meets 90%+
   - Re-run coverage check
   - Repeat until ALL packages meet 90%+

3. **Only proceed when**:
   - ✅ All packages show 90%+ coverage
   - ✅ Coverage report saved to `coverage/coverage-summary.json`
   - ✅ No critical gaps remain

**If checkpoint fails, DO NOT proceed. Fix coverage issues first.**

---

## Task 2: Run Full Test Suite and Fix Any Failing Tests

### 📋 Instructions

1. **Run complete test suite**:

   ```bash
   npm test
   ```

2. **Identify failing tests**:
   - Review all test failures
   - Categorize failures:
     - **Type/Import errors**: Fix import paths, type definitions
     - **Logic errors**: Fix implementation bugs
     - **Timing/Async issues**: Fix async/await or timeouts
     - **Mock issues**: Fix test mocks and fixtures
     - **Environment issues**: Fix test environment setup

3. **Fix each failing test**:
   - Read error message carefully
   - Understand what the test expects
   - Fix the underlying issue (code or test)
   - Ensure test passes AND makes sense
   - **DO NOT**: Delete tests, skip tests, or use `test.skip()`

4. **Re-run test suite after fixes**:
   ```bash
   npm test
   ```

### ✅ Verification Checkpoint 2 - MANDATORY

**YOU CANNOT PROCEED TO TASK 3 UNTIL THIS PASSES:**

```bash
# Run this command and verify output
npm test 2>&1 | tail -20

# Expected output:
# Test Suites: XX passed, 0 failed, XX total
# Tests:       XXX passed, 0 failed, XXX total
#
# REQUIRED:
# - Test Suites: 0 failed
# - Tests: 0 failed
```

**Verification Steps**:

1. Run `npm test` and wait for completion
2. Check the final summary line:
   - ❌ **If ANY test suites failed**: Fix them before proceeding
   - ❌ **If ANY tests failed**: Fix them before proceeding
   - ✅ **All tests must pass**: 0 failed tests

3. **Review test output for**:
   - Failed assertions
   - Timeout errors
   - Import/module errors
   - Type errors

4. **If ANY failures exist**:
   - ❌ **STOP**: Document all failures
   - Fix each failing test
   - Re-run tests
   - Verify all pass
   - Repeat until 0 failures

5. **Only proceed when**:
   - ✅ All test suites pass
   - ✅ All individual tests pass
   - ✅ No skipped tests (unless documented reason)
   - ✅ Test output shows: `0 failed`

**If checkpoint fails, DO NOT proceed. Fix all test failures first.**

---

## Task 3: Fix All ESLint Warnings and Errors

### 📋 Instructions

1. **Run ESLint**:

   ```bash
   npm run lint
   ```

2. **Analyze ESLint output**:
   - Count total errors
   - Count total warnings
   - Categorize by type:
     - **Errors**: Must be fixed (blocking)
     - **Warnings**: Should be fixed (best practice)
     - **Complexity warnings**: May require refactoring

3. **Fix ESLint issues**:
   - **For errors**: Fix immediately (these block builds)
   - **For warnings**: Fix when possible
   - **For complexity warnings**:
     - Consider refactoring complex functions
     - Break down large functions
     - Extract helper functions
   - Use auto-fix where safe: `npm run lint:fix`
   - Manual fixes for issues that can't be auto-fixed

4. **Re-run ESLint after fixes**:
   ```bash
   npm run lint
   ```

### ✅ Verification Checkpoint 3 - MANDATORY

**YOU CANNOT PROCEED TO TASK 4 UNTIL THIS PASSES:**

```bash
# Run this command and verify output
npm run lint 2>&1 | grep -E "error|warning|✖|✔" | tail -5

# Expected output:
# ✔ No ESLint errors or warnings
# OR
# ✖ X problems (0 errors, Y warnings)
#
# REQUIRED:
# - errors: MUST be 0
# - warnings: SHOULD be 0 (acceptable if < 10 and documented)
```

**Verification Steps**:

1. Run `npm run lint` and wait for completion
2. Check the summary line:
   - ❌ **If ANY errors exist (errors > 0)**: MUST fix all errors
   - ⚠️ **If warnings exist**: Review and fix when possible
   - ✅ **Ideal**: 0 errors, 0 warnings

3. **For each error**:
   - Read the error message
   - Understand the ESLint rule violated
   - Fix the code to comply
   - Verify fix doesn't break functionality

4. **For warnings**:
   - Fix critical warnings (unused vars, console.log, etc.)
   - Document acceptable warnings (complexity, max-lines) if justified
   - Note: Complexity warnings may be acceptable if code is well-structured

5. **Only proceed when**:
   - ✅ All ESLint errors are fixed (0 errors)
   - ✅ Critical warnings are addressed
   - ✅ Remaining warnings are documented if acceptable
   - ✅ Lint output shows: `0 errors` or `✔ No ESLint errors`

**If checkpoint fails (errors > 0), DO NOT proceed. Fix all ESLint errors first.**

---

## Task 4: Ensure All TypeScript Strict Mode Checks Pass

### 📋 Instructions

1. **Run TypeScript type check**:

   ```bash
   npm run type-check
   ```

2. **Analyze TypeScript errors**:
   - Review all type errors
   - Categorize by type:
     - **Missing types**: Add proper type annotations
     - **Type mismatches**: Fix type definitions
     - **Implicit any**: Add explicit types
     - **Module resolution**: Fix import paths
     - **Unused variables**: Remove or prefix with `_`
     - **Property errors**: Fix object property access

3. **Fix TypeScript errors**:
   - Add proper type annotations
   - Fix type mismatches
   - Resolve import/module issues
   - Use `any` only when absolutely necessary (with explanation)
   - Fix `@typescript-eslint/no-explicit-any` violations
   - Remove unused variables or prefix with `_`

4. **Re-run type check after fixes**:
   ```bash
   npm run type-check
   ```

### ✅ Verification Checkpoint 4 - MANDATORY

**YOU CANNOT PROCEED TO TASK 5 UNTIL THIS PASSES:**

```bash
# Run this command and verify output
npm run type-check 2>&1 | grep -E "error TS|Found [0-9]+ error" | tail -5

# Expected output:
# (no errors)
# OR
# Found 0 errors
#
# REQUIRED:
# - Type errors: MUST be 0
# - Type warnings: SHOULD be 0
```

**Verification Steps**:

1. Run `npm run type-check` and wait for completion
2. Check the final output:
   - ❌ **If ANY type errors exist**: MUST fix all errors
   - ✅ **Ideal**: `Found 0 errors` or no error output

3. **For each type error**:
   - Read the error message carefully
   - Understand the type mismatch
   - Fix the code or type definition
   - Ensure fix doesn't break runtime behavior

4. **Common fixes**:
   - Add missing type annotations
   - Fix import paths
   - Remove unused variables (`@typescript-eslint/no-unused-vars`)
   - Fix property access on possibly undefined objects
   - Add type assertions only when safe

5. **Only proceed when**:
   - ✅ All TypeScript errors are fixed (0 errors)
   - ✅ Type check passes completely
   - ✅ No `error TS` messages in output
   - ✅ Strict mode checks pass

**If checkpoint fails (errors > 0), DO NOT proceed. Fix all TypeScript errors first.**

---

## Task 5: Add Missing JSDoc Comments for Public APIs

### 📋 Instructions

1. **Identify public APIs**:
   - Export statements in `packages/*/src/index.ts`
   - Public classes and their methods
   - Public functions exported from modules
   - Interface definitions
   - Type definitions that are exported

2. **Check existing JSDoc**:
   - Review each public API
   - Identify missing JSDoc comments
   - List files that need JSDoc additions

3. **Add JSDoc comments**:
   - **For functions/methods**:
     ````typescript
     /**
      * Brief description of what the function does.
      *
      * @param paramName - Description of parameter
      * @returns Description of return value
      * @throws {ErrorType} Description of when this error is thrown
      * @example
      * ```typescript
      * const result = exampleFunction('input');
      * ```
      */
     ````
   - **For classes**:
     ````typescript
     /**
      * Brief description of the class.
      *
      * @example
      * ```typescript
      * const instance = new ExampleClass();
      * ```
      */
     ````
   - **For interfaces/types**:
     ```typescript
     /**
      * Brief description of the type.
      */
     ```

4. **JSDoc requirements**:
   - All public functions must have description
   - All parameters must be documented
   - Return types must be documented
   - Complex examples should be included
   - Error conditions should be documented

5. **Verify JSDoc coverage**:
   - Check that all public APIs have JSDoc
   - Ensure descriptions are clear and helpful
   - Verify examples are accurate

### ✅ Verification Checkpoint 5 - MANDATORY

**YOU CANNOT COMPLETE UNTIL THIS PASSES:**

```bash
# Check for public exports without JSDoc
# Run this script or manual review:

# 1. Find all exported functions/classes
grep -r "export.*function\|export.*class\|export.*interface" packages/*/src/**/*.ts | grep -v "\.test\."

# 2. Check each file for JSDoc comments above exports
# Manual review or use a tool like tsd-jsdoc

# REQUIRED:
# - All public exports must have JSDoc
# - All parameters documented
# - Return types documented
```

**Verification Steps**:

1. **Review all public exports**:
   - Check `packages/*/src/index.ts` files
   - List all exported items
   - Verify each has JSDoc

2. **Check JSDoc completeness**:
   - ✅ Description present
   - ✅ Parameters documented (if any)
   - ✅ Return type documented
   - ✅ Examples for complex APIs
   - ✅ Error conditions documented (if applicable)

3. **If ANY public API is missing JSDoc**:
   - ❌ **STOP**: Add JSDoc comments
   - Ensure all public APIs are documented
   - Re-check coverage

4. **Only complete when**:
   - ✅ All public exports have JSDoc
   - ✅ All parameters are documented
   - ✅ All return types are documented
   - ✅ Complex APIs have examples
   - ✅ Documentation is clear and helpful

**If checkpoint fails, DO NOT complete. Add missing JSDoc comments first.**

---

## Final Verification - ALL TASKS COMPLETE

### ✅ Final Checkpoint - MANDATORY

**Run all verification checks one final time:**

```bash
# 1. Coverage check
npm run test:coverage | grep -E "All files" | awk '{print "Coverage: " $3 "%"}'
# Expected: Coverage: >= 90.00%

# 2. Test suite check
npm test 2>&1 | tail -1
# Expected: Tests: X passed, 0 failed

# 3. ESLint check
npm run lint 2>&1 | tail -1
# Expected: 0 errors

# 4. TypeScript check
npm run type-check 2>&1 | tail -1
# Expected: Found 0 errors (or no errors)

# 5. JSDoc check (manual review)
echo "Review public API documentation"
```

**Final Verification Checklist**:

- ✅ **Task 1**: All packages >= 90% coverage
- ✅ **Task 2**: All tests passing (0 failures)
- ✅ **Task 3**: All ESLint errors fixed (0 errors)
- ✅ **Task 4**: All TypeScript errors fixed (0 errors)
- ✅ **Task 5**: All public APIs have JSDoc

**Only mark tasks as complete when ALL checkpoints pass.**

---

## ⚠️ CRITICAL REMINDERS

1. **DO NOT SKIP CHECKPOINTS**: Each task has a mandatory verification checkpoint
2. **DO NOT PROCEED IF CHECKPOINT FAILS**: Fix issues before moving forward
3. **DO NOT USE `--no-verify` OR BYPASS CHECKS**: All verifications must pass
4. **DOCUMENT ANY ACCEPTABLE EXCEPTIONS**: If a warning/error is acceptable, document why
5. **RE-RUN CHECKS AFTER FIXES**: Always verify fixes work
6. **COMMIT PROGRESS**: Commit after each task completes successfully

---

## Success Criteria

All tasks are complete when:

- ✅ Coverage report shows 90%+ for all packages
- ✅ `npm test` shows 0 failed tests
- ✅ `npm run lint` shows 0 errors
- ✅ `npm run type-check` shows 0 errors
- ✅ All public APIs have JSDoc comments
- ✅ All verification checkpoints pass

**Good luck! Take your time and do it right. Quality over speed.** 🚀
