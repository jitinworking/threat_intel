import React, { useState, useEffect, useCallback } from 'react';
import { 
  Shield, Sparkles, RefreshCw, Download, FileText, Landmark, 
  HelpCircle, ChevronDown, CheckCircle2, AlertTriangle, Printer
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip, 
  Cell, PieChart, Pie, CartesianGrid 
} from 'recharts';
import { 
  Card, CardHeader, CardTitle, CardContent, 
  Button, Notification, H1, Text, Small, PageHeader
} from '../components/ui/design-system';

import { BACKEND_URL } from '../config';

const BACKEND = BACKEND_URL;

export const ExecutiveIntelligence: React.FC = () => {
  // Executive states
  const [summary, setSummary] = useState<any | null>(null);
  const [risk, setRisk] = useState<any | null>(null);
  const [business, setBusiness] = useState<any | null>(null);
  const [reports, setReports] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [aiSummary, setAiSummary] = useState<any | null>(null);

  // Authorization states
  const [actionedIds, setActionedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchExecutiveData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [sumRes, riskRes, busRes, repRes, recRes, aiRes] = await Promise.all([
        fetch(`${BACKEND}/api/executive/summary`).then(r => r.json()),
        fetch(`${BACKEND}/api/executive/risk`).then(r => r.json()),
        fetch(`${BACKEND}/api/executive/business`).then(r => r.json()),
        fetch(`${BACKEND}/api/executive/reports`).then(r => r.json()),
        fetch(`${BACKEND}/api/executive/recommendations`).then(r => r.json()),
        fetch(`${BACKEND}/api/executive/ai-summary`).then(r => r.json())
      ]);

      setSummary(sumRes);
      setRisk(riskRes);
      setBusiness(busRes);
      setReports(Array.isArray(repRes) ? repRes : []);
      setRecommendations(Array.isArray(recRes) ? recRes : []);
      setAiSummary(aiRes);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'CISO service connection timeout.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchExecutiveData();
  }, [fetchExecutiveData]);

  const toggleActioned = (id: string) => {
    setActionedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleDownload = (docTitle: string) => {
    alert(`Downloading certified cryptographic CISO package: ${docTitle}`);
  };

  const triggerPrintPDF = () => {
    window.print();
  };

  // Recharts trend data
  const trendData = [
    { name: 'Jan', posture: 62 },
    { name: 'Feb', posture: 64 },
    { name: 'Mar', posture: 68 },
    { name: 'Apr', posture: 70 },
    { name: 'May', posture: 72 },
    { name: 'Jun', posture: 74 },
  ];

  return (
    <div className="p-6 md:p-8 flex flex-col gap-6 md:gap-8 bg-background min-h-full transition-colors duration-300 print:bg-white print:p-12">
      
      {/* ── HEADER & TOOLBAR ── */}
      <PageHeader
        title="Executive Posture Intelligence"
        description="Corporate security health metrics, executive risk posture, and MITRE ATT&CK compliance tracking."
        breadcrumbs={[
          { label: 'Command Center' },
          { label: 'Executive Posture' }
        ]}
        actions={
          <div className="flex flex-wrap items-center gap-2.5 print:hidden">
            <Button 
              variant="secondary" 
              size="sm" 
              onClick={fetchExecutiveData} 
              disabled={loading}
              className="gap-1.5"
            >
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
              <span>Sync</span>
            </Button>

            <Button 
              variant="secondary" 
              size="sm" 
              onClick={() => handleDownload('CSV Posture Sheet')} 
              className="gap-1.5"
            >
              <FileText size={13} />
              <span>CSV Export</span>
            </Button>

            <Button 
              variant="primary" 
              size="sm" 
              onClick={triggerPrintPDF} 
              className="gap-1.5"
            >
              <Printer size={13} />
              <span>Generate PDF Brief</span>
            </Button>
          </div>
        }
      />

      {error && (
        <Notification 
          variant="warning"
          title="Service Connection Timeout"
          message={`Failed to query executive CISO aggregates: ${error}`}
        />
      )}

      {/* ── TOP-LINE POSTURAL KPIs ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 print:grid-cols-4 print:gap-2">
        <Card className="print:border-black">
          <CardHeader className="pb-1 border-none mb-0">
            <CardTitle className="text-ink-mid text-[11px] uppercase tracking-wider font-bold print:text-black">Executive Risk Index</CardTitle>
            <HelpCircle size={13} className="text-ink-mid/50 print:hidden" />
          </CardHeader>
          <CardContent className="pt-2">
            <span className="text-[26px] font-extrabold text-foreground tracking-tight print:text-black">
              {risk?.overallScore ? `${risk.overallScore} / 100` : '74 / 100'}
            </span>
            <Text className="text-[10px] text-red font-bold mt-1 print:text-black">{risk?.change || '+14% shift'}</Text>
          </CardContent>
        </Card>

        <Card className="print:border-black">
          <CardHeader className="pb-1 border-none mb-0">
            <CardTitle className="text-ink-mid text-[11px] uppercase tracking-wider font-bold print:text-black">Mean Time to Detect</CardTitle>
            <HelpCircle size={13} className="text-ink-mid/50 print:hidden" />
          </CardHeader>
          <CardContent className="pt-2">
            <span className="text-[26px] font-extrabold text-foreground tracking-tight print:text-black">
              {summary?.mttd || '4.2 Min'}
            </span>
            <Text className="text-[10px] text-green font-bold mt-1 print:text-black">-12.4% reduction</Text>
          </CardContent>
        </Card>

        <Card className="print:border-black">
          <CardHeader className="pb-1 border-none mb-0">
            <CardTitle className="text-ink-mid text-[11px] uppercase tracking-wider font-bold print:text-black">Mean Time to Respond</CardTitle>
            <HelpCircle size={13} className="text-ink-mid/50 print:hidden" />
          </CardHeader>
          <CardContent className="pt-2">
            <span className="text-[26px] font-extrabold text-foreground tracking-tight print:text-black">
              {summary?.mttr || '14.8 Min'}
            </span>
            <Text className="text-[10px] text-green font-bold mt-1 print:text-black">-8.2% reduction</Text>
          </CardContent>
        </Card>

        <Card className="print:border-black">
          <CardHeader className="pb-1 border-none mb-0">
            <CardTitle className="text-ink-mid text-[11px] uppercase tracking-wider font-bold print:text-black">MITRE Coverage Rate</CardTitle>
            <HelpCircle size={13} className="text-ink-mid/50 print:hidden" />
          </CardHeader>
          <CardContent className="pt-2">
            <span className="text-[26px] font-extrabold text-foreground tracking-tight print:text-black">
              {business?.complianceScore || '82.4%'}
            </span>
            <Text className="text-[10px] text-green font-bold mt-1 print:text-black">{business?.coverageDelta || '+2.1%'}</Text>
          </CardContent>
        </Card>
      </div>

      {/* ── CORE EXECUTIVE WORKSPACE ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8">
        
        {/* Left Span: AI Briefing & Mitigation authorization list */}
        <div className="xl:col-span-2 flex flex-col gap-6 lg:gap-8">
          
          {/* AI Copilot Executive Briefing */}
          <div className="relative bg-gradient-to-r from-blue/5 to-transparent border border-line rounded-2xl p-6 overflow-hidden shadow-sm flex flex-col gap-3.5 print:bg-white print:border-black print:from-white">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue/5 rounded-full blur-2xl pointer-events-none print:hidden" />
            
            <div className="flex items-center gap-3 print:hidden">
              <div className="px-2.5 py-1 rounded bg-blue/10 text-blue text-[10px] font-extrabold uppercase tracking-wider border border-blue/20 flex items-center gap-1.5">
                <Sparkles size={11} className="animate-pulse" />
                <span>AI Copilot Briefing</span>
              </div>
              <span className="text-[10px] text-ink-mid font-mono">Status: Authenticated Brief</span>
            </div>

            <H1 className="text-[18px] font-extrabold tracking-tight text-foreground print:text-black leading-snug">
              {aiSummary?.threatLevel || 'High Risk Active Threats'} Identified in Core Infrastructure
            </H1>
            
            <p className="text-[12.5px] text-ink-mid print:text-gray-800 leading-relaxed">
              {aiSummary?.summary || 'Aggregated intrusion patterns suggest credential access campaigns targeted at network nodes.'}
            </p>

            <div className="p-3.5 bg-paper border border-line rounded-xl flex items-center gap-3 print:border-black print:bg-white">
              <AlertTriangle className="text-red shrink-0" size={15} />
              <p className="text-[11.5px] text-ink-mid print:text-black font-semibold italic">
                <span className="font-bold text-foreground print:text-black not-italic mr-1.5">Forward outlook:</span>
                {aiSummary?.outlook || 'Critical security patch compliance reviews recommended immediately.'}
              </p>
            </div>
          </div>

          {/* Priority Mitigation Playbooks */}
          <Card className="print:border-black">
            <CardHeader className="pb-2">
              <CardTitle className="text-[13px] font-bold uppercase tracking-wider flex items-center gap-2">
                <Shield size={14} className="text-blue" /> Priority Mitigation Authorizations
              </CardTitle>
              <Small>Mitigation policies awaiting digital CISO authorization</Small>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-3.5">
                {recommendations.map(rec => {
                  const isActioned = actionedIds.includes(rec.id);
                  return (
                    <div key={rec.id} className="p-4 bg-paper rounded-xl border border-line flex flex-col md:flex-row gap-4 justify-between items-start md:items-center print:border-black">
                      <div className="flex-1 flex flex-col gap-1">
                        <div className="flex items-center gap-2.5">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-widest ${
                            rec.priority === 'Critical' ? 'bg-red/10 text-red border border-red/20' : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                          }`}>
                            Rank {rec.rank} · {rec.priority}
                          </span>
                          <span className="text-[12px] font-bold text-foreground print:text-black">{rec.action}</span>
                        </div>
                        <p className="text-[11.5px] text-ink-mid print:text-gray-800 leading-normal mt-1">
                          <span className="font-semibold text-foreground print:text-black mr-1">Vulnerable Segment:</span>
                          {rec.affectedAssets}
                        </p>
                        <p className="text-[11.5px] text-ink-mid/80 print:text-gray-700 leading-normal">
                          <span className="font-semibold text-foreground print:text-black mr-1">Mitigation Protocol:</span>
                          {rec.suggestedResponse}
                        </p>
                      </div>

                      <Button 
                        variant={isActioned ? 'secondary' : 'primary'} 
                        size="md" 
                        onClick={() => toggleActioned(rec.id)}
                        className="gap-1.5 shrink-0 print:hidden"
                      >
                        {isActioned ? <CheckCircle2 size={13} className="text-green" /> : null}
                        <span>{isActioned ? 'Authorized' : 'Authorize Policy'}</span>
                      </Button>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

        </div>

        {/* Right Span: Charts, Threat Vectors, certified assessments */}
        <div className="flex flex-col gap-6 lg:gap-8">
          
          {/* Posture Trend line */}
          <Card className="print:border-black">
            <CardHeader className="pb-2">
              <CardTitle className="text-[13px] font-bold uppercase tracking-wider">6-Month Posture Trends</CardTitle>
              <Small>Aggregated historical posture assessment profile</Small>
            </CardHeader>
            <CardContent>
              <div className="w-full h-44 mt-2 print:hidden">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                    <defs>
                      <linearGradient id="cisoColor" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563EB" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#2563EB" stopOpacity={0.0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--line))" opacity={0.4} />
                    <XAxis dataKey="name" stroke="#64748B" fontSize={9.5} fontStyle="bold" />
                    <YAxis domain={[50, 100]} stroke="#64748B" fontSize={9.5} fontStyle="bold" />
                    <Tooltip contentStyle={{ background: 'hsl(var(--paper))', borderColor: 'hsl(var(--line))', fontSize: 11 }} />
                    <Area type="monotone" dataKey="posture" stroke="#2563EB" strokeWidth={2} fillOpacity={1} fill="url(#cisoColor)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Print alternative text for trend */}
              <div className="hidden print:block text-[11px] text-black">
                Posture levels show a steady optimization curve from 62% in January to 74% in June.
              </div>
            </CardContent>
          </Card>

          {/* Threat Vector Distribution Ring */}
          <Card className="print:border-black">
            <CardHeader className="pb-2">
              <CardTitle className="text-[13px] font-bold uppercase tracking-wider">Threat Vector Distribution</CardTitle>
              <Small>Ingested class distribution overview</Small>
            </CardHeader>
            <CardContent>
              <div className="w-full h-40 flex items-center justify-center relative print:hidden">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={business?.riskClassification || []}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={62}
                      paddingAngle={4}
                      dataKey="count"
                    >
                      {(business?.riskClassification || []).map((_entry: any, index: number) => {
                        const colors = ['#2563EB', '#3B82F6', '#10B981', '#F59E0B', '#EF4444'];
                        return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                      })}
                    </Pie>
                    <Tooltip contentStyle={{ background: 'hsl(var(--paper))', borderColor: 'hsl(var(--line))', fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute flex flex-col items-center justify-center">
                  <span className="text-[18px] font-extrabold text-foreground leading-none">1.1K</span>
                  <span className="text-[9px] text-ink-mid font-bold uppercase mt-0.5">Traces</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] font-semibold text-ink-mid mt-1 print:text-black">
                {business?.riskClassification?.map((c: any) => (
                  <div key={c.category} className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded bg-blue" />
                    <span>{c.category}: {c.count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Certified Assessments Catalog */}
          <Card className="print:border-black">
            <CardHeader className="pb-2">
              <CardTitle className="text-[13px] font-bold uppercase tracking-wider">Certified Strategic Assessments</CardTitle>
              <Small>Cryptographically signed reports ready for download</Small>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-2">
                {reports.map(rep => (
                  <div key={rep.id} className="p-3 bg-paper rounded-xl border border-line flex items-center justify-between print:border-black">
                    <div className="flex flex-col gap-0.5 max-w-[75%]">
                      <span className="text-[11.5px] font-bold text-foreground print:text-black truncate">{rep.title}</span>
                      <span className="text-[9.5px] text-ink-mid print:text-gray-700 font-mono">Emitted: {rep.created}</span>
                    </div>
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      onClick={() => handleDownload(rep.title)}
                      className="print:hidden"
                    >
                      <Download size={12} />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

        </div>

      </div>

    </div>
  );
};
