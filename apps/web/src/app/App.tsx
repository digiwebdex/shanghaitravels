import { RouterProvider } from "react-router";
import { Toaster } from "sonner";
import { AuthProvider } from "@/auth/AuthProvider";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { router } from "@/app/routes";

export default function App() {
  return (
    <ErrorBoundary title="TravelOS failed to load">
      <AuthProvider>
        <RouterProvider router={router} />
        <Toaster position="top-right" richColors closeButton />
      </AuthProvider>
    </ErrorBoundary>
  );
}
