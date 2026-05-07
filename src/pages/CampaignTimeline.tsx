import React, { useState } from 'react';
import { Clock, Activity, Target, ShieldAlert, GitCommit, Search, ExternalLink } from 'lucide-react';

const mockCampaigns = [
  {
    id: 'camp-001',
    name: 'Operation "Ghost Writer" (APT29)',
    description: 'A sophisticated phishing campaign targeting government agencies, observed evolving its C2 infrastructure over 45 days.',
    status: 'active',
    startDate: '2026-03-15',
    events: [
      { id: 1, date: '2026-03-15', title: 'Domain Registration', desc: 'Attacker registered spoofed domain: login-microsoftonline-secure.com', type: 'recon' },
      { id: 2, date: '2026-03-22', title: 'SSL Certificate Issued', desc: 'Let\'s Encrypt certificate provisioned for spoofed domain.', type: 'recon' },
      { id: 3, date: '2026-04-01', title: 'Initial Phishing Wave', desc: 'Targeted spear-phishing emails sent to 15 executives containing malicious PDF.', type: 'delivery' },
      { id: 4, date: '2026-04-03', title: 'First Payload Detonation', desc: 'Sandbox detected execution of heavily obfuscated droppper (Cobalt Strike loader).', type: 'execution' },
      { id: 5, date: '2026-04-04', title: 'C2 Beaconing Detected', desc: 'Outbound traffic observed to known malicious IP (185.12.x.x) over port 443.', type: 'c2' },
      { id: 6, date: '2026-04-10', title: 'Infrastructure Burned', desc: 'Original domain taken down. Threat actor shifted to new IP space.', type: 'action' },
      { id: 7, date: '2026-04-12', title: 'Second Phishing Wave', desc: 'Campaign resumed using compromised legitimate WordPress sites.', type: 'delivery' },
    ]
  },
  {
    id: 'camp-002',
    name: 'Lazarus Cryptocurrency Targeting',
    description: 'Financial sector targeting focused on cryptocurrency exchanges using trojanized trading applications.',
    status: 'dormant',
    startDate: '2026-01-10',
    events: [
      { id: 1, date: '2026-01-10', title: 'Fake App Published', desc: 'Trojanized trading app uploaded to third-party stores.', type: 'delivery' },
      { id: 2, date: '2026-01-25', title: 'Malware Bazaar Upload', desc: 'First instance of payload seen on MalwareBazaar.', type: 'recon' },
      { id: 3, date: '2026-02-05', title: 'C2 Communication', desc: 'Encrypted channel established via Telegram API.', type: 'c2' },
    ]
  }
];

const getEventTypeColor = (type: string) => {
  switch (type) {
    case 'recon': return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
    case 'delivery': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30';
    case 'execution': return 'text-orange-400 bg-orange-500/10 border-orange-500/30';
    case 'c2': return 'text-purple-400 bg-purple-500/10 border-purple-500/30';
    case 'action': return 'text-green-400 bg-green-500/10 border-green-500/30';
    default: return 'text-slate-400 bg-slate-500/10 border-slate-500/30';
  }
};

const getEventIcon = (type: string) => {
  switch (type) {
    case 'recon': return <Search size={14} />;
    case 'delivery': return <Target size={14} />;
    case 'execution': return <Activity size={14} />;
    case 'c2': return <GitCommit size={14} />;
    case 'action': return <ShieldAlert size={14} />;
    default: return <Clock size={14} />;
  }
};

export const CampaignTimeline: React.FC = () => {
  const [activeCampaign, setActiveCampaign] = useState(mockCampaigns[0]);

  return (
    <div className="animate-fade-in flex flex-col gap-6 h-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <Clock size={24} className="text-primary" />
            Campaign Timelines
          </h1>
          <p className="text-muted text-sm mt-1">
            Chronological reconstruction and lifecycle analysis of tracked APT campaigns.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1">
        
        {/* Campaign List Sidebar */}
        <div className="glass-panel p-4 flex flex-col gap-3 lg:col-span-1">
          <h3 className="text-sm font-bold uppercase tracking-wider text-muted mb-2">Tracked Campaigns</h3>
          {mockCampaigns.map(camp => (
            <div 
              key={camp.id}
              onClick={() => setActiveCampaign(camp)}
              className={`p-3 rounded-lg border cursor-pointer transition-all ${
                activeCampaign.id === camp.id 
                  ? 'bg-primary/10 border-primary text-white' 
                  : 'bg-white/5 border-transparent text-slate-300 hover:bg-white/10'
              }`}
            >
              <div className="font-bold text-sm mb-1">{camp.name}</div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted">{camp.startDate}</span>
                <span className={`px-2 py-0.5 rounded-full ${camp.status === 'active' ? 'bg-danger/20 text-danger' : 'bg-slate-500/20 text-slate-400'}`}>
                  {camp.status}
                </span>
              </div>
            </div>
          ))}
          
          <button className="mt-4 w-full py-2 border border-dashed border-slate-600 rounded-lg text-sm text-slate-400 hover:text-white hover:border-slate-400 transition-colors">
            + Correlate New Campaign
          </button>
        </div>

        {/* Timeline View */}
        <div className="glass-panel p-6 lg:col-span-3 flex flex-col">
          <div className="mb-8 border-b border-white/10 pb-6 flex justify-between items-start">
            <div>
              <h2 className="text-xl font-bold text-white mb-2">{activeCampaign.name}</h2>
              <p className="text-slate-400 text-sm max-w-2xl">{activeCampaign.description}</p>
            </div>
            <div className="flex gap-4 text-center">
              <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                <div className="text-2xl font-bold text-primary">{activeCampaign.events.length}</div>
                <div className="text-xs text-muted uppercase tracking-wider">Events</div>
              </div>
              <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                <div className="text-2xl font-bold text-warning">High</div>
                <div className="text-xs text-muted uppercase tracking-wider">Velocity</div>
              </div>
            </div>
          </div>

          <div className="relative flex-1 pl-4">
            {/* Vertical Line */}
            <div className="absolute left-[27px] top-4 bottom-4 w-0.5 bg-slate-700"></div>

            <div className="flex flex-col gap-8 relative z-10">
              {activeCampaign.events.map((event, index) => (
                <div key={event.id} className="flex gap-6 group animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                  
                  {/* Timeline Node */}
                  <div className="flex flex-col items-center mt-1">
                    <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(0,0,0,0.5)] z-10 transition-transform group-hover:scale-110 ${getEventTypeColor(event.type)}`}>
                      {getEventIcon(event.type)}
                    </div>
                  </div>

                  {/* Event Content */}
                  <div className="flex-1 bg-white/5 border border-white/10 p-4 rounded-lg hover:border-white/20 transition-all">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-slate-200">{event.title}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border uppercase tracking-wider ${getEventTypeColor(event.type)}`}>
                          {event.type}
                        </span>
                      </div>
                      <span className="text-xs font-mono text-slate-400 flex items-center gap-1">
                        <Clock size={12} /> {event.date}
                      </span>
                    </div>
                    <p className="text-sm text-slate-400 leading-relaxed">
                      {event.desc}
                    </p>
                    
                    {event.type === 'c2' && (
                      <div className="mt-3 text-xs bg-slate-900/50 p-2 rounded border border-slate-700 font-mono text-purple-300 flex justify-between items-center">
                        <span>DST IP: 185.12.x.x | PORT: 443</span>
                        <ExternalLink size={12} className="cursor-pointer hover:text-white" />
                      </div>
                    )}
                     {event.type === 'execution' && (
                      <div className="mt-3 text-xs bg-slate-900/50 p-2 rounded border border-slate-700 font-mono text-orange-300 flex justify-between items-center">
                        <span>SHA256: 8a9f...b4c2</span>
                        <ExternalLink size={12} className="cursor-pointer hover:text-white" />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            {activeCampaign.status === 'active' && (
               <div className="flex gap-6 mt-8 opacity-50">
                <div className="flex flex-col items-center mt-1">
                  <div className="w-8 h-8 rounded-full border-2 border-dashed border-slate-500 flex items-center justify-center shrink-0 z-10">
                    <Clock size={14} className="text-slate-500 animate-pulse" />
                  </div>
                </div>
                <div className="flex-1 p-4 flex items-center text-sm text-slate-500 italic">
                  Monitoring for further activity...
                </div>
               </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
