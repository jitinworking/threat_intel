import React from 'react';
import { Shield, Target, AlertCircle, ExternalLink, Zap, ChevronRight, X } from 'lucide-react';

interface InvestigationBrief {
  summary: string;
  risk_score: number;
  recommended_action: string;
  historical_hits: number;
  threat_actor_match: string;
}

interface InvestigationSidebarProps {
  ioc: any;
  isOpen: boolean;
  onClose: () => void;
  brief: InvestigationBrief | null;
  loading: boolean;
}

export const InvestigationSidebar: React.FC<InvestigationSidebarProps> = ({ ioc, isOpen, onClose, brief, loading }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-[450px] bg-paper border-l border-line z-1000 shadow-2xl flex flex-col animate-slide-in">
      <div className="p-6 border-b border-line flex justify-between items-center bg-paper-alt">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Shield size={20} className="text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground tracking-tight">AI investigation Brief</h2>
            <p className="text-[10px] uppercase font-bold text-ink-mid tracking-widest mt-0.5">Asset ID: {String(ioc?.id).substr(0,8)}</p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-line rounded-full transition-colors">
          <X size={20} className="text-ink-mid" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
            <p className="text-sm text-ink-mid animate-pulse">Consulting Threat Intelligence Oracle...</p>
          </div>
        ) : brief ? (
          <div className="space-y-8">
            {/* Risk Score Widget */}
            <div className="glass-panel p-6 border-primary/20 bg-primary/5 relative overflow-hidden">
               <div className="absolute top-0 right-0 p-4 opacity-10">
                 <Zap size={80} />
               </div>
               <div className="flex justify-between items-end">
                 <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-1">Confidence Score</p>
                    <div className="text-4xl font-black text-foreground">{brief.risk_score}%</div>
                 </div>
                 <div className="text-right">
                    <span className="badge badge-danger px-3 py-1 text-xs font-bold">CRITICAL THREAT</span>
                 </div>
               </div>
            </div>

            {/* AI Summary */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-ink-mid mb-3 flex items-center gap-2">
                <Target size={14} className="text-primary" /> Analysis Summary
              </h3>
              <div className="p-4 bg-paper-alt rounded-xl border border-line text-sm leading-relaxed text-foreground">
                {brief.summary}
              </div>
            </div>

            {/* Recommendations */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-ink-mid mb-3 flex items-center gap-2">
                <AlertCircle size={14} className="text-warning" /> Countermeasures
              </h3>
              <div className="p-4 bg-warning/5 rounded-xl border border-warning/20 flex gap-4 items-center">
                <div className="p-2 bg-warning/20 rounded-lg text-warning shrink-0">
                   <Zap size={20} />
                </div>
                <div>
                  <p className="text-xs font-bold text-warning mb-0.5">Recommended Action</p>
                  <p className="text-sm font-bold text-foreground uppercase tracking-tight">{brief.recommended_action}</p>
                </div>
              </div>
            </div>

            {/* Attribution */}
            <div className="grid grid-cols-2 gap-4">
               <div className="bg-paper border border-line rounded-xl p-4 shadow-sm">
                  <p className="text-[9px] font-bold text-ink-mid uppercase mb-1">Likely Actor</p>
                  <p className="text-sm font-bold text-foreground">{brief.threat_actor_match}</p>
               </div>
               <div className="bg-paper border border-line rounded-xl p-4 shadow-sm">
                  <p className="text-[9px] font-bold text-ink-mid uppercase mb-1">Historical Hits</p>
                  <p className="text-sm font-bold text-foreground">{brief.historical_hits} Correlations</p>
               </div>
            </div>

            {/* External Links */}
            <div className="pt-4 border-t border-line">
              <button className="w-full py-3 bg-paper-alt hover:bg-line border border-line rounded-xl text-sm font-bold text-foreground transition-all flex items-center justify-center gap-2 mb-3 cursor-pointer">
                Pivot to VirusTotal <ExternalLink size={14} />
              </button>
              <button className="w-full py-3 bg-paper-alt hover:bg-line border border-line rounded-xl text-sm font-bold text-foreground transition-all flex items-center justify-center gap-2 cursor-pointer">
                Pivot to Shodan <ExternalLink size={14} />
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-ink-mid text-sm">No analysis data available for this indicator.</p>
          </div>
        )}
      </div>

      <div className="p-6 bg-paper-alt border-t border-line">
         <button className="w-full py-4 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2 cursor-pointer">
           Download Full Intel Brief <ChevronRight size={18} />
         </button>
      </div>
    </div>
  );
};
