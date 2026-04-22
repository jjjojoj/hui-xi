import { useEffect, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuthStore } from "~/stores/authStore";
import { Loader2 } from "lucide-react";

/**
 * Auth guard wrapper component.
 * Shows a loading spinner while the Zustand persist store rehydrates from localStorage.
 * If the user is not authenticated after hydration, redirects to /auth.
 * If authenticated, renders children.
 */
export function RequireAuth({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const authToken = useAuthStore((s) => s.authToken);
  const userRole = useAuthStore((s) => s.userRole);

  useEffect(() => {
    // Only redirect when we are confident the store has hydrated.
    // After hydration, if not authenticated, redirect to /auth.
    // We detect hydration completion by checking that the store is no longer
    // in its default state. Because Zustand persist hydrates synchronously
    // from localStorage on mount, by the time this effect fires the store
    // already has its persisted values (or the defaults if nothing was stored).
    if (!isAuthenticated || !authToken) {
      navigate({ to: "/auth" });
    }
  }, [isAuthenticated, authToken, navigate]);

  // While store hasn't hydrated yet, show spinner.
  // We detect "not yet hydrated" by checking if authToken is still null
  // while isAuthenticated hasn't been explicitly set to false after hydration.
  // The simplest reliable approach: if authToken is null and we haven't
  // explicitly confirmed unauthenticated, we wait briefly.
  // Actually, Zustand persist with localStorage hydrates synchronously before
  // the first render, so we don't need a separate hydration flag. We just check
  // auth state directly.
  if (!isAuthenticated || !authToken) {
    // Return null immediately — the useEffect above will navigate away.
    // But if somehow navigation is delayed, show a brief spinner.
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mr-3" />
          <span className="text-gray-600 text-lg">加载中...</span>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
