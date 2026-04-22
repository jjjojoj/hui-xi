import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  SECURITY NOTICE: Auth Token Storage                        ║
 * ╠══════════════════════════════════════════════════════════════╣
 * ║                                                              ║
 * ║  The auth token is currently stored in localStorage via      ║
 * ║  Zustand's persist middleware. This has the following        ║
 * ║  security implications:                                      ║
 * ║                                                              ║
 * ║  1. XSS VULNERABILITY: Any JavaScript running on the page   ║
 * ║     (e.g. from a compromised third-party script) can read   ║
 * ║     the token from localStorage.                             ║
 * ║                                                              ║
 * ║  2. PERSISTENCE: The token survives browser restarts and    ║
 * ║     tab closures, which is convenient but means an          ║
 * ║     attacker with physical access to the device can read    ║
 * ║     it.                                                      ║
 * ║                                                              ║
 * ║  3. NO EXPIRY ENFORCEMENT: The token has a 7-day server-   ║
 * ║     side expiry (set in loginTeacher.ts), but the client    ║
 * ║     doesn't proactively check or clear expired tokens.      ║
 * ║                                                              ║
 * ║  RECOMMENDATIONS FOR PRODUCTION:                            ║
 * ║  - Store tokens in httpOnly cookies (set by server) to     ║
 * ║    prevent XSS access. This is the gold standard.           ║
 * ║  - Use short-lived access tokens + refresh tokens.         ║
 * ║  - Implement Content-Security-Policy headers to reduce      ║
 * ║    XSS risk.                                                 ║
 * ║  - Add a client-side token expiry check that auto-logs      ║
 * ║    out when the token expires.                               ║
 * ║  - Consider using a BFF (Backend-For-Frontend) pattern      ║
 * ║    to keep tokens entirely server-side.                      ║
 * ║                                                              ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

type Teacher = {
  id: number;
  phoneNumber: string;
  name: string;
};

type Parent = {
  id: number;
  phoneNumber: string;
  name: string;
  children?: {
    id: number;
    name: string;
    schoolName: string;
    grade: string;
    className: string;
  }[];
};

type UserRole = "teacher" | "parent";

type AuthStore = {
  authToken: string | null;
  userRole: UserRole | null;
  teacher: Teacher | null;
  parent: Parent | null;
  isAuthenticated: boolean;
  setTeacherAuth: (token: string, teacher: Teacher) => void;
  setParentAuth: (token: string, parent: Parent) => void;
  logout: () => void;
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      authToken: null,
      userRole: null,
      teacher: null,
      parent: null,
      isAuthenticated: false,
      setTeacherAuth: (token: string, teacher: Teacher) =>
        set({
          authToken: token,
          userRole: "teacher",
          teacher,
          parent: null,
          isAuthenticated: true,
        }),
      setParentAuth: (token: string, parent: Parent) =>
        set({
          authToken: token,
          userRole: "parent",
          parent,
          teacher: null,
          isAuthenticated: true,
        }),
      logout: () =>
        set({
          authToken: null,
          userRole: null,
          teacher: null,
          parent: null,
          isAuthenticated: false,
        }),
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => localStorage),
      // SECURITY: Ensure all sensitive fields are included in the serialized state
      // so they are properly cleared on logout. Zustand persist uses partialize
      // to select which fields to store — by default all are stored.
      // On logout, all fields are set to null/false, and Zustand persist
      // will write that empty state to localStorage on the next state change.
    },
  ),
);
