export interface NewsItem {
  title: string;
  pubDate: string;
  link: string;
  guid: string;
  author: string;
  thumbnail: string;
  description: string;
  source: string;
}

import { getActiveFeeds } from '../hooks/useFeeds';
import { MOCK_NEWS } from './mockData';

const RSS2JSON_ENDPOINT = '/api/rss';

export const fetchLatestNews = async (): Promise<NewsItem[]> => {
  try {
    const feeds = getActiveFeeds();
    const fetchPromises = feeds.map(async (feed) => {
      try {
        const resp = await fetch(`${RSS2JSON_ENDPOINT}?rss_url=${encodeURIComponent(feed.url)}`);
        if (!resp.ok) return MOCK_NEWS.filter(n => n.source === feed.name);
        const json = await resp.json();
        if (json.status === 'ok') {
          return json.items.map((item: any) => ({
            ...item,
            source: feed.name
          }));
        }
        return MOCK_NEWS.filter(n => n.source === feed.name) || MOCK_NEWS;
      } catch(e) { return MOCK_NEWS; }
    });

    const results = await Promise.all(fetchPromises);
    const allNews = results.flat().sort((a, b) => {
      return new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime();
    });

    return allNews.length > 0 ? allNews.slice(0, 15) : MOCK_NEWS as any;
  } catch (error) {
    console.error('Error fetching RSS feeds:', error);
    return MOCK_NEWS as any;
  }
};
