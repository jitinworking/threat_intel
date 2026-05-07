import React from 'react';

interface WorldMapProps {
  targets: string[];
}

export const WorldMap: React.FC<WorldMapProps> = ({ targets }) => {
  const regions = [
    { id: 'north-america', label: 'North America', cx: 200, cy: 150, r: 40, keywords: ['us', 'usa', 'america', 'canada', 'north america'] },
    { id: 'south-america', label: 'South America', cx: 280, cy: 300, r: 35, keywords: ['brazil', 'south america', 'latam'] },
    { id: 'europe', label: 'Europe', cx: 500, cy: 120, r: 30, keywords: ['europe', 'uk', 'germany', 'france', 'eu'] },
    { id: 'middle-east', label: 'Middle East', cx: 580, cy: 200, r: 25, keywords: ['middle east', 'israel', 'iran', 'saudi'] },
    { id: 'africa', label: 'Africa', cx: 520, cy: 280, r: 35, keywords: ['africa', 'south africa'] },
    { id: 'asia', label: 'Asia', cx: 750, cy: 150, r: 50, keywords: ['asia', 'japan', 'china', 'india', 'south korea', 'taiwan'] },
    { id: 'oceania', label: 'Oceania', cx: 850, cy: 350, r: 25, keywords: ['australia', 'oceania', 'new zealand'] }
  ];

  const isActive = (regionKeywords: string[]) => {
    return targets.some(target => 
      regionKeywords.some(keyword => target.toLowerCase().includes(keyword))
    );
  };

  return (
    <div className="relative w-full h-full bg-slate-950 rounded-lg overflow-hidden border border-white/5 flex items-center justify-center p-4">
      {/* Grid Background */}
      <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
      
      <svg viewBox="0 0 1000 500" className="w-full h-full z-10" preserveAspectRatio="xMidYMid meet">
        {/* Connection lines between regions */}
        <path d="M 200,150 Q 350,100 500,120 T 750,150" fill="none" stroke="rgba(59, 130, 246, 0.2)" strokeWidth="2" strokeDasharray="5,5" />
        <path d="M 500,120 Q 550,180 580,200 T 750,150" fill="none" stroke="rgba(59, 130, 246, 0.2)" strokeWidth="2" strokeDasharray="5,5" />
        
        {regions.map(region => {
          const active = isActive(region.keywords);
          // If no specific regions match, but targets include 'global', light everything up slightly or specific regions.
          const isGlobal = targets.some(t => t.toLowerCase() === 'global');
          const highlyActive = active || (isGlobal && (region.id === 'north-america' || region.id === 'europe' || region.id === 'asia'));

          return (
            <g key={region.id} className="transition-all duration-700">
              {highlyActive && (
                <>
                  <circle cx={region.cx} cy={region.cy} r={region.r * 1.5} fill="rgba(239, 68, 68, 0.1)" className="animate-pulse" />
                  <circle cx={region.cx} cy={region.cy} r={region.r * 1.2} fill="rgba(239, 68, 68, 0.2)" />
                </>
              )}
              <circle 
                cx={region.cx} 
                cy={region.cy} 
                r={region.r} 
                fill={highlyActive ? "rgba(239, 68, 68, 0.6)" : "rgba(30, 41, 59, 0.8)"} 
                stroke={highlyActive ? "#ef4444" : "rgba(255,255,255,0.1)"}
                strokeWidth={highlyActive ? 2 : 1}
              />
              <text 
                x={region.cx} 
                y={region.cy} 
                textAnchor="middle" 
                alignmentBaseline="middle" 
                fill={highlyActive ? "#fff" : "rgba(255,255,255,0.4)"}
                className="text-[12px] font-bold tracking-widest uppercase pointer-events-none"
              >
                {region.label}
              </text>
            </g>
          );
        })}
      </svg>
      
      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-sm p-2 rounded border border-white/10 z-20">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.8)]"></div>
          <span className="text-xs text-slate-300 uppercase tracking-wider">Active Targeting Zone</span>
        </div>
      </div>
    </div>
  );
};
