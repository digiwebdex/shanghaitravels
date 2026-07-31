import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
  type RefObject,
} from "react";
import { Link } from "react-router";
import {
  ArrowRight,
  Building2,
  ChevronDown,
  Handshake,
  Shield,
  UserRound,
} from "lucide-react";

/** Absolute TravelOS HashRouter targets (separate SPA under /erp/). */
const ERP = {
  staffLogin: "/erp/#/login",
  corporateLogin: "/erp/#/portal/corporate/login",
  agentLogin: "/erp/#/portal/agent/login",
  customerLogin: "/erp/#/portal/customer/login",
  agentRegister: "/erp/#/portal/agent/register",
  customerRegister: "/erp/#/portal/customer/register",
} as const;

type EntryItem = {
  id: string;
  href: string;
  title: string;
  description: string;
  icon: ReactNode;
  external?: boolean;
};

const LOGIN_ITEMS: EntryItem[] = [
  {
    id: "staff",
    href: ERP.staffLogin,
    title: "Staff ERP",
    description: "Internal employees & administrators",
    icon: <Shield size={18} strokeWidth={2} aria-hidden />,
    external: true,
  },
  {
    id: "corporate",
    href: ERP.corporateLogin,
    title: "Corporate Portal",
    description: "Corporate travel managers",
    icon: <Building2 size={18} strokeWidth={2} aria-hidden />,
    external: true,
  },
  {
    id: "agent",
    href: ERP.agentLogin,
    title: "Agent Portal",
    description: "Travel partners & B2B agents",
    icon: <Handshake size={18} strokeWidth={2} aria-hidden />,
    external: true,
  },
  {
    id: "customer",
    href: ERP.customerLogin,
    title: "Customer Portal",
    description: "Track applications, payments & documents",
    icon: <UserRound size={18} strokeWidth={2} aria-hidden />,
    external: true,
  },
];

const REGISTER_ITEMS: EntryItem[] = [
  {
    id: "agent-reg",
    href: ERP.agentRegister,
    title: "Become an Agent",
    description: "Apply to become a Shanghai Travels partner.",
    icon: <Handshake size={18} strokeWidth={2} aria-hidden />,
    external: true,
  },
  {
    id: "customer-reg",
    href: ERP.customerRegister,
    title: "Customer Registration",
    description: "Create your customer account.",
    icon: <UserRound size={18} strokeWidth={2} aria-hidden />,
    external: true,
  },
];

type PanelKind = "login" | "register" | null;

function useDismissible(open: boolean, onClose: () => void, rootRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };

    const onPointer = (e: MouseEvent | TouchEvent) => {
      const el = rootRef.current;
      if (!el) return;
      const target = e.target as Node;
      if (!el.contains(target)) onClose();
    };

    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("touchstart", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("touchstart", onPointer);
    };
  }, [open, onClose, rootRef]);
}

function EntryLink({
  item,
  onSelect,
}: {
  item: EntryItem;
  onSelect: () => void;
}) {
  const className =
    "group flex items-start gap-3 rounded-xl px-3 py-3 text-left transition-all duration-200 " +
    "hover:bg-primary/[0.04] dark:hover:bg-white/[0.06] focus-visible:outline-none " +
    "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-popover";

  const body = (
    <>
      <span
        className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/8 text-primary transition-colors duration-200 group-hover:bg-accent/15 group-hover:text-accent dark:bg-white/10 dark:text-white dark:group-hover:bg-accent/20"
        aria-hidden
      >
        {item.icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
          {item.title}
          <ArrowRight
            size={14}
            className="opacity-0 -translate-x-1 transition-all duration-200 group-hover:opacity-60 group-hover:translate-x-0 text-accent"
            aria-hidden
          />
        </span>
        <span className="mt-0.5 block text-[12px] leading-snug text-muted-foreground">
          {item.description}
        </span>
      </span>
    </>
  );

  if (item.external) {
    return (
      <a href={item.href} className={className} onClick={onSelect} role="menuitem">
        {body}
      </a>
    );
  }

  return (
    <Link to={item.href} className={className} onClick={onSelect} role="menuitem">
      {body}
    </Link>
  );
}

function AuthPanel({
  kind,
  id,
  onClose,
  mobile,
}: {
  kind: "login" | "register";
  id: string;
  onClose: () => void;
  mobile?: boolean;
}) {
  const isLogin = kind === "login";
  const items = isLogin ? LOGIN_ITEMS : REGISTER_ITEMS;

  return (
    <div
      id={id}
      role="menu"
      aria-label={isLogin ? "Choose your workspace" : "Choose account type"}
      className={
        mobile
          ? "mt-2 rounded-2xl border border-border bg-popover text-popover-foreground shadow-lg shadow-primary/8 dark:shadow-black/40 overflow-hidden"
          : "absolute right-0 top-full z-50 mt-2 w-[min(100vw-2rem,22rem)] origin-top-right rounded-2xl border border-border bg-popover text-popover-foreground shadow-xl shadow-primary/10 dark:shadow-black/50 overflow-hidden"
      }
    >
      <div className="border-b border-border px-4 py-3.5 bg-gradient-to-br from-primary/[0.03] to-accent/[0.04] dark:from-white/[0.04] dark:to-accent/[0.06]">
        <p className="text-sm font-bold text-foreground">
          {isLogin ? "Welcome Back" : "Create Account"}
        </p>
        <p className="mt-0.5 text-[12px] text-muted-foreground">
          {isLogin ? "Choose your workspace" : "Choose account type"}
        </p>
      </div>

      <div className="p-2 space-y-0.5">
        {items.map((item) => (
          <EntryLink key={item.id} item={item} onSelect={onClose} />
        ))}
      </div>

      {!isLogin && (
        <div className="border-t border-border px-4 py-3.5 bg-muted/40 dark:bg-white/[0.03]">
          <p className="text-xs font-semibold text-foreground">Need Corporate Access?</p>
          <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
            Corporate accounts are created by our sales team.
          </p>
          <Link
            to="/contact"
            onClick={onClose}
            className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-primary px-3 py-2.5 text-xs font-bold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Contact Sales
            <ArrowRight size={13} aria-hidden />
          </Link>
        </div>
      )}
    </div>
  );
}

function AuthTrigger({
  label,
  open,
  solid,
  accent,
  controlsId,
  onToggle,
  onKeyDown,
  buttonRef,
}: {
  label: string;
  open: boolean;
  solid: boolean;
  accent?: boolean;
  controlsId: string;
  onToggle: () => void;
  onKeyDown: (e: ReactKeyboardEvent<HTMLButtonElement>) => void;
  buttonRef: RefObject<HTMLButtonElement | null>;
}) {
  if (accent) {
    return (
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={controlsId}
        onClick={onToggle}
        onKeyDown={onKeyDown}
        className="inline-flex items-center gap-1 rounded-lg bg-accent px-4 py-2 text-sm font-bold text-accent-foreground shadow-sm transition-all duration-200 hover:bg-orange-600 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
      >
        {label}
        <ChevronDown
          size={14}
          className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>
    );
  }

  return (
    <button
      ref={buttonRef}
      type="button"
      aria-haspopup="menu"
      aria-expanded={open}
      aria-controls={controlsId}
      onClick={onToggle}
      onKeyDown={onKeyDown}
      className={`inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
        solid
          ? "text-foreground hover:bg-muted"
          : "text-white/90 hover:bg-white/10 hover:text-white"
      }`}
    >
      {label}
      <ChevronDown
        size={14}
        className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        aria-hidden
      />
    </button>
  );
}

/** Desktop header Login / Register popovers. */
export function AuthEntryDesktop({ solid }: { solid: boolean }) {
  const [open, setOpen] = useState<PanelKind>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const loginBtnRef = useRef<HTMLButtonElement>(null);
  const registerBtnRef = useRef<HTMLButtonElement>(null);
  const baseId = useId();
  const loginPanelId = `${baseId}-login-menu`;
  const registerPanelId = `${baseId}-register-menu`;

  const close = useCallback(() => setOpen(null), []);
  useDismissible(open !== null, close, rootRef);

  const onTriggerKey = (kind: "login" | "register") => (e: ReactKeyboardEvent<HTMLButtonElement>) => {
    if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setOpen(kind);
    }
  };

  return (
    <div ref={rootRef} className="hidden lg:flex items-center gap-1.5 relative">
      <div className="relative">
        <AuthTrigger
          label="Login"
          open={open === "login"}
          solid={solid}
          controlsId={loginPanelId}
          onToggle={() => setOpen((v) => (v === "login" ? null : "login"))}
          onKeyDown={onTriggerKey("login")}
          buttonRef={loginBtnRef}
        />
        {open === "login" && (
          <AuthPanel kind="login" id={loginPanelId} onClose={close} />
        )}
      </div>

      <div className="relative">
        <AuthTrigger
          label="Register"
          open={open === "register"}
          solid={solid}
          accent
          controlsId={registerPanelId}
          onToggle={() => setOpen((v) => (v === "register" ? null : "register"))}
          onKeyDown={onTriggerKey("register")}
          buttonRef={registerBtnRef}
        />
        {open === "register" && (
          <AuthPanel kind="register" id={registerPanelId} onClose={close} />
        )}
      </div>
    </div>
  );
}

/** Mobile menu Login / Register expandable cards. */
export function AuthEntryMobile({ onNavigated }: { onNavigated?: () => void }) {
  const [open, setOpen] = useState<PanelKind>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const baseId = useId();
  const loginPanelId = `${baseId}-m-login`;
  const registerPanelId = `${baseId}-m-register`;

  const close = useCallback(() => {
    setOpen(null);
    onNavigated?.();
  }, [onNavigated]);

  useDismissible(open !== null, () => setOpen(null), rootRef);

  return (
    <div ref={rootRef} className="pt-3 space-y-2 border-t border-border mt-2">
      <p className="px-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        Account
      </p>

      <div>
        <button
          type="button"
          aria-haspopup="menu"
          aria-expanded={open === "login"}
          aria-controls={loginPanelId}
          onClick={() => setOpen((v) => (v === "login" ? null : "login"))}
          className="flex w-full items-center justify-between rounded-xl border border-border bg-card px-3.5 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Login
          <ChevronDown
            size={16}
            className={`text-muted-foreground transition-transform duration-200 ${open === "login" ? "rotate-180" : ""}`}
            aria-hidden
          />
        </button>
        {open === "login" && (
          <AuthPanel kind="login" id={loginPanelId} onClose={close} mobile />
        )}
      </div>

      <div>
        <button
          type="button"
          aria-haspopup="menu"
          aria-expanded={open === "register"}
          aria-controls={registerPanelId}
          onClick={() => setOpen((v) => (v === "register" ? null : "register"))}
          className="flex w-full items-center justify-between rounded-xl bg-accent px-3.5 py-3 text-sm font-bold text-accent-foreground shadow-sm transition-colors hover:bg-orange-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          Register
          <ChevronDown
            size={16}
            className={`transition-transform duration-200 ${open === "register" ? "rotate-180" : ""}`}
            aria-hidden
          />
        </button>
        {open === "register" && (
          <AuthPanel kind="register" id={registerPanelId} onClose={close} mobile />
        )}
      </div>
    </div>
  );
}

export const AUTH_ENTRY_TARGETS = ERP;
