import { useState, useEffect, useCallback } from 'react';
import { getData, setData } from '../utils/storage';

export function useStorage<T>(key: string, fallback: T): [T, (val: T) => void, boolean] {
  const [value, setValue] = useState<T>(fallback);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    getData(key, fallback).then((v) => {
      if (mounted) {
        setValue(v);
        setLoading(false);
      }
    });
    return () => { mounted = false; };
  }, [key]);

  const update = useCallback((val: T) => {
    setValue(val);
    setData(key, val);
  }, [key]);

  return [value, update, loading];
}
