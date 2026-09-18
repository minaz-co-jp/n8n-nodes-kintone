# Owner-only / manual setup checklist

These tasks require repository/org/service administration, private secrets, or external approval and should not be performed in normal source-code PRs.

## 1. Cybozu / kintone naming and logo confirmation

Before public npm promotion or n8n verification:

- Confirm use of the name `n8n-nodes-kintone`.
- Confirm use of the official kintone logo/cloud mark in the n8n node.
- Follow the kintone Visual Identity Guide without modifying official assets.
- Keep the project clearly described as an unofficial community integration.

## 2. GitHub repository rules

Configure repository settings/rulesets for `main`:

- Require pull requests.
- Block direct pushes.
- Require CI status checks.
- Disable force pushes.
- Prefer/allow Squash merge only.
- Consider requiring a review once external contributors participate.

The current connected GitHub workflow can edit repository files and PRs, but repository administration/ruleset mutation should be configured by an organization owner in GitHub Settings.

## 3. npm ownership and publish credentials

- Confirm the npm package name is available and acceptable.
- Create/confirm the npm account or organization that owns `n8n-nodes-kintone`.
- Enable 2FA / trusted publishing where possible.
- Add publish credentials or configure npm trusted publishing for GitHub Actions.
- Never commit npm tokens to this repository.

## 4. E2E kintone test environment

Create dedicated test apps only; never use production apps.

Recommended:

### Main Test App
- single-line text
- multiline text
- number
- radio/dropdown/checkbox/multi-select
- date/time/datetime
- link
- user/organization/group select
- lookup
- subtable
- process management enabled

### Lookup Master App
- unique lookup key
- fields copied by Lookup

Create dedicated API tokens with only the permissions required by the test suite.

Store test values as GitHub Actions secrets, for example:

- `KINTONE_E2E_BASE_URL`
- `KINTONE_E2E_APP_ID`
- `KINTONE_E2E_API_TOKEN`
- `KINTONE_E2E_LOOKUP_APP_ID`
- `KINTONE_E2E_LOOKUP_API_TOKEN`

Do not expose these in Actions logs.

## 5. GitHub Actions / publishing

After the package can build with a committed lockfile:

- Switch CI from `npm install` to `npm ci`.
- Enable dependency cache.
- Add npm release workflow.
- Protect release publishing behind GitHub Environment approval if desired.

## 6. n8n Community Node publication / verification

After V1 behavior is stable:

- Publish the npm package.
- Test installation on self-hosted n8n.
- Follow the current n8n community-node verification process for cloud availability.
- Verify the package metadata and documentation URLs before submission.
