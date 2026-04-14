import { useEffect, useCallback } from 'react';

interface UseInactivityPurgeProps {
  password: string;
  onPurge: (message: string) => void;
  timeoutMs?: number;
}

/**
 * Hook to automatically purge the master password after a period of inactivity.
 */
export const useInactivityPurge = ({
  password,
  onPurge,
  timeoutMs = 5 * 60 * 1000 // Default 5 minutes
}: UseInactivityPurgeProps) => {
  
  const resetTimer = useCallback(() => {
    // This function can be exposed if needed to manually reset
  }, []);

  useEffect(() => {
    if (!password) return;

    let timer: NodeJS.Timeout;

    const handleInactivity = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        onPurge('session_expired');
      }, timeoutMs);
    };

    // Events that reset the timer
    const activityEvents = ['mousemove', 'keydown', 'mousedown', 'touchstart'];
    
    const resetAndHandle = () => {
      handleInactivity();
    };

    activityEvents.forEach(event => {
      window.addEventListener(event, resetAndHandle);
    });

    // Initial trigger
    handleInactivity();

    return () => {
      if (timer) clearTimeout(timer);
      activityEvents.forEach(event => {
        window.removeEventListener(event, resetAndHandle);
      });
    };
  }, [password, onPurge, timeoutMs]);

  return { resetTimer };
};
