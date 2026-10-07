import React from 'react';
import { 
  Shield, ChevronLeft, ChevronRight, PanelLeftClose, PanelLeftOpen 
} from 'lucide-react';
import { 
  NAVIGATION_ROUTES, 
  NAVIGATION_CATEGORIES, 
  type RouteItem 
} from '../navigation';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isCollapsed,
  onToggleCollapse,
}) => {
  return (
    <aside
      className={`h-full flex flex-col bg-surface border-r border-border select-none text-text transition-all duration-200 shrink-0 print:hidden ${
        isCollapsed ? 'w-14' : 'w-[224px]'
      }`}
    >
      {/* ── Brand / Header ── */}
      <div className="h-12 px-3 flex items-center justify-between border-b border-border shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 text-primary">
            <Shield size={15} strokeWidth={2.2} />
          </div>
          {!isCollapsed && (
            <div className="min-w-0 leading-tight">
              <span className="font-bold text-[13px] text-text tracking-tight block truncate">
                ThreatIntel
              </span>
              <span className="text-[10px] font-mono text-text-muted block">
                SOC v4.2
              </span>
            </div>
          )}
        </div>

        <button
          onClick={onToggleCollapse}
          className="p-1 rounded hover:bg-surface-hover text-text-muted hover:text-text cursor-pointer transition-colors"
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? <PanelLeftOpen size={14} /> : <PanelLeftClose size={14} />}
        </button>
      </div>

      {/* ── Nav Groups ── */}
      <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-4 custom-scrollbar">
        {NAVIGATION_CATEGORIES.map(category => {
          const items = NAVIGATION_ROUTES.filter(r => r.category === category);
          if (!items.length) return null;

          return (
            <div key={category} className="flex flex-col">
              {!isCollapsed && (
                <div className="px-2 mb-1 text-[10px] font-bold uppercase tracking-wider text-text-muted select-none">
                  {category}
                </div>
              )}

              <div className="space-y-0.5">
                {items.map(item => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;

                  return (
                    <button
                      key={item.id}
                      data-tab={item.id}
                      onClick={() => setActiveTab(item.id)}
                      title={isCollapsed ? `${item.label} (${item.shortcut || ''})` : undefined}
                      className={`group w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded text-xs transition-colors cursor-pointer text-left relative ${
                        isActive
                          ? 'bg-surface-elevated text-primary font-semibold border-l-2 border-primary pl-2'
                          : 'text-text-secondary hover:text-text hover:bg-surface-hover font-normal'
                      } ${isCollapsed ? 'justify-center px-0' : ''}`}
                    >
                      <Icon
                        size={15}
                        strokeWidth={isActive ? 2.2 : 1.8}
                        className={`shrink-0 ${isActive ? 'text-primary' : 'text-text-muted group-hover:text-text'}`}
                      />

                      {!isCollapsed && (
                        <>
                          <span className="truncate flex-1 tracking-tight">{item.label}</span>
                          {item.shortcut && (
                            <span className="hidden group-hover:inline-block font-mono text-[9px] text-text-muted px-1 rounded bg-surface border border-border">
                              {item.shortcut}
                            </span>
                          )}
                        </>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Bottom Operational Workspace Info ── */}
      {!isCollapsed ? (
        <div className="px-3 py-2.5 border-t border-border bg-surface-elevated shrink-0 text-[11px] text-text-muted flex items-center justify-between">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="w-1.5 h-1.5 rounded-full bg-success shrink-0" />
            <span className="truncate font-medium text-text">Live Ingestion</span>
          </div>
          <span className="font-mono text-[10px]">2m poll</span>
        </div>
      ) : (
        <div className="p-2 border-t border-border flex justify-center shrink-0">
          <span className="w-2 h-2 rounded-full bg-success" title="Live Ingestion Active" />
        </div>
      )}
    </aside>
  );
};
