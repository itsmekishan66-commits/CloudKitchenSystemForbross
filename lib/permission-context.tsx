"use client";

import { createContext, useContext, ReactNode } from "react";

const PermissionsContext = createContext<string[]>([]);

export function PermissionsProvider({
  permissions,
  children,
}: {
  permissions: string[];
  children: ReactNode;
}) {
  return (
    <PermissionsContext.Provider value={permissions}>
      {children}
    </PermissionsContext.Provider>
  );
}

export function usePermissions() {
  return useContext(PermissionsContext);
}
