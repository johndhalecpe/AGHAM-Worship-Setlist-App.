---
name: color-palette
description: Reference for how palettes are structured in this project. Lists
  the 6 root colors per palette, derivation rules, contrast requirements, and
  the CSS structure to use when implementing a new palette.
---

## 6 Root Colors Per Palette

| # | Root | Visual rule | Current (default) |
|---|---|---|---|
| 1 | `--color-surface` | Page background — lightest in light mode, darkest in dark mode | `#F6F4EF` |
| 2 | `--color-text` | Primary text — darkest in light mode, lightest in dark mode | `#2D2B28` |
| 3 | `--color-accent` | Buttons/primary accent — must be dark enough for white text (L* ≤ 55, ≥ 4.5:1 contrast vs white) | `#D84F0B` |
| 4 | `--color-accent-secondary` | Secondary accent — same contrast rule | `#0D9488` |
| 5 | `--color-danger` | Destructive action — darker/intensified version of accent, or a red that shares the palette's temperature | `#DC2626` |
| 6 | `--color-success` | Positive action — green tinted toward the palette's temperature | `#16A34A` |

## Dark Mode Rule

Only surface and text change in dark mode. Accent colors carry over from light mode. Optionally brighten accent-secondary if it loses pop on a dark background.

## Derived Variables (22 others)

All use `color-mix()` — defined once in `:root`, not repeated per palette:

- **Surfaces:** `surface-card` (lighter), `surface-elevated` (barely lighter), `surface-muted` (barely darker) — scale from `--color-surface`
- **Borders:** mix of `surface` + `text` at 15% / 25%
- **Text hierarchy:** `text-secondary` / `text-tertiary` — mix of `text` + `surface`
- **Text on accent:** always `#FFFFFF`
- **Badges:** tint of source color at ~15% opacity for bg, darkened base for text
- **Glass:** surface at reduced opacity + blur

## Contrast Checklist (for every palette)

- [ ] `--color-accent` vs white ≥ 4.5:1
- [ ] `--color-accent-secondary` vs white ≥ 4.5:1
- [ ] `--color-text` vs `--color-surface` ≥ 4.5:1
- [ ] `--color-danger` reads as destructive, fits palette temperature
- [ ] `--color-success` reads as positive, fits palette temperature
- [ ] Dark mode: surface ≤ L* 15, text ≥ L* 80

## Palette CSS Structure

```css
[data-palette="name"] {
  --color-surface: #...;
  --color-text: #...;
  --color-accent: #...;
  --color-accent-secondary: #...;
  --color-danger: #...;
  --color-success: #...;
}

html.dark[data-palette="name"] {
  --color-surface: #...;
  --color-text: #...;
}
Colors not used as root variables go into the @theme {} block for decorative use.
