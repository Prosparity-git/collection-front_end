
import { useState, useCallback, useRef, useEffect } from 'react';

export const useDebouncedAPI = <T,>(
  apiFunction: () => Promise<T>,
  debounceMs: number = 300
) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const timeoutRef = useRef<NodeJS.Timeout>();
  const cancelledRef = useRef(false);
  const requestIdRef = useRef(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  const call = useCallback(async () => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    // Increment request ID to handle race conditions
    const currentRequestId = ++requestIdRef.current;

    // Reset error state
    setError(null);
    
    // Set up debounced execution
    timeoutRef.current = setTimeout(async () => {
      if (cancelledRef.current || currentRequestId !== requestIdRef.current) return;
      
      setLoading(true);
      
      try {
        const result = await apiFunction();
        
        // Only update state if this is still the latest request
        if (!cancelledRef.current && currentRequestId === requestIdRef.current) {
          setData(result);
        }
      } catch (err) {
        if (!cancelledRef.current && currentRequestId === requestIdRef.current) {
          console.error('Debounced API call failed:', err);
          
          // Improved error handling
          if (err instanceof Error) {
            if (err.name === 'AbortError') {
              console.log('Request was cancelled');
              return;
            }
            
            // Check for specific error types
            if (err.message.includes('400') || err.message.includes('Bad Request')) {
              setError(new Error('Invalid request parameters. Please check your filters and try again.'));
            } else if (err.message.includes('Failed to fetch') || err.message.includes('network')) {
              setError(new Error('Network error. Please check your connection and retry.'));
            } else {
              setError(err);
            }
          } else {
            setError(new Error('Unknown error occurred'));
          }
        }
      } finally {
        if (!cancelledRef.current && currentRequestId === requestIdRef.current) {
          setLoading(false);
        }
      }
    }, debounceMs);
  }, [apiFunction, debounceMs]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancelledRef.current = true;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
    requestIdRef.current = 0;
  }, []);

  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    cancelledRef.current = true;
    setLoading(false);
  }, []);

  return { data, loading, error, call, reset, cancel };
};
