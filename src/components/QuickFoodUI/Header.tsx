import React from 'react';
import { Utensils, RefreshCcw } from 'lucide-react';

interface HeaderProps {
  onReset: () => void;
  showReset: boolean;
}

export function Header({ onReset, showReset }: HeaderProps) {
  return (
    <nav className="h-16 px-6 md:px-12 flex items-center justify-between pointer-events-auto sticky top-0 z-50">
      <div className="flex items-center gap-3 cursor-pointer group" onClick={onReset}>
        <div className="w-12 h-12 bg-[var(--cartoon-yellow)] cartoon-border cartoon-shadow-sm rounded-2xl flex items-center justify-center group-hover:rotate-6 transition-transform duration-500">
          <Utensils size={24} className="text-[var(--text-main)]" />
        </div>
        <div className="hidden sm:block">
          <h1 className="text-2xl font-heading tracking-tight leading-none text-[var(--text-main)] group-hover:text-[var(--brand-blue)] transition-colors uppercase">QUICK FOOD</h1>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[var(--brand-blue)] animate-pulse" />
            <span className="text-[10px] font-black text-[var(--text-main)] tracking-[0.2em] uppercase">MODULAR V1.0</span>
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        {showReset ? (
          <button 
            onClick={onReset}
            className="cartoon-button bg-[var(--cartoon-orange)] text-white !px-3 md:!px-8 !py-1.5 md:!py-3 text-[10px] md:text-base"
          >
            <RefreshCcw size={14} /> RESET
          </button>
        ) : (
          <div className="flex items-center gap-2 px-4 py-2 bg-[var(--card-bg)] cartoon-border rounded-full shadow-sm">
            <div className="w-2 h-2 rounded-full bg-[var(--cartoon-green)]" />
            <span className="text-[10px] font-heading text-[var(--text-main)] uppercase tracking-widest">Active</span>
          </div>
        )}
      </div>
    </nav>
  );
}
