export interface CisaKevVulnerability {
  cveID: string;
  vendorProject: string;
  product: string;
  vulnerabilityName: string;
  dateAdded: string;
  shortDescription: string;
  requiredAction: string;
  dueDate: string;
  knownRansomwareCampaignUse: string;
  notes: string;
}

import { MOCK_CISA } from './mockData';

export const fetchCisaKev = async (): Promise<CisaKevVulnerability[]> => {
  try {
    const response = await fetch('/api/cisa');
    
    if (!response.ok) {
      return MOCK_CISA as any;
    }

    const json = await response.json();
    if (json && json.vulnerabilities) {
      return json.vulnerabilities.sort((a: any, b: any) => 
        new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime()
      );
    }
    return MOCK_CISA as any;
  } catch (error) {
    console.error('Error fetching CISA KEV catalog:', error);
    return MOCK_CISA as any;
  }
};
