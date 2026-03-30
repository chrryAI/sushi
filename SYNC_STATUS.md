# SUSHI + Porffor Sync Status

**Last Sync:** 2026-03-27
**Upstream:** https://github.com/CanadaHonk/porffor
**Version:** v0.61.12

## Synced Components

### ✅ Package.json

- Updated version: `0.61.5` → `0.61.12`
- Synced with upstream dependencies
- Added `sushi` bin entry alongside `porf`
- Kept SUSHI-specific additions:
  - `falkordb` dependency (for BAM/STRIKE)
  - Test scripts (`test:bam`, `test:strike`, etc.)

### ✅ CLI Version

- Updated CLI version to match Porffor: `0.61.12`
- Updated description to include Porffor version

### ✅ README.md

- Synced Porffor documentation with upstream
- Kept SUSHI-specific sections:
  - SUSHI platform overview
  - SUSHI CLI commands
  - STRIKE mutation testing documentation

### ✅ CLI Package.json

- Updated version to `0.61.12`
- Updated repository links to upstream
- Added keywords: `porffor`, `mutation-testing`, `strike`

## SUSHI Extensions (Not in Upstream)

These are custom additions for the SUSHI platform:

1. **BAM** (`tools/bam.js`) - Bug detection system
2. **STRIKE** (`tools/strike.js`) - Mutation testing framework
3. **Memory** (`tools/memory.js`) - Learning system
4. **SUSHI CLI** (`cli/`) - Terminal AI assistant
5. **FalkorDB integration** - Graph database for mutations/bugs

## Test Scripts Added

```json
{
  "test:autofix": "node tools/run-autofix.js",
  "test:bam": "node tools/run-bam-strike.js",
  "test:dashboard": "node tools/dashboard.js",
  "test:enterprise": "npm run test:bam && npm run test:memory && npm run test:autofix && npm run test:dashboard",
  "test:learn": "npm run test:bam && npm run test:memory",
  "test:memory": "node tools/run-memory.js"
}
```

## Verification

```bash
# Check version
node cli/sushi.js --version
# Output: 0.61.12

# Run mutation testing
node cli/sushi.js strike examples/math-utils.js --test "node examples/math-utils.test.js"
```

## Future Syncs

To sync with upstream in the future:

1. Check upstream version: https://github.com/CanadaHonk/porffor/releases
2. Update `version` in:
   - `package.json`
   - `cli/package.json`
   - `cli/sushi.js` (program.version)
3. Sync dependencies from upstream `package.json`
4. Update README.md Porffor section
5. Test SUSHI-specific features still work
