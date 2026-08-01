# TravelOS V4 Design System

Frontend tokens for `apps/web`. Architecture is frozen — extend tokens, do not invent new modules.

## Sources

| Layer | Path |
|-------|------|
| CSS variables | `apps/web/src/styles/theme.css` |
| Fonts | `apps/web/src/styles/fonts.css` (Inter) |
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

## Radius & spacing

- Radius: 6 / 8 / 12 / 16 / 24 (`radius.xs` … `radius.xl`)
- Spacing grid: 8px

## Charts

Use `chartColors` from `tokens.ts` (mirrors `--chart-*` in theme.css). Do not hardcode amber/purple ad-hoc palettes on new charts.

## Rules

1. Prefer CSS variables in className; use `tokens.ts` only for Recharts / inline styles.
2. Reuse `PageShell`, `PageHeader`, `Surface`, `DataTable`, `EmptyState`, banners.
3. Workspace tabs come only from `src/workspaces/registry.ts`.
