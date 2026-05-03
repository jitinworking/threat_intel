import React, { useEffect, useState, useRef } from 'react';
import { Maximize2, ZoomIn, ZoomOut, Filter } from 'lucide-react';
import ForceGraph2D from 'react-force-graph-2d';

const buildGraphFromIoCs = (iocsData: any[]) => {
  const nodes: any[] = [];
  const links: any[] = [];
  const malwareSet = new Set<string>();
  
  iocsData.forEach(ioc => {
    if (ioc.malware) malwareSet.add(ioc.malware);
    nodes.push({
      id: `ioc-${ioc.id}`,
      group: 3,
      name: ioc.ioc,
      type: ioc.ioc_type
    });
  });

  malwareSet.forEach(mw => {
    nodes.push({ id: `mw-${mw}`, group: 2, name: mw, type: 'Malware' });
    iocsData.filter(i => i.malware === mw).forEach(ioc => {
      links.push({ source: `mw-${mw}`, target: `ioc-${ioc.id}` });
    });
  });

  return { nodes, links };
};

export const ThreatGraph: React.FC = () => {
  const [graphData, setGraphData] = useState<{nodes: any[], links: any[]}>({ nodes: [], links: [] });
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<any>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await fetch('http://localhost:3001/api/iocs?limit=50');
        const data = await res.json();
        setGraphData(buildGraphFromIoCs(data.iocs));
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
    // Pivot on IoCs
    if (node.group === 3) {
      try {
        const res = await fetch(`http://localhost:3001/api/pivot/${encodeURIComponent(node.name)}`);
        const data = await res.json();
        
        if (data.pivoted_infrastructure) {
           const jarmId = `jarm-${data.jarm_hash.substring(0,8)}`;
           const newNodes = [...graphData.nodes];
           const newLinks = [...graphData.links];
           
           if (!newNodes.find(n => n.id === jarmId)) {
             newNodes.push({ id: jarmId, group: 4, name: `JARM: ${data.jarm_hash.substring(0,8)}...`, type: 'JARM Hash' });
           }
           // Link the clicked IoC to this new JARM cluster
           newLinks.push({ source: node.id, target: jarmId });
           
           data.pivoted_infrastructure.forEach((pi: any) => {
             const piId = `ioc-${pi.id}`;
             if (!newNodes.find(n => n.id === piId)) {
               newNodes.push({ id: piId, group: 3, name: pi.ioc, type: pi.ioc_type });
             }
             // Link the new IoC to the JARM hash
             newLinks.push({ source: jarmId, target: piId });
           });
           
           setGraphData({ nodes: newNodes, links: newLinks });
        }
      } catch (err) {
        console.error("Failed to pivot", err);
      }
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
        <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
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
        <div className="absolute bottom-4 left-4 z-10 glass-panel p-3 text-xs bg-slate-900/80">
          <h4 className="font-bold mb-2 uppercase tracking-wider text-muted font-mono">Legend</h4>
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
          nodeLabel="name"
          onNodeClick={handleNodeClick}
          nodeColor={node => {
            if (node.group === 1) return '#ef4444'; // Red for APT
            if (node.group === 2) return '#eab308'; // Yellow for Malware
            if (node.group === 4) return '#a855f7'; // Purple for JARM
            return '#3b82f6'; // Blue for IoC
          }}
          nodeRelSize={6}
          nodeVal={node => node.group === 1 ? 15 : node.group === 2 ? 10 : node.group === 4 ? 8 : 4}
          linkColor={() => 'rgba(255,255,255,0.2)'}
          linkWidth={1.5}
          backgroundColor="rgba(0,0,0,0)"
        />
      </div>
    </div>
  );
};
