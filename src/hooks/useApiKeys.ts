import { useState, useEffect } from 'react';

export interface ApiKeys {
  threatFox: string;
  alienVault: string;
}

const DEFAULT_KEYS: ApiKeys = {
  threatFox: '',
  alienVault: ''
};

export const useApiKeys = () => {
  const [keys, setKeys] = useState<ApiKeys>(DEFAULT_KEYS);

  useEffect(() => {
    const saved = localStorage.getItem('threat_intel_api_keys');
    if (saved) {
      setKeys(JSON.parse(saved));
    }
  }, []);

  const updateKey = (service: keyof ApiKeys, value: string) => {
    const updated = { ...keys, [service]: value };
    setKeys(updated);
    localStorage.setItem('threat_intel_api_keys', JSON.stringify(updated));
  };

  return { keys, updateKey };
};

// Synchronous getter for use inside non-React native fetch functions
export const getActiveApiKeys = (): ApiKeys => {
  const saved = localStorage.getItem('threat_intel_api_keys');
  return saved ? JSON.parse(saved) : DEFAULT_KEYS;
};
