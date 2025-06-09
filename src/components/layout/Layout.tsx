import { ReactNode, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import TopBar from './TopBar';
import Footer from './Footer';
import { trackPageView, getOrCreateSessionId, updateTimeSpent } from '../../utils/analyticsUtils';

type LayoutProps = {
  children: ReactNode;
};

const Layout = ({ children }: LayoutProps) => {
  const location = useLocation();
  const [pageLoadTime, setPageLoadTime] = useState<number>(Date.now());
  const [sessionId] = useState<string>(getOrCreateSessionId());
  
  // Track page view when path changes
  useEffect(() => {
    const path = location.pathname;
    const isAdmin = path.startsWith('/admin');
    
    // Reset page load time
    setPageLoadTime(Date.now());
    
    // Track page view
    trackPageView(path, isAdmin);
    
    // Update time spent when user leaves the page
    return () => {
      const timeSpent = Math.floor((Date.now() - pageLoadTime) / 1000);
      if (timeSpent > 0) {
        updateTimeSpent(sessionId, path, timeSpent);
      }
    };
  }, [location.pathname]);
  
  // Update time spent when user leaves the site
  useEffect(() => {
    const handleBeforeUnload = () => {
      const timeSpent = Math.floor((Date.now() - pageLoadTime) / 1000);
      if (timeSpent > 0) {
        // Use sendBeacon for more reliable tracking on page unload
        const path = location.pathname;
        const data = JSON.stringify({
          session_id: sessionId,
          path,
          time_spent: timeSpent
        });
        
        navigator.sendBeacon(
          `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/page_views?session_id=eq.${encodeURIComponent(sessionId)}&path=eq.${encodeURIComponent(path)}&order=created_at.desc&limit=1`,
          data
        );
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [pageLoadTime, location.pathname, sessionId]);

  return (
    <div className="flex flex-col min-h-screen">
      <TopBar />
      <main className="flex-grow">
        {children}
      </main>
      <Footer />
    </div>
  );
};

export default Layout;