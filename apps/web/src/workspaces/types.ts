import type { LucideIcon } from "lucide-react";

/**
 * Workspace Architecture
 *
 * Every major ERP domain is a Workspace with a fixed tab set:
 * Overview · Work · Reports · Calendar · Settings
 *
 * The registry is the single source of truth for sidebar leaves that
 * belong to a workspace. Pages never invent their own tab layout.
 */

export type WorkspaceTabKind = "overview" | "work" | "reports" | "calendar" | "settings";

export type WorkspaceTab = {
  kind: WorkspaceTabKind;
  label: string;
  /** Absolute hash-router path (e.g. `/finance/dashboard`). */
  to: string;
  /** Exact match for NavLink end. */
  end?: boolean;
  /** Permission required to see this tab. */
  perm?: string;
  /** Hidden from production UI when true. */
  soon?: boolean;
};

export type Workspace = {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
  /** Base path used for breadcrumb and active matching. */
  basePath: string;
  /** Permission that gates the whole workspace in the sidebar. */
  perm?: string;
  tabs: WorkspaceTab[];
};

export const TAB_ORDER: WorkspaceTabKind[] = [
  "overview",
  "work",
  "reports",
  "calendar",
  "settings",
];
