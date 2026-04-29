import fs from 'fs';
import path from 'path';

const repoPath = '/home/jitin/.gemini/antigravity/scratch/Unit42-timely-threat-intel';
const outputPath = '/home/jitin/Downloads/threat-intel-dashboard/public/unit42_iocs.json';

const sha256Regex = /\b[A-Fa-f0-9]{64}\b/g;
const md5Regex = /\b[A-Fa-f0-9]{32}\b/g;
const ipv4Regex = /\b(?:[0-9]{1,3}(?:\[\.\]|\.)){3}[0-9]{1,3}\b/g;
const domainRegex = /\b(?:[a-zA-Z0-9-]+\.)*[a-zA-Z0-9-]+\[\.\][a-zA-Z]{2,}\b/gi;

function getAllFiles(dirPath, arrayOfFiles) {
  const files = fs.readdirSync(dirPath);
  arrayOfFiles = arrayOfFiles || [];
  files.forEach(function(file) {
    if (fs.statSync(dirPath + "/" + file).isDirectory()) {
      if (file !== '.git') {
        arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
      }
    } else {
      if (file.endsWith('.txt') || file.endsWith('.csv')) {
        arrayOfFiles.push(path.join(dirPath, file));
      }
    }
  });
  return arrayOfFiles;
}

const allFiles = getAllFiles(repoPath);
let allIocs = [];
let idCounter = 1;

for (const file of allFiles) {
  const content = fs.readFileSync(file, 'utf8');
  const filename = path.basename(file);
  
  const malwareMatches = filename.match(/for-(.*?)-/i) || filename.match(/from-(.*?)-/i) || filename.match(/-(.*?)-/i);
  let malwareName = malwareMatches ? malwareMatches[1].replace(/-/g, ' ') : 'Various Threats';
  if (malwareName.length > 20) malwareName = 'Various Threats';

  let match;
  while ((match = sha256Regex.exec(content)) !== null) {
    allIocs.push({
      id: `u42-${idCounter++}`,
      ioc: match[0],
      threat_type: 'payload',
      threat_type_desc: 'Payload Deliverable',
      ioc_type: 'sha256',
      ioc_type_desc: 'SHA256 Hash',
      malware: malwareName.toLowerCase().trim(),
      malware_printable: malwareName.trim(),
      confidence_level: 95,
      tags: ['Unit42', 'Historical']
    });
  }

  while ((match = md5Regex.exec(content)) !== null) {
    allIocs.push({
      id: `u42-${idCounter++}`,
      ioc: match[0],
      threat_type: 'payload',
      threat_type_desc: 'Payload Deliverable',
      ioc_type: 'md5',
      ioc_type_desc: 'MD5 Hash',
      malware: malwareName.toLowerCase().trim(),
      malware_printable: malwareName.trim(),
      confidence_level: 95,
      tags: ['Unit42', 'Historical']
    });
  }

  while ((match = ipv4Regex.exec(content)) !== null) {
    const rawIp = match[0];
    const cleanIp = rawIp.replace(/\[\.\]/g, '.');
    if (cleanIp.split('.').every(n => parseInt(n) < 256)) {
      allIocs.push({
        id: `u42-${idCounter++}`,
        ioc: cleanIp,
        threat_type: 'botnet_cc',
        threat_type_desc: 'Botnet C&C',
        ioc_type: 'ipv4',
        ioc_type_desc: 'IPv4 Address',
        malware: malwareName.toLowerCase().trim(),
        malware_printable: malwareName.trim(),
        confidence_level: 95,
        tags: ['Unit42', 'Historical']
      });
    }
  }

  while ((match = domainRegex.exec(content)) !== null) {
    const rawDomain = match[0];
    const cleanDomain = rawDomain.replace(/\[\.\]/g, '.');
    allIocs.push({
      id: `u42-${idCounter++}`,
      ioc: cleanDomain,
      threat_type: 'payload_delivery',
      threat_type_desc: 'Payload Delivery',
      ioc_type: 'domain',
      ioc_type_desc: 'Domain Name',
      malware: malwareName.toLowerCase().trim(),
      malware_printable: malwareName.trim(),
      confidence_level: 95,
      tags: ['Unit42', 'Historical']
    });
  }
}

const uniqueIocs = [];
const seen = new Set();
for (const item of allIocs) {
  if (!seen.has(item.ioc)) {
    seen.add(item.ioc);
    uniqueIocs.push(item);
  }
}

const finalIocs = uniqueIocs.slice(-5000).reverse();

fs.writeFileSync(outputPath, JSON.stringify(finalIocs, null, 2));
console.log(`Successfully compiled ${finalIocs.length} unique IoCs from Unit42 repositories into ${outputPath}`);
