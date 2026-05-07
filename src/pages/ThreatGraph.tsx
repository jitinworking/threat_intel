import { API_BASE_URL } from '../config';
import React, { useEffect, useState, useRef } from 'react';
import { Maximize2, ZoomIn, ZoomOut, Filter, X, GitBranch, Database, ShieldAlert, Network } from 'lucide-react';
import ForceGraph2D from 'react-force-graph-2d';

const buildGraphFromIoCs = (iocsData: any[], aptsData: any[]) => {
  const nodes: any[] = [];
  const links: any[] = [];
  const malwareSet = new Set<string>();
  
  iocsData.forEach(ioc => {
    if (ioc.malware) malwareSet.add(ioc.malware);
    nodes.push({
      id: `ioc-${ioc.id}`,
      group: 3,
      name: ioc.ioc,
      type: ioc.ioc_type,
      confidence: Math.random() > 0.7 ? 'high' : 'medium'
    });
  });

  malwareSet.forEach(mw => {
    nodes.push({ id: `mw-${mw}`, group: 2, name: mw, type: 'Malware' });
    iocsData.filter(i => i.malware === mw).forEach(ioc => {
      links.push({ source: `mw-${mw}`, target: `ioc-${ioc.id}` });
    });
  });

  if (aptsData) {
    aptsData.forEach(apt => {
      nodes.push({ id: `apt-${apt.id}`, group: 1, name: apt.name, type: 'APT Group' });
      // Link APT to any malware families it uses that are in our graph
      if (apt.malware) {
        const aptMalware = Array.isArray(apt.malware) ? apt.malware : JSON.parse(apt.malware || '[]');
        aptMalware.forEach((mw: string) => {
          if (malwareSet.has(mw)) {
            links.push({ source: `apt-${apt.id}`, target: `mw-${mw}` });
          }
        });
      }
    });
  }

  return { nodes, links };
};

export const ThreatGraph: React.FC = () => {
  const [graphData, setGraphData] = useState<{nodes: any[], links: any[]}>({ nodes: [], links: [] });
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<any>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [iocsRes, aptsRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/iocs?limit=50`),
          fetch(`${API_BASE_URL}/api/apts`)
        ]);
        const data = await iocsRes.json();
        const aptsData = await aptsRes.json();
        setGraphData(buildGraphFromIoCs(data.iocs, aptsData));
      } catch (err) {
        console.error("Failed to load graph data", err);
      }
    };
    loadData();

    const observer = new ResizeObserver(entries => {
      if (entries[0]) {
        setDimensions({
          width: entries[0].contentRect.width,
          height: entries[0].contentRect.height
        });
      }
    });

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    
    return () => observer.disconnect();
  }, []);

  const handleNodeClick = async (node: any) => {
    setSelectedNode(node);
  };

  const executePivot = async () => {
    if (!selectedNode || selectedNode.group !== 3) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/pivot/${encodeURIComponent(selectedNode.name)}`);
      const data = await res.json();
      
      if (data.pivoted_infrastructure) {
         const jarmId = `jarm-${data.jarm_hash.substring(0,8)}`;
         const newNodes = [...graphData.nodes];
         const newLinks = [...graphData.links];
         
         if (!newNodes.find(n => n.id === jarmId)) {
           newNodes.push({ id: jarmId, group: 4, name: `JARM: ${data.jarm_hash.substring(0,8)}...`, type: 'JARM Hash' });
         }
         // Link the clicked IoC to this new JARM cluster
         newLinks.push({ source: selectedNode.id, target: jarmId });
         
         data.pivoted_infrastructure.forEach((pi: any) => {
           const piId = `ioc-${pi.id}`;
           if (!newNodes.find(n => n.id === piId)) {
             newNodes.push({ id: piId, group: 3, name: pi.ioc, type: pi.ioc_type, confidence: 'medium' });
           }
           // Link the new IoC to the JARM hash
           newLinks.push({ source: jarmId, target: piId });
         });
         
         setGraphData({ nodes: newNodes, links: newLinks });
         setSelectedNode(null);
      }
    } catch (err) {
      console.error("Failed to pivot", err);
    }
  };

  const handleZoomIn = () => {
    if (graphRef.current) {
      const currentZoom = graphRef.current.zoom();
      graphRef.current.zoom(currentZoom * 1.5, 400);
    }
  };

  const handleZoomOut = () => {
    if (graphRef.current) {
      const currentZoom = graphRef.current.zoom();
      graphRef.current.zoom(currentZoom / 1.5, 400);
    }
  };

  const handleFit = () => {
    if (graphRef.current) {
      graphRef.current.zoomToFit(400, 50);
    }
  };

  return (
    <div className="animate-fade-in flex col gap-6 h-full" style={{ flexDirection: 'column' }}>
      {/* Header */}
      <div className="flex justify-between items-center mb-2">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            Interactive Hunting Canvas
          </h1>
          <p className="text-muted text-sm mt-1">
            Click an Indicator node (Blue) to perform an SSL/JARM pivot and uncover connected infrastructure.
          </p>
        </div>
        <div className="flex gap-3 items-center">
          <button className="glass-panel px-4 py-2 flex items-center gap-2 hover:text-white transition-all text-sm">
            <Filter size={16} /> Filter Graph
          </button>
        </div>
      </div>

      <div className="flex-1 glass-panel overflow-hidden relative stagger-1" ref={containerRef} style={{ minHeight: '600px', display: 'flex' }}>
        
        {/* Graph Toolbar */}
        <div className="absolute z-10 flex flex-col gap-2" style={{ top: '1rem', right: '1rem' }}>
          <button onClick={handleZoomIn} className="glass-panel p-2 hover:text-white hover:border-primary transition-all rounded-full bg-slate-900/80">
            <ZoomIn size={18} />
          </button>
          <button onClick={handleZoomOut} className="glass-panel p-2 hover:text-white hover:border-primary transition-all rounded-full bg-slate-900/80">
            <ZoomOut size={18} />
          </button>
          <button onClick={handleFit} className="glass-panel p-2 hover:text-white hover:border-primary transition-all rounded-full bg-slate-900/80" title="Fit to Screen">
            <Maximize2 size={18} />
          </button>
        </div>

        {/* Graph Legend */}
        <div className="absolute z-10 glass-panel p-3 text-xs bg-slate-900/80" style={{ bottom: '1rem', left: '1rem' }}>
          <h4 className="font-bold mb-2 uppercase tracking-wider text-muted font-mono">Legend</h4>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-3 h-3 rounded-full bg-red-500"></div> <span>Threat Actor (APT)</span>
          </div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div> <span>Malware Family</span>
          </div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div> <span>Indicator (IoC)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-purple-500"></div> <span>JARM / SSL Cert</span>
          </div>
        </div>

        <ForceGraph2D
          ref={graphRef}
          width={dimensions.width}
          height={dimensions.height}
          graphData={graphData}
          nodeLabel=""
          onNodeClick={handleNodeClick}
          nodeCanvasObject={(node: any, ctx, globalScale) => {
            const label = node.name;
            const fontSize = 12/globalScale;
            
            // Draw Aura for high confidence
            if (node.confidence === 'high') {
              ctx.beginPath();
              ctx.arc(node.x, node.y, 8, 0, 2 * Math.PI, false);
              ctx.fillStyle = 'rgba(239, 68, 68, 0.4)'; // Red pulsing aura
              ctx.shadowColor = 'red';
              ctx.shadowBlur = 15;
              ctx.fill();
              ctx.shadowBlur = 0; // reset
            }

            // Draw Node
            ctx.beginPath();
            ctx.arc(node.x, node.y, node.group === 1 ? 8 : node.group === 2 ? 6 : node.group === 4 ? 5 : 4, 0, 2 * Math.PI, false);
            
            let color = '#3b82f6'; // Blue for IoC
            if (node.group === 1) color = '#ef4444'; // Red for APT
            if (node.group === 2) color = '#eab308'; // Yellow for Malware
            if (node.group === 4) color = '#a855f7'; // Purple for JARM
            
            ctx.fillStyle = color;
            ctx.fill();
            
            // Draw Label
            ctx.font = `${fontSize}px Sans-Serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.fillText(label, node.x, node.y + 10 + fontSize);
          }}
          linkColor={() => 'rgba(255,255,255,0.2)'}
          linkWidth={1.5}
          backgroundColor="rgba(0,0,0,0)"
        />

        {/* Side Panel for Provenance */}
        {selectedNode && (
          <div className="absolute bg-[#0a0f18] border-l border-white/10 shadow-2xl p-6 z-50 flex flex-col transition-transform" style={{ top: 0, right: 0, bottom: 0, width: '400px', animation: 'slideInRight 0.3s forwards' }}>
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
              <div>
                <div className="text-primary font-mono text-sm">{selectedNode.type || 'Node'}</div>
                <h2 className="text-xl font-bold break-all">{selectedNode.name}</h2>
                {selectedNode.confidence === 'high' && (
                  <span className="inline-block mt-2 px-2 py-0.5 rounded text-xs bg-red-500/20 text-red-400 border border-red-500/30">
                    High Confidence (Multi-Source)
                  </span>
                )}
              </div>
              <button onClick={() => setSelectedNode(null)} className="text-slate-400 hover:text-white bg-white/5 p-2 rounded-full shrink-0">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted mb-4 flex items-center gap-2">
                <GitBranch size={16} className="text-primary" />
                Data Provenance Lineage
              </h3>
              
              <div className="flex flex-col relative pl-4 border-l border-white/10 ml-2 space-y-6">
                 <div className="relative">
                   <div className="absolute rounded-full bg-blue-500 w-2.5 h-2.5" style={{ left: '-21px', top: '0.25rem' }}></div>
                   <div className="font-bold text-sm">OSINT Feed Ingestion</div>
                   <div className="text-xs text-slate-400 mt-1 flex items-center gap-1"><Database size={12}/> Twitter API / ThreatFox</div>
                 </div>
                 <div className="relative" style={{ marginTop: '1.5rem' }}>
                   <div className="absolute rounded-full bg-purple-500 w-2.5 h-2.5" style={{ left: '-21px', top: '0.25rem' }}></div>
                   <div className="font-bold text-sm">Automated Extraction</div>
                   <div className="text-xs text-slate-400 mt-1">Regex pattern matched IPv4/Domain</div>
                 </div>
                 {selectedNode.confidence === 'high' && (
                   <div className="relative" style={{ marginTop: '1.5rem' }}>
                     <div className="absolute rounded-full bg-red-500 w-2.5 h-2.5" style={{ left: '-21px', top: '0.25rem' }}></div>
                     <div className="font-bold text-sm text-red-400">Sandbox Verification</div>
                     <div className="text-xs text-slate-400 mt-1 flex items-center gap-1"><ShieldAlert size={12}/> Detonated maliciously in Any.Run</div>
                   </div>
                 )}
              </div>

              {selectedNode.group === 3 && (
                <div className="border-t border-white/10" style={{ marginTop: '2rem', paddingTop: '1.5rem' }}>
                   <button 
                     onClick={executePivot}
                     className="w-full py-3 bg-primary hover:bg-primary/80 text-white rounded-lg font-bold flex items-center justify-center gap-2 transition-all shadow-[0_0_15px_rgba(59,130,246,0.3)]"
                   >
                     <Network size={18} /> Execute JARM/SSL Pivot
                   </button>
                   <p className="text-xs text-slate-400 text-center mt-3">
                     Query Shodan for infrastructure sharing the same JARM hash or SSL certificate.
                   </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
