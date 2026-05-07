import { API_BASE_URL } from '../config';
import React, { useState, useRef, useEffect } from 'react';
import { Bot, User, Send, X, Terminal, Maximize2, Minimize2, FileText, Download } from 'lucide-react';

interface Message {
  id: string;
  sender: 'user' | 'bot';
  type?: 'text' | 'report';
  content: string | any;
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
      type: 'text',
      content: 'System initialized. I am your Natural Language Threat Hunter Engine connected to the live intelligence database. Ask me to correlate actors (e.g., "Summarize Lazarus"), or generate triage reports (e.g., "Generate a triage report for 185.12.x.x").',
      timestamp: new Date()
    }
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const renderText = (text: string) => {
    const formatted = text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/`(.*?)`/g, '<code class="bg-slate-900 px-1 rounded text-blue-400 border border-blue-500/30">$1</code>')
      .replace(/\n/g, '<br />');
    return <div dangerouslySetInnerHTML={{ __html: formatted }} />;
  };

  const renderReport = (report: any) => (
    <div className="bg-slate-900/80 border border-slate-700 rounded-lg overflow-hidden mt-1 shadow-lg w-full max-w-full text-left">
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-4 py-3 border-b border-slate-700 flex justify-between items-center">
        <h4 className="font-bold text-white text-sm flex items-center gap-2">
          <FileText size={16} className="text-blue-400"/> {report.title}
        </h4>
        <button className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-2 py-1 rounded flex items-center gap-1 transition-colors">
          <Download size={12}/> PDF
        </button>
      </div>
      <div className="p-4 space-y-4">
         <div className="flex justify-between items-start border-b border-white/5 pb-3">
            <div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider">Target Indicator</div>
              <div className="font-mono text-sm text-red-400">{report.target}</div>
            </div>
            <div className="text-right">
              <div className="text-[10px] text-slate-400 uppercase tracking-wider">Confidence</div>
              <div className="font-bold text-yellow-400">{report.confidence}%</div>
            </div>
         </div>
         
         <div>
            <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Executive Summary</div>
            <p className="text-sm text-slate-300 leading-relaxed">{report.summary}</p>
         </div>

         <div className="grid grid-cols-2 gap-3">
            <div className="bg-black/20 p-2.5 rounded border border-white/5">
               <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Attribution</div>
               <div className="text-sm font-bold text-white">{report.malwareFamily}</div>
            </div>
            <div className="bg-black/20 p-2.5 rounded border border-white/5">
               <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">MITRE Tactics</div>
               <div className="flex gap-1 flex-wrap mt-1">
                 {report.mitre.map((m: string) => (
                   <span key={m} className="text-[10px] bg-slate-800 border border-slate-600 px-1.5 py-0.5 rounded text-slate-300 font-mono">
                     {m}
                   </span>
                 ))}
               </div>
            </div>
         </div>

         <div className="pt-2 border-t border-white/5">
            <div className="text-[10px] text-green-400 uppercase tracking-wider mb-2 font-bold">Recommended Mitigations</div>
            <ul className="list-disc pl-4 space-y-1.5">
              {report.recommendations.map((r: string, i: number) => (
                <li key={i} className="text-xs text-slate-300">{r}</li>
              ))}
            </ul>
         </div>
      </div>
    </div>
  );

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg: Message = { id: Math.random().toString(), sender: 'user', type: 'text', content: input, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    const currentInput = input;
    setInput('');

    try {
      const res = await fetch(`${API_BASE_URL}/api/copilot/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: currentInput })
      });
      const data = await res.json();
      
      const botMsg: Message = {
        id: Math.random().toString(),
        sender: 'bot',
        type: data.type || 'text',
        content: data.content,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      setMessages(prev => [...prev, {
        id: Math.random().toString(),
        sender: 'bot',
        type: 'text',
        content: 'Error communicating with the Intelligence Parsing Engine.',
        timestamp: new Date()
      }]);
    }
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
                     
                     <div className={`p-4 rounded-2xl text-sm shadow-md flex flex-col max-w-full ${
                         msg.sender === 'user' 
                         ? 'bg-blue-600 text-white rounded-br-sm' 
                         : 'bg-slate-800 border border-white/10 rounded-bl-sm text-slate-200'
                     }`}>
                         {msg.type === 'report' ? renderReport(msg.content) : renderText(msg.content as string)}
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
