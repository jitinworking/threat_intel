export const MOCK_IOCS = [
  {
    id: 'mock-1',
    ioc: '185.153.196.21',
    threat_type: 'botnet_cc',
    threat_type_desc: 'Botnet C&C',
    ioc_type: 'ipv4',
    malware: 'cobaltstrike',
    malware_printable: 'Cobalt Strike',
    confidence_level: 100,
    tags: ['CobaltStrike', 'C2']
  },
  {
    id: 'mock-2',
    ioc: 'malicious-domain-update.com',
    threat_type: 'payload_delivery',
    threat_type_desc: 'Payload Delivery',
    ioc_type: 'domain',
    malware: 'qakbot',
    malware_printable: 'QakBot',
    confidence_level: 95,
    tags: ['Qakbot', 'BankingTrojan']
  },
  {
    id: 'mock-3',
    ioc: '45.132.241.112',
    threat_type: 'botnet_cc',
    threat_type_desc: 'Botnet C&C',
    ioc_type: 'ipv4',
    malware: 'icedid',
    malware_printable: 'IcedID',
    confidence_level: 80,
    tags: ['IcedID']
  },
  {
    id: 'mock-4',
    ioc: 'a0b9c8d7e6f5a4b3c2d1e0f9a8b7c6d5e4f3a2b1',
    threat_type: 'payload',
    threat_type_desc: 'Payload',
    ioc_type: 'sha256',
    malware: 'emotet',
    malware_printable: 'Emotet',
    confidence_level: 100,
    tags: ['Emotet', 'Ransomware']
  }
];

export const MOCK_NEWS = [
  {
    id: 'mock-news-1',
    title: 'Critical Zero-Day Actively Exploited in Enterprise VPNs',
    link: '#',
    pubDate: new Date().toISOString(),
    source: 'The Hacker News'
  },
  {
    id: 'mock-news-2',
    title: 'New Ransomware Strain Targets Healthcare Sector Infrastructure',
    link: '#',
    pubDate: new Date(Date.now() - 3600000).toISOString(),
    source: 'BleepingComputer'
  },
  {
    id: 'mock-news-3',
    title: 'Major Data Breach Hits Global Shipping Conglomerate',
    link: '#',
    pubDate: new Date(Date.now() - 7200000).toISOString(),
    source: 'Krebs on Security'
  }
];

export const MOCK_CISA = [
  {
    cveID: 'CVE-2026-1001',
    vulnerabilityName: 'Mock System Arbitrary Code Execution',
    dateAdded: new Date().toISOString().split('T')[0]
  },
  {
    cveID: 'CVE-2026-1002',
    vulnerabilityName: 'Mock Secure Gateway Authentication Bypass',
    dateAdded: new Date(Date.now() - 86400000).toISOString().split('T')[0]
  }
];
