# GitHub Agent Prompt: Quality Improvement Tasks

## 🎯 Mission: Complete All Quality Improvement Tasks

You are tasked with completing 5 critical quality improvement tasks for this repository.
**⚠️ CRITICAL: You MUST complete each task in order and pass all verification checkpoints before proceeding.**

---

## Task 1: Ensure 90%+ Test Coverage

**Instructions:**

1. Run `npm run test:coverage`
2. Check coverage report for all packages
3. Identify files below 90% coverage (Lines, Statements, Functions, Branches)
4. Write additional unit tests to cover missing code paths
5. Re-run coverage until ALL packages show >= 90% coverage

**✅ VERIFICATION CHECKPOINT 1 (MANDATORY):**

```bash
npm run test:coverage | grep -E "All files"
# MUST show: >= 90.00% for Lines, Statements, Functions, Branches
# If ANY package is below 90%, STOP and add more tests
# DO NOT proceed to Task 2 until this passes
```

**Stop Condition:** If coverage < 90%, you MUST add tests. Cannot proceed.

---

## Task 2: Fix All Failing Tests

**Instructions:**

1. Run `npm test`
2. List all failing tests
3. Fix each failing test (fix code or test, do NOT delete tests)
4. Re-run tests until ALL pass (0 failures)

**✅ VERIFICATION CHECKPOINT 2 (MANDATORY):**

```bash
npm test 2>&1 | tail -5
# MUST show: "0 failed" in test summary
# If ANY test fails, STOP and fix it
# DO NOT proceed to Task 3 until this passes
```

**Stop Condition:** If any test fails, you MUST fix it. Cannot proceed.

---

## Task 3: Fix All ESLint Errors and Warnings

**Instructions:**

1. Run `npm run lint`
2. Count errors and warnings
3. Fix all errors first (these are blocking)
4. Fix warnings (use auto-fix: `npm run lint:fix` when safe)
5. For complexity warnings, refactor large functions if possible
6. Re-run lint until errors = 0

**✅ VERIFICATION CHECKPOINT 3 (MANDATORY):**

```bash
npm run lint 2>&1 | grep -E "✖|errors"
# MUST show: "0 errors" or "✔ No ESLint errors"
# Warnings can be acceptable if documented
# If ANY errors exist, STOP and fix them
# DO NOT proceed to Task 4 until this passes
```

**Stop Condition:** If ESLint errors > 0, you MUST fix them. Cannot proceed.

---

## Task 4: Fix All TypeScript Errors

**Instructions:**

1. Run `npm run type-check`
2. List all TypeScript errors
3. Fix each error:
   - Add missing type annotations
   - Fix type mismatches
   - Fix import paths
   - Remove unused variables (or prefix with `_`)
   - Fix property access on possibly undefined objects
4. Re-run type-check until 0 errors

**✅ VERIFICATION CHECKPOINT 4 (MANDATORY):**

```bash
npm run type-check 2>&1 | grep -E "error TS|Found"
# MUST show: "Found 0 errors" or no error output
# If ANY type errors exist, STOP and fix them
# DO NOT proceed to Task 5 until this passes
```

**Stop Condition:** If TypeScript errors > 0, you MUST fix them. Cannot proceed.

---

## Task 5: Add Missing JSDoc Comments

**Instructions:**

1. Find all public exports in `packages/*/src/index.ts` and exported files
2. Check which exports are missing JSDoc comments
3. Add JSDoc to all public APIs:
   - Functions: description, @param, @returns, @throws, @example
   - Classes: description, @example
   - Interfaces/Types: description
4. Ensure all parameters and return types are documented

**✅ VERIFICATION CHECKPOINT 5 (MANDATORY):**

```bash
# Manual review: Check all public exports have JSDoc
grep -r "export.*function\|export.*class\|export.*interface" packages/*/src/**/*.ts | grep -v "\.test\."
# Review each export and verify JSDoc exists above it
# If ANY public API lacks JSDoc, STOP and add it
# DO NOT complete until this passes
```

**Stop Condition:** If any public API lacks JSDoc, you MUST add it. Cannot complete.

---

## Final Verification

**Before marking complete, run ALL checks:**

```bash
# 1. Coverage
npm run test:coverage | grep "All files"  # Must be >= 90%

# 2. Tests
npm test 2>&1 | tail -1  # Must show 0 failed

# 3. Lint
npm run lint 2>&1 | tail -1  # Must show 0 errors

# 4. Type Check
npm run type-check 2>&1 | tail -1  # Must show 0 errors

# 5. JSDoc (manual review of public exports)
```

**✅ ALL CHECKPOINTS MUST PASS BEFORE COMPLETION**

---

## ⚠️ CRITICAL RULES

1. **NO SKIPPING**: Each task MUST be completed before moving to next
2. **NO BYPASSING**: Verification checkpoints are mandatory
3. **NO SHORTCUTS**: Fix issues properly, don't use workarounds
4. **VERIFY AFTER FIXES**: Always re-run checks after making changes
5. **COMMIT PROGRESS**: Commit after each successful task

---

## Expected Timeline

- Task 1: 30-60 minutes (depending on coverage gaps)
- Task 2: 15-45 minutes (depending on test failures)
- Task 3: 20-40 minutes (depending on lint issues)
- Task 4: 30-60 minutes (depending on type errors)
- Task 5: 20-40 minutes (depending on API count)

**Total: ~2-4 hours for thorough completion**

---

## Success Criteria

✅ All packages have 90%+ test coverage  
✅ All tests pass (0 failures)  
✅ All ESLint errors fixed (0 errors)  
✅ All TypeScript errors fixed (0 errors)  
✅ All public APIs have JSDoc comments

Please read and follow all instructions in .github/AGENT_QUALITY_TASKS_PROMPT.md
Complete all 5 tasks in order, ensuring each verification checkpoint passes before proceeding.
Do not skip any steps or bypass any checks.

**Start with Task 1. Good luck!** 🚀
