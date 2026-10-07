import {
  LayoutGrid, Landmark, Globe, Database, Rss, Users, Box,
  Clock, GitBranch, FileText, BookOpen, ShieldAlert, Newspaper,
  Terminal, Settings
} from 'lucide-react';
import React from 'react';

export interface RouteItem {
  id: string;
  label: string;
  shortLabel?: string;
  category: 'Command Center' | 'Threat Intelligence' | 'External Recon' | 'Hunting & Investigation' | 'Administration';
  icon: React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>;
  description: string;
  keywords: string[];
  shortcut?: string;
}

export const NAVIGATION_ROUTES: RouteItem[] = [
  // Command Center
  {
    id: 'dashboard',
    label: 'SOC Dashboard',
    shortLabel: 'Dashboard',
    category: 'Command Center',
    icon: LayoutGrid,
    description: 'Real-time threat posture, collection health, and priority findings',
    keywords: ['soc', 'analyst', 'overview', 'alerts', 'incidents', 'kpi'],
    shortcut: 'G D',
  },
  {
    id: 'executive-intelligence',
    label: 'Executive Posture',
    shortLabel: 'Executive',
    category: 'Command Center',
    icon: Landmark,
    description: 'CISO-level strategic metrics, threat exposure index, and board posture',
    keywords: ['ciso', 'posture', 'risk', 'strategic', 'board', 'exposure'],
  },
  {
    id: 'geomap',
    label: 'Global Threat Map',
    shortLabel: 'Geo Map',
    category: 'Command Center',
    icon: Globe,
    description: 'Geospatial distribution of attack originations and active infrastructure',
    keywords: ['map', 'geo', 'locations', 'origin', 'hotspots', 'countries'],
  },

  // Threat Intelligence
  {
    id: 'ioc',
    label: 'IoC Explorer',
    shortLabel: 'Indicators',
    category: 'Threat Intelligence',
    icon: Database,
    description: 'Search, filter, and inspect verified indicators of compromise',
    keywords: ['ioc', 'indicator', 'ip', 'hash', 'domain', 'url', 'sha256', 'md5'],
    shortcut: 'G I',
  },
  {
    id: 'threat-feed',
    label: 'Live Threat Feed',
    shortLabel: 'Live Feed',
    category: 'Threat Intelligence',
    icon: Rss,
    description: 'Real-time event stream from ThreatFox, URLhaus, SSLBL, and open feeds',
    keywords: ['feed', 'live', 'stream', 'threatfox', 'urlhaus', 'sslbl'],
  },
  {
    id: 'apt',
    label: 'Threat Actors & APTs',
    shortLabel: 'Actors',
    category: 'Threat Intelligence',
    icon: Users,
    description: 'Nation-state adversaries, cybercrime syndicates, and targeted sectors',
    keywords: ['apt', 'actor', 'group', 'nation', 'attribution', 'lazarus', 'fancy bear'],
  },
  {
    id: 'malware-intel',
    label: 'Malware Intelligence',
    shortLabel: 'Malware',
    category: 'Threat Intelligence',
    icon: Box,
    description: 'Payload signatures, sandbox detonation metrics, and malware families',
    keywords: ['malware', 'sandbox', 'binary', 'sha256', 'payload', 'detonation'],
  },
  {
    id: 'campaigns',
    label: 'Campaigns',
    shortLabel: 'Campaigns',
    category: 'Threat Intelligence',
    icon: Clock,
    description: 'Correlated attack campaigns, timelines, and infrastructure re-use',
    keywords: ['campaign', 'operation', 'timeline', 'espionage', 'ransomware'],
  },
  {
    id: 'graph',
    label: 'Threat Relationships',
    shortLabel: 'Graph',
    category: 'Threat Intelligence',
    icon: GitBranch,
    description: 'Interactive link analysis connecting actors, malware, and infrastructure',
    keywords: ['graph', 'link analysis', 'topology', 'correlation', 'nodes'],
    shortcut: 'G G',
  },
  {
    id: 'reports',
    label: 'Intelligence Reports',
    shortLabel: 'Reports',
    category: 'Threat Intelligence',
    icon: FileText,
    description: 'Structured intelligence assessments, executive PDFs, and scheduled briefs',
    keywords: ['report', 'brief', 'pdf', 'executive', 'assessment'],
  },
  {
    id: 'advisory',
    label: 'Weekly Advisory',
    shortLabel: 'Advisories',
    category: 'Threat Intelligence',
    icon: BookOpen,
    description: 'Weekly threat advisories and situational vulnerability bulletins',
    keywords: ['advisory', 'bulletin', 'weekly', 'cve', 'patch'],
  },

  // External Recon
  {
    id: 'vulnerabilities',
    label: 'CVE & KEV Registry',
    shortLabel: 'CVE Feed',
    category: 'External Recon',
    icon: ShieldAlert,
    description: 'NVD vulnerability registry with CISA KEV exploit status and EPSS risk',
    keywords: ['cve', 'vulnerability', 'kev', 'cisa', 'epss', 'exploit', 'nvd'],
  },
  {
    id: 'news',
    label: 'OSINT & News',
    shortLabel: 'OSINT',
    category: 'External Recon',
    icon: Newspaper,
    description: 'Aggregated security news, advisories, and social monitoring feeds',
    keywords: ['news', 'osint', 'rss', 'articles', 'bleepingcomputer', 'security'],
  },

  // Hunting & Investigation
  {
    id: 'hunting',
    label: 'Hunting Playground',
    shortLabel: 'Hunting',
    category: 'Hunting & Investigation',
    icon: Terminal,
    description: 'Rule repository and query generator for Sentinel (KQL) and Splunk (SPL)',
    keywords: ['hunt', 'query', 'kql', 'spl', 'sigma', 'sentinel', 'splunk', 'yara'],
    shortcut: 'G H',
  },

  // Administration
  {
    id: 'settings',
    label: 'System & Ingestion',
    shortLabel: 'Settings',
    category: 'Administration',
    icon: Settings,
    description: 'Feed polling configurations, API keys, and workspace preferences',
    keywords: ['settings', 'config', 'api', 'keys', 'polling', 'proxy', 'database'],
  },
];

export const NAVIGATION_CATEGORIES = [
  'Command Center',
  'Threat Intelligence',
  'External Recon',
  'Hunting & Investigation',
  'Administration',
] as const;

export function getRouteById(id: string): RouteItem | undefined {
  return NAVIGATION_ROUTES.find(r => r.id === id);
}
