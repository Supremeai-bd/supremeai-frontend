import { useState, useEffect, useCallback } from 'react';

/**
 * URL Tab Router Hook
 * Synchronizes active tab state with URL query parameter (?tab=...) and hash,
 * preserving tab state across page refreshes and supporting browser Back/Forward history.
 */
export function useTabRouter(defaultTab: string = 'chat') {
  const getTabFromUrl = useCallback((): string => {
    try {
      const params = new URLSearchParams(window.location.search);
      const queryTab = params.get('tab');
      if (queryTab) return queryTab;

      const hash = window.location.hash.replace('#', '');
      if (hash) return hash;
    } catch {}
    return defaultTab;
  }, [defaultTab]);

  const [activeTab, setActiveTabState] = useState<string>(getTabFromUrl);

  const setTab = useCallback((tab: string, replace: boolean = false) => {
    setActiveTabState(tab);
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', tab);
      url.hash = tab;

      if (replace) {
        window.history.replaceState({ tab }, '', url.toString());
      } else {
        window.history.pushState({ tab }, '', url.toString());
      }
    } catch {}
  }, []);

  // Listen to browser Back / Forward buttons (popstate)
  useEffect(() => {
    const handlePopState = () => {
      const currentTab = getTabFromUrl();
      setActiveTabState(currentTab);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [getTabFromUrl]);

  return { activeTab, setActiveTab: setTab, setTab };
}
