
import { useState, useEffect, useCallback } from 'react';

interface PersistedState {
  filters?: any;
  searchTerm?: string;
  selectedApplicationId?: string;
  scrollPosition?: number;
  currentPage?: number;
  lastActiveTimestamp?: number;
}

export const useStatePersistence = () => {
  const [isRestoringState, setIsRestoringState] = useState(false);

  // Save state to localStorage
  const saveState = useCallback((key: string, data: any) => {
    try {
      const stateToSave = {
        ...data,
        lastActiveTimestamp: Date.now()
      };
      localStorage.setItem(`prosparity_${key}`, JSON.stringify(stateToSave));
    } catch (error) {
      console.warn('Failed to save state to localStorage:', error);
    }
  }, []);

  // Load state from localStorage
  const loadState = useCallback((key: string): any => {
    try {
      const saved = localStorage.getItem(`prosparity_${key}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        
        // Check if state is not too old (24 hours)
        const age = Date.now() - (parsed.lastActiveTimestamp || 0);
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours
        
        if (age < maxAge) {
          return parsed;
        } else {
          // Clean up old state
          localStorage.removeItem(`prosparity_${key}`);
        }
      }
    } catch (error) {
      console.warn('Failed to load state from localStorage:', error);
    }
    return null;
  }, []);

  // Save scroll position
  const saveScrollPosition = useCallback((position: number) => {
    saveState('scroll_position', { position });
  }, [saveState]);

  // Restore scroll position
  const restoreScrollPosition = useCallback(() => {
    const saved = loadState('scroll_position');
    if (saved?.position) {
      setTimeout(() => {
        window.scrollTo(0, saved.position);
      }, 100);
    }
  }, [loadState]);

  // Save application filters and search
  const saveFiltersState = useCallback((filters: any, searchTerm: string, currentPage: number) => {
    saveState('filters_state', {
      filters,
      searchTerm,
      currentPage
    });
  }, [saveState]);

  // Restore filters state
  const restoreFiltersState = useCallback(() => {
    return loadState('filters_state');
  }, [loadState]);

  // Save selected application
  const saveSelectedApplication = useCallback((applicationId: string | null) => {
    if (applicationId) {
      saveState('selected_application', { applicationId });
    } else {
      localStorage.removeItem('prosparity_selected_application');
    }
  }, [saveState]);

  // Restore selected application
  const restoreSelectedApplication = useCallback(() => {
    const saved = loadState('selected_application');
    return saved?.applicationId || null;
  }, [loadState]);

  // Clean up old states
  const cleanupOldStates = useCallback(() => {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('prosparity_')) {
        const saved = loadState(key.replace('prosparity_', ''));
        // loadState will automatically remove old entries
      }
    });
  }, [loadState]);

  useEffect(() => {
    // Clean up old states on app start
    cleanupOldStates();
  }, [cleanupOldStates]);

  return {
    saveState,
    loadState,
    saveScrollPosition,
    restoreScrollPosition,
    saveFiltersState,
    restoreFiltersState,
    saveSelectedApplication,
    restoreSelectedApplication,
    isRestoringState,
    setIsRestoringState
  };
};
