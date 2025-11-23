# Branch Protection Rules

This document describes the branch protection rules that should be configured in GitHub for this repository.

## Protected Branches

### main
- **Required Status Checks**: All CI checks must pass
  - lint
  - type-check
  - test (all Node.js versions)
  - build
  - quality-gates
- **Require Pull Request Reviews**: 
  - Required: 2 approvers
  - Dismiss stale reviews: Yes
  - Require review from Code Owners: Yes (if CODEOWNERS exists)
- **Require Up-to-Date Branches**: Yes
- **Require Conversation Resolution**: Yes
- **Require Linear History**: No (allows merge commits)
- **Enforce Admin Restrictions**: Yes
- **Allow Force Pushes**: No
- **Allow Deletions**: No
- **Restrict Pushes**: Yes (only via PRs)

### develop
- **Required Status Checks**: All CI checks must pass
  - lint
  - type-check
  - test (all Node.js versions)
  - build
- **Require Pull Request Reviews**: 
  - Required: 1 approver
  - Dismiss stale reviews: Yes
- **Require Up-to-Date Branches**: Yes
- **Require Conversation Resolution**: Yes
- **Allow Force Pushes**: No
- **Allow Deletions**: No

## Setup Instructions

1. Go to repository Settings → Branches
2. Click "Add branch protection rule"
3. Enter branch name pattern (e.g., `main` or `develop`)
4. Configure the settings as listed above
5. Save the protection rule

## CI/CD Status Checks

The following status checks must pass before merging:

- ✅ **lint**: Code passes ESLint checks
- ✅ **type-check**: TypeScript compilation succeeds
- ✅ **test**: All tests pass (Node.js 18 & 20)
- ✅ **build**: Project builds successfully
- ✅ **quality-gates**: Coverage meets threshold (90%+)
- ✅ **codecov**: Coverage uploaded and PR comment added

## Exceptions

In emergency situations (e.g., critical security fixes), administrators can bypass branch protection. However, this should be:
1. Documented in the PR description
2. Reviewed post-merge
3. Used sparingly

