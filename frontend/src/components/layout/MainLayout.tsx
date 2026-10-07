import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { RightSidebar } from './RightSidebar';
import { PinnedPostsModal } from '@/components/common/PinnedPostsModal';
import { useEffect, useState } from 'react';
import { useSidebar } from '@/contexts/SidebarContext';
import { useMediaQuery } from '@/hooks/useResponsive';
import { usePageTracking } from '@/hooks/usePageTracking';
import { Button } from '@/app/components/ui/button';
import { ChevronLeft, ChevronRight, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/app/components/ui/tooltip';

export function MainLayout() {
  usePageTracking();
  const { isLeftSidebarCollapsed, toggleLeftSidebar } = useSidebar();
  const isLandscapeMobile = useMediaQuery('(orientation: landscape) and (max-height: 500px)');
  
  // Smart sidebar visibility based on actual viewport width
  const [showLeftSidebar, setShowLeftSidebar] = useState(window.innerWidth >= 768);
  const [showRightSidebar, setShowRightSidebar] = useState(window.innerWidth >= 1280);

  useEffect(() => {
    const handleResize = () => {
      // Show left sidebar at md breakpoint (768px)
      setShowLeftSidebar(window.innerWidth >= 768);
      
      // Show right sidebar at xl breakpoint (1280px)
      setShowRightSidebar(window.innerWidth >= 1280);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background">
      <Header />
      <div className="flex-1 overflow-hidden flex w-full">
        {/* Left Sidebar - seamless docked column with smooth collapse */}
        {showLeftSidebar && !isLandscapeMobile && (
          <aside 
            className={cn(
              "h-full hidden md:flex flex-col border-r border-border/40 bg-background/40 overflow-hidden relative shrink-0",
              "transition-[width,opacity] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
              isLeftSidebarCollapsed 
                ? "w-0 opacity-0 pointer-events-none border-r-0" 
                : "sidebar-left opacity-100"
            )}
          >
            <div className="h-full w-full overflow-hidden relative">
              <Sidebar />
              {/* Collapse button inside sidebar */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-3 right-3 h-7 w-7 text-muted-foreground hover:text-foreground opacity-60 hover:opacity-100 transition-opacity rounded-lg"
                    onClick={toggleLeftSidebar}
                  >
                    <PanelLeftClose className="h-4 w-4" />
                    <span className="sr-only">Thu gọn sidebar</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">Thu gọn sidebar</TooltipContent>
              </Tooltip>
            </div>
          </aside>
        )}
        
        {/* Expand button when sidebar is collapsed */}
        {showLeftSidebar && !isLandscapeMobile && isLeftSidebarCollapsed && (
          <div className="hidden md:flex items-start p-2.5 border-r border-border/40 bg-background/40">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shadow-xs rounded-lg animate-fade-in hover:bg-muted/70"
                  onClick={toggleLeftSidebar}
                >
                  <PanelLeftOpen className="h-4 w-4" />
                  <span className="sr-only">Mở rộng sidebar</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Mở rộng sidebar</TooltipContent>
            </Tooltip>
          </div>
        )}
        
        {/* Main content - scrolls independently */}
        <main id="main-content" className="flex-1 min-w-0 flex flex-col overflow-hidden bg-background scroll-smooth scrollbar-gutter-stable">
          <div className="flex-1 overflow-y-auto">
            <Outlet />
          </div>
        </main>

        {/* Right Sidebar - seamless docked column */}
        {showRightSidebar && (
          <aside className="sidebar-right h-full hidden xl:flex flex-col border-l border-border/40 bg-background/40 shrink-0 overflow-hidden">
            <RightSidebar />
          </aside>
        )}
      </div>
      <PinnedPostsModal />
    </div>
  );
}
