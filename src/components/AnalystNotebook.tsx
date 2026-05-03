import React from 'react';
import { useNotebook } from '../context/NotebookContext';
import { X, BookOpen, Trash2, Download, Link, Type } from 'lucide-react';

export const AnalystNotebook: React.FC = () => {
  const { isOpen, toggleNotebook, items, removeItem, clearNotebook, pinItem } = useNotebook();

  if (!isOpen) return null;

  const exportReport = () => {
    let report = '# Incident Investigation Report\n\n';
    report += `Generated: ${new Date().toISOString()}\n\n`;
    report += '## Key Findings (Pinned Artifacts)\n\n';
    
    items.forEach((item, index) => {
      report += `### Artifact ${items.length - index}: ${item.type.toUpperCase()}\n`;
      report += `**Timestamp:** ${item.timestamp.toISOString()}\n`;
      if (item.context) report += `**Context:** ${item.context}\n`;
      report += `**Data:**\n\`\`\`\n${item.content}\n\`\`\`\n\n`;
    });

    const blob = new Blob([report], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `investigation-report-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-y-0 right-0 w-[400px] glass-panel z-50 flex flex-col shadow-2xl border-l border-white/10" style={{ background: 'var(--bg-card)' }}>
      <div className="p-4 border-b border-white/10 flex justify-between items-center bg-slate-900/50">
        <h2 className="text-lg font-bold flex items-center gap-2 text-white">
          <BookOpen className="text-primary" size={20} /> Active Investigation
        </h2>
        <div className="flex gap-2">
          {items.length > 0 && (
            <>
              <button onClick={exportReport} className="p-1.5 text-muted hover:text-white hover:bg-white/10 rounded transition-colors" title="Export to Markdown">
                <Download size={16} />
              </button>
              <button onClick={clearNotebook} className="p-1.5 text-danger hover:bg-danger/10 rounded transition-colors" title="Clear Notebook">
                <Trash2 size={16} />
              </button>
            </>
          )}
          <button onClick={toggleNotebook} className="p-1.5 text-muted hover:text-white rounded transition-colors">
            <X size={20} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar flex flex-col gap-4">
        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-muted opacity-50 text-center">
            <BookOpen size={48} className="mb-4" />
            <p className="text-sm">Your notebook is empty.</p>
            <p className="text-xs mt-2">Click the "Pin" icon on any IoC, graph node, or news article to add it to your investigation report.</p>
          </div>
        ) : (
          items.map((item) => (
            <div key={item.id} className="bg-slate-950/50 border border-white/10 rounded-lg overflow-hidden group">
              <div className="flex justify-between items-center p-2 bg-white/5 border-b border-white/5 text-xs">
                <div className="flex items-center gap-2">
                  <span className={`badge ${item.type === 'ioc' ? 'badge-danger' : item.type === 'note' ? 'badge-primary' : 'badge-warning'}`}>
                    {item.type.toUpperCase()}
                  </span>
                  <span className="text-muted">{item.timestamp.toLocaleTimeString()}</span>
                </div>
                <button onClick={() => removeItem(item.id)} className="text-muted hover:text-danger opacity-0 group-hover:opacity-100 transition-opacity">
                  <X size={14} />
                </button>
              </div>
              <div className="p-3 flex flex-col gap-2">
                {item.context && <div className="text-xs font-bold text-slate-300 flex items-center gap-1"><Link size={12}/> {item.context}</div>}
                <div className="text-sm font-mono text-white whitespace-pre-wrap break-all">
                  {item.content}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="p-4 border-t border-white/10 bg-slate-900/50">
        <form onSubmit={(e) => {
          e.preventDefault();
          const input = e.currentTarget.elements.namedItem('note') as HTMLInputElement;
          if (input.value.trim()) {
            pinItem('note', input.value.trim(), 'Manual Note');
            input.value = '';
          }
        }} className="flex gap-2">
          <input 
            name="note"
            type="text" 
            placeholder="Add a quick note..." 
            className="flex-1 bg-slate-950 border border-white/10 rounded p-2 text-sm text-white outline-none"
          />
          <button type="submit" className="px-3 py-2 bg-primary/20 hover:bg-primary/30 text-primary rounded border border-primary/30 transition-colors">
            <Type size={16} />
          </button>
        </form>
      </div>
    </div>
  );
};
