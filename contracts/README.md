# contracts/

Machine-readable shared definitions, generated into / mirrored from the codebase.

## Files here
- **`design-tokens.json`** — color tokens mirroring `src/constants/theme.ts` (`Colors`, `TAB_COLORS`, `CATEGORY_COLORS`). `theme.ts` stays the source of truth; this is the portable mirror.
- **`enums.yaml`** — the enum-like value sets used across the app (schedule category, expense category, mood, day type, tab, alarm days, music service, timer mode).

## Deliberately skipped
- **`openapi.yaml`** — skipped. LifeOS is **local-only**: no backend, no HTTP API, no routes to describe. Data shapes live in `docs/02-data-model.md`. See `docs/03-api-contract.md`.
- **`error-codes.yaml`** — skipped. No API means no wire error codes. The app surfaces errors as inline `Alert` dialogs (validation, permission denied), not codes.

If LifeOS ever grows a backend (not planned — see `docs/00-charter.md`), add both files then.
