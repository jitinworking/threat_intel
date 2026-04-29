import React from 'react';
import { Shield } from 'lucide-react';

// MITRE ATT&CK Techniques mapped to common threat categories
const MITRE_TACTICS = [
  { id: 'TA0001', name: 'Initial Access', techniques: [
    { id: 'T1566', name: 'Phishing', count: 342, severity: 'critical' },
    { id: 'T1190', name: 'Exploit Public-Facing App', count: 189, severity: 'high' },
    { id: 'T1133', name: 'External Remote Services', count: 156, severity: 'high' },
    { id: 'T1078', name: 'Valid Accounts', count: 98, severity: 'medium' },
  ]},
  { id: 'TA0002', name: 'Execution', techniques: [
    { id: 'T1059', name: 'Command & Scripting Interpreter', count: 467, severity: 'critical' },
    { id: 'T1204', name: 'User Execution', count: 234, severity: 'high' },
    { id: 'T1053', name: 'Scheduled Task/Job', count: 145, severity: 'medium' },
  ]},
  { id: 'TA0003', name: 'Persistence', techniques: [
    { id: 'T1547', name: 'Boot/Logon Autostart', count: 312, severity: 'high' },
    { id: 'T1136', name: 'Create Account', count: 87, severity: 'medium' },
    { id: 'T1543', name: 'Create/Modify System Process', count: 201, severity: 'high' },
  ]},
  { id: 'TA0004', name: 'Privilege Escalation', techniques: [
    { id: 'T1068', name: 'Exploitation for Priv Esc', count: 156, severity: 'critical' },
    { id: 'T1548', name: 'Abuse Elevation Control', count: 134, severity: 'high' },
  ]},
  { id: 'TA0005', name: 'Defense Evasion', techniques: [
    { id: 'T1027', name: 'Obfuscated Files', count: 389, severity: 'high' },
    { id: 'T1562', name: 'Impair Defenses', count: 245, severity: 'critical' },
    { id: 'T1070', name: 'Indicator Removal', count: 178, severity: 'high' },
  ]},
  { id: 'TA0006', name: 'Credential Access', techniques: [
    { id: 'T1003', name: 'OS Credential Dumping', count: 278, severity: 'critical' },
    { id: 'T1110', name: 'Brute Force', count: 356, severity: 'high' },
    { id: 'T1555', name: 'Credentials from Stores', count: 167, severity: 'high' },
  ]},
  { id: 'TA0007', name: 'Discovery', techniques: [
    { id: 'T1082', name: 'System Information Discovery', count: 423, severity: 'medium' },
    { id: 'T1083', name: 'File and Directory Discovery', count: 312, severity: 'medium' },
  ]},
  { id: 'TA0008', name: 'Lateral Movement', techniques: [
    { id: 'T1021', name: 'Remote Services', count: 234, severity: 'high' },
    { id: 'T1570', name: 'Lateral Tool Transfer', count: 145, severity: 'high' },
  ]},
  { id: 'TA0009', name: 'Collection', techniques: [
    { id: 'T1005', name: 'Data from Local System', count: 289, severity: 'high' },
    { id: 'T1114', name: 'Email Collection', count: 178, severity: 'medium' },
  ]},
  { id: 'TA0011', name: 'Command & Control', techniques: [
    { id: 'T1071', name: 'Application Layer Protocol', count: 567, severity: 'critical' },
    { id: 'T1573', name: 'Encrypted Channel', count: 345, severity: 'high' },
    { id: 'T1105', name: 'Ingress Tool Transfer', count: 234, severity: 'high' },
  ]},
  { id: 'TA0010', name: 'Exfiltration', techniques: [
    { id: 'T1041', name: 'Exfiltration Over C2', count: 198, severity: 'critical' },
    { id: 'T1048', name: 'Exfiltration Over Alt Protocol', count: 87, severity: 'high' },
  ]},
  { id: 'TA0040', name: 'Impact', techniques: [
    { id: 'T1486', name: 'Data Encrypted for Impact', count: 234, severity: 'critical' },
    { id: 'T1489', name: 'Service Stop', count: 145, severity: 'high' },
    { id: 'T1529', name: 'System Shutdown/Reboot', count: 67, severity: 'medium' },
  ]},
];

const severityColor = (s: string) => {
  if (s === 'critical') return 'var(--danger-color)';
  if (s === 'high') return 'var(--warning-color)';
  if (s === 'medium') return 'var(--primary-color)';
  return 'var(--text-muted)';
};

const heatColor = (count: number) => {
  if (count > 400) return 'rgba(var(--danger-rgb), 0.6)';
  if (count > 250) return 'rgba(var(--danger-rgb), 0.35)';
  if (count > 150) return 'rgba(var(--warning-rgb), 0.35)';
  if (count > 80) return 'rgba(var(--primary-rgb), 0.25)';
  return 'rgba(255, 255, 255, 0.06)';
};

export const MitreAttack: React.FC = () => {
  const [overlay, setOverlay] = React.useState<'none' | 'china' | 'pakistan'>('none');

  const CHINA_TECHNIQUES = ['T1190', 'T1078', 'T1059', 'T1543', 'T1068', 'T1027', 'T1003', 'T1570', 'T1105', 'T1041', 'T1489'];
  const PAKISTAN_TECHNIQUES = ['T1566', 'T1204', 'T1059', 'T1547', 'T1548', 'T1027', 'T1110', 'T1083', 'T1021', 'T1005', 'T1071'];

  const getAdjustedCount = (techId: string, baseCount: number) => {
    if (overlay === 'none') return baseCount;
    if (overlay === 'china') {
      return CHINA_TECHNIQUES.includes(techId) ? Math.max(450, baseCount + 200) : Math.min(60, baseCount * 0.2);
    }
    if (overlay === 'pakistan') {
      return PAKISTAN_TECHNIQUES.includes(techId) ? Math.max(450, baseCount + 200) : Math.min(60, baseCount * 0.2);
    }
    return baseCount;
  };

  return (
    <div className="animate-fade-in flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <Shield size={24} className="text-danger" />
            MITRE ATT&CK Heatmap
          </h1>
          <p className="text-muted text-sm mt-1">
            Mapping observed threats to the MITRE ATT&CK framework. Hotter colors indicate more frequent techniques.
          </p>
        </div>

        {/* Adversary Overlay Controls */}
        <div className="flex items-center gap-2 p-1 rounded-lg" style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <button
            onClick={() => setOverlay('none')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${overlay === 'none' ? 'bg-primary text-white' : 'text-muted hover:text-white'}`}
          >
            All Activity
          </button>
          <button
            onClick={() => setOverlay('china')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${overlay === 'china' ? 'bg-danger text-white' : 'text-muted hover:text-white'}`}
          >
            China Overlay
          </button>
          <button
            onClick={() => setOverlay('pakistan')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${overlay === 'pakistan' ? 'bg-warning text-white' : 'text-muted hover:text-white'}`}
          >
            Pakistan Overlay
          </button>
        </div>
      </div>

      <div className="flex col gap-4" style={{ flexDirection: 'column' }}>
        {MITRE_TACTICS.map(tactic => (
          <div key={tactic.id} className="glass-panel p-4 stagger-1">
            <div className="flex items-center gap-3 mb-3">
              <span className="badge badge-danger" style={{ fontSize: '10px' }}>{tactic.id}</span>
              <h3 className="text-sm font-bold">{tactic.name}</h3>
            </div>
            <div className="flex gap-2 flex-wrap">
              {tactic.techniques.map(tech => {
                const count = getAdjustedCount(tech.id, tech.count);
                return (
                  <div
                    key={tech.id}
                    className="p-3 rounded"
                    style={{
                      background: heatColor(count),
                      border: `1px solid ${severityColor(tech.severity)}33`,
                      borderRadius: 'var(--radius-sm)',
                      minWidth: '160px',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      opacity: overlay !== 'none' && !CHINA_TECHNIQUES.includes(tech.id) && !PAKISTAN_TECHNIQUES.includes(tech.id) && count < 80 ? 0.5 : 1
                    }}
                    title={`${tech.id}: ${tech.name} — Adjusted Observations: ${Math.round(count)}`}
                  >
                    <div className="text-xs text-muted font-mono">{tech.id}</div>
                    <div className="text-sm font-bold mt-1">{tech.name}</div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs font-bold" style={{ color: severityColor(tech.severity) }}>
                        {overlay !== 'none' ? (count > 80 ? 'HIGH PROBABILITY' : 'LOW SIGNAL') : `${Math.round(count)} events`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="glass-panel p-4 stagger-2">
        <h3 className="text-sm font-semibold mb-3">Heatmap Legend</h3>
        <div className="flex gap-6 items-center">
          {[
            { label: 'Low (< 80)', color: 'rgba(255,255,255,0.06)' },
            { label: 'Medium (80-150)', color: 'rgba(var(--primary-rgb), 0.25)' },
            { label: 'High (150-250)', color: 'rgba(var(--warning-rgb), 0.35)' },
            { label: 'Very High (250-400)', color: 'rgba(var(--danger-rgb), 0.35)' },
            { label: 'Critical (400+)', color: 'rgba(var(--danger-rgb), 0.6)' },
          ].map(item => (
            <div key={item.label} className="flex items-center gap-2">
              <div style={{ width: 16, height: 16, borderRadius: 3, background: item.color, border: '1px solid rgba(255,255,255,0.1)' }}></div>
              <span className="text-xs text-muted">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

