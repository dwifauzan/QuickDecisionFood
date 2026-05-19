import React from 'react';
import { Wallet, Wind, Sparkles, Heart, Clock, Camera } from 'lucide-react';
import { motion } from 'motion/react';

interface SettingsBarProps {
  budget: string;
  handleBudgetChange: (e: any) => void;
  context: string;
  setContext: (v: string) => void;
  isHealthyMode: boolean;
  setIsHealthyMode: (v: boolean) => void;
  isFastMode: boolean;
  setIsFastMode: (v: boolean) => void;
  isInstaMode: boolean;
  setIsInstaMode: (v: boolean) => void;
  isOptimizationEnabled: boolean;
  setIsOptimizationEnabled: (v: boolean) => void;
}

export function SettingsBar({
  budget, handleBudgetChange, context, setContext,
  isHealthyMode, setIsHealthyMode, isFastMode, setIsFastMode,
  isInstaMode, setIsInstaMode, isOptimizationEnabled, setIsOptimizationEnabled
}: SettingsBarProps) {
  return (
    <div className="lg:col-span-4 space-y-6 md:space-y-8 lg:sticky lg:top-24">
      <div className="cartoon-card bg-[var(--card-bg)] !p-5 md:!p-8">
        <label className="text-[10px] md:text-xs font-heading uppercase ml-2 text-[var(--text-main)] block mb-4 md:mb-6 flex items-center gap-2">
          <Sparkles size={14} className="text-[var(--cartoon-orange)]" /> Context Filter
        </label>
        
        <div className="space-y-4 md:space-y-6">
          {/* BUDGET & CONTEXT */}
          <div className="space-y-2">
            <div className="flex items-center gap-3 bg-[var(--bg-color)] cartoon-border p-3 rounded-2xl cartoon-shadow-sm">
              <Wallet size={18} className="text-[var(--text-main)]" />
              <input type="text" value={budget} onChange={handleBudgetChange} placeholder="Budget (Rp)" className="bg-transparent outline-none font-display text-sm w-full" />
            </div>
            <div className="flex items-center gap-3 bg-[var(--bg-color)] cartoon-border p-3 rounded-2xl cartoon-shadow-sm">
              <Wind size={18} className="text-[var(--text-main)]" />
              <input type="text" value={context} onChange={(e) => setContext(e.target.value)} placeholder="Suasana (mis: Pedas)" className="bg-transparent outline-none font-display text-sm w-full" />
            </div>
          </div>

          <div className="pt-4 border-t-4 border-[var(--border-color)] border-dashed space-y-4">
             <div className="flex items-center justify-between px-2">
                <span className="text-[10px] font-heading uppercase text-[var(--text-main)]">AI Optimization</span>
                <button 
                  onClick={() => setIsOptimizationEnabled(!isOptimizationEnabled)}
                  className={`w-12 h-6 rounded-full cartoon-border transition-colors relative ${isOptimizationEnabled ? 'bg-[var(--cartoon-green)]' : 'bg-gray-300'}`}
                >
                  <motion.div 
                    animate={{ x: isOptimizationEnabled ? 24 : 2 }}
                    className="w-4 h-4 rounded-full bg-white cartoon-border-sm absolute top-0.5" 
                  />
                </button>
             </div>

             <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3 transition-opacity ${isOptimizationEnabled ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
                {[
                  { id: 'healthy', label: 'Healthy Switch', subtitle: 'Nutrisi Lebih Baik', icon: Heart, color: 'var(--cartoon-green)', state: isHealthyMode, setter: setIsHealthyMode },
                  { id: 'fast', label: 'Insta-Fast', subtitle: 'Penyajian Cepat', icon: Clock, color: 'var(--cartoon-orange)', state: isFastMode, setter: setIsFastMode },
                  { id: 'insta', label: 'Insta-Ready', subtitle: 'Foto-able!', icon: Camera, state: isInstaMode, setter: setIsInstaMode }
                ].map((item) => (
                  <button 
                    key={item.id}
                    onClick={() => item.setter(!item.state)}
                    className={`w-full flex items-center gap-4 p-4 rounded-2xl cartoon-border cartoon-shadow-sm transition-all group ${item.state ? 'bg-[var(--brand-blue)] text-white scale-102' : 'bg-[var(--bg-color)] text-[var(--text-main)] hover:bg-[var(--brand-blue)]/5'}`}
                  >
                    <div className={`w-10 h-10 rounded-xl cartoon-border-sm flex items-center justify-center shrink-0 transition-transform group-hover:rotate-6 ${item.state ? 'bg-white/20' : 'bg-[var(--card-bg)]'}`}>
                      <item.icon size={20} />
                    </div>
                    <div className="flex flex-col items-start overflow-hidden text-left">
                      <span className="text-[10px] md:text-xs font-heading uppercase tracking-tight truncate w-full">{item.label}</span>
                      <span className={`text-[8px] font-black uppercase tracking-widest leading-none truncate w-full ${item.state ? 'text-white/60' : 'text-[var(--text-main)]/40'}`}>
                        {item.subtitle}
                      </span>
                    </div>
                    {item.state && (
                      <div className="ml-auto bg-white/20 w-5 h-5 rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                      </div>
                    )}
                  </button>
                ))}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
