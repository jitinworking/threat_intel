import React, { useState, useEffect, useMemo } from 'react';
import Map, { Source, Layer, Marker } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { 
  Play, Pause, FastForward, Shield, Activity, 
  MapPin, Globe, Database, Network, Eye, Layers
} from 'lucide-react';
import { 
  PageHeader, Card, Button, SeverityBadge, StatusIndicator, EmptyState
} from '../components/ui/design-system';
import { useInvestigation } from '../context/InvestigationContext';

// Carto Dark Matter basemap for clean enterprise cartography
const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';

interface AttackEvent {
  id: string;
  timestamp: number;
  origin: [number, number]; // [lon, lat]
  originName: string;
  originIp: string;
  target: [number, number]; // [lon, lat]
  targetName: string;
  targetIp: string;
  type: string;
  severity: 'Critical' | 'High' | 'Medium';
  actor?: string;
}

const MOCK_ATTACKS: AttackEvent[] = [
  { id: 'ev1', timestamp: 1698760000, origin: [116.4074, 39.9042], originName: 'Beijing, CN', originIp: '218.92.0.144', target: [-77.0369, 38.9072], targetName: 'Washington D.C., US', targetIp: '198.51.100.24', type: 'DDoS Amplification', severity: 'Critical', actor: 'Volt Typhoon' },
  { id: 'ev2', timestamp: 1698760050, origin: [37.6173, 55.7558], originName: 'Moscow, RU', originIp: '185.220.101.5', target: [13.4050, 52.5200], targetName: 'Berlin, DE', targetIp: '194.109.6.98', type: 'Data Exfiltration', severity: 'High', actor: 'APT29 / Cozy Bear' },
  { id: 'ev3', timestamp: 1698760100, origin: [103.8198, 1.3521], originName: 'Singapore, SG', originIp: '103.253.42.11', target: [151.2093, -33.8688], targetName: 'Sydney, AU', targetIp: '139.130.4.5', type: 'Initial Access Broker', severity: 'Medium', actor: 'Unknown Cluster' },
  { id: 'ev4', timestamp: 1698760150, origin: [-43.1729, -22.9068], originName: 'Rio, BR', originIp: '177.136.252.1', target: [-0.1276, 51.5072], targetName: 'London, UK', targetIp: '185.86.151.11', type: 'Banking Trojan C2', severity: 'Critical', actor: 'Grandoreiro Ops' },
  { id: 'ev5', timestamp: 1698760200, origin: [139.6917, 35.6895], originName: 'Tokyo, JP', originIp: '133.242.18.2', target: [-122.4194, 37.7749], targetName: 'San Francisco, US', targetIp: '104.244.42.1', type: 'Lateral Movement', severity: 'High', actor: 'Lazarus Group' },
  { id: 'ev6', timestamp: 1698760250, origin: [51.3890, 35.6892], originName: 'Tehran, IR', originIp: '91.240.118.1', target: [34.7818, 32.0853], targetName: 'Tel Aviv, IL', targetIp: '212.179.1.5', type: 'Wiper Delivery', severity: 'Critical', actor: 'MuddyWater' },
];

const generateArc = (start: [number, number], end: [number, number]) => {
  const numPoints = 50;
  const line = [];
  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints;
    const lon = start[0] + (end[0] - start[0]) * t;
    const lat = start[1] + (end[1] - start[1]) * t;
    line.push([lon, lat]);
  }
  return line;
};

export const GeoMap: React.FC = () => {
  const { openInvestigation } = useInvestigation();
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(MOCK_ATTACKS[0].timestamp);
  const [activeAttacks, setActiveAttacks] = useState<AttackEvent[]>([]);
  const [selectedAttack, setSelectedAttack] = useState<AttackEvent | null>(null);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [showVectors, setShowVectors] = useState(true);
  
  const minTime = MOCK_ATTACKS[0].timestamp;
  const maxTime = MOCK_ATTACKS[MOCK_ATTACKS.length - 1].timestamp + 100;

  // Animation Loop for timeline playback
  useEffect(() => {
    let animationFrameId: number;
    let lastTime = Date.now();

    const loop = () => {
      const now = Date.now();
      const dt = now - lastTime;
      lastTime = now;

      if (isPlaying) {
        setCurrentTime((prev) => {
          let next = prev + dt / 10;
          if (next > maxTime) next = minTime;
          return next;
        });
      }
      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isPlaying, maxTime, minTime]);

  // Derive Active Attacks based on current timeline position
  useEffect(() => {
    const active = MOCK_ATTACKS.filter(
      (a) => a.timestamp <= currentTime && a.timestamp > currentTime - 60
    );
    setActiveAttacks(active);
  }, [currentTime]);

  // Construct GeoJSON for Vector Paths
  const attackLinesGeoJSON = useMemo(() => {
    return {
      type: 'FeatureCollection',
      features: activeAttacks.map((attack) => ({
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: generateArc(attack.origin, attack.target)
        },
        properties: {
          severity: attack.severity
        }
      }))
    };
  }, [activeAttacks]);

  // Construct GeoJSON for Target Heatmap
  const heatmapGeoJSON = useMemo(() => {
    return {
      type: 'FeatureCollection',
      features: MOCK_ATTACKS.map((attack) => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: attack.target
        },
        properties: {
          weight: attack.severity === 'Critical' ? 1.0 : attack.severity === 'High' ? 0.6 : 0.3
        }
      }))
    };
  }, []);

  const formatTime = (ts: number) => {
    return new Date(ts * 1000).toISOString().split('T')[1].split('.')[0];
  };

  const handleInspectOrigin = (attack: AttackEvent) => {
    openInvestigation({
      value: attack.originIp,
      type: 'ip',
      severity: attack.severity.toLowerCase() as any,
      confidence: 90,
      source: 'Geo Ingestion / Sensor Grid',
      firstSeen: new Date(attack.timestamp * 1000).toISOString(),
      lastSeen: new Date().toISOString(),
      country: attack.originName,
      threatActor: attack.actor
    });
  };

  return (
    <div className="p-6 flex flex-col gap-5 min-h-full">
      {/* ── WORKSPACE PAGE HEADER ── */}
      <PageHeader
        title="Global Threat Map"
        subtitle="Geospatial telemetry and real-time inter-continental attack vector distribution"
        actions={
          <div className="flex items-center gap-3">
            <StatusIndicator 
              status="active" 
              label={`${activeAttacks.length} Active Attack Vectors`} 
            />
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                setCurrentTime(minTime);
                setIsPlaying(true);
              }}
              className="text-xs"
            >
              Reset Scrubber
            </Button>
          </div>
        }
      />

      {/* ── MAP CONTAINER ── */}
      <div className="flex-1 min-h-[580px] flex flex-col relative bg-surface border border-border rounded-lg overflow-hidden shadow-sm">
        
        <Map
          initialViewState={{
            longitude: 15,
            latitude: 35,
            zoom: 1.5,
            pitch: 15
          }}
          mapStyle={MAP_STYLE}
          interactive={true}
          dragPan={true}
          scrollZoom={true}
        >
          {/* Target Heatmap Layer */}
          {showHeatmap && (
            <Source id="heatmap-source" type="geojson" data={heatmapGeoJSON as any}>
              <Layer 
                id="heatmap-layer" 
                type="heatmap" 
                paint={{
                  'heatmap-weight': ['get', 'weight'],
                  'heatmap-intensity': 1.2,
                  'heatmap-color': [
                    'interpolate',
                    ['linear'],
                    ['heatmap-density'],
                    0, 'rgba(79, 140, 255, 0)',
                    0.3, 'rgba(79, 140, 255, 0.4)',
                    0.6, 'rgba(255, 159, 67, 0.7)',
                    1, 'rgba(255, 77, 94, 0.9)'
                  ],
                  'heatmap-radius': 28,
                  'heatmap-opacity': 0.65
                }} 
              />
            </Source>
          )}

          {/* Attack Vector Paths */}
          {showVectors && (
            <Source id="attack-paths-source" type="geojson" data={attackLinesGeoJSON as any}>
              <Layer 
                id="attack-paths-layer" 
                type="line" 
                paint={{
                  'line-color': [
                    'match',
                    ['get', 'severity'],
                    'Critical', '#FF4D5E',
                    'High', '#FF9F43',
                    '#4F8CFF'
                  ],
                  'line-width': 2,
                  'line-opacity': 0.8
                }} 
              />
            </Source>
          )}

          {/* Origin and Target Markers */}
          {activeAttacks.map(attack => (
            <React.Fragment key={attack.id}>
              <Marker longitude={attack.origin[0]} latitude={attack.origin[1]}>
                <div 
                  onClick={() => {
                    setSelectedAttack(attack);
                    handleInspectOrigin(attack);
                  }}
                  className="cursor-pointer group relative flex items-center justify-center p-1"
                  title={`Origin: ${attack.originName} (${attack.originIp})`}
                >
                  <div className="w-2.5 h-2.5 bg-critical rounded-full ring-2 ring-surface border border-critical" />
                </div>
              </Marker>
              <Marker longitude={attack.target[0]} latitude={attack.target[1]}>
                <div 
                  className="relative flex items-center justify-center p-1"
                  title={`Target: ${attack.targetName} (${attack.targetIp})`}
                >
                  <div className="w-2 h-2 bg-primary rounded-full ring-2 ring-surface border border-primary" />
                </div>
              </Marker>
            </React.Fragment>
          ))}
        </Map>

        {/* ── TOP-LEFT: SENSOR LAYER CONTROLS ── */}
        <div className="absolute top-4 left-4 z-10 bg-surface/95 border border-border rounded-lg p-3 shadow-md min-w-[240px]">
          <div className="flex items-center gap-2 mb-2.5 pb-2 border-b border-border">
            <Layers size={13} className="text-primary" />
            <span className="text-xs font-semibold text-text uppercase tracking-wider">Telemetry Layers</span>
          </div>
          <div className="flex flex-col gap-2 text-xs">
            <label className="flex items-center justify-between text-text-secondary cursor-pointer hover:text-text">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-critical" />
                <span>Attack Vectors</span>
              </span>
              <input 
                type="checkbox" 
                checked={showVectors} 
                onChange={e => setShowVectors(e.target.checked)}
                className="rounded border-border text-primary focus:ring-0 cursor-pointer"
              />
            </label>
            <label className="flex items-center justify-between text-text-secondary cursor-pointer hover:text-text">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-high" />
                <span>Target Density (Heatmap)</span>
              </span>
              <input 
                type="checkbox" 
                checked={showHeatmap} 
                onChange={e => setShowHeatmap(e.target.checked)}
                className="rounded border-border text-primary focus:ring-0 cursor-pointer"
              />
            </label>
            <div className="flex items-center justify-between text-text-muted pt-1.5 border-t border-border/50 gap-4">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary" />
                <span>Protected Endpoints</span>
              </span>
              <span className="text-[11px] font-mono shrink-0">Sensors: 42</span>
            </div>
          </div>
        </div>

        {/* ── TOP-RIGHT: INTERCEPTED ATTACK LOG ── */}
        <div className="absolute top-4 right-4 z-10 w-[340px] bg-surface/95 border border-border rounded-lg shadow-md flex flex-col max-h-[320px] overflow-hidden">
          <div className="p-2.5 border-b border-border bg-surface-elevated flex justify-between items-center">
            <span className="text-xs font-semibold text-text uppercase tracking-wider flex items-center gap-1.5">
              <Network size={13} className="text-primary" /> Intercepted Traffic
            </span>
            <span className="text-[11px] font-mono text-text-muted">{activeAttacks.length} in window</span>
          </div>
          <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-2">
            {activeAttacks.map(attack => (
              <div 
                key={attack.id} 
                onClick={() => handleInspectOrigin(attack)}
                className="p-2.5 rounded border border-border bg-surface hover:border-primary/40 hover:bg-surface-hover transition-colors cursor-pointer flex flex-col gap-1.5"
              >
                <div className="flex justify-between items-center gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <SeverityBadge severity={attack.severity} className="shrink-0" />
                    <span className="text-xs font-medium text-text truncate">{attack.type}</span>
                  </div>
                  <span className="text-[11px] font-mono text-text-muted shrink-0">{formatTime(attack.timestamp)}</span>
                </div>
                <div className="flex items-center justify-between text-[11px] font-mono text-text-secondary pt-1 border-t border-border/50">
                  <div className="flex items-center gap-1 text-critical truncate max-w-[120px]" title={attack.originIp}>
                    <span>{attack.originName.split(',')[0]}</span>
                  </div>
                  <span className="text-text-muted text-[10px]">➔</span>
                  <div className="flex items-center gap-1 text-primary truncate max-w-[120px] text-right" title={attack.targetIp}>
                    <span>{attack.targetName.split(',')[0]}</span>
                  </div>
                </div>
                {attack.actor && (
                  <div className="text-[10px] text-text-muted">
                    Cluster: <span className="text-text-secondary font-medium">{attack.actor}</span>
                  </div>
                )}
              </div>
            ))}
            {activeAttacks.length === 0 && (
              <div className="text-center py-6 text-xs text-text-muted">
                Waiting for telemetry events in playback window...
              </div>
            )}
          </div>
        </div>

        {/* ── BOTTOM DOCKED: PLAYBACK & TIMELINE CONTROLS ── */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 w-full max-w-xl px-4">
          <div className="bg-surface/95 border border-border p-3 rounded-lg shadow-md flex items-center gap-3">
            {/* Play/Pause Button */}
            <Button 
              size="sm"
              variant={isPlaying ? "outline" : "primary"}
              onClick={() => setIsPlaying(!isPlaying)}
              className="h-8 w-8 p-0 shrink-0"
              title={isPlaying ? "Pause Playback" : "Play Telemetry"}
            >
              {isPlaying ? <Pause size={13} /> : <Play size={13} className="ml-0.5" />}
            </Button>
            
            {/* Timeline Scrubber */}
            <div className="flex-1 relative flex items-center">
              <input 
                type="range" 
                min={minTime} 
                max={maxTime} 
                value={currentTime} 
                onChange={(e) => setCurrentTime(Number(e.target.value))}
                className="w-full h-1.5 bg-border rounded-full appearance-none outline-none cursor-pointer accent-primary"
              />
            </div>
            
            {/* Timestamp */}
            <div className="text-xs font-mono font-medium text-text bg-surface-elevated border border-border px-2.5 py-1 rounded shrink-0">
              {formatTime(currentTime)} UTC
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
