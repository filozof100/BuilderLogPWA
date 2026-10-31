import { useEffect, useRef } from 'react';

// Mount already loads data; refresh only on a hidden -> visible transition.
export function subscribeToForeground(onResume, target = document) {
  let previous = target.visibilityState;
  function changed() {
    const next = target.visibilityState;
    const resumed = previous === 'hidden' && next === 'visible';
    previous = next;
    if (resumed) onResume();
  }
  target.addEventListener('visibilitychange', changed);
  return () => target.removeEventListener('visibilitychange', changed);
}

export default function useForegroundRefresh(onResume, enabled = true) {
  const latest = useRef({ onResume, enabled });
  latest.current = { onResume, enabled };
  useEffect(() => subscribeToForeground(() => {
    if (latest.current.enabled) latest.current.onResume();
  }), []);
}
