import { useEffect } from 'react';

/**
 * Hook to lock body scroll and prevent layout shift from scrollbar
 * Used by dialogs, modals, and other overlays
 */
export function useScrollLock(isLocked: boolean) {
  useEffect(() => {
    if (!isLocked) return;

    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;
    
    // Calculate scrollbar width
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    
    // Lock scroll and compensate for scrollbar
    document.body.style.overflow = 'hidden';
    document.body.setAttribute('data-scroll-locked', 'true');
    
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
      document.body.style.setProperty('--removed-body-scroll-bar-size', `${scrollbarWidth}px`);
    }

    return () => {
      // Restore original state
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
      document.body.removeAttribute('data-scroll-locked');
      document.body.style.removeProperty('--removed-body-scroll-bar-size');
    };
  }, [isLocked]);
}

export default useScrollLock;
