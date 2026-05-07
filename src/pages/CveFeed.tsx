import { API_BASE_URL } from '../config';
import React, { useState, useEffect } from 'react';
import { ShieldAlert, ExternalLink, Search, Clock, Tag, AlertCircle } from 'lucide-react';

interface CVE {
  id: string;
  description: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  score: number;
  publishedDate: string;
  vendor: string;
  status: string;
}

export const CveFeed: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'All' | 'Critical' | 'High'>('All');
  const [cves, setCves] = useState<CVE[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/cves`)
      .then(r => r.json())
      .then(data => {
        setCves(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch CVEs', err);
        setLoading(false);
      });
  }, []);

  const filteredCves = cves.filter(cve => {
    const matchesSearch = cve.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         cve.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         cve.vendor.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'All' || cve.severity === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <ShieldAlert className="text-warning" size={28} /> Vulnerability Watch
          </h1>
          <p className="text-muted text-sm mt-1">Live tracking of CVEs from the National Vulnerability Database (NVD).</p>
        </div>
        <div className="flex gap-2">
           <button className="badge badge-primary px-3 py-1.5 flex items-center gap-2 hover:bg-primary/20 transition-colors">
              <Clock size={14} /> Refresh Feed
           </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="glass-panel p-4 flex flex-col md:flex-row gap-4 items-center stagger-1">
        <div className="glass-panel flex-1 px-4 py-2 flex items-center gap-3 border-white/10 w-full" style={{ borderRadius: 'var(--radius-md)' }}>
          <Search size={18} className="text-muted" />
          <input 
            type="text" 
            placeholder="Search by ID, product, or description..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-transparent border-none text-main text-sm flex-1 outline-none"
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          {(['All', 'Critical', 'High'] as const).map(f => (
            <button 
              key={f}
              onClick={() => setFilter(f)}
              className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-sm font-medium transition-all ${filter === f ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-white/5 text-muted hover:bg-white/10'}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 gap-4 stagger-2">
        {filteredCves.map((cve, idx) => (
          <div key={cve.id} className="glass-panel p-5 hover:border-primary/30 transition-all stagger-idx" style={{ animationDelay: `${idx * 50}ms` }}>
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Severity Side */}
              <div className="flex flex-col items-center justify-center lg:w-24 shrink-0 p-3 rounded-xl bg-white/5 border border-white/5">
                <span className={`text-2xl font-black ${cve.severity === 'Critical' ? 'text-danger' : 'text-warning'}`}>
                  {cve.score.toFixed(1)}
                </span>
                <span className={`text-[10px] uppercase font-bold tracking-widest ${cve.severity === 'Critical' ? 'text-danger' : 'text-warning'}`}>
                  {cve.severity}
                </span>
              </div>

              {/* Content */}
              <div className="flex-1">
                <div className="flex flex-wrap justify-between items-start gap-2 mb-2">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-bold text-white border-b border-primary/30 pb-0.5 truncate max-w-full">{cve.id}</h3>
                    <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded border border-white/10 text-muted uppercase tracking-tighter shrink-0">
                       NVD Analyzed
                    </span>
                  </div>
                  <span className="text-xs text-muted flex items-center gap-1.5 shrink-0">
                    <Clock size={12} /> {cve.publishedDate}
                  </span>
                </div>
                <p className="text-sm text-slate-300 leading-relaxed mb-4 line-clamp-2 italic">
                  "{cve.description}"
                </p>
                <div className="flex flex-wrap gap-2">
                  <div className="flex items-center gap-1.5 text-xs text-muted bg-white/5 px-2.5 py-1 rounded-full border border-white/5">
                    <Tag size={12} /> <span className="font-semibold text-slate-200">{cve.vendor}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted bg-white/5 px-2.5 py-1 rounded-full border border-white/5">
                    <AlertCircle size={12} /> Status: <span className="text-secondary">{cve.status}</span>
                  </div>
                  <a 
                    href={`https://nvd.nist.gov/vuln/detail/${cve.id}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="ml-auto text-primary hover:text-white transition-colors text-xs flex items-center gap-1.5 group"
                  >
                    View Analysis <ExternalLink size={12} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        ))}
        {filteredCves.length === 0 && (
          <div className="glass-panel p-12 text-center text-muted">
            No vulnerabilities found matching your criteria.
          </div>
        )}
      </div>
    </div>
  );
};
