"use client";
import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";

interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info";
}

interface ConfirmContextType {
  confirm: (options: ConfirmOptions | string) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextType>({
  confirm: () => Promise.resolve(false),
});

export function useConfirm() {
  return useContext(ConfirmContext).confirm;
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions>({ message: "" });
  const resolveRef = useRef<(value: boolean) => void>(() => {});

  const confirm = useCallback((opts: ConfirmOptions | string): Promise<boolean> => {
    const resolved: ConfirmOptions = typeof opts === "string" ? { message: opts } : opts;
    setOptions({
      title: resolved.title ?? "Confirm",
      message: resolved.message,
      confirmText: resolved.confirmText ?? "Confirm",
      cancelText: resolved.cancelText ?? "Cancel",
      variant: resolved.variant ?? "danger",
    });
    setOpen(true);
    return new Promise((resolve) => {
      resolveRef.current = resolve;
    });
  }, []);

  function handleConfirm() {
    setOpen(false);
    resolveRef.current(true);
  }

  function handleCancel() {
    setOpen(false);
    resolveRef.current(false);
  }

  const variantStyles = {
    danger: { confirm: "bg-red-600 hover:bg-red-700", icon: "text-red-600" },
    warning: { confirm: "bg-amber-600 hover:bg-amber-700", icon: "text-amber-600" },
    info: { confirm: "bg-blue-600 hover:bg-blue-700", icon: "text-blue-600" },
  };

  const styles = variantStyles[options.variant ?? "danger"];

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl p-6 mx-4">
            <div className="flex items-start gap-4">
              <div className={`shrink-0 ${styles.icon}`}>
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-slate-800">{options.title}</h3>
                <p className="mt-1 text-sm text-slate-600">{options.message}</p>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={handleCancel}
                className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                {options.cancelText}
              </button>
              <button onClick={handleConfirm}
                className={`rounded-xl px-5 py-2.5 text-sm font-semibold text-white ${styles.confirm}`}
              >
                {options.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}
