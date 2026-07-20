---
name: patch-version-bump
description: Automatically increment the patch version by 0.0.1 for every new version or release.
---

# Patch Version Bump

Whenever the user asks to update, bump, release, or increment the project version:

## Rules

1. Read the current semantic version in the format:
   ```
   MAJOR.MINOR.PATCH
   ```

2. Increment only the PATCH number by **1**.

3. Leave the MAJOR and MINOR numbers unchanged.

### Examples

| Current | Next |
|---------|------|
| 0.1.0 | 0.1.1 |
| 0.1.1 | 0.1.2 |
| 0.1.3 | 0.1.4 |
| 1.0.9 | 1.0.10 |
| 2.4.15 | 2.4.16 |

## Never

- Do not modify the MAJOR version.
- Do not modify the MINOR version.
- Do not skip patch numbers.
- Do not reset the patch unless explicitly instructed by the user.

## Output

Whenever a version bump occurs, clearly state:

```
Version updated:
Old: <old_version>
New: <new_version>
```

Then update every occurrence of the version number throughout the project, including but not limited to:

- package.json
- package-lock.json (if appropriate)
- Cargo.toml
- pyproject.toml
- composer.json
- README.md
- CHANGELOG.md
- documentation
- banners
- application metadata
- any hard-coded version constants

Ensure all references remain consistent across the project.
