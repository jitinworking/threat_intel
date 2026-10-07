import React, { useState, useEffect } from 'react';
import { 
  Plus, Trash2, Rss, Key, Bell, Mail, Send, Globe, 
  RefreshCw, CheckCircle2, Shield, Sliders, Layout, Monitor
} from 'lucide-react';
import { useFeeds } from '../hooks/useFeeds';
import { 
  PageHeader, Card, Button, Badge, StatusIndicator, Notification 
} from '../components/ui/design-system';
import { useDensity } from '../context/DensityContext';

import { BACKEND_URL } from '../config';

const BACKEND = BACKEND_URL;

interface SettingField {
  key: string;
  label: string;
  placeholder: string;
  description: string;
  icon: React.ReactNode;
  type?: string;
  category: string;
}

const SETTING_FIELDS: SettingField[] = [
  { key: 'threatfox_api_key', label: 'ThreatFox API Key', placeholder: 'Enter API Key from abuse.ch', description: 'Unlocks full ThreatFox data access. Free at https://threatfox.abuse.ch/', icon: <Key size={13} />, category: 'Threat Feed Connectors' },
  { key: 'otx_api_key', label: 'AlienVault OTX API Key', placeholder: 'Enter OTX API Key', description: 'STIX/TAXII feed from AlienVault. Free at https://otx.alienvault.com/', icon: <Globe size={13} />, category: 'Threat Feed Connectors' },

  { key: 'virustotal_api_key', label: 'VirusTotal API Key', placeholder: 'Enter VirusTotal API Key', description: 'Auto-enrich indicators with malware scan reputation. Free at https://virustotal.com/', icon: <Key size={13} />, category: 'Enrichment Providers' },
  { key: 'abuseipdb_api_key', label: 'AbuseIPDB API Key', placeholder: 'Enter AbuseIPDB API Key', description: 'IP reputation scoring and abuse confidence confidence index.', icon: <Key size={13} />, category: 'Enrichment Providers' },
  { key: 'shodan_api_key', label: 'Shodan API Key', placeholder: 'Enter Shodan API Key', description: 'Port scanning and internet-connected device intelligence.', icon: <Key size={13} />, category: 'Enrichment Providers' },

  { key: 'twitter_bearer_token', label: 'Twitter/X Bearer Token', placeholder: 'Enter Twitter API Bearer Token', description: 'Monitors #IOC #malware #APT hashtags via developer endpoints.', icon: <Send size={13} />, category: 'Social Intelligence' },
  { key: 'telegram_bot_token', label: 'Telegram Bot Token', placeholder: 'Enter Bot Token from @BotFather', description: 'Monitors configured Telegram threat disclosure channels.', icon: <Send size={13} />, category: 'Social Intelligence' },
  { key: 'telegram_channels', label: 'Telegram Channels', placeholder: '@channel1, @channel2', description: 'Comma-delimited channel list for real-time telemetry extraction.', icon: <Send size={13} />, category: 'Social Intelligence' },

  { key: 'imap_host', label: 'IMAP Server Host', placeholder: 'imap.enterprise.com', description: 'Enterprise mail host for automated security bulletin scraping.', icon: <Mail size={13} />, category: 'Email Ingestion' },
  { key: 'imap_user', label: 'IMAP Username', placeholder: 'soc-ingest@enterprise.com', description: 'Service account username for automated inbox processing.', icon: <Mail size={13} />, category: 'Email Ingestion' },
  { key: 'imap_password', label: 'IMAP Credential / App Token', placeholder: 'App password or token', description: 'Secure service credential stored encrypted in local SQLite engine.', icon: <Mail size={13} />, type: 'password', category: 'Email Ingestion' },

  { key: 'discord_webhook_url', label: 'Discord Webhook URL', placeholder: 'https://discord.com/api/webhooks/...', description: 'Dispatches high and critical indicator notifications.', icon: <Bell size={13} />, category: 'Alert Dispatchers' },
  { key: 'slack_webhook_url', label: 'Slack Webhook URL', placeholder: 'https://hooks.slack.com/services/...', description: 'Dispatches automated triage notices to designated SOC channel.', icon: <Bell size={13} />, category: 'Alert Dispatchers' },
  { key: 'alert_keywords', label: 'Trigger Keywords', placeholder: 'emotet, cobalt strike, cve-2024, ransomware', description: 'Comma-delimited keywords that escalate alerts to critical priority.', icon: <Bell size={13} />, category: 'Alert Dispatchers' },
];

export const Settings: React.FC = () => {
  const { feeds, addFeed, removeFeed } = useFeeds();
  const { density, setDensity } = useDensity();
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    fetch(`${BACKEND}/api/settings`)
      .then(r => r.json())
      .then(data => { setSettings(data); })
      .catch(() => {});
  }, []);

  const handleAddFeed = () => {
    if (name.trim() && url.trim()) {
      addFeed(name.trim(), url.trim());
      setName('');
      setUrl('');
    }
  };

  const updateSetting = (key: string, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const saveSettings = async () => {
    setSaving(true);
    setSavedSuccess(false);
    try {
      await fetch(`${BACKEND}/api/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 4000);
    } catch (e) {
      console.error('Failed to commit settings:', e);
    } finally {
      setSaving(false);
    }
  };

  const categories = [...new Set(SETTING_FIELDS.map(f => f.category))];

  return (
    <div className="p-6 flex flex-col gap-6 max-w-7xl mx-auto w-full min-h-full">
      {/* ── WORKSPACE PAGE HEADER ── */}
      <PageHeader
        title="System Configuration"
        subtitle="Manage ingestion channels, connector credentials, enrichment providers, and alert dispatchers"
        actions={
          <div className="flex items-center gap-3">
            {savedSuccess && (
              <span className="flex items-center gap-1.5 text-xs text-success font-medium">
                <CheckCircle2 size={14} /> Saved to Database
              </span>
            )}
            <Button
              onClick={saveSettings}
              disabled={saving}
              variant="primary"
              size="sm"
              className="gap-2 text-xs"
            >
              {saving ? <RefreshCw size={13} className="animate-spin" /> : <Key size={13} />}
              <span>{saving ? 'Synchronizing...' : 'Save Configuration'}</span>
            </Button>
          </div>
        }
      />

      {/* ── WORKSTATION PREFERENCES ── */}
      <Card className="p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center gap-2.5">
            <Sliders size={16} className="text-primary" />
            <div>
              <h2 className="text-sm font-semibold text-text">Workstation Display & Density</h2>
              <p className="text-xs text-text-muted">Configure visual density and analyst viewport preferences</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-3.5 rounded-lg border border-border bg-surface-elevated flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-text">Information Density</div>
              <div className="text-[11px] text-text-muted mt-0.5">Toggle between comfortable and high-density SOC layouts</div>
            </div>
            <div className="flex items-center gap-1.5 bg-surface p-1 rounded border border-border">
              <button
                onClick={() => setDensity('comfortable')}
                className={`px-2.5 py-1 text-xs font-medium rounded transition-colors cursor-pointer ${
                  density === 'comfortable'
                    ? 'bg-primary text-white shadow-xs'
                    : 'text-text-secondary hover:text-text'
                }`}
              >
                Comfortable
              </button>
              <button
                onClick={() => setDensity('compact')}
                className={`px-2.5 py-1 text-xs font-medium rounded transition-colors cursor-pointer ${
                  density === 'compact'
                    ? 'bg-primary text-white shadow-xs'
                    : 'text-text-secondary hover:text-text'
                }`}
              >
                Compact (SOC)
              </button>
            </div>
          </div>

          <div className="p-3.5 rounded-lg border border-border bg-surface-elevated flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-text">Security Architecture Engine</div>
              <div className="text-[11px] text-text-muted mt-0.5">SQLite WAL Engine with memory cache enabled</div>
            </div>
            <Badge variant="outline" className="font-mono text-[11px]">
              v4.2.0-PROD
            </Badge>
          </div>
        </div>
      </Card>

      {/* ── RSS & ATOM INGESTION FEEDS ── */}
      <Card className="p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center gap-2.5">
            <Rss size={16} className="text-primary" />
            <div>
              <h2 className="text-sm font-semibold text-text">Custom Intelligence Ingestion Feeds</h2>
              <p className="text-xs text-text-muted">Direct XML, Atom, or RSS threat feeds parsed periodically by the worker</p>
            </div>
          </div>
          <Badge variant="outline" className="text-xs font-mono">
            {feeds.length} Active Feeds
          </Badge>
        </div>

        <div className="flex flex-col sm:flex-row gap-2.5">
          <input 
            type="text" 
            placeholder="Feed Name (e.g. CISA Advisories)" 
            value={name} 
            onChange={e => setName(e.target.value)}
            className="bg-surface-elevated border border-border rounded px-3 py-1.5 text-xs text-text flex-1 outline-none focus:border-primary/50"
          />
          <input 
            type="text" 
            placeholder="Feed URL (https://.../feed.xml)" 
            value={url} 
            onChange={e => setUrl(e.target.value)}
            className="bg-surface-elevated border border-border rounded px-3 py-1.5 text-xs text-text font-mono flex-2 outline-none focus:border-primary/50"
          />
          <Button 
            onClick={handleAddFeed} 
            variant="secondary" 
            size="sm"
            disabled={!name.trim() || !url.trim()}
            className="gap-1.5 text-xs shrink-0"
          >
            <Plus size={13} /> Add Feed
          </Button>
        </div>

        <div className="flex flex-col gap-2 pt-2">
          {feeds.length === 0 ? (
            <div className="p-4 bg-surface-elevated border border-dashed border-border rounded text-xs text-text-muted text-center">
              No custom RSS feeds defined. System utilizes default built-in OSINT sources.
            </div>
          ) : feeds.map((feed, i) => (
            <div key={i} className="flex items-center justify-between py-2 px-3 bg-surface-elevated border border-border rounded hover:border-border-strong transition-colors">
              <div className="flex items-center gap-3 overflow-hidden">
                <span className="text-xs font-semibold text-text shrink-0">{feed.name}</span>
                <span className="text-[11px] text-text-muted font-mono truncate">{feed.url}</span>
              </div>
              <button 
                onClick={() => removeFeed(feed.id)} 
                className="text-text-muted hover:text-critical p-1 transition-colors cursor-pointer rounded"
                title="Remove Feed"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      </Card>

      {/* ── API CONNECTORS & DISPATCHERS ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
        {categories.map(category => (
          <Card key={category} className="p-5 flex flex-col gap-4">
            <div className="flex items-center gap-2 pb-2.5 border-b border-border">
              {category.includes('Feed') ? <Key size={15} className="text-primary" /> :
               category.includes('Enrichment') ? <Globe size={15} className="text-primary" /> :
               category.includes('Social') ? <Send size={15} className="text-high" /> :
               category.includes('Email') ? <Mail size={15} className="text-medium" /> :
               <Bell size={15} className="text-critical" />}
              <div>
                <h3 className="text-sm font-semibold text-text">{category}</h3>
                <p className="text-[11px] text-text-muted">Integration secrets stored locally in encrypted SQLite node</p>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              {SETTING_FIELDS.filter(f => f.category === category).map(field => (
                <div key={field.key} className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-text flex items-center gap-1.5">
                      {field.icon} 
                      <span>{field.label}</span>
                    </label>
                  </div>
                  <input
                    type={field.type || 'text'}
                    placeholder={field.placeholder}
                    value={settings[field.key] || ''}
                    onChange={e => updateSetting(field.key, e.target.value)}
                    className="w-full bg-surface-elevated border border-border rounded px-3 py-1.5 text-xs text-text font-mono outline-none focus:border-primary/50"
                  />
                  <p className="text-[11px] text-text-muted leading-tight">{field.description}</p>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>

      {/* ── FOOTER SAVE BAR ── */}
      <div className="flex justify-between items-center pt-3 pb-8 border-t border-border">
        <span className="text-xs text-text-muted">
          All configuration updates are hot-reloaded across running ingestion workers.
        </span>
        <Button
          onClick={saveSettings}
          disabled={saving}
          variant="primary"
          size="sm"
          className="gap-2 text-xs"
        >
          {saving ? <RefreshCw size={13} className="animate-spin" /> : <Key size={13} />}
          <span>{saving ? 'Synchronizing...' : 'Save Configuration'}</span>
        </Button>
      </div>
    </div>
  );
};
