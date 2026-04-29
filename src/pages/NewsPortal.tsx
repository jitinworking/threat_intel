import { API_BASE_URL, WS_BASE_URL } from '../config';
import React, { useState } from 'react';
import { Newspaper, ExternalLink, Calendar, ShieldAlert, Globe, Lock, Zap } from 'lucide-react';

const BACKEND = `${API_BASE_URL}`;

interface NewsItem {
  id: number;
  title: string;
  source: string;
  summary: string;
  url: string;
  category: string;
  published_at: string;
}

export const NewsPortal: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState('All');
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  React.useEffect(() => {
    fetch(`${BACKEND}/api/news`)
      .then(res => res.json())
      .then(data => {
        setNews(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch news:', err);
        setLoading(false);
      });
  }, []);

  const categories = ['All', ...Array.from(new Set(news.map(n => n.category)))];
  
  const filteredNews = activeCategory === 'All' 
    ? news 
    : news.filter(n => n.category === activeCategory);

  const extractIndicators = async (text: string) => {
    // Regex for IP and Domain
    const ipRegex = /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g;
    const domainRegex = /\b[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/g;
    
    const ips: string[] = text.match(ipRegex) || [];
    const rawDomains: string[] = text.match(domainRegex) || [];
    
    // Clean domains to prevent matching sentences
    const domains = rawDomains.filter(d => 
      d.includes('.') && 
      !d.startsWith('.') && 
      !d.endsWith('.') &&
      d.length > 5 && 
      !ips.includes(d) &&
      !d.toLowerCase().endsWith('com.') // crude sentence end catch
    );
    
    const allIocs = [
      ...ips.map(i => ({ ioc: i, type: 'ipv4' })), 
      ...domains.map(d => ({ ioc: d, type: 'domain' }))
    ];
    
    if (allIocs.length === 0) {
      alert("No distinct indicators found in this article.");
      return;
    }

    try {
      for (const indicator of allIocs) {
        await fetch(`${API_BASE_URL}/api/iocs`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ioc: indicator.ioc,
            ioc_type: indicator.type,
            threat_type: 'unknown',
            malware_printable: 'OSINT Extracted',
            confidence_level: 60,
            source: 'News Scraper',
            tags: ['osint', 'auto-ingest']
          })
        });
      }
      alert(`Scraping Complete.\nSuccessfully sent ${allIocs.length} indicators to the threat database:\n\n${allIocs.map(i => i.ioc).join('\n')}`);
    } catch (err) {
      alert(`Extracted ${allIocs.length} indicators:\n${allIocs.map(i => i.ioc).join('\n')}\n\nWarning: Database offline - local cache only.`);
    }
  };

  return (
    <div className="animate-fade-in flex flex-col gap-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            Cybersecurity News Portal
          </h1>
          <p className="text-muted text-sm mt-1">
            Latest intelligence, vulnerability notices, and industry updates
          </p>
        </div>
        <div className="flex gap-3 items-center">
          <button className="glass-panel px-4 py-2 flex items-center gap-2 hover:text-white transition-all text-sm font-medium">
            <Newspaper size={16} /> Subscribe to Digest
          </button>
        </div>
      </div>

      {/* Categories Toolbar */}
      <div className="glass-panel p-4 flex gap-4 items-center overflow-x-auto custom-scrollbar stagger-1">
        <span className="text-xs font-bold uppercase tracking-wider text-muted whitespace-nowrap px-2">Filter by Category</span>
        <div className="flex gap-2">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap border ${
                activeCategory === cat 
                  ? 'bg-primary/20 text-primary border-primary/40 shadow-lg shadow-primary/10' 
                  : 'bg-white/5 text-muted hover:text-white border-transparent hover:bg-white/10'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* News Grid */}
      <div className="grid gap-6 stagger-2" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))' }}>
        {loading ? (
          <div className="col-span-full py-12 text-center text-muted">
            <div className="flex justify-center items-center gap-3">
              <div className="w-5 h-5 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
              Fetching latest cybersecurity news...
            </div>
          </div>
        ) : filteredNews.length === 0 ? (
          <div className="col-span-full py-12 text-center text-muted italic">
            No news articles found for the selected category.
          </div>
        ) : (
          filteredNews.map(news => (
          <div key={news.id} className="glass-panel p-6 flex flex-col gap-4 hover:border-primary/30 transition-all group">
            <div className="flex justify-between items-start gap-4">
              <div className="flex items-center gap-2 px-2 py-1 rounded bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-tight w-fit">
                {news.category === 'Vulnerability' || news.category === 'APT/Vulnerability' ? <Lock size={14} className="text-danger" /> :
                 news.category === 'Cybercrime' ? <ShieldAlert size={14} className="text-warning" /> :
                 <Globe size={14} className="text-primary" />}
                 <span>{news.category}</span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted uppercase tracking-tighter whitespace-nowrap">
                <Calendar size={12} />
                {new Date(news.published_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
              </div>
            </div>
            
            <h3 className="text-lg font-bold leading-tight group-hover:text-blue-400 transition-colors">
              {news.title}
            </h3>
            
            <p className="text-sm text-muted line-clamp-3">
              {news.summary}
            </p>
            
            <div className="mt-auto pt-4 flex justify-between items-center border-t border-white/5">
              <button 
                onClick={() => extractIndicators(news.title + " " + news.summary)}
                className="flex items-center gap-1 text-xs font-bold text-purple-400 hover:text-purple-300 transition-colors bg-purple-500/10 hover:bg-purple-500/20 px-3 py-1.5 rounded border border-purple-500/20"
              >
                <Zap size={12} className="fill-purple-500/30" /> Extract Intel
              </button>
              <a href={news.url} className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors">
                Read article <ExternalLink size={12} />
              </a>
            </div>
          </div>
        )))}
      </div>
    </div>
  );
};
