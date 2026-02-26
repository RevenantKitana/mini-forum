import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

interface SidebarContextType {
  isLeftSidebarCollapsed: boolean;
  isRightSidebarCollapsed: boolean;
  toggleLeftSidebar: () => void;
  toggleRightSidebar: () => void;
  collapseLeftSidebar: () => void;
  expandLeftSidebar: () => void;
  collapseRightSidebar: () => void;
  expandRightSidebar: () => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

const LEFT_SIDEBAR_KEY = 'left_sidebar_collapsed';
const RIGHT_SIDEBAR_KEY = 'right_sidebar_collapsed';

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [isLeftSidebarCollapsed, setIsLeftSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem(LEFT_SIDEBAR_KEY);
    return saved === 'true';
  });
  
  const [isRightSidebarCollapsed, setIsRightSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem(RIGHT_SIDEBAR_KEY);
    return saved === 'true';
  });

  // Persist left sidebar state
  useEffect(() => {
    localStorage.setItem(LEFT_SIDEBAR_KEY, String(isLeftSidebarCollapsed));
  }, [isLeftSidebarCollapsed]);

  // Persist right sidebar state
  useEffect(() => {
    localStorage.setItem(RIGHT_SIDEBAR_KEY, String(isRightSidebarCollapsed));
  }, [isRightSidebarCollapsed]);

  const toggleLeftSidebar = useCallback(() => {
    setIsLeftSidebarCollapsed(prev => !prev);
  }, []);

  const toggleRightSidebar = useCallback(() => {
    setIsRightSidebarCollapsed(prev => !prev);
  }, []);

  const collapseLeftSidebar = useCallback(() => {
    setIsLeftSidebarCollapsed(true);
  }, []);

  const expandLeftSidebar = useCallback(() => {
    setIsLeftSidebarCollapsed(false);
  }, []);

  const collapseRightSidebar = useCallback(() => {
    setIsRightSidebarCollapsed(true);
  }, []);

  const expandRightSidebar = useCallback(() => {
    setIsRightSidebarCollapsed(false);
  }, []);

  return (
    <SidebarContext.Provider
      value={{
        isLeftSidebarCollapsed,
        isRightSidebarCollapsed,
        toggleLeftSidebar,
        toggleRightSidebar,
        collapseLeftSidebar,
        expandLeftSidebar,
        collapseRightSidebar,
        expandRightSidebar,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
}
