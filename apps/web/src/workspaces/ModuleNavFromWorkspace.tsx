import { workspaceById } from "./registry";
import { WorkspaceTabsCompact } from "./WorkspaceTabs";

/**
 * Drop-in replacement for legacy *ModuleNav components.
 * Reads the frozen workspace registry — never invents a parallel tab list.
 */
export function ModuleNavFromWorkspace({ workspaceId }: { workspaceId: string }) {
  const workspace = workspaceById(workspaceId);
  if (!workspace) return null;
  return (
    <div className="mb-4">
      <WorkspaceTabsCompact workspace={workspace} />
    </div>
  );
}
