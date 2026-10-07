import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Search, ArrowRight, Command, Database, Sparkles, 
  Copy, Check, Moon, Sun, SlidersHorizontal, Layers
} from 'lucide-react';
import { NAVIGATION_ROUTES, type RouteItem } from '../navigation';
import { useTheme } from '../context/ThemeContext';
import { useDensity } from '../context/DensityContext';
import { useInvestigation } from '../context/InvestigationContext';
import { BACKEND_URL } from '../config';

const BACKEND = BACKEND_URL;

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: string) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose, onNavigate }) => {
  const { theme, toggleTheme } = useTheme();
  const { toggleDensity } = useDensity();
  const { openInvestigation, openCopilot } = useInvestigation();

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [iocResults, setIocResults] = useState<any[]>([]);
  const [iocLoading, setIocLoading] = useState(false);
  const [copiedIoc, setCopiedIoc] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setIocResults([]);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Debounced IoC search against SQLite backend
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length < 2) {
      setIocResults([]);
      setIocLoading(false);
      return;
    }

    setIocLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`${BACKEND}/api/iocs?search=${encodeURIComponent(query.trim())}&limit=5`);
        if (res.ok) {
          const data = await res.json();
          setIocResults(data.iocs || []);
        }
      } catch {
        setIocResults([]);
      } finally {
        setIocLoading(false);
      }
    }, 200);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  // Filter routes based on query
  const matchingRoutes = query.trim().length === 0
    ? NAVIGATION_ROUTES.slice(0, 7)
    : NAVIGATION_ROUTES.filter(r => {
        const q = query.toLowerCase();
        return (
          r.label.toLowerCase().includes(q) ||
          r.category.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q) ||
          r.keywords.some(k => k.includes(q))
        );
      }).slice(0, 6);

  const navigateTo = useCallback((id: string) => {
    onNavigate(id);
    onClose();
  }, [onNavigate, onClose]);

  const handleCopyIoc = (ioc: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(ioc);
    setCopiedIoc(ioc);
    setTimeout(() => setCopiedIoc(null), 1500);
  };

  const handleInspectIoc = (iocItem: any) => {
    onClose();
    openInvestigation({
      id: iocItem.id,
      type: iocItem.ioc_type || 'ip',
      value: iocItem.ioc,
      severity: iocItem.confidence_level >= 80 ? 'critical' : 'high',
      confidence: iocItem.confidence_level,
      source: iocItem.source,
      malware: iocItem.malware_printable,
      threatType: iocItem.threat_type_desc,
    });
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    const totalItems = matchingRoutes.length + iocResults.length;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % Math.max(1, totalItems));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + totalItems) % Math.max(1, totalItems));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex < matchingRoutes.length) {
        const target = matchingRoutes[selectedIndex];
        if (target) navigateTo(target.id);
      } else {
        const iocIdx = selectedIndex - matchingRoutes.length;
        const ioc = iocResults[iocIdx];
        if (ioc) handleInspectIoc(ioc);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 modal-overlay"
        onClick={onClose}
      />

      {/* Palette Container */}
      <div 
        onKeyDown={handleKeyDown}
        className="relative w-full max-w-2xl bg-surface border border-border rounded shadow-2xl flex flex-col overflow-hidden animate-fade-in"
      >
        {/* Search Bar */}
        <div className="px-4 py-3 border-b border-border bg-surface-elevated flex items-center gap-3">
          <Search size={16} className="text-text-muted shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => { setQuery(e.target.value); setSelectedIndex(0); }}
            placeholder="Search workspaces, indicators, campaigns, actors, or enter command..."
            className="w-full bg-transparent text-sm text-text placeholder-text-muted outline-none"
          />
          {query && (
            <button
              onClick={() => { setQuery(''); inputRef.current?.focus(); }}
              className="text-xs text-text-muted hover:text-text cursor-pointer p-0.5"
            >
              Clear
            </button>
          )}
          <kbd className="hidden sm:inline-block font-mono text-[10px] text-text-muted bg-surface px-1.5 py-0.5 rounded border border-border">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-2 divide-y divide-border/50 custom-scrollbar">
          
          {/* Quick Actions if query is empty */}
          {!query && (
            <div className="pb-2">
              <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-text-muted">
                Quick Operations
              </div>
              <div className="grid grid-cols-3 gap-1 pt-1">
                <button
                  onClick={() => { toggleTheme(); onClose(); }}
                  className="flex items-center gap-2 p-2 rounded hover:bg-surface-hover text-xs text-text cursor-pointer text-left transition-colors"
                >
                  {theme === 'dark' ? <Sun size={14} className="text-primary" /> : <Moon size={14} className="text-primary" />}
                  <span>Switch Theme</span>
                </button>
                <button
                  onClick={() => { toggleDensity(); onClose(); }}
                  className="flex items-center gap-2 p-2 rounded hover:bg-surface-hover text-xs text-text cursor-pointer text-left transition-colors"
                >
                  <SlidersHorizontal size={14} className="text-primary" />
                  <span>Toggle Density</span>
                </button>
                <button
                  onClick={() => { openCopilot('What are the top emerging threats today?'); onClose(); }}
                  className="flex items-center gap-2 p-2 rounded hover:bg-surface-hover text-xs text-text cursor-pointer text-left transition-colors"
                >
                  <Sparkles size={14} className="text-primary" />
                  <span>Threat Copilot</span>
                </button>
              </div>
            </div>
          )}

          {/* Navigational Routes */}
          {matchingRoutes.length > 0 && (
            <div className="py-1">
              <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-text-muted">
                Workstation Navigation
              </div>
              <div className="space-y-0.5">
                {matchingRoutes.map((route, idx) => {
                  const Icon = route.icon;
                  const isSelected = selectedIndex === idx;

                  return (
                    <button
                      key={route.id}
                      onClick={() => navigateTo(route.id)}
                      className={`w-full flex items-center justify-between px-2.5 py-2 rounded text-xs transition-colors cursor-pointer text-left ${
                        isSelected
                          ? 'bg-primary/10 text-primary font-medium'
                          : 'hover:bg-surface-hover text-text'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon size={14} className={isSelected ? 'text-primary' : 'text-text-muted'} />
                        <span className="font-medium truncate">{route.label}</span>
                        <span className="text-[10px] text-text-muted truncate hidden sm:inline">
                          — {route.description}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {route.shortcut && (
                          <span className="font-mono text-[10px] text-text-muted bg-surface-elevated px-1.5 py-0.5 rounded border border-border">
                            {route.shortcut}
                          </span>
                        )}
                        <ArrowRight size={12} className={isSelected ? 'text-primary' : 'text-text-muted'} />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Live IoC Search Results from DB */}
          {(iocResults.length > 0 || iocLoading) && (
            <div className="pt-2">
              <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-text-muted flex items-center justify-between">
                <span>Database Indicators ({iocResults.length})</span>
                {iocLoading && <span className="animate-pulse">Searching SQLite...</span>}
              </div>

              <div className="space-y-0.5">
                {iocResults.map((ioc, idx) => {
                  const itemIndex = matchingRoutes.length + idx;
                  const isSelected = selectedIndex === itemIndex;

                  return (
                    <div
                      key={ioc.id}
                      onClick={() => handleInspectIoc(ioc)}
                      className={`w-full flex items-center justify-between px-2.5 py-2 rounded text-xs transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-primary/10 text-primary'
                          : 'hover:bg-surface-hover text-text'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Database size={13} className="text-text-muted shrink-0" />
                        <span className="font-mono text-[12px] font-medium truncate">{ioc.ioc}</span>
                        <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-surface border border-border text-text-muted shrink-0">
                          {ioc.ioc_type}
                        </span>
                        {ioc.malware_printable && (
                          <span className="text-xs text-text-secondary truncate hidden md:inline">
                            {ioc.malware_printable}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={e => handleCopyIoc(ioc.ioc, e)}
                          title="Copy IoC"
                          className="p-1 hover:bg-surface rounded text-text-muted hover:text-text cursor-pointer transition-colors"
                        >
                          {copiedIoc === ioc.ioc ? <Check size={12} className="text-success" /> : <Copy size={12} />}
                        </button>
                        <span className="text-[11px] font-mono text-text-muted">{ioc.source}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {matchingRoutes.length === 0 && iocResults.length === 0 && !iocLoading && (
            <div className="py-8 text-center text-xs text-text-muted">
              No matching pages or indicators found for "{query}".
            </div>
          )}

        </div>

        {/* Footer Shortcut Bar */}
        <div className="px-4 py-2 border-t border-border bg-surface-elevated text-[11px] text-text-muted flex items-center justify-between select-none">
          <div className="flex items-center gap-3">
            <span>Use <kbd className="font-mono text-[10px] bg-surface px-1 py-0.5 rounded border border-border">↑</kbd> <kbd className="font-mono text-[10px] bg-surface px-1 py-0.5 rounded border border-border">↓</kbd> to navigate</span>
            <span><kbd className="font-mono text-[10px] bg-surface px-1 py-0.5 rounded border border-border">Enter</kbd> to select</span>
          </div>
          <span>Threat Intelligence Registry</span>
        </div>

      </div>
    </div>
  );
};
