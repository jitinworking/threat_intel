import { useState, useEffect } from 'react';

export interface CustomFeed {
  id: string;
  name: string;
  url: string;
}

const DEFAULT_FEEDS: CustomFeed[] = [
  { id: '1', name: 'The Hacker News', url: 'https://feeds.feedburner.com/TheHackersNews' },
  { id: '2', name: 'BleepingComputer', url: 'https://www.bleepingcomputer.com/feed/' },
  { id: '3', name: 'Krebs on Security', url: 'https://krebsonsecurity.com/feed/' }
];

export const useFeeds = () => {
  const [feeds, setFeeds] = useState<CustomFeed[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('threat_intel_feeds');
    if (saved) {
      setFeeds(JSON.parse(saved));
    } else {
      setFeeds(DEFAULT_FEEDS);
      localStorage.setItem('threat_intel_feeds', JSON.stringify(DEFAULT_FEEDS));
    }
  }, []);

  const addFeed = (name: string, url: string) => {
    const newFeed = { id: Date.now().toString(), name, url };
    const updated = [...feeds, newFeed];
    setFeeds(updated);
    localStorage.setItem('threat_intel_feeds', JSON.stringify(updated));
  };

  const removeFeed = (id: string) => {
    const updated = feeds.filter(f => f.id !== id);
    setFeeds(updated);
    localStorage.setItem('threat_intel_feeds', JSON.stringify(updated));
  };

  return { feeds, addFeed, removeFeed };
};

// Expose a synchronous way to get current feeds for standard fetch methods
export const getActiveFeeds = (): CustomFeed[] => {
  const saved = localStorage.getItem('threat_intel_feeds');
  return saved ? JSON.parse(saved) : DEFAULT_FEEDS;
};
