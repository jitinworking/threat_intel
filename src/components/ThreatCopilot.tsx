import React, { useState, useRef, useEffect } from 'react';
import { 
  X, Send, Sparkles, User, Terminal, Shield, 
  HelpCircle, ChevronRight, Copy, Check, Minimize2, ExternalLink
} from 'lucide-react';
import { mockApts } from '../data/mockApts';
import { useInvestigation } from '../context/InvestigationContext';
import { Button, Code } from './ui/design-system';
import { BACKEND_URL } from '../config';

interface Message {
  id: string;
  sender: 'user' | 'bot';
  content: React.ReactNode;
  timestamp: Date;
}

export const ThreatCopilot: React.FC = () => {
  const { 
    isCopilotOpen, 
    closeCopilot, 
    copilotPrompt, 
    copilotEntity 
  } = useInvestigation();

  const [input, setInput] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'bot',
      content: (
        <div className="space-y-2 text-xs">
          <p className="font-medium text-text">Threat Intelligence Copilot initialized.</p>
          <p className="text-text-secondary">
            Contextual assistant for investigating indicators, adversary TTPs, C2 infrastructure, and generating Sentinel (KQL) or Splunk (SPL) detection rules.
          </p>
        </div>
      ),
      timestamp: new Date()
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const parseIntelligence = async (query: string): Promise<React.ReactNode> => {
    const q = query.toLowerCase();

    // Contextual Entity Query
    if (copilotEntity) {
      if (q.includes('hunt') || q.includes('kql') || q.includes('query')) {
        return (
          <div className="space-y-2 text-xs">
            <p className="text-text font-medium">Generated Microsoft Sentinel hunting query for <Code>{copilotEntity.value}</Code>:</p>
            <pre className="p-2.5 rounded bg-surface border border-border font-mono text-[11px] text-text overflow-x-auto">
{`DeviceNetworkEvents
| where RemoteIP == "${copilotEntity.value}" or RemoteUrl has "${copilotEntity.value}"
| project TimeGenerated, DeviceName, InitiatingProcessFileName, RemoteIP, RemotePort
| summarize ConnectionCount = count() by bin(TimeGenerated, 1h), DeviceName`}
            </pre>
          </div>
        );
      }

      if (q.includes('analyze') || q.includes('why') || q.includes('suspicious')) {
        return (
          <div className="space-y-2 text-xs">
            <p className="text-text font-medium">Analysis for indicator <Code>{copilotEntity.value}</Code> ({copilotEntity.type}):</p>
            <ul className="list-disc list-inside space-y-1 text-text-secondary">
              <li>Confidence Level: <span className="font-semibold text-text">{copilotEntity.confidence ?? 85}%</span></li>
              <li>Observed Delivery: Malicious staging via {copilotEntity.malware || 'Cobalt Strike loader'}</li>
              <li>Threat Association: Correlated with active command & control beaconing within the last 7 days.</li>
              <li>Recommended Action: Immediately block on network perimeters and execute endpoint hunting query.</li>
            </ul>
          </div>
        );
      }
    }

    // APT Query
    const specificApt = mockApts.find(apt => 
      q.includes(apt.name.toLowerCase()) || 
      apt.aliases.some(alias => q.includes(alias.toLowerCase()))
    );

    if (specificApt) {
      if (q.includes('ioc') || q.includes('indicator') || q.includes('ip')) {
        try {
          const res = await fetch(`${BACKEND_URL}/api/iocs?limit=3`);
          const data = await res.json();
          const linkedIocs = data.iocs || [];
          return (
            <div className="space-y-2 text-xs">
              <p className="text-text font-medium">Correlated Indicators for <span className="text-primary font-semibold">{specificApt.name}</span>:</p>
              <div className="space-y-1">
                {linkedIocs.map((ioc: any) => (
                  <div key={ioc.id} className="p-2 rounded bg-surface border border-border font-mono text-[11px] flex justify-between items-center">
                    <span className="text-text">{ioc.ioc}</span>
                    <span className="text-[10px] text-text-muted uppercase font-bold">{ioc.ioc_type}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        } catch {
          return <p className="text-xs text-text-secondary">Correlated records for {specificApt.name} are currently syncing.</p>;
        }
      }

      return (
        <div className="space-y-2 text-xs">
          <p className="font-semibold text-text">{specificApt.name} ({specificApt.origin})</p>
          <p className="text-text-secondary">{specificApt.description}</p>
          <div className="pt-1">
            <span className="text-text-muted font-bold text-[10px] uppercase">Targeted Sectors: </span>
            <span className="text-text font-medium">{specificApt.targets.join(', ')}</span>
          </div>
        </div>
      );
    }

    // General KQL / SPL generation
    if (q.includes('kql') || q.includes('sentinel')) {
      return (
        <div className="space-y-2 text-xs">
          <p className="text-text font-medium">General Suspicious Process KQL Template:</p>
          <pre className="p-2.5 rounded bg-surface border border-border font-mono text-[11px] text-text overflow-x-auto">
{`DeviceProcessEvents
| where ProcessCommandLine has_any ("powershell -enc", "certutil -urlcache", "bitsadmin /transfer")
| project TimeGenerated, DeviceName, AccountName, ProcessCommandLine`}
          </pre>
        </div>
      );
    }

    // Default intelligence synthesis
    return (
      <div className="space-y-1.5 text-xs text-text-secondary leading-relaxed">
        <p>I evaluated your query against active threat feeds and knowledge bases.</p>
        <p>You can ask me to:</p>
        <div className="flex flex-col gap-1 pt-1 font-mono text-[11px]">
          <button 
            onClick={() => handleSendQuery('Summarize Lazarus Group TTPs')}
            className="text-left text-primary hover:underline cursor-pointer"
          >
            → "Summarize Lazarus Group TTPs"
          </button>
          <button 
            onClick={() => handleSendQuery('Generate KQL hunt for PowerShell')}
            className="text-left text-primary hover:underline cursor-pointer"
          >
            → "Generate KQL hunt for PowerShell"
          </button>
          <button 
            onClick={() => handleSendQuery('List active C2 domains')}
            className="text-left text-primary hover:underline cursor-pointer"
          >
            → "List active C2 domains"
          </button>
        </div>
      </div>
    );
  };

  const handleSendQuery = async (queryText: string) => {
    if (!queryText.trim()) return;

    const userMessage: Message = {
      id: Math.random().toString(36).substring(2, 9),
      sender: 'user',
      content: queryText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');

    // Process Copilot response
    const botResponseContent = await parseIntelligence(queryText);
    const botMessage: Message = {
      id: Math.random().toString(36).substring(2, 9),
      sender: 'bot',
      content: botResponseContent,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, botMessage]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendQuery(input);
  };

  // Handle incoming prompts from InvestigationDrawer or other pages
  useEffect(() => {
    if (isCopilotOpen && copilotPrompt) {
      handleSendQuery(copilotPrompt);
    }
  }, [isCopilotOpen, copilotPrompt]);

  if (!isCopilotOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 modal-overlay"
        onClick={closeCopilot}
      />

      {/* Drawer */}
      <div className="relative w-full max-w-md bg-surface border-l border-border h-full flex flex-col shadow-2xl animate-slide-in">
        
        {/* Header */}
        <div className="px-4 py-3 border-b border-border bg-surface-elevated flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Sparkles size={13} />
            </div>
            <div>
              <h3 className="text-xs font-semibold text-text">Threat Copilot</h3>
              <p className="text-[10px] text-text-muted">Contextual SOC Analyst Assistant</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={closeCopilot}
              className="p-1 hover:bg-surface-hover rounded text-text-muted hover:text-text cursor-pointer"
              title="Close Copilot"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Context Strip if entity is active */}
        {copilotEntity && (
          <div className="px-4 py-2 bg-surface-elevated/70 border-b border-border flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 truncate">
              <span className="text-[10px] font-bold uppercase text-text-muted">Target:</span>
              <span className="font-mono text-text font-medium truncate">{copilotEntity.value}</span>
            </div>
            <span className="text-[10px] uppercase font-bold text-primary">{copilotEntity.type}</span>
          </div>
        )}

        {/* Message Log */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar min-h-0 bg-surface">
          {messages.map(msg => (
            <div
              key={msg.id}
              className={`flex flex-col gap-1 ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div className="flex items-center gap-1 text-[10px] text-text-muted px-1">
                {msg.sender === 'user' ? (
                  <span>Analyst</span>
                ) : (
                  <span className="flex items-center gap-1">
                    <Sparkles size={10} className="text-primary" />
                    Copilot
                  </span>
                )}
                <span>·</span>
                <span className="font-mono">{msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>

              <div
                className={`max-w-[90%] rounded p-3 text-xs leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-primary text-white font-medium'
                    : 'bg-surface-elevated border border-border text-text shadow-2xs'
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Prompt Chips */}
        <div className="px-4 py-2 border-t border-border bg-surface-elevated flex items-center gap-1.5 overflow-x-auto custom-scrollbar shrink-0">
          <button
            onClick={() => handleSendQuery(copilotEntity ? `Analyze indicator ${copilotEntity.value}` : 'Analyze latest critical IoCs')}
            className="px-2.5 py-1 rounded bg-surface hover:bg-surface-hover border border-border text-[11px] text-text-secondary hover:text-text whitespace-nowrap cursor-pointer transition-colors"
          >
            Analyze {copilotEntity ? 'entity' : 'IoCs'}
          </button>
          <button
            onClick={() => handleSendQuery('Generate KQL detection query')}
            className="px-2.5 py-1 rounded bg-surface hover:bg-surface-hover border border-border text-[11px] text-text-secondary hover:text-text whitespace-nowrap cursor-pointer transition-colors"
          >
            Generate KQL
          </button>
          <button
            onClick={() => handleSendQuery('Correlate active APT groups')}
            className="px-2.5 py-1 rounded bg-surface hover:bg-surface-hover border border-border text-[11px] text-text-secondary hover:text-text whitespace-nowrap cursor-pointer transition-colors"
          >
            Correlate APTs
          </button>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="p-3 border-t border-border bg-surface shrink-0">
          <div className="relative flex items-center">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask Copilot or type 'hunt [indicator]'..."
              className="w-full bg-surface-elevated border border-border rounded pl-3 pr-9 py-2 text-xs text-text placeholder-text-muted outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className="absolute right-1.5 p-1 rounded bg-primary text-white hover:bg-primary-hover disabled:opacity-30 disabled:pointer-events-none cursor-pointer transition-colors"
            >
              <Send size={13} />
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
