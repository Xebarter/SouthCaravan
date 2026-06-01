'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  type ReactNode,
} from 'react'

type DashboardNavApi = {
  registerOpenHandler: (handler: (() => void) | null) => void
  openNav: () => void
}

const DashboardNavContext = createContext<DashboardNavApi | null>(null)

export function DashboardNavProvider({ children }: { children: ReactNode }) {
  const handlerRef = useRef<(() => void) | null>(null)

  const registerOpenHandler = useCallback((handler: (() => void) | null) => {
    handlerRef.current = handler
  }, [])

  const openNav = useCallback(() => {
    handlerRef.current?.()
  }, [])

  return (
    <DashboardNavContext.Provider value={{ registerOpenHandler, openNav }}>
      {children}
    </DashboardNavContext.Provider>
  )
}

export function useDashboardNav() {
  return useContext(DashboardNavContext)
}

/** Registers a mobile workspace menu opener (hamburger sheet) with the global Header. */
export function useRegisterDashboardNav(open: () => void) {
  const api = useDashboardNav()

  useEffect(() => {
    if (!api) return
    api.registerOpenHandler(open)
    return () => api.registerOpenHandler(null)
  }, [api, open])
}
