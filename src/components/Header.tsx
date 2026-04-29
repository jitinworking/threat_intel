import React from 'react';
import { Search, Bell, User, Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export const Header: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="glass-panel" style={{ borderRadius: 0, borderTop: 'none', borderRight: 'none', borderLeft: 'none', zIndex: 10 }}>
      <div className="layout-container flex justify-between items-center py-4">
        {/* Search Bar */}
        <div className="search-container glass-panel flex items-center px-4 py-2 rounded-full w-[350px] gap-2 shadow-none border-white/10 focus-within:border-primary/40 transition-all">
          <Search size={18} className="text-muted" />
          <input 
            type="text" 
            placeholder="Search IoCs, IPs, domains..." 
            className="bg-transparent border-none text-main text-sm flex-1 outline-none"
          />
          <div className="badge badge-primary px-1.5 py-0.5 text-[10px]">⌘K</div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-4">
          <button 
            onClick={toggleTheme}
            className="glass-panel p-2.5 flex items-center justify-center hover:text-primary transition-all shadow-none border-white/10"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <button className="glass-panel p-2.5 flex items-center justify-center hover:text-primary transition-all shadow-none border-white/10">
            <Bell size={18} className="text-muted" />
          </button>
          
          <div style={{ width: '1px', height: '24px', background: 'var(--border-strong)' }}></div>

          <button className="flex items-center gap-2 p-1 pl-2 rounded-full glass-panel" style={{ paddingRight: '0.25rem' }}>
            <span className="text-sm font-medium px-2">Analyst</span>
            <div className="avatar" style={{ background: 'var(--primary-color)', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <User size={16} color="white" />
            </div>
          </button>
        </div>
      </div>
    </header>
  );
};
