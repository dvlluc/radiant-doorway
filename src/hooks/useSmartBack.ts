import { useNavigate, useLocation } from 'react-router-dom';

/**
 * Smart back navigation hook with fallback routes
 * Handles cases where browser history is empty or unavailable
 */
export function useSmartBack(fallbackPath?: string) {
  const navigate = useNavigate();
  const location = useLocation();

  const goBack = () => {
    // Check if there's meaningful navigation history (not just the initial page load)
    if (window.history.length > 2) {
      navigate(-1);
      return;
    }

    // Provide intelligent fallbacks based on current path
    const path = location.pathname;
    
    if (fallbackPath) {
      navigate(fallbackPath);
    } else if (path.startsWith('/events/')) {
      navigate('/events');
    } else if (path.startsWith('/jobs/')) {
      navigate('/jobs');
    } else if (path.startsWith('/professional/') || path.startsWith('/profile/')) {
      navigate('/directory');
    } else if (path.startsWith('/booking/')) {
      navigate('/directory');
    } else if (path.startsWith('/my-tickets')) {
      navigate('/events');
    } else if (path.startsWith('/ticket-scanner')) {
      navigate('/events');
    } else if (path.startsWith('/account')) {
      navigate('/directory');
    } else {
      navigate('/directory');
    }
  };

  return goBack;
}
