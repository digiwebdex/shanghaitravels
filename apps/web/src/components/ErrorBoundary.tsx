import { Component, type ErrorInfo, type ReactNode } from "react";

type Props = { children: ReactNode; title?: string };
type State = { error: Error | null };

/** Catches render crashes so staff see a recovery UI instead of a blank screen. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[TravelOS ErrorBoundary]", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3 p-6 text-center" role="alert">
          <p className="text-[14px] font-bold text-slate-800">{this.props.title || "Something went wrong"}</p>
          <p className="text-[11px] text-slate-500 max-w-md">{this.state.error.message}</p>
          <button
            type="button"
            className="px-4 py-2 rounded-lg text-[11px] font-bold text-white"
            style={{ background: "linear-gradient(135deg,#F59E0B,#B45309)" }}
            onClick={() => {
              this.setState({ error: null });
              window.location.reload();
            }}
          >
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
