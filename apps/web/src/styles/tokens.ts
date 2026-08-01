/**
 * TravelOS V4 design tokens — TypeScript mirror of styles/theme.css.
 * Prefer CSS variables in className; use these for inline styles / charts.
 */
export const brand = {
  primary: "#14213D",
  accent: "#F97316",
  accentDeep: "#C2410C",
  background: "#F4F6FA",
  white: "#FFFFFF",
  sidebar: "#14213D",
} as const;

export const gradient = {
  accent: "linear-gradient(135deg,#F97316,#C2410C)",
  primary: "linear-gradient(135deg,#14213D,#1E3570)",
} as const;

export const chartColors = [
  "#14213D",
  "#F97316",
  "#16A34A",
  "#0891B2",
  "#7C3AED",
  "#EA580C",
  "#6366F1",
  "#64748B",
] as const;

export const radius = {
  xs: "6px",
  sm: "8px",
  md: "12px",
  lg: "16px",
  xl: "24px",
} as const;
