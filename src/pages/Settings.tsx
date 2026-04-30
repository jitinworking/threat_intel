import { API_BASE_URL } from '../config';
import React, { useState } from 'react';
import { Plus, Trash2, Rss, Key, Bell, Mail, Send, Globe, RefreshCw } from 'lucide-react';
import { useFeeds } from '../hooks/useFeeds';

const BACKEND = `${API_BASE_URL}`;

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
  // Threat Feed API Keys
  { key: 'threatfox_api_key', label: 'ThreatFox API Key', placeholder: 'Enter API Key from abuse.ch', description: 'Unlocks full ThreatFox data access. Free at https://threatfox.abuse.ch/', icon: <Key size={16} />, category: 'Threat Feed APIs' },
  { key: 'otx_api_key', label: 'AlienVault OTX API Key', placeholder: 'Enter OTX API Key', description: 'STIX/TAXII feed from AlienVault. Free at https://otx.alienvault.com/', icon: <Globe size={16} />, category: 'Threat Feed APIs' },

  // Enrichment API Keys
  { key: 'virustotal_api_key', label: 'VirusTotal API Key', placeholder: 'Enter VirusTotal API Key', description: 'Auto-enrich IoCs with malware scan data. Free at https://virustotal.com/', icon: <Key size={16} />, category: 'Enrichment APIs' },
  { key: 'abuseipdb_api_key', label: 'AbuseIPDB API Key', placeholder: 'Enter AbuseIPDB API Key', description: 'IP reputation scoring. Free at https://abuseipdb.com/', icon: <Key size={16} />, category: 'Enrichment APIs' },
  { key: 'shodan_api_key', label: 'Shodan API Key', placeholder: 'Enter Shodan API Key', description: 'Port scanning and host intel. Free at https://shodan.io/', icon: <Key size={16} />, category: 'Enrichment APIs' },

  // Social Feeds
  { key: 'twitter_bearer_token', label: 'Twitter/X Bearer Token', placeholder: 'Enter Twitter API Bearer Token', description: 'Monitors #IOC #malware #APT hashtags. Requires Twitter Developer account.', icon: <Send size={16} />, category: 'Social Feeds' },
  { key: 'telegram_bot_token', label: 'Telegram Bot Token', placeholder: 'Enter Bot Token from @BotFather', description: 'Monitors Telegram channels for IoCs.', icon: <Send size={16} />, category: 'Social Feeds' },
  { key: 'telegram_channels', label: 'Telegram Channels', placeholder: '@channel1, @channel2', description: 'Comma-separated list of Telegram channels to monitor.', icon: <Send size={16} />, category: 'Social Feeds' },

  // Email Ingestion
  { key: 'imap_host', label: 'IMAP Host', placeholder: 'imap.gmail.com', description: 'Email server hostname for IoC extraction from mailing lists.', icon: <Mail size={16} />, category: 'Email Ingestion' },
  { key: 'imap_user', label: 'IMAP Username', placeholder: 'your@email.com', description: 'Email account username.', icon: <Mail size={16} />, category: 'Email Ingestion' },
  { key: 'imap_password', label: 'IMAP Password', placeholder: 'App password', description: 'Use an app-specific password for security.', icon: <Mail size={16} />, type: 'password', category: 'Email Ingestion' },

  // Alerting
  { key: 'discord_webhook_url', label: 'Discord Webhook URL', placeholder: 'https://discord.com/api/webhooks/...', description: 'Receive threat alerts in your Discord server.', icon: <Bell size={16} />, category: 'Alerting' },
  { key: 'slack_webhook_url', label: 'Slack Webhook URL', placeholder: 'https://hooks.slack.com/services/...', description: 'Receive threat alerts in your Slack workspace.', icon: <Bell size={16} />, category: 'Alerting' },
  { key: 'alert_keywords', label: 'Alert Keywords', placeholder: 'emotet, cobalt strike, your-domain.com', description: 'Comma-separated keywords to trigger alerts when matched.', icon: <Bell size={16} />, category: 'Alerting' },
];

export const Settings: React.FC = () => {
  const { feeds, addFeed, removeFeed } = useFeeds();
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  // Load settings from backend
  React.useEffect(() => {
    fetch(`${BACKEND}/api/settings`)
      .then(r => r.json())
      .then(data => { setSettings(data); })
      .catch(() => {});
  }, []);

  const handleAdd = () => {
    if (name && url) {
      addFeed(name, url);
      setName('');
      setUrl('');
    }
  };

  const updateSetting = (key: string, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      await fetch(`${BACKEND}/api/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
    } catch (e) {
      console.error('Failed to save settings to backend:', e);
    }
    setSaving(false);
  };

  const categories = [...new Set(SETTING_FIELDS.map(f => f.category))];

  return (
    <div className="animate-fade-in flex col gap-6" style={{ flexDirection: 'column' }}>
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted text-sm mt-1">Configure threat feeds, API keys, alerting, and enrichment.</p>
      </div>

      {/* RSS Feeds */}
      <div className="glass-panel p-6 stagger-1">
        <h2 className="card-title">
          <Rss size={20} className="text-primary" />
          Custom RSS/Atom Feeds
        </h2>
        <p className="text-sm text-muted mb-4">Add custom news feeds to the Dashboard intel ticker.</p>

        <div className="flex gap-3 mb-4">
          <input type="text" className="glass-panel p-2 flex-1 text-sm" placeholder="Feed Name" value={name} onChange={e => setName(e.target.value)}
            style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-subtle)', color: 'white', outline: 'none' }} />
          <input type="text" className="glass-panel p-2 flex-1 text-sm" placeholder="RSS/Atom URL" value={url} onChange={e => setUrl(e.target.value)}
            style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-subtle)', color: 'white', outline: 'none' }} />
          <button onClick={handleAdd} className="glass-panel px-4 py-2 flex items-center gap-2 hover:text-white transition-all text-sm">
            <Plus size={16} /> Add Feed
          </button>
        </div>

        <div className="flex col gap-2" style={{ flexDirection: 'column' }}>
          {feeds.length === 0 ? (
            <p className="text-sm text-muted">No custom feeds added yet. Default feeds are active.</p>
          ) : feeds.map((feed, i) => (
            <div key={i} className="flex items-center justify-between py-2 px-3 glass-panel">
              <div>
                <span className="text-sm font-medium">{feed.name}</span>
                <span className="text-xs text-muted ml-3">{feed.url}</span>
              </div>
              <button onClick={() => removeFeed(feed.id)} className="p-1 hover:text-danger transition-colors">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* API Keys & Configuration */}
      {categories.map(category => (
        <div key={category} className="glass-panel p-6 stagger-2">
          <h2 className="card-title">
            {category === 'Threat Feed APIs' ? <Key size={20} className="text-primary" /> :
             category === 'Enrichment APIs' ? <Globe size={20} className="text-cyan" /> :
             category === 'Social Feeds' ? <Send size={20} className="text-purple" /> :
             category === 'Email Ingestion' ? <Mail size={20} className="text-warning" /> :
             <Bell size={20} className="text-danger" />}
            {category}
          </h2>
          <p className="text-sm text-muted mb-4">All credentials are stored in your local SQLite database and never leave your machine.</p>

          <div className="flex col gap-4" style={{ flexDirection: 'column' }}>
            {SETTING_FIELDS.filter(f => f.category === category).map(field => (
              <div key={field.key}>
                <label className="text-xs text-muted font-medium mb-1 block uppercase tracking-wide flex items-center gap-2">
                  {field.icon} {field.label}
                </label>
                <input
                  type={field.type || 'text'}
                  placeholder={field.placeholder}
                  value={settings[field.key] || ''}
                  onChange={e => updateSetting(field.key, e.target.value)}
                  className="glass-panel p-2 w-full text-sm"
                  style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-subtle)', color: 'white', outline: 'none', maxWidth: '500px' }}
                />
                <p className="text-xs text-muted mt-1">{field.description}</p>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={saveSettings}
          disabled={saving}
          className="glass-panel px-6 py-3 flex items-center gap-2 hover:text-white transition-all text-sm font-semibold disabled:opacity-50"
          style={{ background: 'rgba(59,130,246,0.2)', borderColor: 'var(--primary-color)' }}
        >
          {saving ? <RefreshCw size={16} className="animate-spin" /> : <Key size={16} />}
          {saving ? 'Saving...' : 'Save All Settings'}
        </button>
      </div>
    </div>
  );
};
