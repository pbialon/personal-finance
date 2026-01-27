'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

const STORAGE_KEY = 'sidebar-expanded';

interface SidebarContextType {
  isExpanded: boolean;
  setIsExpanded: (expanded: boolean) => void;
}

const SidebarContext = createContext<SidebarContextType>({
  isExpanded: false,
  setIsExpanded: () => {},
});

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [isExpanded, setIsExpandedState] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) {
      setIsExpandedState(stored === 'true');
    }
  }, []);

  // Save to localStorage and update state
  const setIsExpanded = (expanded: boolean) => {
    setIsExpandedState(expanded);
    localStorage.setItem(STORAGE_KEY, String(expanded));
  };

  return (
    <SidebarContext.Provider value={{ isExpanded, setIsExpanded }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  return useContext(SidebarContext);
}
