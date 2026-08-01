# TravelOS V4 Design System

Frontend tokens for `apps/web`. Shared visual identity with the public homepage (figma-design).

## Sources

| Layer | Path |
|-------|------|
| CSS variables | `apps/web/src/styles/theme.css` |
| Fonts | `apps/web/src/styles/fonts.css` (**Plus Jakarta Sans** + JetBrains Mono) |
| TS mirror (charts / inline) | `apps/web/src/styles/tokens.ts` |
| Page furniture | `apps/web/src/components/enterprise/Page.tsx` |
| Tables / pills | `apps/web/src/components/enterprise/DataTable.tsx` |
| Feedback | `apps/web/src/components/Feedback.tsx` |

## Brand

| Token | Value | Use |
|-------|-------|-----|
| Primary | `#14213D` | Sidebar, headings, primary charts |
| Accent | `#F97316` | CTAs, links, highlights |
| Accent deep | `#C2410C` | Gradient end / hover weight |
| Background | `#F4F6FA` | App canvas |

Accent gradient: `linear-gradient(135deg,#F97316,#C2410C)` (`gradient.accent` / `btnPrimaryStyle`).

## Surfaces

- Cards: white + `ring` navy-tint (`--ring-card`) + `--shadow-card`
- Radius: controls `--radius-sm` (8px); cards `rounded-xl`
- Ease: `--ease-brand`

## Components

Use `ListPageShell` for every list module:

- Premium `PageHeader` (icon tile, breadcrumb, subtitle, actions)
- Optional `StatStrip` / `KpiCard`
- `ListToolbar` (search + filters)
- `Surface` + `DataTable`
- Empty / loading / error via `EmptyState`, `SkeletonRows`, `ErrorBanner`

## Rules

1. Prefer CSS variables in className; use `tokens.ts` only for Recharts / inline styles.
2. Never use legacy amber `#F59E0B` gradients — always brand accent.
3. Workspace tabs come only from `src/workspaces/registry.ts`.
4. Sidebar only lists working destinations; hubs nest under Website Setup / module tabs.
