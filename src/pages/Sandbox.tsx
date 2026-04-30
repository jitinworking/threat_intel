import { API_BASE_URL } from '../config';
import React, { useState } from 'react';
import { Upload, Globe, Box, Shield, Activity, FileText, Clock } from 'lucide-react';

interface SandboxReport {
  id: string;
  target: string;
  type: 'URL' | 'FILE';
  status: 'In Progress' | 'Completed' | 'Failed';
  timestamp: string;
  verdict?: 'Malicious' | 'Suspicious' | 'Clean';
}

export const Sandbox: React.FC = () => {
  const [submissionType, setSubmissionType] = useState<'url' | 'file'>('url');
  const [input, setInput] = useState('');
  const [reports, setReports] = useState<SandboxReport[]>([
    { id: 'SB-A938F2', target: 'http://mal-update-site.top/payload.exe', type: 'URL', status: 'Completed', timestamp: '2026-03-27 14:20', verdict: 'Malicious' },
    { id: 'SB-E22194', target: 'invoice_8332.iso', type: 'FILE', status: 'Completed', timestamp: '2026-03-27 12:45', verdict: 'Critical' } as any,
    { id: 'SB-C11982', target: 'https://legit-service.com/login', type: 'URL', status: 'Completed', timestamp: '2026-03-27 09:12', verdict: 'Clean' },
  ]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input && submissionType === 'url') return;
    
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/sandbox`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ioc: input, type: submissionType })
      });
      const data = await res.json();
      
      const newReport: SandboxReport = {
        id: data.jobId,
        target: input || 'Uploaded File',
        type: submissionType.toUpperCase() as any,
        status: 'In Progress',
        timestamp: new Date().toLocaleString(),
      };
      setReports([newReport, ...reports]);
      setInput('');
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black flex items-center gap-4 text-white uppercase tracking-tight">
            <Box className="text-primary" size={32} /> Malware Sandbox
          </h1>
          <p className="text-muted text-sm mt-1 font-medium italic">Detonate suspicious artifacts in an isolated analysis environment.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Submission Panel */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-panel p-8 bg-slate-900/40 border-primary/20 shadow-2xl">
             <div className="flex gap-4 mb-8">
               <button 
                 onClick={() => setSubmissionType('url')}
                 className={`flex-1 py-4 px-6 rounded-xl border font-bold text-sm transition-all flex items-center justify-center gap-3 ${submissionType === 'url' ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20' : 'bg-white/5 border-white/10 text-muted hover:border-white/20'}`}
               >
                 <Globe size={20} /> ANALYZE URL
               </button>
               <button 
                 onClick={() => setSubmissionType('file')}
                 className={`flex-1 py-4 px-6 rounded-xl border font-bold text-sm transition-all flex items-center justify-center gap-3 ${submissionType === 'file' ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20' : 'bg-white/5 border-white/10 text-muted hover:border-white/20'}`}
               >
                 <Upload size={20} /> ANALYZE FILE
               </button>
             </div>

             <form onSubmit={handleSubmit} className="space-y-6">
               {submissionType === 'url' ? (
                 <div className="space-y-2">
                   <label className="text-[10px] font-bold text-muted uppercase tracking-widest ml-1">Universal Resource Locator</label>
                   <div className="flex gap-3">
                     <input 
                       className="flex-1 bg-slate-950/80 border border-white/10 rounded-xl px-6 py-4 text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-slate-700"
                       placeholder="https://suspicious-site.com/exploit"
                       value={input}
                       onChange={(e) => setInput(e.target.value)}
                     />
                   </div>
                 </div>
               ) : (
                 <div className="border-2 border-dashed border-white/5 rounded-2xl py-12 flex flex-col items-center justify-center gap-4 bg-slate-950/20 hover:bg-slate-950/40 transition-all cursor-pointer group">
                    <div className="p-4 bg-white/5 rounded-full group-hover:scale-110 transition-transform">
                      <Upload size={32} className="text-muted" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-bold text-white uppercase tracking-tight">Drop artifact here to detonate</p>
                      <p className="text-xs text-muted mt-1">Supports .exe, .dll, .js, .vbs, .docm, .pdf (Max 50MB)</p>
                    </div>
                 </div>
               )}

               <button 
                 type="submit"
                 disabled={loading}
                 className="w-full py-4 bg-primary hover:bg-primary-hover disabled:opacity-50 text-white font-black uppercase tracking-widest rounded-xl transition-all shadow-xl shadow-primary/10 flex items-center justify-center gap-3"
               >
                 {loading ? <Clock className="animate-spin" /> : <Activity />} DETONATE ARTIFACT
               </button>
             </form>
          </div>

          {/* Tips / Info */}
          <div className="grid grid-cols-2 gap-6">
             <div className="glass-panel p-5 border-blue-500/10 hover:border-blue-500/30 transition-all">
                <Shield size={20} className="text-blue-500 mb-3" />
                <h4 className="text-sm font-bold text-white mb-1">Interactive Sandbox</h4>
                <p className="text-[11px] text-muted">Real-time interaction during analysis for bypassing anti-vm techniques.</p>
             </div>
             <div className="glass-panel p-5 border-purple-500/10 hover:border-purple-500/30 transition-all">
                <FileText size={20} className="text-purple-500 mb-3" />
                <h4 className="text-sm font-bold text-white mb-1">Network Emulation</h4>
                <p className="text-[11px] text-muted">Advanced traffic capture and decoding for encrypted C2 protocols.</p>
             </div>
          </div>
        </div>

        {/* Recent Reports Panel */}
        <div className="space-y-6">
          <div className="glass-panel p-0 overflow-hidden flex flex-col border-white/10 h-full">
            <div className="p-4 border-b border-white/5 bg-white/2 flex justify-between items-center">
               <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted">Analysis Backlog</h3>
               <button className="text-[10px] font-bold text-primary">View All</button>
            </div>
            
            <div className="divide-y divide-white/5 overflow-y-auto custom-scrollbar flex-1">
              {reports.map((report) => (
                <div key={report.id} className="p-5 hover:bg-white/2 transition-all group cursor-pointer">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[9px] font-mono p-1 bg-white/5 border border-white/10 rounded text-muted">{report.id}</span>
                    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${
                      report.verdict === 'Malicious' ? 'bg-danger/20 text-danger' : 
                      report.verdict === 'Clean' ? 'bg-green-500/20 text-green-400' :
                      'bg-warning/20 text-warning'
                    }`}>
                      {report.status === 'In Progress' ? 'ANALYZING' : report.verdict || 'PENDING'}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-white mb-1 truncate group-hover:text-primary transition-colors">{report.target}</h4>
                  <div className="flex justify-between items-center mt-3">
                    <div className="flex items-center gap-2 text-[10px] text-muted font-bold">
                       {report.type === 'URL' ? <Globe size={11} /> : <FileText size={11} />}
                       {report.type}
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-muted">
                       <Clock size={11} />
                       {report.timestamp}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-white/5 bg-slate-900/50">
               <div className="flex justify-between items-center text-[10px] font-bold uppercase text-muted tracking-widest">
                 <span>Avg Queue Time</span>
                 <span className="text-white">~4.2 mins</span>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
