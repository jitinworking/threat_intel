import React, { useState } from 'react';
import { 
  X, AlertOctagon, AlertTriangle, Info, CheckCircle2, ChevronDown, 
  Copy, Check, Search, RotateCcw, ChevronRight
} from 'lucide-react';
import { cn } from '../../utils/utils';

// ==========================================
// 1. TYPOGRAPHY & HEADERS
// ==========================================

export const H1: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({ className, ...props }) => (
  <h1 className={cn("text-2xl font-bold tracking-tight text-text leading-tight", className)} {...props} />
);

export const H2: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({ className, ...props }) => (
  <h2 className={cn("text-lg font-semibold tracking-tight text-text leading-snug", className)} {...props} />
);

export const H3: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({ className, ...props }) => (
  <h3 className={cn("text-sm font-semibold text-text leading-normal", className)} {...props} />
);

export const Text: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({ className, ...props }) => (
  <p className={cn("text-[13px] text-text-secondary leading-relaxed", className)} {...props} />
);

export const Small: React.FC<React.HTMLAttributes<HTMLSpanElement>> = ({ className, ...props }) => (
  <span className={cn("text-xs text-text-muted font-normal leading-none", className)} {...props} />
);

export const Code: React.FC<React.HTMLAttributes<HTMLElement>> = ({ className, ...props }) => (
  <code className={cn("font-mono text-xs bg-surface-elevated px-1.5 py-0.5 rounded border border-border text-text font-medium", className)} {...props} />
);

export interface PageHeaderProps {
  title: string;
  description?: string;
  subtitle?: string;
  breadcrumbs?: { label: string; onClick?: () => void }[];
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  subtitle,
  breadcrumbs,
  badge,
  actions,
  className,
}) => {
  const desc = description || subtitle;
  return (
    <div className={cn("flex flex-col gap-3 pb-5 border-b border-border", className)}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="flex items-center gap-1.5 text-xs text-text-muted" aria-label="Breadcrumbs">
          {breadcrumbs.map((crumb, idx) => {
            const isLast = idx === breadcrumbs.length - 1;
            return (
              <React.Fragment key={crumb.label}>
                {idx > 0 && <ChevronRight size={12} className="text-text-muted/60 shrink-0" />}
                {crumb.onClick && !isLast ? (
                  <button
                    onClick={crumb.onClick}
                    className="hover:text-text transition-colors cursor-pointer truncate max-w-[200px]"
                  >
                    {crumb.label}
                  </button>
                ) : (
                  <span className={cn(isLast ? "font-medium text-text truncate max-w-[240px]" : "truncate max-w-[200px]")}>
                    {crumb.label}
                  </span>
                )}
              </React.Fragment>
            );
          })}
        </nav>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-text">{title}</h1>
            {badge}
          </div>
          {desc && (
            <p className="mt-1 text-[13px] text-text-secondary max-w-3xl leading-relaxed">
              {desc}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};

export const SectionHeader: React.FC<{
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}> = ({ title, description, actions, className }) => (
  <div className={cn("flex items-center justify-between gap-4 mb-3", className)}>
    <div>
      <h3 className="text-sm font-semibold text-text">{title}</h3>
      {description && <p className="text-xs text-text-muted mt-0.5">{description}</p>}
    </div>
    {actions && <div className="flex items-center gap-2">{actions}</div>}
  </div>
);

// ==========================================
// 2. SEVERITY, STATUS & ENTITY BADGES
// ==========================================

export type SeverityLevel = 'critical' | 'high' | 'medium' | 'low' | 'informational';

const SEVERITY_CONFIG: Record<SeverityLevel, { dot: string; bg: string; border: string; text: string; label: string }> = {
  critical: {
    dot: 'bg-critical',
    bg: 'bg-critical-muted',
    border: 'border-critical/30',
    text: 'text-critical',
    label: 'Critical',
  },
  high: {
    dot: 'bg-high',
    bg: 'bg-high-muted',
    border: 'border-high/30',
    text: 'text-high',
    label: 'High',
  },
  medium: {
    dot: 'bg-medium',
    bg: 'bg-medium-muted',
    border: 'border-medium/30',
    text: 'text-medium',
    label: 'Medium',
  },
  low: {
    dot: 'bg-low',
    bg: 'bg-low-muted',
    border: 'border-low/30',
    text: 'text-low',
    label: 'Low',
  },
  informational: {
    dot: 'bg-text-muted',
    bg: 'bg-surface-elevated',
    border: 'border-border',
    text: 'text-text-secondary',
    label: 'Info',
  },
};

export const SeverityBadge: React.FC<{
  level?: string;
  severity?: string;
  showDot?: boolean;
  className?: string;
}> = ({ level, severity, showDot = true, className }) => {
  const raw = severity || level || 'informational';
  const norm = (raw.toLowerCase() as SeverityLevel) in SEVERITY_CONFIG
    ? (raw.toLowerCase() as SeverityLevel)
    : 'informational';
  const cfg = SEVERITY_CONFIG[norm];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold border leading-tight select-none",
        cfg.bg,
        cfg.border,
        cfg.text,
        className
      )}
    >
      {showDot && <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", cfg.dot)} />}
      <span className="capitalize">{norm}</span>
    </span>
  );
};

export const StatusIndicator: React.FC<{
  status: 'active' | 'live' | 'inactive' | 'stale' | 'syncing';
  label?: string;
  timestamp?: string;
  className?: string;
}> = ({ status, label, timestamp, className }) => {
  const isOnline = status === 'active' || status === 'live';
  const isSync = status === 'syncing';

  return (
    <div className={cn("inline-flex items-center gap-1.5 text-xs text-text-secondary select-none", className)}>
      <span
        className={cn(
          "w-2 h-2 rounded-full shrink-0",
          isOnline ? "bg-success" : isSync ? "bg-primary animate-pulse" : "bg-text-muted"
        )}
      />
      <span className="font-medium text-text">
        {label || (isOnline ? 'Online' : isSync ? 'Syncing...' : 'Inactive')}
      </span>
      {timestamp && <span className="text-text-muted font-mono text-[11px]">({timestamp})</span>}
    </div>
  );
};

export const ConfidenceScore: React.FC<{ score: number; className?: string }> = ({ score, className }) => {
  const color = score >= 80 ? 'text-critical' : score >= 60 ? 'text-high' : score >= 40 ? 'text-medium' : 'text-text-muted';
  return (
    <div className={cn("inline-flex items-center gap-1.5 font-mono text-xs", className)}>
      <div className="w-10 h-1.5 bg-surface-elevated rounded-full overflow-hidden border border-border">
        <div
          className={cn("h-full rounded-full", score >= 80 ? 'bg-critical' : score >= 60 ? 'bg-high' : 'bg-primary')}
          style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
        />
      </div>
      <span className={cn("font-semibold", color)}>{score}%</span>
    </div>
  );
};

export const EntityBadge: React.FC<{ type: string; value?: string; className?: string }> = ({ type, value, className }) => {
  return (
    <span className={cn("inline-flex items-center gap-1 font-mono text-xs bg-surface-elevated border border-border rounded px-1.5 py-0.5", className)}>
      <span className="text-[10px] uppercase font-bold text-text-muted tracking-wider">{type}</span>
      {value && <span className="font-semibold text-text">{value}</span>}
    </span>
  );
};

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'critical' | 'high' | 'medium' | 'low' | 'success' | 'info' | 'default' | 'outline' | 'warning';
}

export const Badge: React.FC<BadgeProps> = ({ variant = 'default', className, children, ...props }) => {
  const styles: Record<string, string> = {
    critical: 'bg-critical-muted text-critical border-critical/30',
    high: 'bg-high-muted text-high border-high/30',
    warning: 'bg-high-muted text-high border-high/30',
    medium: 'bg-medium-muted text-medium border-medium/30',
    low: 'bg-low-muted text-low border-low/30',
    success: 'bg-success-muted text-success border-success/30',
    info: 'bg-primary-muted text-primary border-primary/30',
    outline: 'bg-transparent text-text-secondary border-border',
    default: 'bg-surface-elevated text-text-secondary border-border',
  };

  return (
    <span
      className={cn("inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border leading-tight", styles[variant] || styles.default, className)}
      {...props}
    >
      {children}
    </span>
  );
};

// ==========================================
// 3. BUTTONS
// ==========================================

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'destructive' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg' | 'icon';
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'secondary',
  size = 'md',
  className,
  ...props
}) => {
  const base = "inline-flex items-center justify-center font-medium transition-colors rounded cursor-pointer disabled:opacity-50 disabled:pointer-events-none select-none text-[13px]";

  const variants = {
    primary: "bg-primary text-white hover:bg-primary-hover shadow-sm border border-primary/20 font-semibold",
    secondary: "bg-surface hover:bg-surface-hover text-text border border-border shadow-xs",
    destructive: "bg-critical text-white hover:bg-critical/90 shadow-sm font-semibold",
    ghost: "hover:bg-surface-hover text-text-secondary hover:text-text",
    outline: "border border-border text-text hover:bg-surface-hover",
  };

  const sizes = {
    sm: "px-2.5 py-1 text-xs rounded",
    md: "px-3.5 py-1.5 text-[13px] rounded",
    lg: "px-4 py-2 text-sm rounded-md",
    icon: "p-1.5 rounded",
  };

  return (
    <button className={cn(base, variants[variant], sizes[size], className)} {...props} />
  );
};

// ==========================================
// 4. FORM CONTROLS & FILTER BAR
// ==========================================

export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = ({ className, ...props }) => {
  return (
    <input
      className={cn(
        "w-full bg-surface border border-border rounded px-3 py-1.5 text-[13px] text-text placeholder-text-muted outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all",
        className
      )}
      {...props}
    />
  );
};

export interface DropdownProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string; label: string }[];
}

export const Dropdown: React.FC<DropdownProps> = ({ options, className, label, ...props }) => {
  return (
    <div className="relative flex flex-col gap-1 shrink-0">
      {label && <label className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">{label}</label>}
      <div className="relative">
        <select
          className={cn(
            "appearance-none bg-surface border border-border text-xs font-medium text-text px-3 pr-7 py-1.5 rounded outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 cursor-pointer transition-all",
            className
          )}
          {...props}
        >
          {options.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted" />
      </div>
    </div>
  );
};

export interface FilterBarProps {
  search: string;
  onSearchChange: (val: string) => void;
  searchPlaceholder?: string;
  children?: React.ReactNode;
  onClear?: () => void;
  hasActiveFilters?: boolean;
  className?: string;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  search,
  onSearchChange,
  searchPlaceholder = "Search indicators, actors, malware...",
  children,
  onClear,
  hasActiveFilters = false,
  className,
}) => {
  return (
    <div className={cn("flex flex-wrap items-center gap-2.5 p-2 bg-surface rounded border border-border", className)}>
      <div className="relative flex-1 min-w-[220px]">
        <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={e => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          className="w-full bg-surface-elevated border border-border rounded pl-8 pr-7 py-1.5 text-xs text-text placeholder-text-muted outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
        />
        {search && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted hover:text-text cursor-pointer p-0.5"
          >
            <X size={12} />
          </button>
        )}
      </div>

      {children}

      {hasActiveFilters && onClear && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClear}
          className="text-xs text-text-muted hover:text-text gap-1"
        >
          <RotateCcw size={12} />
          Clear
        </Button>
      )}
    </div>
  );
};

// ==========================================
// 5. CARDS & KPI METRICS
// ==========================================

export const Card: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => (
  <div className={cn("bg-surface border border-border rounded p-4 flex flex-col justify-between transition-colors", className)} {...props} />
);

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => (
  <div className={cn("pb-3 border-b border-border mb-3 flex justify-between items-center gap-3", className)} {...props} />
);

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({ className, ...props }) => (
  <h3 className={cn("text-sm font-semibold text-text flex items-center gap-2", className)} {...props} />
);

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => (
  <div className={cn("flex-1", className)} {...props} />
);

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => (
  <div className={cn("pt-3 border-t border-border mt-3 flex justify-between items-center text-xs text-text-muted", className)} {...props} />
);

export interface MetricCardProps {
  label: string;
  value?: number | string;
  detail?: string;
  icon?: React.ReactNode;
  loading?: boolean;
  prefix?: string;
  suffix?: string;
  accent?: 'primary' | 'critical' | 'high' | 'success' | 'default';
  trend?: string;
  onClick?: () => void;
  className?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  detail,
  icon,
  loading = false,
  prefix = '',
  suffix = '',
  accent = 'default',
  trend,
  onClick,
  className,
}) => {
  const accentBorder = {
    primary: 'border-l-primary',
    critical: 'border-l-critical',
    high: 'border-l-high',
    success: 'border-l-success',
    default: 'border-l-border-strong',
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        "bg-surface border border-border border-l-4 rounded p-4 flex flex-col justify-between transition-colors",
        accentBorder[accent],
        onClick && "cursor-pointer hover:bg-surface-hover",
        className
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">{label}</span>
        {icon && <span className="text-text-muted shrink-0">{icon}</span>}
      </div>

      <div className="my-2">
        {loading ? (
          <div className="h-8 w-24 bg-surface-elevated rounded animate-pulse" />
        ) : (
          <div className="text-2xl font-bold tracking-tight text-text font-mono">
            {prefix}{typeof value === 'number' ? value.toLocaleString() : (value ?? '—')}{suffix}
          </div>
        )}
      </div>

      {(detail || trend) && (
        <div className="flex items-center justify-between text-xs text-text-muted">
          {detail && <span>{detail}</span>}
          {trend && <span className="font-mono text-primary font-medium">{trend}</span>}
        </div>
      )}
    </div>
  );
};

// ==========================================
// 6. TABLES
// ==========================================

export const TableContainer: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => (
  <div className={cn("w-full overflow-x-auto border border-border rounded bg-surface", className)} {...props} />
);

export const Table: React.FC<React.HTMLAttributes<HTMLTableElement>> = ({ className, ...props }) => (
  <table className={cn("w-full border-collapse text-left text-xs", className)} {...props} />
);

export const TableHeader: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({ className, ...props }) => (
  <thead className={cn("bg-surface-elevated border-b border-border text-[11px] font-semibold text-text-muted sticky top-0 z-10 select-none", className)} {...props} />
);

export const TableBody: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({ className, ...props }) => (
  <tbody className={cn("divide-y divide-border", className)} {...props} />
);

export const TableRow: React.FC<React.HTMLAttributes<HTMLTableRowElement>> = ({ className, ...props }) => (
  <tr className={cn("hover:bg-surface-hover transition-colors group", className)} {...props} />
);

export const TableHead: React.FC<React.ThHTMLAttributes<HTMLTableCellElement>> = ({ className, ...props }) => (
  <th className={cn("px-3 py-2.5 font-semibold text-text-muted data-table-header uppercase tracking-wider", className)} {...props} />
);

export const TableCell: React.FC<React.TdHTMLAttributes<HTMLTableCellElement>> = ({ className, ...props }) => (
  <td className={cn("px-3 py-2.5 text-text font-normal data-table-cell align-middle", className)} {...props} />
);

// ==========================================
// 7. CODE VIEWER
// ==========================================

export const CodeViewer: React.FC<{
  code: string;
  language?: string;
  className?: string;
}> = ({ code, language = 'kql', className }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lines = code.trim().split('\n');

  return (
    <div className={cn("rounded border border-border bg-surface-elevated overflow-hidden font-mono text-xs", className)}>
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-border bg-surface text-text-muted">
        <span className="text-[10px] uppercase font-bold tracking-wider">{language}</span>
        <button
          onClick={handleCopy}
          className="inline-flex items-center gap-1 text-[11px] hover:text-text transition-colors cursor-pointer"
        >
          {copied ? <Check size={12} className="text-success" /> : <Copy size={12} />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>
      <div className="p-3 overflow-x-auto custom-scrollbar">
        <table className="w-full border-collapse">
          <tbody>
            {lines.map((line, idx) => (
              <tr key={idx} className="leading-relaxed hover:bg-surface-hover/50">
                <td className="pr-4 text-text-muted/40 select-none text-right font-mono text-[11px] w-6 align-top">
                  {idx + 1}
                </td>
                <td className="text-text font-mono text-[12px] whitespace-pre font-normal">
                  {line}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ==========================================
// 8. STATES (EMPTY, ERROR, SKELETON)
// ==========================================

export const EmptyState: React.FC<{
  icon?: React.ReactNode;
  title?: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}> = ({
  icon,
  title = "No intelligence records found",
  description = "No matching items for current search or filters. Try adjusting filter criteria.",
  action,
  className,
}) => (
  <div className={cn("py-12 px-4 text-center flex flex-col items-center justify-center max-w-sm mx-auto", className)}>
    <div className="w-10 h-10 rounded bg-surface-elevated border border-border flex items-center justify-center text-text-muted mb-3">
      {icon || <Search size={18} />}
    </div>
    <h4 className="text-sm font-semibold text-text mb-1">{title}</h4>
    <p className="text-xs text-text-secondary leading-relaxed mb-4">{description}</p>
    {action}
  </div>
);

export const ErrorState: React.FC<{
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
}> = ({
  title = "Unable to retrieve intelligence",
  message,
  onRetry,
  className,
}) => (
  <div className={cn("p-4 border border-critical/30 bg-critical-muted rounded flex items-start justify-between gap-3 my-3", className)}>
    <div className="flex items-start gap-3">
      <AlertOctagon size={16} className="text-critical shrink-0 mt-0.5" />
      <div>
        <h4 className="text-xs font-semibold text-critical">{title}</h4>
        <p className="text-xs text-text-secondary mt-0.5">{message}</p>
      </div>
    </div>
    {onRetry && (
      <Button variant="outline" size="sm" onClick={onRetry} className="shrink-0 text-xs gap-1 border-critical/30 hover:bg-critical/10 text-critical">
        <RotateCcw size={12} />
        Retry
      </Button>
    )}
  </div>
);

export const Skeleton: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => (
  <div className={cn("bg-surface-elevated rounded animate-pulse", className)} {...props} />
);

// ==========================================
// 9. OVERLAYS (MODAL, DRAWER, NOTIFICATION)
// ==========================================

export const Modal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: string;
}> = ({ isOpen, onClose, title, children, maxWidth = "max-w-md" }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 modal-overlay" onClick={onClose} />
      <div className={cn("relative w-full bg-surface border border-border rounded shadow-xl flex flex-col overflow-hidden animate-fade-in", maxWidth)}>
        <div className="px-5 py-3.5 border-b border-border flex justify-between items-center bg-surface-elevated">
          <h3 className="text-sm font-semibold text-text">{title}</h3>
          <button onClick={onClose} className="p-1 hover:bg-surface-hover rounded text-text-muted hover:text-text cursor-pointer">
            <X size={15} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
};

export const Drawer: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  width?: string;
}> = ({ isOpen, onClose, title, subtitle, children, width = "max-w-xl" }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/50 modal-overlay" onClick={onClose} />
      <div className={cn("relative w-full bg-surface border-l border-border h-full flex flex-col shadow-2xl animate-slide-in", width)}>
        <div className="px-5 py-4 border-b border-border flex justify-between items-center bg-surface-elevated shrink-0">
          <div>
            <h3 className="text-sm font-semibold text-text">{title}</h3>
            {subtitle && <p className="text-xs text-text-muted mt-0.5">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-surface-hover rounded text-text-muted hover:text-text cursor-pointer">
            <X size={16} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-5 custom-scrollbar min-h-0">
          {children}
        </div>
      </div>
    </div>
  );
};

export const Notification: React.FC<{
  variant?: 'error' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  onClose?: () => void;
}> = ({ variant = 'info', title, message, onClose }) => {
  const styles = {
    error: { border: 'border-critical/30', bg: 'bg-critical-muted', text: 'text-critical', icon: <AlertOctagon size={15} /> },
    warning: { border: 'border-high/30', bg: 'bg-high-muted', text: 'text-high', icon: <AlertTriangle size={15} /> },
    info: { border: 'border-primary/30', bg: 'bg-primary-muted', text: 'text-primary', icon: <Info size={15} /> },
    success: { border: 'border-success/30', bg: 'bg-success-muted', text: 'text-success', icon: <CheckCircle2 size={15} /> },
  };

  const current = styles[variant];

  return (
    <div className={cn("p-3 border rounded flex gap-3 items-start justify-between shadow-xs", current.border, current.bg)}>
      <div className="flex gap-2.5 items-start">
        <div className={cn("mt-0.5", current.text)}>{current.icon}</div>
        <div>
          <span className="text-xs font-semibold text-text leading-none">{title}</span>
          <p className="text-xs text-text-secondary mt-1 leading-normal">{message}</p>
        </div>
      </div>
      {onClose && (
        <button onClick={onClose} className="p-0.5 hover:bg-surface-hover rounded text-text-muted hover:text-text cursor-pointer">
          <X size={13} />
        </button>
      )}
    </div>
  );
};
