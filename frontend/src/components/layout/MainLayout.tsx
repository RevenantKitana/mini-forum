import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { RightSidebar } from './RightSidebar';
import { PinnedPostsModal } from '@/components/common/PinnedPostsModal';
import { useEffect, useState } from 'react';
import { useSidebar } from '@/contexts/SidebarContext';
import { useMediaQuery } from '@/hooks/useResponsive';
import { Button } from '@/app/components/ui/button';
import { ChevronLeft, ChevronRight, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/app/components/ui/tooltip';

export function MainLayout() {
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
    <div className="h-screen flex flex-col overflow-hidden bg-muted/30">
      <Header />
      <div className="flex-1 overflow-hidden">
        {/* Mobile-optimized spacing: gap-3 → gap-4, py-3 → py-4, px-3 → px-4 */}
        <div className="w-full h-full flex gap-3 md:gap-4 py-3 md:py-4 px-3 md:px-4">
          {/* Left Sidebar - responsive width using CSS variables, smart hiding with collapse support */}
          {showLeftSidebar && !isLandscapeMobile && (
            <aside 
              className={cn(
                "h-full hidden md:block overflow-hidden",
                "transition-[width,opacity,transform] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
                isLeftSidebarCollapsed 
                  ? "w-0 opacity-0 scale-x-0 origin-left pointer-events-none" 
                  : "sidebar-left opacity-100 scale-x-100 origin-left"
              )}
            >
              <div className="h-full bg-background rounded-lg border shadow-sm overflow-hidden relative">
                <Sidebar />
                {/* Collapse button inside sidebar */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 h-7 w-7 opacity-60 hover:opacity-100 transition-opacity"
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
            <div className="hidden md:flex items-start pt-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 shadow-sm animate-fade-in"
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
          
          {/* Main content - scrolls independently with smooth transitions */}
          <main className="flex-1 min-w-0 overflow-y-auto bg-background rounded-lg border shadow-sm p-4 md:p-5 scroll-smooth scrollbar-gutter-stable">
            <div className="animate-fade-in-up">
              <Outlet />
            </div>
          </main>
          {/* Right Sidebar - responsive width using CSS variables, smart hiding */}
          {showRightSidebar && (
            <aside className="sidebar-right h-full hidden xl:block">
              <div className="h-full bg-background rounded-lg border shadow-sm overflow-hidden animate-fade-in">
                <RightSidebar />
              </div>
            </aside>
          )}
        </div>
      </div>
      <PinnedPostsModal />
    </div>
  );
}
