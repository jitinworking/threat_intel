import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { 
  Maximize2, ZoomIn, ZoomOut, Filter, Shield, Box, Globe, 
  GitBranch, X, Terminal, Sparkles, ExternalLink, RefreshCw
} from 'lucide-react';
import ForceGraph2D from 'react-force-graph-2d';
import { useInvestigation } from '../context/InvestigationContext';
import { useTheme } from '../context/ThemeContext';
import { 
  PageHeader, Button, Badge, SeverityBadge, ConfidenceScore 
} from '../components/ui/design-system';

interface GraphNode {
  id: string;
  group: number;
  name: string;
  type: string;
  confidence?: number;
  description?: string;
  neighbors: string[];
  links: any[];
  val?: number;
  x?: number;
  y?: number;
}

interface GraphLink {
  source: string | GraphNode;
  target: string | GraphNode;
}

const generateGraphData = () => {
  const apts = [
    { id: 'apt-laz', group: 1, name: 'Lazarus Group', type: 'Threat Actor', confidence: 95, description: 'DPRK state-sponsored cyber espionage and financial operations unit.' },
    { id: 'apt-cozy', group: 1, name: 'Cozy Bear (APT29)', type: 'Threat Actor', confidence: 92, description: 'Russian foreign intelligence service (SVR) linked threat actor.' },
    { id: 'apt-41', group: 1, name: 'APT 41 (Double Dragon)', type: 'Threat Actor', confidence: 90, description: 'Chinese state-sponsored espionage and financially motivated actor.' },
    { id: 'apt-fin7', group: 1, name: 'FIN7 / Carbanak', type: 'Threat Actor', confidence: 88, description: 'Prolific Eastern European cybercrime syndicate targeting hospitality & retail.' }
  ];

  const malware = [
    { id: 'mw-trickbot', group: 2, name: 'Trickbot Trojan', type: 'Malware', confidence: 85, description: 'Modular banking trojan used for initial network access and ransomware delivery.' },
    { id: 'mw-wannacry', group: 2, name: 'WannaCry Ransomware', type: 'Malware', confidence: 98, description: 'Worm-propagating cryptoviral extortion tool utilizing EternalBlue.' },
    { id: 'mw-sunburst', group: 2, name: 'Sunburst Backdoor', type: 'Malware', confidence: 94, description: 'Supply-chain backdoor injected into SolarWinds Orion software builds.' },
    { id: 'mw-cobalt', group: 2, name: 'Cobalt Strike Beacon', type: 'Malware', confidence: 89, description: 'Post-exploitation adversary emulation tool repurposed for persistent C2.' },
    { id: 'mw-carbanak', group: 2, name: 'Carbanak Backdoor', type: 'Malware', confidence: 86, description: 'Custom malware designed for exfiltrating automated teller funds.' }
  ];

  const iocs = Array.from({ length: 28 }).map((_, i) => ({
    id: `ioc-${i}`,
    group: 3,
    name: i % 2 === 0 ? `c2-relay-${i}.darknet.is` : `194.26.${Math.floor(i * 3 + 10)}.112`,
    type: i % 2 === 0 ? 'Domain' : 'IP Address',
    confidence: 80 + (i % 18),
    description: 'Active command and control infrastructure observed in network beacons.'
  }));

  const nodes: GraphNode[] = [...apts, ...malware, ...iocs].map(n => ({
    ...n,
    neighbors: [],
    links: [],
    val: n.group === 1 ? 9 : n.group === 2 ? 6 : 4
  }));

  const links: GraphLink[] = [];

  links.push({ source: 'apt-laz', target: 'mw-trickbot' });
  links.push({ source: 'apt-laz', target: 'mw-wannacry' });
  links.push({ source: 'apt-cozy', target: 'mw-sunburst' });
  links.push({ source: 'apt-41', target: 'mw-cobalt' });
  links.push({ source: 'apt-fin7', target: 'mw-carbanak' });
  links.push({ source: 'apt-fin7', target: 'mw-cobalt' });

  iocs.forEach((ioc, i) => {
    const mwNode = malware[i % malware.length].id;
    links.push({ source: mwNode, target: ioc.id });
    if (i % 4 === 0) {
      const aptNode = apts[i % apts.length].id;
      links.push({ source: aptNode, target: ioc.id });
    }
  });

  // Cross-link neighbors
  links.forEach(link => {
    const a = nodes.find(n => n.id === (typeof link.source === 'object' ? (link.source as any).id : link.source));
    const b = nodes.find(n => n.id === (typeof link.target === 'object' ? (link.target as any).id : link.target));
    if (a && b) {
      a.neighbors.push(b.id);
      b.neighbors.push(a.id);
      a.links.push(link);
      b.links.push(link);
    }
  });

  return { nodes, links };
};

export const ThreatGraph: React.FC = () => {
  const { openInvestigation, openCopilot } = useInvestigation();
  const { theme } = useTheme();

  const [data, setData] = useState(() => generateGraphData());
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [filterGroup, setFilterGroup] = useState<number | null>(null);

  const graphRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight
        });
      }
    };
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  const filteredData = useMemo(() => {
    if (filterGroup === null) return data;
    const filteredNodes = data.nodes.filter(n => n.group === filterGroup);
    const nodeIds = new Set(filteredNodes.map(n => n.id));
    const filteredLinks = data.links.filter(l => {
      const s = typeof l.source === 'object' ? (l.source as any).id : l.source;
      const t = typeof l.target === 'object' ? (l.target as any).id : l.target;
      return nodeIds.has(s) && nodeIds.has(t);
    });
    return { nodes: filteredNodes, links: filteredLinks };
  }, [data, filterGroup]);

  const getNodeColor = useCallback((node: GraphNode) => {
    if (selectedNode && selectedNode.id === node.id) return '#FFFFFF';
    if (node.group === 1) return '#FF4D5E'; // Actor: Red
    if (node.group === 2) return '#FF9F43'; // Malware: Orange
    return '#4F8CFF'; // Infrastructure / IoC: Blue
  }, [selectedNode]);

  const handleInspectEntity = () => {
    if (!selectedNode) return;
    openInvestigation({
      id: selectedNode.id,
      type: selectedNode.type.toLowerCase().includes('actor') ? 'actor' : selectedNode.type.toLowerCase().includes('malware') ? 'malware' : 'domain',
      value: selectedNode.name,
      severity: selectedNode.group === 1 ? 'critical' : selectedNode.group === 2 ? 'high' : 'medium',
      confidence: selectedNode.confidence || 85,
      threatType: selectedNode.description,
    });
  };

  const handleCopilotEntity = () => {
    if (!selectedNode) return;
    openCopilot(`Analyze threat node ${selectedNode.name} (${selectedNode.type}) and summarize campaign connections`, {
      type: selectedNode.type,
      value: selectedNode.name,
      confidence: selectedNode.confidence,
    });
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      
      {/* ── Subheader ── */}
      <div className="px-4 py-2.5 border-b border-border bg-surface flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <GitBranch size={15} className="text-primary" />
          <span className="font-semibold text-xs text-text">Threat Relationships Link Analysis</span>
          <span className="text-text-muted text-xs hidden sm:inline">— Interactive node topology</span>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 text-xs">
          <button
            onClick={() => setFilterGroup(null)}
            className={`px-2 py-1 rounded transition-colors cursor-pointer ${
              filterGroup === null ? 'bg-surface-elevated font-semibold text-primary' : 'text-text-muted hover:text-text'
            }`}
          >
            All Nodes
          </button>
          <button
            onClick={() => setFilterGroup(1)}
            className={`px-2 py-1 rounded transition-colors cursor-pointer ${
              filterGroup === 1 ? 'bg-surface-elevated font-semibold text-critical' : 'text-text-muted hover:text-text'
            }`}
          >
            Adversaries
          </button>
          <button
            onClick={() => setFilterGroup(2)}
            className={`px-2 py-1 rounded transition-colors cursor-pointer ${
              filterGroup === 2 ? 'bg-surface-elevated font-semibold text-high' : 'text-text-muted hover:text-text'
            }`}
          >
            Malware
          </button>
          <button
            onClick={() => setFilterGroup(3)}
            className={`px-2 py-1 rounded transition-colors cursor-pointer ${
              filterGroup === 3 ? 'bg-surface-elevated font-semibold text-primary' : 'text-text-muted hover:text-text'
            }`}
          >
            Infrastructure
          </button>
        </div>
      </div>

      {/* ── Graph Canvas Stage ── */}
      <div ref={containerRef} className="flex-1 relative bg-background overflow-hidden min-h-0">
        
        <ForceGraph2D
          ref={graphRef}
          width={dimensions.width}
          height={dimensions.height}
          graphData={filteredData}
          backgroundColor={theme === 'dark' ? '#0B0F14' : '#F6F8FA'}
          nodeRelSize={5}
          nodeColor={getNodeColor}
          linkColor={() => theme === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)'}
          linkWidth={1.2}
          onNodeClick={(node: any) => setSelectedNode(node)}
          nodeCanvasObjectMode={() => 'after'}
          nodeCanvasObject={(node: any, ctx, globalScale) => {
            const label = node.name;
            const fontSize = 11 / globalScale;
            ctx.font = `${fontSize}px Inter, sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = theme === 'dark' ? '#A3ADBA' : '#475467';
            ctx.fillText(label, node.x, node.y + 10);
          }}
        />

        {/* Floating Controls Toolbar */}
        <div className="absolute bottom-4 left-4 flex items-center gap-1 bg-surface border border-border rounded p-1 shadow-md z-10">
          <button
            onClick={() => graphRef.current?.zoom(graphRef.current.zoom() * 1.25, 300)}
            className="p-1.5 hover:bg-surface-hover rounded text-text-muted hover:text-text cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn size={14} />
          </button>
          <button
            onClick={() => graphRef.current?.zoom(graphRef.current.zoom() * 0.8, 300)}
            className="p-1.5 hover:bg-surface-hover rounded text-text-muted hover:text-text cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut size={14} />
          </button>
          <button
            onClick={() => graphRef.current?.zoomToFit(400, 30)}
            className="p-1.5 hover:bg-surface-hover rounded text-text-muted hover:text-text cursor-pointer"
            title="Center Graph"
          >
            <Maximize2 size={14} />
          </button>
          <div className="h-4 w-px bg-border mx-1" />
          <button
            onClick={() => setData(generateGraphData())}
            className="p-1.5 hover:bg-surface-hover rounded text-text-muted hover:text-text cursor-pointer"
            title="Reset Graph Layout"
          >
            <RefreshCw size={14} />
          </button>
        </div>

        {/* ── Contextual Selected Entity Inspector Dock ── */}
        {selectedNode && (
          <div className="absolute top-4 right-4 w-80 bg-surface border border-border rounded shadow-xl flex flex-col z-20 animate-fade-in text-xs">
            <div className="p-3 border-b border-border bg-surface-elevated flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted bg-surface px-1.5 py-0.5 rounded border border-border">
                  {selectedNode.type}
                </span>
                <span className="font-semibold text-text truncate max-w-[140px]">
                  {selectedNode.name}
                </span>
              </div>
              <button
                onClick={() => setSelectedNode(null)}
                className="p-1 rounded hover:bg-surface-hover text-text-muted hover:text-text cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>

            <div className="p-3.5 space-y-3">
              <div>
                <span className="text-[10px] font-bold uppercase text-text-muted block mb-1">Assessment</span>
                <p className="text-text-secondary leading-relaxed">
                  {selectedNode.description || 'Observed active entity in correlation topology.'}
                </p>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-border">
                <span className="text-text-muted text-[11px]">Confidence Score:</span>
                <ConfidenceScore score={selectedNode.confidence || 85} />
              </div>

              <div className="flex items-center justify-between border-t border-border pt-1">
                <span className="text-text-muted text-[11px]">Adjacent Links:</span>
                <span className="font-mono text-text font-medium">{selectedNode.neighbors.length} connections</span>
              </div>

              <div className="flex flex-col gap-1.5 pt-2 border-t border-border">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleInspectEntity}
                  className="w-full gap-1.5"
                >
                  <ExternalLink size={12} /> Open in Investigation Drawer
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleCopilotEntity}
                  className="w-full gap-1.5"
                >
                  <Sparkles size={12} /> Analyze with Copilot
                </Button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
