import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react"

export type ToastType = "success" | "warning" | "error" | "info" | "loading"

export interface Toast {
  id: string
  type: ToastType
  message: string
  description?: string
  action?: { label: string onClick: () => void }
  duration?: number // ms; 0 = persist until dismissed
  dismissible?: boolean
}

interface ToastContextValue {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, "id">) => string
  removeToast: (id: string) => void
  success: (message: string, opts?: Partial<Toast>) => string
  warning: (message: string, opts?: Partial<Toast>) => string
  error: (message: string, opts?: Partial<Toast>) => string
  info: (message: string, opts?: Partial<Toast>) => string
  loading: (message: string, opts?: Partial<Toast>) => string
  dismiss: (id: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const removeToast = useCallback((id: string) => {
    setToasts((ts) => ts.filter((t) => t.id !== id))
  }, [])

  const addToast = useCallback(
    (toast: Omit<Toast, "id">): string => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
      const t: Toast = {
        dismissible: true,
        duration: toast.type === "loading" ? 0 : 4500,
        ...toast,
        id,
      }
      setToasts((ts) => [...ts.slice(-4), t]) // cap at 5 visible
      if (t.duration && t.duration > 0) {
        setTimeout(() => removeToast(id), t.duration)
      }
      return id
    },
    [removeToast],
  )

  const make = (type: ToastType) => (message: string, opts?: Partial<Toast>) =>
    addToast({ type, message, ...opts })

  return (
    <ToastContext.Provider
      value={{
        toasts,
        addToast,
        removeToast,
        success: make("success"),
        warning: make("warning"),
        error: make("error"),
        info: make("info"),
        loading: make("loading"),
        dismiss: removeToast,
      }}
    >
      {children}
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>")
  return ctx
}
