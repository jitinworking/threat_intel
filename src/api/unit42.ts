import { type ThreatFoxIoC } from './threatFox';

export const fetchUnit42IoCs = async (): Promise<ThreatFoxIoC[]> => {
  try {
    const response = await fetch('/unit42_iocs.json');
    if (!response.ok) {
      console.warn(`Unit42 Static JSON error! status: ${response.status}`);
      return [];
    }

    const json = await response.json();
    return json;
  } catch (error) {
    console.error('Error fetching Unit42 Static Database:', error);
    return [];
  }
};
