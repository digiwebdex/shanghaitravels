import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router";
import {
  Bell,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Command,
  LogOut,
  Menu,
  Plus,
  ScanLine,
  Search,
  User,
  X,
} from "lucide-react";
import { useAuth } from "@/auth/AuthProvider";
import { ORG_NAME } from "@/config/env";
import { NAV, sectionForPath, type NavLeaf, type NavSection } from "@/config/nav";
import {
  createActionsForPath,
  createLabelForPath,
  searchPlaceholderForPath,
} from "@/config/contextUi";
import { CommandPalette } from "@/components/shell/CommandPalette";
import { HelpAssistant } from "@/help/HelpAssistant";
import { ScanDocumentModal } from "@/components/ocr/ScanDocumentPanel";
import { brand, gradient } from "@/styles/tokens";

const EXPANDED_KEY = "travelos:nav:expanded";
const COLLAPSED_KEY = "travelos:nav:collapsed";

function readExpanded(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(EXPANDED_KEY);
    return raw ? (JSON.parse(raw) as Record<string, boolean>) : {};
  } catch {
    return {};
  }
}

function leafIsActive(item: NavLeaf, pathname: string, search: string, routerActive: boolean): boolean {
  const [path, qs] = item.to.split("?");
  if (!qs) return routerActive;
  const want = new URLSearchParams(qs);
  const have = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  const pathOk = item.end ? pathname === path : pathname === path || pathname.startsWith(`${path}/`);
  return pathOk && [...want.entries()].every(([k, v]) => have.get(k) === v);
}

const SidebarLeaf = memo(function SidebarLeaf({
  item,
  onNavigate,
  pathname,
  search,
}: {
  item: NavLeaf;
  onNavigate: () => void;
  pathname: string;
  search: string;
}) {
  const Icon = item.icon;
  return (
    <NavLink
      to={item.to}
      end={item.end}
      onClick={onNavigate}
      className={({ isActive }) => {
        const on = leafIsActive(item, pathname, search, isActive);
        return `group relative flex items-center gap-2.5 rounded-lg pl-8 pr-2.5 py-[7px] text-[11.5px] font-medium transition-colors duration-100 ${
          on
            ? "bg-orange-500/[0.14] text-orange-100"
            : "text-white/45 hover:bg-white/[0.05] hover:text-white/80"
        }`;
      }}
    >
      {({ isActive }) => {
        const on = leafIsActive(item, pathname, search, isActive);
        return (
          <>
            {on && (
              <span className="absolute left-[13px] top-1/2 h-4 w-[2px] -translate-y-1/2 rounded-full bg-orange-400" />
            )}
            <Icon size={13} className={`flex-shrink-0 ${on ? "text-orange-400" : "text-white/35"}`} />
            <span className="flex-1 truncate">{item.label}</span>
          </>
        );
      }}
    </NavLink>
  );
});

function SidebarSection({
  section,
  items,
  collapsed,
  expanded,
  onToggle,
  onNavigate,
  pathname,
  search,
}: {
  section: NavSection;
  items: NavLeaf[];
  collapsed: boolean;
  expanded: boolean;
  onToggle: () => void;
  onNavigate: () => void;
  pathname: string;
  search: string;
}) {
  const Icon = section.icon;

  if (section.to) {
    return (
      <NavLink
        to={section.to}
        end={section.end}
        onClick={onNavigate}
        title={collapsed ? section.label : undefined}
        className={({ isActive }) =>
          `flex items-center gap-2.5 rounded-lg py-2 text-[12px] font-semibold transition-colors ${
            collapsed ? "justify-center px-2" : "px-2.5"
          } ${isActive ? "bg-orange-500/[0.14] text-orange-100" : "text-white/60 hover:bg-white/[0.05] hover:text-white"}`
        }
      >
        {({ isActive }) => (
          <>
            <Icon size={15} className={`flex-shrink-0 ${isActive ? "text-orange-400" : "text-white/45"}`} />
            {!collapsed && <span className="truncate">{section.label}</span>}
          </>
        )}
      </NavLink>
    );
  }

  if (collapsed) {
    return (
      <button
        type="button"
        onClick={onToggle}
        title={section.label}
        aria-label={section.label}
        className="flex w-full items-center justify-center rounded-lg px-2 py-2 text-white/45 transition-colors hover:bg-white/[0.05] hover:text-white"
      >
        <Icon size={15} />
      </button>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-[12px] font-semibold text-white/60 transition-colors hover:bg-white/[0.05] hover:text-white"
      >
        <Icon size={15} className="flex-shrink-0 text-white/45" />
        <span className="flex-1 truncate text-left">{section.label}</span>
        <ChevronDown
          size={12}
          className={`flex-shrink-0 text-white/25 transition-transform duration-200 ${
            expanded ? "" : "-rotate-90"
          }`}
        />
      </button>
      {expanded && (
        <div className="mt-[2px] space-y-[1px] pb-1">
          {items.map((item) => (
            <SidebarLeaf
              key={item.id}
              item={item}
              onNavigate={onNavigate}
              pathname={pathname}
              search={search}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminLayout() {
  const { user, logout, can } = useAuth();
  const navigate = useNavigate();
  const { pathname, search } = useLocation();

  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(COLLAPSED_KEY) === "1";
    } catch {
      return false;
    }
  });
  const [mobileOpen, setMobileOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [scanOpen, setScanOpen] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>(readExpanded);

  const profileRef = useRef<HTMLDivElement>(null);
  const createRef = useRef<HTMLDivElement>(null);

  /** Sections the user can actually reach, with forbidden links removed. */
  const sections = useMemo(
    () =>
      NAV.map((s) => ({ section: s, items: (s.items ?? []).filter((i) => !i.perm || can(i.perm)) })).filter(
        ({ section, items }) => section.to || items.length > 0,
      ),
    [can],
  );

  const activeSection = useMemo(() => sectionForPath(pathname), [pathname]);

  // Keep the section containing the current route open, without collapsing
  // whatever the user opened by hand.
  useEffect(() => {
    if (!activeSection) return;
    setExpanded((prev) => (prev[activeSection] ? prev : { ...prev, [activeSection]: true }));
  }, [activeSection]);

  useEffect(() => {
    try {
      localStorage.setItem(EXPANDED_KEY, JSON.stringify(expanded));
    } catch {
      /* storage unavailable — expansion is not worth failing over */
    }
  }, [expanded]);

  useEffect(() => {
    try {
      localStorage.setItem(COLLAPSED_KEY, collapsed ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, [collapsed]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!profileOpen && !createOpen) return;
    const handler = (e: MouseEvent) => {
      const t = e.target as Node;
      if (profileRef.current && !profileRef.current.contains(t)) setProfileOpen(false);
      if (createRef.current && !createRef.current.contains(t)) setCreateOpen(false);
    };
    const id = setTimeout(() => document.addEventListener("mousedown", handler), 0);
    return () => {
      clearTimeout(id);
      document.removeEventListener("mousedown", handler);
    };
  }, [profileOpen, createOpen]);

  const toggleSection = useCallback((id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const closeMobile = useCallback(() => setMobileOpen(false), []);

  const initials = (user?.fullName || user?.email || "?")
    .split(/\s+/)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const quickActions = useMemo(() => createActionsForPath(pathname, can), [pathname, can]);
  const createLabel = useMemo(() => createLabelForPath(pathname, can), [pathname, can]);
  const searchPlaceholder = useMemo(() => searchPlaceholderForPath(pathname), [pathname]);

  const sidebar = (
    <>
      <div
        className={`flex flex-shrink-0 items-center gap-2.5 border-b border-white/[0.06] ${
          collapsed ? "justify-center px-2 py-3.5" : "px-4 py-3.5"
        }`}
      >
        <div
          className="flex size-7 flex-shrink-0 items-center justify-center rounded-lg"
          style={{ background: gradient.accent }}
        >
          <Command size={14} className="text-white" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="text-[11px] font-black leading-none tracking-[0.08em] text-white">ADMIN ERP</p>
            <p className="mt-1 truncate text-[9px] leading-none text-white/30">{ORG_NAME}</p>
          </div>
        )}
      </div>

      <nav
        className={`scrollbar-hide flex-1 space-y-[3px] overflow-y-auto py-3 ${collapsed ? "px-1.5" : "px-2.5"}`}
        aria-label="Main navigation"
      >
        {sections.map(({ section, items }) => (
          <SidebarSection
            key={section.id}
            section={section}
            items={items}
            collapsed={collapsed}
            expanded={!!expanded[section.id]}
            onToggle={() => {
              if (collapsed) setCollapsed(false);
              toggleSection(section.id);
            }}
            onNavigate={closeMobile}
            pathname={pathname}
            search={search}
          />
        ))}
      </nav>

      {!collapsed && (
        <div className="flex-shrink-0 border-t border-white/[0.06] px-4 py-2.5">
          <p className="truncate text-[9px] text-white/25">{ORG_NAME}</p>
        </div>
      )}
    </>
  );

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--background)" }}>
      {/* Desktop sidebar */}
      <aside
        className="relative z-20 hidden flex-shrink-0 flex-col transition-[width] duration-200 lg:flex"
        style={{ background: brand.sidebar, width: collapsed ? 56 : 248 }}
      >
        {sidebar}
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          className="absolute -right-3 top-[68px] z-30 flex size-6 items-center justify-center rounded-full border border-[var(--border)] bg-white text-[var(--muted-foreground)] shadow-md transition-colors hover:bg-[var(--muted)]"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight size={11} /> : <ChevronLeft size={11} />}
        </button>
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            onClick={closeMobile}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px]"
          />
          <aside
            className="absolute inset-y-0 left-0 flex w-[268px] flex-col shadow-2xl"
            style={{ background: brand.sidebar }}
          >
            <button
              type="button"
              onClick={closeMobile}
              aria-label="Close navigation"
              className="absolute right-2 top-3.5 z-10 rounded-lg p-1.5 text-white/50 hover:bg-white/10 hover:text-white"
            >
              <X size={15} />
            </button>
            {sidebar}
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header
          className="flex flex-shrink-0 items-center gap-2 border-b border-[var(--border)] bg-white px-3 sm:px-4"
          style={{ height: 56 }}
        >
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="rounded-lg p-2 text-[var(--muted-foreground)] transition-colors hover:bg-[var(--background)] lg:hidden"
            aria-label="Open navigation"
          >
            <Menu size={17} />
          </button>

          <button
            type="button"
            onClick={() => setPaletteOpen(true)}
            className="flex flex-1 items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--muted)] px-3 py-2 text-left transition-colors hover:border-slate-300 hover:bg-white sm:max-w-md"
          >
            <Search size={13} className="flex-shrink-0 text-[var(--muted-foreground)]" />
            <span className="flex-1 truncate text-[11.5px] text-[var(--muted-foreground)]">{searchPlaceholder}</span>
            <kbd className="hidden flex-shrink-0 rounded border border-[var(--border)] bg-white px-1.5 py-[1px] font-mono text-[9px] font-semibold text-[var(--muted-foreground)] sm:block">
              ⌘K
            </kbd>
          </button>

          <div className="ml-auto flex flex-shrink-0 items-center gap-1.5">
            {can("ocr:use") && (
              <button
                type="button"
                onClick={() => setScanOpen(true)}
                className="flex items-center gap-1.5 rounded-lg border border-orange-200 bg-orange-50 px-2.5 py-2 text-[11px] font-bold text-orange-700 transition-colors hover:bg-orange-100"
                title="Scan Document"
              >
                <ScanLine size={14} />
                <span className="hidden sm:inline">Scan Document</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => navigate("/operations/notifications")}
              className="rounded-lg p-2 text-[var(--muted-foreground)] transition-colors hover:bg-[var(--background)]"
              aria-label="Notifications"
              title="Notifications"
            >
              <Bell size={16} />
            </button>

            {quickActions.length > 0 && (
              <div className="relative" ref={createRef}>
                <div
                  className="flex overflow-hidden rounded-lg text-white"
                  style={{ background: gradient.accent }}
                >
                  <button
                    type="button"
                    onClick={() => navigate(quickActions[0].to)}
                    className="flex items-center gap-1.5 px-3 py-2 text-[11.5px] font-bold transition-opacity hover:opacity-90"
                  >
                    <Plus size={13} />
                    <span className="hidden max-w-[140px] truncate sm:inline">{createLabel}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCreateOpen((o) => !o)}
                    className="border-l border-white/20 px-2 py-2 transition-opacity hover:opacity-90"
                    aria-label="More create actions"
                    aria-expanded={createOpen}
                  >
                    <ChevronDown size={11} className={createOpen ? "rotate-180" : ""} />
                  </button>
                </div>
                {createOpen && (
                  <div className="absolute right-0 top-full z-50 mt-1.5 w-60 overflow-hidden rounded-xl border border-[var(--border)] bg-white py-1 shadow-xl">
                    {quickActions.map((a) => (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => {
                          setCreateOpen(false);
                          navigate(a.to);
                        }}
                        className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-[11.5px] text-[var(--muted-foreground)] transition-colors hover:bg-[var(--muted)]"
                      >
                        <a.icon size={13} className="flex-shrink-0 text-orange-600" />
                        {a.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="relative" ref={profileRef}>
              <button
                type="button"
                onClick={() => setProfileOpen((o) => !o)}
                className={`flex items-center gap-2 rounded-lg px-1.5 py-1.5 transition-colors ${
                  profileOpen ? "bg-[var(--background)]" : "hover:bg-[var(--background)]"
                }`}
              >
                <div
                  className="flex size-7 items-center justify-center rounded-full text-[10px] font-black text-white"
                  style={{ background: gradient.accent }}
                >
                  {initials}
                </div>
                <div className="hidden text-left xl:block">
                  <p className="text-[11px] font-bold leading-none text-[var(--primary)]">
                    {user?.fullName || user?.email}
                  </p>
                  <p className="mt-1 text-[9px] leading-none text-[var(--muted-foreground)]">{user?.role}</p>
                </div>
                <ChevronDown
                  size={10}
                  className={`text-[var(--muted-foreground)] transition-transform ${profileOpen ? "rotate-180" : ""}`}
                />
              </button>
              {profileOpen && (
                <div className="absolute right-0 top-full z-50 mt-1.5 w-56 overflow-hidden rounded-xl border border-[var(--border)] bg-white shadow-xl">
                  <div className="border-b border-[var(--border)] px-4 py-3.5">
                    <p className="text-[12px] font-bold text-[var(--primary)]">{user?.fullName || "—"}</p>
                    <p className="mt-0.5 text-[9.5px] text-[var(--muted-foreground)]">{user?.email}</p>
                    <span className="mt-1.5 inline-block rounded-full border border-orange-200 bg-orange-100 px-2 py-0.5 text-[9px] font-bold text-orange-700">
                      {user?.role}
                    </span>
                  </div>
                  <div className="py-1">
                    <button
                      type="button"
                      onClick={() => {
                        setProfileOpen(false);
                        navigate("/change-password");
                      }}
                      className="flex w-full items-center gap-2.5 px-3 py-2 text-[11px] text-[var(--muted-foreground)] transition-colors hover:bg-[var(--muted)]"
                    >
                      <User size={12} className="text-[var(--muted-foreground)]" /> Change password
                    </button>
                    <div className="mt-1 border-t border-[var(--border)] pt-1">
                      <button
                        type="button"
                        onClick={async () => {
                          await logout();
                          navigate("/login", { replace: true });
                        }}
                        className="flex w-full items-center gap-2.5 px-3 py-2 text-[11px] text-red-500 transition-colors hover:bg-red-50"
                      >
                        <LogOut size={12} /> Sign out
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="relative flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
      <ScanDocumentModal open={scanOpen} onClose={() => setScanOpen(false)} />
      {/* V17 — floating ERP Assistant, available on every admin screen. */}
      <HelpAssistant />
    </div>
  );
}
