import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity, AlertTriangle, ArrowUpRight, Clock3, Database,
  Download, Globe2, RefreshCw, ShieldAlert, Zap, Layers,
  ExternalLink, ChevronRight, Filter
} from 'lucide-react';
import {
  PageHeader, MetricCard, SeverityBadge, StatusIndicator,
  Button, Card, CardContent, CardHeader, CardTitle,
  EmptyState, Skeleton, Code
} from '../components/ui/design-system';
import { useInvestigation } from '../context/InvestigationContext';
import { BACKEND_URL, WS_URL } from '../config';

const BACKEND = BACKEND_URL;

type Feed = { name: string; type: string; status: string; lastPolled: string | null };
type Alert = { id: number; message: string; severity: string; created_at: string; ioc?: string; ioc_type?: string };
type Hotspot = { country: string; code: string; count: number; severity: string };

const parseFeedTimestamp = (value: string | null) => {
  if (!value) return NaN;
  return new Date(value.endsWith('Z') ? value : `${value.replace(' ', 'T')}Z`).getTime();
};

const timeAgo = (value: string) => {
  const elapsed = Math.max(0, Date.now() - new Date(value).getTime());
  const minutes = Math.floor(elapsed / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return hours < 24 ? `${hours}h ago` : `${Math.floor(hours / 24)}d ago`;
};

const extractIndicator = (alert: Alert) => {
  const match = alert.message?.match(/indicator:\s+(\S+)/i);
  return match?.[1] || alert.ioc || 'Unknown Indicator';
};

export const Dashboard: React.FC = () => {
  const { openInvestigation } = useInvestigation();

  const [kpis, setKpis] = useState<any>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [feeds, setFeeds] = useState<Feed[]>([]);
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [wsStatus, setWsStatus] = useState<'connected' | 'disconnected'>('disconnected');

  const [lastRefreshedAt, setLastRefreshedAt] = useState(() => Date.now());

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const [kpiData, alertData, feedData, mapData, timelineData] = await Promise.all([
        fetch(`${BACKEND}/api/dashboard/kpis`).then(r => r.json()),
        fetch(`${BACKEND}/api/dashboard/alerts`).then(r => r.json()),
        fetch(`${BACKEND}/api/dashboard/feed-health`).then(r => r.json()),
        fetch(`${BACKEND}/api/dashboard/threat-map`).then(r => r.json()),
        fetch(`${BACKEND}/api/dashboard/timeline`).then(r => r.json())
      ]);

      setKpis(kpiData);
      setAlerts(Array.isArray(alertData) ? alertData : []);
      setFeeds(Array.isArray(feedData) ? feedData : []);
      setHotspots(Array.isArray(mapData?.hotspots) ? mapData.hotspots : []);
      setTimeline(Array.isArray(timelineData) ? timelineData : []);
      setLastRefreshedAt(Date.now());
      setError(null);
    } catch (requestError: any) {
      setError(requestError.message || 'Unable to retrieve dashboard intelligence.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadDashboard(); }, [loadDashboard]);

  useEffect(() => {
    const socket = new WebSocket(WS_URL);
    socket.onopen = () => setWsStatus('connected');
    socket.onclose = () => setWsStatus('disconnected');
    socket.onmessage = () => loadDashboard();
    return () => socket.close();
  }, [loadDashboard]);

  useEffect(() => {
    const poller = window.setInterval(loadDashboard, 30000);
    return () => window.clearInterval(poller);
  }, [loadDashboard]);

  const activeFeeds = useMemo(() => {
    return feeds.filter(feed => {
      const pollTime = parseFeedTimestamp(feed.lastPolled);
      return feed.status === 'Active' && Number.isFinite(pollTime) && pollTime > lastRefreshedAt - 5 * 60 * 1000;
    });
  }, [feeds, lastRefreshedAt]);

  const exportSnapshot = () => {
    const snapshot = JSON.stringify({
      generatedAt: new Date().toISOString(),
      kpis,
      alerts,
      feeds,
      hotspots,
      timeline
    }, null, 2);
    const blob = new Blob([snapshot], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `threat-posture-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleInspectAlert = (alert: Alert) => {
    const indicator = extractIndicator(alert);
    openInvestigation({
      id: alert.id,
      type: alert.ioc_type || (indicator.includes('.') ? 'domain' : 'indicator'),
      value: indicator,
      severity: (alert.severity as any) || 'high',
      source: 'Threat Ingestion Alert',
      threatType: alert.message,
    });
  };

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-[1600px] mx-auto">
      
      {/* ── Page Header ── */}
      <PageHeader
        title="Security Operations Command"
        description="Operational overview of active adversary campaigns, collection synchronization, and prioritized telemetry."
        badge={
          <StatusIndicator
            status={wsStatus === 'connected' ? 'live' : 'inactive'}
            label={wsStatus === 'connected' ? 'Real-Time Pipeline' : 'Syncing'}
          />
        }
        actions={
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={loadDashboard}
              disabled={loading}
              className="gap-1.5"
            >
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
              Refresh
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={exportSnapshot}
              className="gap-1.5"
            >
              <Download size={13} />
              Export Brief
            </Button>
          </>
        }
      />

      {error && (
        <div className="p-3 bg-critical-muted border border-critical/30 rounded text-xs text-critical flex items-center justify-between">
          <span>{error}</span>
          <Button variant="outline" size="sm" onClick={loadDashboard}>Retry</Button>
        </div>
      )}

      {/* ── KPI Strip (Restrained, Dense) ── */}
      <section className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
        <MetricCard
          label="Critical Priority"
          value={kpis?.criticalAlerts ?? 0}
          detail="Urgent indicator actions"
          icon={<ShieldAlert size={16} className="text-critical" />}
          accent="critical"
          loading={!kpis}
        />
        <MetricCard
          label="High Severity"
          value={kpis?.highAlerts ?? 0}
          detail="Active malicious staging"
          icon={<AlertTriangle size={16} className="text-high" />}
          accent="high"
          loading={!kpis}
        />
        <MetricCard
          label="Total Corpus"
          value={kpis?.totalIocs ?? 0}
          detail="Validated indicators in SQLite"
          icon={<Database size={16} className="text-primary" />}
          accent="primary"
          loading={!kpis}
        />
        <MetricCard
          label="24h Velocity"
          value={kpis?.recent24h ? `+${kpis.recent24h.toLocaleString()}` : '+0'}
          detail="Observed in last 24h"
          icon={<Zap size={16} className="text-primary" />}
          accent="default"
          loading={!kpis}
        />
        <MetricCard
          label="Collection Feeds"
          value={`${activeFeeds.length} / ${feeds.length || 16}`}
          detail="Feeds synced in last 5m"
          icon={<Activity size={16} className="text-success" />}
          accent="success"
          loading={!kpis}
        />
      </section>

      {/* ── Middle: Priority Intelligence Queue + Collection Health ── */}
      <section className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        
        {/* Priority Intelligence Queue (Primary Analyst View) */}
        <div className="xl:col-span-8 bg-surface border border-border rounded flex flex-col">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between bg-surface-elevated">
            <div>
              <h3 className="text-xs font-semibold text-text uppercase tracking-wider">Priority Intelligence Queue</h3>
              <p className="text-xs text-text-muted mt-0.5">High-confidence findings requiring SOC triage</p>
            </div>
            <span className="text-[11px] font-mono text-text-muted">
              {alerts.length} unread
            </span>
          </div>

          <div className="divide-y divide-border flex-1">
            {alerts.slice(0, 5).map((alert) => {
              const indicator = extractIndicator(alert);
              return (
                <div
                  key={alert.id}
                  onClick={() => handleInspectAlert(alert)}
                  className="p-3.5 hover:bg-surface-hover transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <SeverityBadge level={alert.severity} />
                      <span className="font-mono text-xs font-semibold text-text truncate group-hover:text-primary transition-colors">
                        {indicator}
                      </span>
                    </div>
                    <p className="text-xs text-text-secondary line-clamp-1 leading-normal">
                      {alert.message}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 text-xs">
                    <span className="font-mono text-[11px] text-text-muted">
                      {timeAgo(alert.created_at)}
                    </span>
                    <button
                      className="p-1 rounded hover:bg-surface border border-border text-text-muted hover:text-text cursor-pointer opacity-80 group-hover:opacity-100 transition-opacity"
                      title="Inspect entity"
                    >
                      <ArrowUpRight size={13} />
                    </button>
                  </div>
                </div>
              );
            })}

            {!alerts.length && (
              <div className="py-12">
                <EmptyState title="No active priority findings" description="All collection items are currently triage-cleared." />
              </div>
            )}
          </div>
        </div>

        {/* Collection Ingestion Health */}
        <div className="xl:col-span-4 bg-surface border border-border rounded flex flex-col">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between bg-surface-elevated">
            <div>
              <h3 className="text-xs font-semibold text-text uppercase tracking-wider">Collection Health</h3>
              <p className="text-xs text-text-muted mt-0.5">Sync state across 16 threat feeds</p>
            </div>
            <span className="text-xs font-mono text-success font-medium">
              {activeFeeds.length} online
            </span>
          </div>

          <div className="divide-y divide-border max-h-[340px] overflow-y-auto custom-scrollbar flex-1">
            {feeds.map(feed => {
              const poll = parseFeedTimestamp(feed.lastPolled);
              const online = feed.status === 'Active' && Number.isFinite(poll) && poll > lastRefreshedAt - 5 * 60 * 1000;

              return (
                <div key={feed.name} className="px-3.5 py-2.5 flex items-center justify-between gap-3 text-xs">
                  <div className="min-w-0">
                    <span className="font-medium text-text block truncate">{feed.name}</span>
                    <span className="text-[10px] text-text-muted uppercase font-bold">{feed.type}</span>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="flex items-center justify-end gap-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${online ? 'bg-success' : 'bg-text-muted'}`} />
                      <span className={`text-[11px] font-medium ${online ? 'text-success' : 'text-text-muted'}`}>
                        {online ? 'Active' : 'Standby'}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-text-muted block mt-0.5">
                      {Number.isFinite(poll) ? timeAgo(new Date(poll).toISOString()) : 'Pending sync'}
                    </span>
                  </div>
                </div>
              );
            })}

            {!feeds.length && (
              <div className="py-8">
                <EmptyState title="No feeds registered" description="Check backend ingestion database." />
              </div>
            )}
          </div>
        </div>

      </section>

      {/* ── Bottom: Threat Activity Timeline + Observed Origins ── */}
      <section className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        
        {/* Activity Timeline */}
        <div className="xl:col-span-8 bg-surface border border-border rounded flex flex-col">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between bg-surface-elevated">
            <div>
              <h3 className="text-xs font-semibold text-text uppercase tracking-wider">Intelligence Pipeline Activity</h3>
              <p className="text-xs text-text-muted mt-0.5">Chronological ingestion and detection records</p>
            </div>
            <Clock3 size={14} className="text-text-muted" />
          </div>

          <div className="p-4 space-y-3">
            <div className="relative pl-5 border-l border-border space-y-3">
              {timeline.slice(0, 5).map((evt, idx) => (
                <div key={evt.id || idx} className="relative text-xs">
                  <span className={`absolute -left-[25px] top-1 w-2 h-2 rounded-full border border-surface ${
                    evt.severity === 'critical' ? 'bg-critical' : evt.severity === 'high' ? 'bg-high' : 'bg-primary'
                  }`} />
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-text truncate max-w-lg">
                      {evt.message || evt.event}
                    </span>
                    <span className="font-mono text-[11px] text-text-muted shrink-0">
                      {timeAgo(evt.created_at || evt.time || new Date().toISOString())}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold uppercase text-text-muted tracking-wider">
                    {evt.severity || 'info'} Event
                  </span>
                </div>
              ))}

              {!timeline.length && (
                <EmptyState title="Timeline empty" description="No events have been dispatched yet." />
              )}
            </div>
          </div>
        </div>

        {/* Observed Origin Hotspots */}
        <div className="xl:col-span-4 bg-surface border border-border rounded flex flex-col">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between bg-surface-elevated">
            <div>
              <h3 className="text-xs font-semibold text-text uppercase tracking-wider">Origin Intelligence</h3>
              <p className="text-xs text-text-muted mt-0.5">Observed indicator concentration by nation</p>
            </div>
            <Globe2 size={14} className="text-text-muted" />
          </div>

          <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
            <div className="space-y-2.5">
              {hotspots.slice(0, 5).map((spot, idx) => {
                const max = Math.max(...hotspots.map(h => h.count), 1);
                const percent = Math.round((spot.count / max) * 100);

                return (
                  <div key={spot.code || idx} className="text-xs space-y-1">
                    <div className="flex items-center justify-between font-medium">
                      <span className="text-text truncate">{spot.country}</span>
                      <span className="font-mono text-text-muted text-[11px]">{spot.count.toLocaleString()} IoCs</span>
                    </div>
                    <div className="h-1.5 w-full bg-surface-elevated rounded-full overflow-hidden border border-border">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}

              {!hotspots.length && (
                <EmptyState title="No geographical data" description="Awaiting geo-IP enrichment batch." />
              )}
            </div>

            <p className="text-[11px] text-text-muted border-t border-border pt-2.5">
              Correlated from network addresses against autonomous system geolocation registries.
            </p>
          </div>
        </div>

      </section>

    </div>
  );
};
