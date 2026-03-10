# Frontend Branch Protection Configuration

This document describes the **GitHub dashboard** settings that should be enabled for the frontend repo.
The workflow file alone does not block direct pushes or unsafe merges.

## Recommended `main` rule

Enable these settings for `main`:

- Require a pull request before merging
- Require at least 1 approval
- Dismiss stale approvals when new commits are pushed
- Require conversation resolution before merging
- Require branches to be up to date before merging
- Include administrators

## Required status checks

Mark these as required:

- `Run Frontend Tests`
- `Build Frontend`
- `All Required Frontend Checks Passed`

## Advisory status check

- `Frontend Lint (Advisory)`

Full-repo lint is intentionally advisory for now because the repo still has a lint backlog. Keep the job visible, but do not block merges on it until the backlog is cleared.

## Local verification

Run these before pushing:

```bash
npm test
npm run build
```

Once the lint backlog is resolved, add `npm run lint` to the blocking local and CI checklist.