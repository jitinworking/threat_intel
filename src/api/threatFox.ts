export interface ThreatFoxIoC {
  id: string;
  ioc: string;
  threat_type: string;
  threat_type_desc: string;
  ioc_type: string;
  ioc_type_desc: string;
  malware: string;
  malware_printable: string;
  malware_alias: string | null;
  malware_malpedia: string;
  confidence_level: number;
  first_seen: string;
  last_seen: string | null;
  reporter: string;
  tags: string[];
}

import { MOCK_IOCS } from './mockData';
import { getActiveApiKeys } from '../hooks/useApiKeys';

export const fetchRecentIoCs = async (days: number = 1): Promise<ThreatFoxIoC[]> => {
  try {
    const keys = getActiveApiKeys();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (keys.threatFox) {
      headers['API-KEY'] = keys.threatFox;
    }

    const response = await fetch('/api/threatfox', {
      method: 'POST',
      headers,
      body: JSON.stringify({ query: 'get_recent', days }),
    });

    if (!response.ok) {
      console.warn(`ThreatFox HTTP error! status: ${response.status}, utilizing fallbacks.`);
      return MOCK_IOCS as any;
    }

    const json = await response.json();
    if (json.query_status === 'ok' && json.data) {
      return json.data;
    }
    return MOCK_IOCS as any;
  } catch (error) {
    console.error('Error fetching ThreatFox IoCs:', error);
    return MOCK_IOCS as any;
  }
};
