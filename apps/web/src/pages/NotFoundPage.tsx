import { Link } from "react-router";

export default function NotFoundPage() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 p-6 text-center">
      <p className="text-[28px] font-black text-slate-300">404</p>
      <h1 className="text-[16px] font-bold text-slate-800">Page not found</h1>
      <p className="text-[11px] text-slate-500 max-w-sm">
        That route is not part of the TravelOS ERP shell. Return to the dashboard or open a case from the sidebar.
      </p>
      <Link
        to="/"
        className="mt-2 px-4 py-2 rounded-lg text-[11px] font-bold text-white"
        style={{ background: "linear-gradient(135deg,#F59E0B,#B45309)" }}
      >
        Go to dashboard
      </Link>
    </div>
  );
}
