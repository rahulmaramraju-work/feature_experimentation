import { useCallback, useEffect, useState } from 'react';
import { api } from './api';

// Loads an API resource and exposes reload(); deps re-trigger the fetch.
export function useApi(path, deps = []) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await api(path));
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, ...deps]);
  useEffect(() => {
    load();
  }, [load]);
  return { data, setData, error, loading, reload: load };
}
