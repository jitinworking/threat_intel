import React, { useState, useEffect, useMemo } from 'react';
import { 
  Newspaper, ExternalLink, Calendar, ShieldAlert, Globe, Lock, 
  Zap, Search, CheckCircle2, AlertCircle, RefreshCw, Filter
} from 'lucide-react';
import { 
  PageHeader, Card, Button, Badge, Skeleton, EmptyState, Notification 
} from '../components/ui/design-system';
import { useInvestigation } from '../context/InvestigationContext';

import { BACKEND_URL } from '../config';

const BACKEND = BACKEND_URL;

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
  const { openInvestigation } = useInvestigation();
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [extractingId, setExtractingId] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'info' | 'error'; message: string } | null>(null);

  const fetchNews = () => {
    setLoading(true);
    fetch(`${BACKEND}/api/news`)
      .then(res => res.json())
      .then(data => {
        setNews(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch news:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchNews();
  }, []);

  const categories = useMemo(() => {
    return ['All', ...Array.from(new Set(news.map(n => n.category))).filter(Boolean)];
  }, [news]);

  const filteredNews = useMemo(() => {
    return news.filter(item => {
      const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
      const matchesSearch = !searchQuery.trim() || 
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.source.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [news, activeCategory, searchQuery]);

  const extractIndicators = async (item: NewsItem) => {
    setExtractingId(item.id);
    const text = `${item.title} ${item.summary}`;
    const ipRegex = /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g;
    const domainRegex = /\b[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/g;
    
    const ips: string[] = text.match(ipRegex) || [];
    const rawDomains: string[] = text.match(domainRegex) || [];
    
    const domains = rawDomains.filter(d => 
      d.includes('.') && 
      !d.startsWith('.') && 
      !d.endsWith('.') &&
      d.length > 5 && 
      !ips.includes(d) &&
      !d.toLowerCase().endsWith('com.') &&
      !d.toLowerCase().includes('github.com') &&
      !d.toLowerCase().includes('twitter.com')
    );
    
    const allIocs = [
      ...ips.map(i => ({ ioc: i, type: 'ipv4' })), 
      ...domains.map(d => ({ ioc: d, type: 'domain' }))
    ];
    
    if (allIocs.length === 0) {
      setFeedback({
        type: 'info',
        message: 'No distinct indicators found in this advisory content.'
      });
      setExtractingId(null);
      return;
    }

    try {
      let ingested = 0;
      for (const indicator of allIocs) {
        await fetch(`${BACKEND}/api/iocs`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ioc: indicator.ioc,
            ioc_type: indicator.type,
            threat_type: 'unknown',
            malware_printable: 'OSINT Extracted',
            confidence_level: 65,
            source: item.source || 'News Scraper',
            tags: ['osint', 'auto-ingest', item.category.toLowerCase()]
          })
        });
        ingested++;
      }
      setFeedback({
        type: 'success',
        message: `Extracted & ingested ${ingested} indicators into the IoC database.`
      });

      // Optionally auto-open the first indicator in universal drawer
      if (allIocs.length > 0) {
        openInvestigation({
          value: allIocs[0].ioc,
          type: allIocs[0].type as any,
          severity: 'medium',
          confidence: 65,
          source: item.source || 'OSINT Extracted',
          threatActor: item.category
        });
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        message: `Failed to write indicators to database. Local engine offline.`
      });
    } finally {
      setExtractingId(null);
    }
  };

  const getCategoryBadgeVariant = (cat: string) => {
    switch (cat?.toLowerCase()) {
      case 'vulnerability':
      case 'apt/vulnerability':
        return 'critical';
      case 'cybercrime':
        return 'warning';
      case 'malware':
        return 'high';
      default:
        return 'outline';
    }
  };

  return (
    <div className="p-6 flex flex-col gap-5 min-h-full">
      {/* ── WORKSPACE PAGE HEADER ── */}
      <PageHeader
        title="OSINT Feed"
        subtitle="Live open-source intelligence aggregator covering threat reports, advisories, and indicator extraction"
        actions={
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchNews}
              disabled={loading}
              className="gap-1.5 text-xs"
            >
              <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
              <span>Refresh Feed</span>
            </Button>
          </div>
        }
      />

      {/* Feedback banner */}
      {feedback && (
        <div className={`p-3 rounded-lg border text-xs flex items-center justify-between ${
          feedback.type === 'success' ? 'bg-success/10 border-success/30 text-success' :
          feedback.type === 'error' ? 'bg-critical/10 border-critical/30 text-critical' :
          'bg-primary/10 border-primary/30 text-primary'
        }`}>
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
            <span>{feedback.message}</span>
          </div>
          <button 
            onClick={() => setFeedback(null)} 
            className="text-text-muted hover:text-text cursor-pointer font-bold text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* ── SEARCH AND CATEGORY BAR ── */}
      <div className="bg-surface border border-border p-3.5 rounded-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-3 shadow-sm">
        <div className="flex items-center gap-2 overflow-x-auto max-w-full pb-1 md:pb-0">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-text-muted shrink-0 mr-1 flex items-center gap-1">
            <Filter size={11} /> Filter:
          </span>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors cursor-pointer shrink-0 border ${
                activeCategory === cat 
                  ? 'bg-primary text-white border-primary shadow-xs' 
                  : 'bg-surface-elevated text-text-secondary border-border hover:bg-surface-hover hover:text-text'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-64 shrink-0">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Filter articles..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-surface-elevated border border-border rounded pl-8 pr-3 py-1 text-xs text-text placeholder:text-text-muted focus:outline-none focus:border-primary/50"
          />
        </div>
      </div>

      {/* ── ARTICLES GRID ── */}
      {loading ? (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(n => (
            <div key={n} className="bg-surface border border-border rounded-lg p-5 flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-28" />
              </div>
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-14 w-full" />
              <div className="flex justify-between pt-3 border-t border-border">
                <Skeleton className="h-8 w-28" />
                <Skeleton className="h-8 w-24" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredNews.length === 0 ? (
        <div className="bg-surface border border-border rounded-lg p-10">
          <EmptyState
            title="No intelligence advisories found"
            description={searchQuery ? "No articles match your active search terms." : "No articles recorded in this category."}
            action={searchQuery ? (
              <Button size="sm" variant="outline" onClick={() => { setSearchQuery(''); setActiveCategory('All'); }}>
                Clear Filters
              </Button>
            ) : undefined}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {filteredNews.map(item => (
            <Card key={item.id} className="p-5 flex flex-col justify-between gap-4 hover:border-border-strong transition-colors">
              <div className="flex flex-col gap-2.5">
                <div className="flex justify-between items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Badge variant={getCategoryBadgeVariant(item.category) as any}>
                      {item.category || 'General OSINT'}
                    </Badge>
                    {item.source && (
                      <span className="text-[11px] font-mono text-text-muted">
                        via {item.source}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-text-muted font-mono shrink-0">
                    <Calendar size={11} />
                    <span>{new Date(item.published_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                </div>

                <h3 className="text-sm font-semibold text-text leading-snug tracking-tight">
                  {item.title}
                </h3>

                <p className="text-xs text-text-secondary leading-relaxed line-clamp-3">
                  {item.summary}
                </p>
              </div>

              <div className="pt-3 flex justify-between items-center border-t border-border mt-1">
                <Button 
                  size="sm"
                  variant="outline"
                  onClick={() => extractIndicators(item)}
                  disabled={extractingId === item.id}
                  className="gap-1.5 text-xs text-primary border-primary/30 hover:bg-primary/10"
                >
                  <Zap size={12} className={extractingId === item.id ? "animate-spin" : ""} />
                  <span>{extractingId === item.id ? 'Extracting...' : 'Extract Indicators'}</span>
                </Button>

                <a 
                  href={item.url} 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-medium text-text-secondary hover:text-text transition-colors"
                >
                  <span>Source Advisory</span>
                  <ExternalLink size={12} />
                </a>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
