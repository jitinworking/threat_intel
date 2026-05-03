// List of common False Positive IPs and Domains
const FALSE_POSITIVES = new Set([
  '8.8.8.8', '8.8.4.4', // Google DNS
  '1.1.1.1', '1.0.0.1', // Cloudflare DNS
  '9.9.9.9',            // Quad9
  '208.67.222.222', '208.67.220.220', // OpenDNS
  '127.0.0.1', '0.0.0.0', 'localhost',
  'google.com', 'microsoft.com', 'apple.com', 'amazon.com',
  'cloudflare.com', 'fastly.net', 'akamai.net',
  'github.com', 'gitlab.com', 'bitbucket.org'
]);

// Basic private subnet and wildcard matcher
export function isSuppressed(ioc) {
  if (!ioc) return true;
  
  // Exact match
  if (FALSE_POSITIVES.has(ioc.toLowerCase())) return true;
  
  // Local/Private subnets
  if (ioc.startsWith('192.168.') || ioc.startsWith('10.') || ioc.startsWith('172.16.') || ioc.startsWith('127.')) {
    return true;
  }
  
  // Common safe TLDs or wildcards (simplified)
  if (ioc.endsWith('.gov') || ioc.endsWith('.mil')) {
    return true;
  }

  return false;
}
