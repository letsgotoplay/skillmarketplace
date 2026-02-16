# CLI Testing Guide

This document summarizes the testing experience for the SkillHub CLI and API integration.

## Prerequisites

- SkillHub server running at `http://localhost:3000`
- Valid API token with `SKILL_WRITE` scope
- CLI built and available at `dist/index.js`

## Environment Setup

```bash
# Set API URL (if different from default)
export SKILLHUB_API_URL=http://localhost:3000
```

## CLI Commands

### Authentication

```bash
# Login with API token
node dist/index.js login sh_your_token_here

# Check current user
node dist/index.js whoami
```

### Skill Management

```bash
# Search skills
node dist/index.js search pdf

# Upload new skill
node dist/index.js upload ./my-skill.zip

# Publish new version
node dist/index.js publish bob/my-skill ./my-skill-v2.zip --changelog "New features"

# Install skill
node dist/index.js add pdf --agents claude-code

# List installed skills
node dist/index.js list

# Remove skill
node dist/index.js remove bob/my-skill --all
```

## SKILL.md Format Requirements

### Correct Format

```yaml
---
name: my-skill
description: A description of my skill
version: 1.0.0
author: username
category: DEVELOPMENT
tags: [tag1, tag2]
---

# My Skill

Content goes here...
```

### Common Mistakes

| Issue | Wrong | Correct |
|-------|-------|---------|
| Version quotes | `version: "1.0.0"` | `version: 1.0.0` |
| Array format | Multi-line YAML arrays | Inline: `[a, b]` |
| Missing fields | No `name` or `description` | Both required |

### Required Fields

- `name` - Skill name (required)
- `description` - Skill description (required)

### Optional Fields

- `version` - Semantic version (e.g., `1.0.0`)
- `author` - Author name
- `category` - DEVELOPMENT, SECURITY, DATA, AIML, TESTING, INTEGRATION
- `tags` - Array of tags
- `license` - License type
- `repository` - Repository URL
- `homepage` - Homepage URL

## API Endpoints for CLI

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/skills` | GET | List/search skills |
| `/api/skills` | POST | Upload new skill |
| `/api/skills/{id}/versions` | POST | Upload new version |
| `/api/skills/{id}` | GET | Get skill details |
| `/api/skills/{id}` | DELETE | Delete skill |
| `/api/download/{id}` | GET | Download skill |

## Authentication

The CLI uses API tokens with Bearer authentication:

```bash
curl -H "Authorization: Bearer sh_your_token" \
     -H "User-Agent: SkillHub-CLI/1.0.0" \
     http://localhost:3000/api/skills
```

### Token Scopes

| Scope | Description |
|-------|-------------|
| `SKILL_READ` | Read and download skills |
| `SKILL_WRITE` | Upload and update skills |
| `SKILL_DELETE` | Delete skills |
| `BUNDLE_READ` | Read bundles |
| `BUNDLE_WRITE` | Create and update bundles |
| `TEAM_READ` | Read team info |
| `ADMIN` | Full admin access |

## Audit Logging

All API calls are logged with enhanced metadata:

```json
{
  "authType": "token",
  "tokenId": "sh_abc123",
  "userAgent": "SkillHub-CLI/1.0.0",
  "ip": "192.168.1.1",
  "fullSlug": "bob/my-skill",
  "version": "uuid",
  "specValidationPassed": true
}
```

### Audit Actions

- `UPLOAD_SKILL` - New skill uploaded
- `UPLOAD_SKILL_VERSION` - New version published
- `DELETE_SKILL` - Skill deleted
- `SKILL_VISIBILITY_CHANGED` - Visibility updated

## Troubleshooting

### Upload Fails: "Invalid SKILL.md"

- Check frontmatter format (use `---` delimiters)
- Ensure `name` and `description` are present
- Use inline arrays for tags: `[a, b]` not multi-line
- Don't quote the version number

### Upload Fails: "Version already exists"

- Increment the version in SKILL.md
- Use `publish` command instead of `upload` for existing skills

### Authentication Fails

- Verify token is valid and not expired
- Check token has required scope (`SKILL_WRITE` for uploads)
- Ensure token format: `sh_xxx`

## Testing Checklist

- [ ] Server running at localhost:3000
- [ ] Valid API token created
- [ ] CLI built (`pnpm build`)
- [ ] Login successful
- [ ] Search returns results
- [ ] Upload succeeds
- [ ] Audit logs show CLI metadata
