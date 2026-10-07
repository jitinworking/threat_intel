import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { 
  FileText, Download, Calendar, Mail, Clock, CheckCircle, 
  Search, ChevronRight, X, Shield, Activity, Share2, Target, AlertTriangle
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, CartesianGrid,
  BarChart, Bar, Cell
} from 'recharts';
import { 
  Card, Button, Badge, H1, H2, H3, Text, PageHeader
} from '../components/ui/design-system';

interface Report {
  id: string;
  title: string;
  type: 'Executive' | 'Operational' | 'Monthly';
  date: string;
  author: string;
  status: 'Published' | 'Draft';
  summary: string;
}

const mockReports: Report[] = [
  { id: 'rep-001', title: 'Q3 Global Cyber Threat Landscape', type: 'Executive', date: '2025-10-01', author: 'Threat Intel Team', status: 'Published', summary: 'Executive summary of Q3 threats highlighting a 40% increase in ransomware across the manufacturing sector.' },
  { id: 'rep-002', title: 'Operation Phantom Nexus Analysis', type: 'Operational', date: '2025-10-15', author: 'SOC Tier 3', status: 'Published', summary: 'Deep dive into the TTPs and IOCs associated with Mustang Panda\'s recent espionage campaign.' },
  { id: 'rep-003', title: 'October End-of-Month Metrics', type: 'Monthly', date: '2025-10-31', author: 'System Auto-Generated', status: 'Published', summary: 'Aggregated SOC metrics, incident response times, and total blocked threats for October.' },
  { id: 'rep-004', title: 'Zero-Day Vulnerability Impact: CVE-2025-9921', type: 'Executive', date: '2025-11-02', author: 'Vulnerability Mgmt', status: 'Draft', summary: 'Assessment of business risk regarding the newly disclosed zero-day in core perimeter firewalls.' },
];

const mockScheduled = [
  { id: 'sch-1', name: 'Weekly Executive Brief', type: 'Executive', frequency: 'Weekly (Monday 08:00)', recipients: ['ciso@company.com', 'board@company.com'] },
  { id: 'sch-2', name: 'Daily SOC Handoff', type: 'Operational', frequency: 'Daily (00:00, 08:00, 16:00)', recipients: ['soc-all@company.com'] },
  { id: 'sch-3', name: 'Monthly Compliance Report', type: 'Monthly', frequency: 'Monthly (1st Day)', recipients: ['compliance@company.com'] },
];

const mockChartData = [
  { name: 'Week 1', alerts: 400, blocked: 240 },
  { name: 'Week 2', alerts: 300, blocked: 139 },
  { name: 'Week 3', alerts: 200, blocked: 980 },
  { name: 'Week 4', alerts: 278, blocked: 390 },
];

const mockSectorData = [
  { name: 'Finance', attacks: 120 },
  { name: 'Healthcare', attacks: 85 },
  { name: 'Tech', attacks: 60 },
];

export const Reports: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'Archive' | 'Scheduled'>('Archive');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'All' | 'Executive' | 'Operational' | 'Monthly'>('All');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  const filteredReports = mockReports.filter(r => 
    (filterType === 'All' || r.type === filterType) &&
    r.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 md:p-8 flex flex-col gap-6 md:gap-8 bg-background min-h-full transition-colors duration-300 relative">
      
      {/* ── HEADER ── */}
      <PageHeader
        title="Intelligence Reports"
        subtitle="Automated and ad-hoc professional threat briefings and scheduled CISO reports"
        actions={
          <div className="flex bg-surface-elevated border border-border rounded p-1">
            <button 
              onClick={() => setActiveTab('Archive')}
              className={`px-3 py-1 rounded text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === 'Archive' 
                  ? 'bg-surface text-text shadow-xs' 
                  : 'text-text-muted hover:text-text'
              }`}
            >
              Report Archive
            </button>
            <button 
              onClick={() => setActiveTab('Scheduled')}
              className={`px-3 py-1 rounded text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === 'Scheduled' 
                  ? 'bg-surface text-text shadow-xs' 
                  : 'text-text-muted hover:text-text'
              }`}
            >
              Scheduled Reports
            </button>
          </div>
        }
      />

      {/* ── MAIN CONTENT: ARCHIVE ── */}
      {activeTab === 'Archive' && (
        <div className="flex flex-col gap-6 animate-fade-in">
          
          <div className="flex flex-wrap justify-between items-center gap-4 bg-paper border border-line rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-2">
              {['All', 'Executive', 'Operational', 'Monthly'].map(t => (
                <button
                  key={t}
                  onClick={() => setFilterType(t as any)}
                  className={`px-3 py-1.5 rounded-lg text-[12px] font-bold transition-colors ${
                    filterType === t ? 'bg-blue text-white' : 'bg-paper-alt text-ink-mid hover:bg-line hover:text-foreground'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
            
            <div className="flex items-center px-3.5 h-9 bg-paper-alt border border-line rounded-lg gap-2.5 min-w-[250px]">
              <Search size={14} className="text-ink-mid" />
              <input 
                type="text" 
                placeholder="Search reports..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-transparent border-none text-[12px] text-foreground flex-1 outline-none placeholder:text-ink-mid font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredReports.map(report => (
              <Card 
                key={report.id}
                onClick={() => setSelectedReport(report)}
                className="flex flex-col cursor-pointer hover:border-blue/50 hover:shadow-lg transition-all group p-6"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-2">
                    <Badge variant={
                      report.type === 'Executive' ? 'critical' : 
                      report.type === 'Operational' ? 'high' : 'medium'
                    }>
                      {report.type}
                    </Badge>
                    {report.status === 'Draft' && (
                      <Badge variant="default" className="bg-paper-alt text-ink-mid border-line">Draft</Badge>
                    )}
                  </div>
                  <span className="text-[11px] font-mono font-bold text-ink-mid">{report.date}</span>
                </div>
                
                <H3 className="text-[16px] font-bold text-foreground leading-tight mb-2 group-hover:text-blue transition-colors">
                  {report.title}
                </H3>
                <Text className="text-[13px] text-ink-mid line-clamp-2 mb-6 flex-1">
                  {report.summary}
                </Text>
                
                <div className="flex justify-between items-center pt-4 border-t border-line mt-auto">
                  <span className="text-[11px] font-bold text-ink-mid flex items-center gap-1.5">
                    <CheckCircle size={12} className="text-green" /> {report.author}
                  </span>
                  <div className="text-blue flex items-center gap-1 text-[11px] font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                    View Report <ChevronRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </Card>
            ))}
            {filteredReports.length === 0 && (
              <div className="col-span-full py-20 text-center text-ink-mid/60 border border-dashed border-line rounded-xl">
                 <span className="text-[13px] font-bold">No reports found matching your criteria.</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── MAIN CONTENT: SCHEDULED ── */}
      {activeTab === 'Scheduled' && (
        <div className="flex flex-col gap-6 animate-fade-in">
          <div className="flex justify-between items-center">
            <H2 className="text-[16px] font-bold text-foreground">Active Schedules</H2>
            <Button variant="primary" className="h-9 gap-2">
              <Calendar size={14} /> New Schedule
            </Button>
          </div>

          <div className="bg-paper border border-line rounded-xl shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-paper-alt border-b border-line">
                  <th className="p-4 text-[11px] font-bold text-ink-mid uppercase tracking-wider">Report Configuration</th>
                  <th className="p-4 text-[11px] font-bold text-ink-mid uppercase tracking-wider">Type</th>
                  <th className="p-4 text-[11px] font-bold text-ink-mid uppercase tracking-wider">Frequency</th>
                  <th className="p-4 text-[11px] font-bold text-ink-mid uppercase tracking-wider">Recipients</th>
                  <th className="p-4 text-[11px] font-bold text-ink-mid uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {mockScheduled.map((sch) => (
                  <tr key={sch.id} className="border-b border-line hover:bg-paper-alt/50 transition-colors">
                    <td className="p-4">
                      <span className="text-[14px] font-bold text-foreground block">{sch.name}</span>
                    </td>
                    <td className="p-4">
                      <Badge variant={sch.type === 'Executive' ? 'critical' : sch.type === 'Operational' ? 'high' : 'medium'}>
                        {sch.type}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <span className="flex items-center gap-1.5 text-[12px] font-bold text-foreground">
                        <Clock size={12} className="text-ink-mid" /> {sch.frequency}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col gap-1">
                        {sch.recipients.map(r => (
                          <span key={r} className="flex items-center gap-1.5 text-[11px] font-medium text-ink-mid">
                            <Mail size={10} /> {r}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <Button variant="secondary" className="h-7 text-[11px] px-2">Edit</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── PDF REPORT VIEWER      {/* Report Modal */}
      {selectedReport && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 animate-fade-in">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setSelectedReport(null)} />
          
          <div className="relative w-full max-w-5xl h-full max-h-[90vh] flex flex-col bg-paper border border-line shadow-2xl rounded-2xl overflow-hidden">
            
            {/* Viewer Toolbar */}
            <div className="flex justify-between items-center p-4 border-b border-line bg-paper-alt shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue/10 flex items-center justify-center text-blue">
                  <FileText size={16} />
                </div>
                <div>
                  <h3 className="text-[14px] font-bold text-foreground">{selectedReport.title}</h3>
                  <span className="text-[11px] text-ink-mid uppercase tracking-wider font-bold">PDF Document Preview</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="secondary" className="h-8 gap-2 px-3">
                  <Share2 size={14} /> Share
                </Button>
                <Button variant="primary" className="h-8 gap-2 px-3 bg-blue hover:bg-blue-hover text-white border-transparent">
                  <Download size={14} /> Export PDF
                </Button>
                <div className="w-px h-6 bg-line mx-2" />
                <button onClick={() => setSelectedReport(null)} className="p-1.5 hover:bg-line rounded text-ink-mid hover:text-foreground transition-colors cursor-pointer">
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Simulated A4 PDF Document */}
            <div className="flex-1 overflow-y-auto bg-background p-8 flex justify-center custom-scrollbar">
              
              {/* Document Paper */}
              <div className="w-full max-w-[800px] bg-white text-slate-900 shadow-lg min-h-[1056px] (A4 approximate ratio) p-12 flex flex-col relative print:shadow-none print:p-0">
                
                {/* PDF Header */}
                <div className="flex justify-between items-start border-b-2 border-slate-200 pb-8 mb-8">
                  <div className="flex flex-col gap-1">
                    <h1 className="text-3xl font-black tracking-tight text-slate-900 uppercase">Intelligence Brief</h1>
                    <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">{selectedReport.type} REPORT</span>
                  </div>
                  <div className="text-right flex flex-col gap-1">
                    <span className="text-sm font-bold text-slate-400">DATE: {selectedReport.date}</span>
                    <span className="text-sm font-bold text-slate-400">AUTHOR: {selectedReport.author}</span>
                    <span className="text-sm font-bold text-slate-400">ID: {selectedReport.id}</span>
                  </div>
                </div>

                {/* PDF Title */}
                <h2 className="text-4xl font-extrabold text-slate-900 leading-tight mb-8">
                  {selectedReport.title}
                </h2>

                {/* PDF Executive Summary */}
                <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 mb-10">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <FileText size={14} className="text-blue-600" /> Executive Summary
                  </h3>
                  <p className="text-slate-700 leading-relaxed font-medium text-[15px]">
                    {selectedReport.summary} 
                    This automated report encapsulates critical telemetry and strategic threat intelligence gathered over the specified period. Immediate attention is advised for highlighted critical anomalies.
                  </p>
                </div>

                {/* PDF Metrics Grid */}
                <div className="grid grid-cols-3 gap-6 mb-10">
                  <div className="border border-slate-200 rounded-xl p-5 flex flex-col items-center text-center">
                    <Shield size={24} className="text-emerald-600 mb-2" />
                    <span className="text-3xl font-black text-slate-900">4,281</span>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Threats Blocked</span>
                  </div>
                  <div className="border border-slate-200 rounded-xl p-5 flex flex-col items-center text-center bg-red-50">
                    <AlertTriangle size={24} className="text-red-600 mb-2" />
                    <span className="text-3xl font-black text-red-700">12</span>
                    <span className="text-xs font-bold text-red-500 uppercase tracking-widest mt-1">Critical Incidents</span>
                  </div>
                  <div className="border border-slate-200 rounded-xl p-5 flex flex-col items-center text-center">
                    <Activity size={24} className="text-blue-600 mb-2" />
                    <span className="text-3xl font-black text-slate-900">99.8%</span>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Uptime SLA</span>
                  </div>
                </div>

                {/* PDF Charts */}
                <div className="grid grid-cols-2 gap-8 mb-10">
                  <div className="flex flex-col gap-4">
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest border-b border-slate-200 pb-2">Threat Volume Trend</h3>
                    <div className="h-[200px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={mockChartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                          <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} />
                          <RechartsTooltip cursor={{ stroke: '#cbd5e1', strokeWidth: 2 }} contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', color: '#0f172a', fontSize: '12px', fontWeight: 'bold' }} />
                          <Area type="monotone" dataKey="alerts" stroke="#ef4444" fill="#fef2f2" strokeWidth={2} />
                          <Area type="monotone" dataKey="blocked" stroke="#3b82f6" fill="#eff6ff" strokeWidth={2} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="flex flex-col gap-4">
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest border-b border-slate-200 pb-2">Targeted Sectors</h3>
                    <div className="h-[200px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={mockSectorData} layout="vertical" margin={{ top: 0, right: 0, left: 10, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                          <XAxis type="number" hide />
                          <YAxis dataKey="name" type="category" tick={{ fill: '#0f172a', fontSize: 11, fontWeight: 700 }} axisLine={false} tickLine={false} width={80} />
                          <RechartsTooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', color: '#0f172a', fontSize: '12px', fontWeight: 'bold' }} />
                          <Bar dataKey="attacks" radius={[0, 4, 4, 0]} barSize={24}>
                            {mockSectorData.map((_, index) => (
                              <Cell key={`cell-${index}`} fill={index === 0 ? '#ef4444' : index === 1 ? '#f59e0b' : '#3b82f6'} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* PDF Recommendations */}
                <div className="mt-auto pt-8 border-t border-slate-200">
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Target size={16} className="text-emerald-600" /> Strategic Recommendations
                  </h3>
                  <ul className="list-disc pl-5 text-sm text-slate-600 font-medium space-y-2">
                    <li>Accelerate patching cycle for critical edge devices (VPNs, Firewalls) to under 48 hours.</li>
                    <li>Mandate phishing-resistant MFA (FIDO2) for all privileged accounts by end of quarter.</li>
                    <li>Enhance endpoint detection and response (EDR) tuning to reduce false positives by 15%.</li>
                  </ul>
                </div>

                {/* PDF Footer Overlay */}
                <div className="absolute bottom-6 left-12 right-12 flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest border-t border-slate-100 pt-4">
                  <span>CONFIDENTIAL & PROPRIETARY</span>
                  <span>PAGE 1 OF 1</span>
                  <span>THREAT INTEL PLATFORM V4</span>
                </div>

              </div>
            </div>

          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
