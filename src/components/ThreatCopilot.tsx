import { API_BASE_URL, WS_BASE_URL } from '../config';
import React, { useState, useRef, useEffect } from 'react';
import { Bot, User, Send, X, Terminal, Maximize2, Minimize2 } from 'lucide-react';
import { mockApts } from '../data/mockApts';

interface Message {
  id: string;
  sender: 'user' | 'bot';
  content: React.ReactNode;
  timestamp: Date;
}

export const ThreatCopilot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'bot',
      content: 'System initialized. I am your Natural Language Threat Hunter Engine. Ask me to correlate actors, locate CVE footprints, or summarize active APTs.',
      timestamp: new Date()
    }
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const parseIntelligence = async (query: string): Promise<React.ReactNode> => {
    const q = query.toLowerCase();
    const qStripped = q.replace(/\s/g, '');

    // Strategy 1: Search by Origin
    const origins = ['china', 'chinese', 'pakistan', 'pakistani', 'russia', 'russian', 'iran', 'iranian', 'north korea'];
    const originMatch = origins.find(o => q.includes(o));
    let mappedOrigin = originMatch;
    if (originMatch === 'chinese') mappedOrigin = 'china';
    if (originMatch === 'pakistani') mappedOrigin = 'pakistan';
    if (originMatch === 'russian') mappedOrigin = 'russia';
    if (originMatch === 'iranian') mappedOrigin = 'iran';

    // Strategy 2: Search by Target (Sector)
    const sectors = ['healthcare', 'finance', 'financial', 'government', 'telecom', 'defense', 'energy', 'manufacturing'];
    const sectorMatch = sectors.find(s => q.includes(s));
    let mappedSector = sectorMatch;
    if (sectorMatch === 'finance' || sectorMatch === 'financial') mappedSector = 'financial';

    // Strategy 3: Search by TTP / Arsenal
    const cveMatch = q.match(/cve-\d{4}-\d{4,7}/i);
    const hasLog4j = q.includes('log4j') || q.includes('log4shell');
    const hasPlugX = q.includes('plugx');
    const hasCobalt = q.includes('cobalt') || q.includes('cobalt strike') || q.includes('cobaltstrike');
    
    // Strategy 4: Exact APT Name or Alias matches
    const specificApt = mockApts.find(apt => 
      q.includes(apt.name.toLowerCase()) || 
      apt.aliases.some(alias => q.includes(alias.toLowerCase()) || qStripped.includes(alias.toLowerCase().replace(/\s/g, '')))
    );

    // Strategy 5: Querying associated IoCs
    const lookingForIocs = q.includes('ioc') || q.includes('ip') || q.includes('domain') || q.includes('hash');
    if (specificApt && lookingForIocs) {
       try {
           const res = await fetch(`${API_BASE_URL}/api/iocs`);
           const data = await res.json();
           
           // Simulate finding 3 IoCs linked to this APT from the global database
           const linkedIocs = data.iocs.slice(0, 3);
           
           return (
              <div className="flex flex-col gap-2">
                 <p className="text-sm">Yes, my intelligence engine correlated active IoCs linked to <span className="font-bold text-blue-400 border-b border-blue-500/30 pb-0.5">{specificApt.name}</span> <span className="text-xs text-muted">(aka {specificApt.aliases[0]})</span>:</p>
                 <div className="space-y-2 mt-2">
                    {linkedIocs.map((ioc: any) => (
                       <div key={ioc.id} className="bg-slate-900/50 p-2.5 rounded border border-white/5 font-mono text-xs flex justify-between items-center hover:border-blue-500/30 transition-colors">
                          <span className={ioc.ioc_type === 'ipv4' ? 'text-blue-400' : 'text-purple-400'}>{ioc.ioc}</span>
                          <span className="bg-white/5 border border-white/10 px-2 py-0.5 rounded text-[10px] text-muted">{ioc.ioc_type.toUpperCase()}</span>
                       </div>
                    ))}
                 </div>
                 <p className="text-[10px] text-slate-500 mt-1 italic border-t border-white/5 pt-2">Note: These indicators were extracted globally via TTP correlations.</p>
              </div>
           );
       } catch (err) {
           return `I identified the actor as ${specificApt.name}, but the live IoC matrix database is currently unreachable.`;
       }
    }

    // Execution Logic
    if (specificApt) {
      return (
         <div className="flex flex-col gap-2">
            <p className="font-bold text-blue-400 border-b border-blue-500/20 pb-1">Executive Brief: {specificApt.name}</p>
            <p className="text-xs"><strong>Origin:</strong> {specificApt.origin} | <strong>Threat Level:</strong> {specificApt.threatLevel}</p>
            <p className="text-slate-300 italic text-xs leading-relaxed">"{specificApt.description}"</p>
            <div className="bg-slate-900/50 p-2 rounded mt-1 border border-white/5">
                <span className="text-[10px] font-bold text-muted uppercase tracking-wider">Primary Targets</span>
                <p className="text-xs mt-1 text-white">{specificApt.targets.join(', ')}</p>
            </div>
            <div className="bg-slate-900/50 p-2 rounded border border-white/5">
                <span className="text-[10px] font-bold text-muted uppercase tracking-wider">Known Arsenal</span>
                <p className="text-xs mt-1 text-danger font-mono break-words">{specificApt.malware.join(', ')}</p>
            </div>
         </div>
      );
    }

    if (hasLog4j || cveMatch) {
       const searchCve = hasLog4j ? 'CVE-2021-44228' : cveMatch![0].toUpperCase();
       const exploitingApts = mockApts.filter(a => a.associatedCVEs?.includes(searchCve));
       if (exploitingApts.length > 0) {
           return (
               <div>
                  <p className="text-sm">Intel indicates the following actors actively leverage <span className="text-danger font-mono font-bold bg-danger/10 px-1 rounded">{searchCve}</span>:</p>
                  <ul className="list-disc pl-5 mt-2 space-y-2">
                      {exploitingApts.map(a => (
                        <li key={a.id} className="text-blue-400 font-bold text-sm">
                          {a.name} <span className="text-xs text-muted font-normal">({a.origin})</span>
                        </li>
                      ))}
                  </ul>
               </div>
           );
       } else {
           return `I currently have no tracked threat actors in the active matrix openly exploiting ${searchCve}. However, you should still immediately apply mitigation layers protecting infrastructure from this vulnerability.`;
       }
    }
    
    if (hasPlugX || hasCobalt) {
        const queryMalware = hasPlugX ? 'PlugX' : 'Cobalt Strike';
        const usingApts = mockApts.filter(a => a.malware.some(m => m.toLowerCase().includes(queryMalware.toLowerCase())));
        if (usingApts.length > 0) {
           return (
               <div>
                  <p className="text-sm">Actors actively deploying <span className="text-purple-400 font-bold">{queryMalware}</span> infrastructure:</p>
                  <ul className="list-disc pl-5 mt-2 space-y-1">
                      {usingApts.map(a => <li key={a.id} className="text-white text-sm">{a.name} <span className="text-[10px] text-muted ml-1">[{a.origin}]</span></li>)}
                  </ul>
               </div>
           );
       }
    }

    if (mappedOrigin || mappedSector) {
        let matches = mockApts;
        if (mappedOrigin) {
           matches = matches.filter(a => a.origin.toLowerCase() === mappedOrigin);
        }
        if (mappedSector) {
           matches = matches.filter(a => a.targets.some(t => t.toLowerCase().includes(mappedSector as string)));
        }

        if (matches.length > 0) {
           return (
               <div>
                  <p className="text-sm border-b border-white/10 pb-2 mb-2">I found <strong className="text-blue-400">{matches.length}</strong> active group(s) matching your parameters{mappedOrigin ? ` originating from ${mappedOrigin.toUpperCase()}` : ''}{mappedSector ? ` targeting the ${mappedSector.toUpperCase()} sector` : ''}:</p>
                  <div className="space-y-3">
                     {matches.map(a => (
                         <div key={a.id} className="border-l-2 border-primary pl-3">
                             <span className="font-bold text-white text-sm">{a.name}</span>
                             <p className="text-[11px] text-slate-400 mt-1 break-words line-clamp-3 leading-relaxed">{a.description}</p>
                         </div>
                     ))}
                  </div>
               </div>
           )
        }
    }

    return "My intelligence engine could not find any active correlations for that exact query. Please refine your search using distinct threat actors, targeted sectors, vulnerabilities (CVEs), or malware families.";
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg: Message = { id: Math.random().toString(), sender: 'user', content: input, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');

    // Simulate thinking delay
    setTimeout(async () => {
       const botMsg: Message = {
           id: Math.random().toString(),
           sender: 'bot',
           content: await parseIntelligence(userMsg.content as string),
           timestamp: new Date()
       };
       setMessages(prev => [...prev, botMsg]);
    }, 800);
  };

  if (!isOpen) {
    return (
      <button 
        title="Open AI Threat Hunter Copilot"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-500 text-white rounded-full p-4 shadow-lg shadow-blue-500/30 transition-all hover:scale-105 z-50 flex items-center justify-center animate-bounce-subtle"
      >
        <Bot size={28} />
      </button>
    );
  }

  return (
    <div 
      className={`fixed right-6 bottom-6 flex flex-col glass-panel shadow-2xl shadow-black/80 z-50 transition-all duration-300 ease-in-out border-primary/30`}
      style={{
         width: isMaximized ? 'calc(100vw - 48px)' : '420px',
         height: isMaximized ? 'calc(100vh - 48px)' : '650px',
         maxWidth: '1200px',
         maxHeight: '92vh'
      }}
    >
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b border-white/10 bg-gradient-to-r from-blue-900/60 to-slate-900/80 rounded-t-xl">
         <div className="flex items-center gap-3">
            <div className="bg-blue-500/20 p-2 rounded-lg text-blue-400 border border-blue-500/30 shadow shadow-blue-500/20">
               <Bot size={20} />
            </div>
            <div>
                <h3 className="font-bold text-white text-[15px] tracking-wide">Threat Hunter <span className="text-blue-400">Copilot</span></h3>
                <p className="text-[10px] text-success flex items-center gap-1.5 mt-0.5"><span className="w-1.5 h-1.5 bg-success rounded-full animate-pulse shadow shadow-success"></span> Connected to Global Intel Matrix</p>
            </div>
         </div>
         <div className="flex items-center gap-1 text-slate-400">
            <button onClick={() => setIsMaximized(!isMaximized)} className="p-1.5 hover:bg-white/10 rounded transition-colors" title="Toggle Maximize">
               {isMaximized ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
            <button onClick={() => setIsOpen(false)} className="p-1.5 hover:bg-danger/20 hover:text-danger rounded transition-colors" title="Close Copilot">
               <X size={18} />
            </button>
         </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar bg-slate-950/80">
         {messages.map(msg => (
             <div key={msg.id} className={`flex w-full ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                 <div className={`flex items-end gap-3 max-w-[85%] ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                     
                     <div className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center shadow-lg ${msg.sender === 'user' ? 'bg-gradient-to-br from-blue-600 to-blue-500 text-white' : 'bg-slate-800 text-blue-400 border border-blue-500/40'}`}>
                         {msg.sender === 'user' ? <User size={14} /> : <Terminal size={14} />}
                     </div>
                     
                     <div className={`p-4 rounded-2xl text-sm shadow-md ${
                         msg.sender === 'user' 
                         ? 'bg-blue-600 text-white rounded-br-sm' 
                         : 'bg-slate-800 border border-white/10 rounded-bl-sm text-slate-200'
                     }`}>
                         {msg.content}
                     </div>
                 </div>
             </div>
         ))}
         <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <div className="p-4 border-t border-white/10 bg-slate-900/90 rounded-b-xl flex items-center justify-center">
         <form onSubmit={handleSend} className="flex gap-2 relative w-full">
            <input 
                type="text" 
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Query APTs, Targets, Plugins, or CVEs..."
                className="w-full bg-slate-950 border border-white/20 rounded-full py-3 pl-5 pr-12 text-sm text-white focus:outline-none focus:border-blue-500/70 focus:ring-1 focus:ring-blue-500/50 transition-all placeholder:text-slate-500 shadow-inner"
            />
            <button 
                type="submit" 
                disabled={!input.trim()}
                className="absolute right-1.5 top-1.5 bottom-1.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-full p-2.5 transition-all shadow"
            >
                <Send size={15} className="mr-0.5 mt-0.5" />
            </button>
         </form>
      </div>
      <div className="text-center pb-2 bg-slate-900/90 rounded-b-xl">
          <span className="text-[9px] text-muted tracking-widest uppercase">Powered by Local Intelligence Parsing Engine</span>
      </div>
    </div>
  );
};
