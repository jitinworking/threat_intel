export function analyzePayload(payload) {
  let decoded = payload;
  let isBase64 = false;
  
  // Clean up whitespace for base64 check
  const cleanPayload = payload.trim();
  
  // Try Base64 Decode
  if (/^[A-Za-z0-9+/=]+$/.test(cleanPayload) && cleanPayload.length > 20 && cleanPayload.length % 4 === 0) {
    try {
      decoded = Buffer.from(cleanPayload, 'base64').toString('utf8');
      isBase64 = true;
    } catch (e) {
      // Not base64
    }
  }

  // Fallback try decoding if it looks like typical powershell base64
  if (!isBase64 && payload.includes('-enc') || payload.includes('-EncodedCommand')) {
    const match = payload.match(/(?:-enc|-EncodedCommand)\s+([A-Za-z0-9+/=]+)/i);
    if (match && match[1]) {
      try {
        decoded = Buffer.from(match[1], 'base64').toString('utf16le'); // PS usually uses UTF-16LE
        isBase64 = true;
      } catch (e) {}
    }
  }

  const iocs = [];
  
  // Extract IPv4
  const ipv4Regex = /\b(?:\d{1,3}\.){3}\d{1,3}\b/g;
  const ips = decoded.match(ipv4Regex) || [];
  ips.forEach(ip => iocs.push({ type: 'IPv4', value: ip, context: 'Extracted IP' }));

  // Extract URLs
  const urlRegex = /https?:\/\/[^\s"'<>()]+/ig;
  const urls = decoded.match(urlRegex) || [];
  urls.forEach(url => iocs.push({ type: 'URL', value: url, context: 'Embedded Link' }));

  // Detect Language
  let language = 'Unknown';
  if (decoded.match(/Invoke-|Start-Process|-Command|\$env:|Write-Host|New-Object/i)) language = 'PowerShell';
  else if (decoded.match(/var |let |const |function |document\.|window\.|eval\(/)) language = 'JavaScript';
  else if (decoded.match(/#!|\/bin\/(sh|bash)|wget |curl |chmod |rm -rf/)) language = 'Bash/Shell';
  else if (decoded.match(/import sys|def |print\(|requests\./)) language = 'Python';
  else if (decoded.match(/<?php/i)) language = 'PHP';

  // Detect Intent
  let intent = 'Suspicious Script';
  const intentKeywords = {
    'Download and Execute': ['Invoke-WebRequest', 'wget', 'curl', 'Net.WebClient', 'DownloadString', 'DownloadFile'],
    'Reverse Shell': ['bash -i', 'nc -e', 'Reverse-TCP', '/dev/tcp/', 'Invoke-PowerShellTcp'],
    'Ransomware/Destructive': ['vssadmin', 'delete shadows', 'WannaCry', 'Encrypt', 'rm -rf /*'],
    'Data Exfiltration': ['upload', 'ftp', 'scp', 'post', 'Invoke-RestMethod']
  };

  for (const [key, keywords] of Object.entries(intentKeywords)) {
    if (keywords.some(k => decoded.toLowerCase().includes(k.toLowerCase()))) {
      intent = key;
      break;
    }
  }

  // Generate Explanation
  let explanation = `The Oracle AI engine analyzed this payload. `;
  if (isBase64) explanation += `It was initially Base64 encoded to evade detection. `;
  explanation += `Based on the syntactic structure, it is identified as a ${language} script. `;
  explanation += `The primary objective appears to be "${intent}" given the presence of specific execution patterns. `;
  
  if (iocs.length > 0) {
    explanation += `We successfully extracted ${iocs.length} potential Indicators of Compromise (IoCs) including network endpoints.`;
  } else {
    explanation += `No explicit network IoCs were found in the static code block.`;
  }

  // Deduplicate IOCs
  const uniqueIocs = Array.from(new Map(iocs.map(item => [item.value, item])).values());

  return {
    language,
    intent,
    iocs: uniqueIocs,
    explanation,
    deobfuscatedCode: decoded !== payload ? decoded : (payload.length > 500 ? payload.substring(0, 500) + '\n...[truncated]' : payload)
  };
}
