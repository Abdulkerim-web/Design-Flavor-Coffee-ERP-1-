/**
 * Client-side auth context — mock only.
 *
 * PRODUCTION TODO:
 *   - Replace login() with POST /auth/login → receive a short-lived JWT
 *   - Store the JWT in an httpOnly cookie set by the server (never localStorage)
 *   - currentUser should be populated by /auth/me on app boot (useEffect)
 *   - Add token refresh logic and 401-interceptor in your HTTP client
 *   - Rate-limiting / lockout-after-N-failures must live server-side
 *
 * This context intentionally stores no credentials in memory — only the
 * safe-to-expose user profile (id, name, email, role, avatar).
 */

import { createContext, useContext, useState, type ReactNode } from "react"
import type { RoleId } from "../lib/rbac"
import { apiRequest, setGlobalUserRole } from "../services/api"

import { INITIAL_USERS } from "../lib/rbac"

export interface AuthUser {
  id: string
  name: string
  email: string
  role: RoleId
  avatar?: string
  avatarColor?: string
  department?: string
  permissions?: string[]
}

export type LoginResult = { ok: true user: AuthUser } | {
  ok: false
  error: "unknown-email" | "disabled" | "invalid-password"
}

interface AuthContextValue {
  currentUser: AuthUser | null
  login: (email: string, password: string) => Promise<LoginResult>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue>({
  currentUser: null,
  login: async () => ({ ok: false, error: "unknown-email" }),
  logout: () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null)

  const login = async (
    email: string,
    password: string,
  ): Promise<LoginResult> => {
    try {
      // First try the real backend
      const data = await apiRequest<{ user: AuthUser token: string }>(
        "/auth/login",
        "POST",
        { username: email, password },
      )

      // Ensure the correct role is applied based on the email provided
      const demoUser = INITIAL_USERS.find(u => u.email === email)
      const finalRole = demoUser ? demoUser.role : (data.user.role ?? "general-manager")

      const user: AuthUser = {
        id: data.user.id,
        name: data.user.name || data.user.email,
        email: data.user.email,
        role: finalRole as RoleId,
        avatar: data.user.avatar || "https://i.pravatar.cc/150?u=" + data.user.id,
        avatarColor: data.user.avatarColor || "bg-blue-500",
        department: data.user.department || "Staff",
        permissions: data.user.permissions,
      }

      setCurrentUser(user)
      setGlobalUserRole(user.role)
      return { ok: true, user }
    } catch (e: any) {
      console.warn("Backend login failed or unreachable, falling back to local demo users", e)
      
      // Fallback for Vercel deployment where backend is unreachable
      const fallbackUser = INITIAL_USERS.find(u => u.email === email)
      
      if (fallbackUser && (password === "password123" || password === "password" || password === "demo")) {
        const user: AuthUser = {
          id: fallbackUser.id,
          name: fallbackUser.name,
          email: fallbackUser.email,
          role: fallbackUser.role,
          avatar: fallbackUser.avatar,
          avatarColor: fallbackUser.avatarColor,
          department: fallbackUser.department,
          permissions: ["*"],
        }
        setCurrentUser(user)
        setGlobalUserRole(user.role)
        return { ok: true, user }
      }

      return { ok: false, error: "invalid-password" }
    }
  }

  const logout = async () => {
    try {
      await apiRequest("/auth/logout", "POST")
    } catch (e) {}
    setCurrentUser(null)
  }

  return (
    <AuthContext.Provider value={{ currentUser, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
