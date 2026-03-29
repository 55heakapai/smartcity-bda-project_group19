import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const BASE = 'http://localhost:3001/api';

export function useApi(endpoint, interval = 5000) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetch = useCallback(async () => {
    try {
      const res = await axios.get(`${BASE}${endpoint}`);
      setData(res.data);
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  useEffect(() => {
    fetch();
    if (interval) {
      const id = setInterval(fetch, interval);
      return () => clearInterval(id);
    }
  }, [fetch, interval]);

  return { data, loading, error, refetch: fetch };
}

export const api = {
  get: (path) => axios.get(`${BASE}${path}`).then(r => r.data),
};
