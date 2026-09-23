import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * ScrollToTop ensures that navigating to any route automatically
 * scrolls the viewport to the absolute top of the page.
 */
export function ScrollToTop() {
  const { pathname, search } = useLocation();

  useEffect(() => {
    try {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'instant'
      });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    } catch {
      window.scrollTo(0, 0);
    }
  }, [pathname, search]);

  return null;
}

export default ScrollToTop;
