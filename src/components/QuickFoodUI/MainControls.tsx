import React from 'react';
import { Sparkles, Pizza, Coffee, ChefHat, Search } from 'lucide-react';
import { motion } from 'motion/react';

interface MainControlsProps {
  onDirectSearch: (query: string) => void;
  onCategorySelect: (cat: 'MAKANAN_SAJA' | 'MINUMAN_SAJA' | 'KEDUANYA') => void;
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  userLocation: any;
  requestLocation: () => void;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.9 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 300, damping: 20 } }
};

export function MainControls({ 
  onDirectSearch, onCategorySelect, searchQuery, setSearchQuery, userLocation, requestLocation 
}: MainControlsProps) {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="flex-1 flex flex-col justify-center items-center text-center py-6"
    >
      <motion.div variants={itemVariants} className="mb-6 md:mb-8 rotate-[-2deg] bg-[var(--cartoon-yellow)] cartoon-border p-2 md:p-4 cartoon-shadow-sm rounded-2xl md:rounded-3xl">
        <div className="flex items-center gap-2">
           <Sparkles size={16} className="md:size-5 text-[var(--text-main)]" />
           <span className="text-[10px] md:text-sm font-heading uppercase tracking-widest text-[var(--text-main)]">AI-Powered Decisions!</span>
        </div>
      </motion.div>

      <motion.h2 variants={itemVariants} className="text-2xl md:text-6xl lg:text-7xl font-heading leading-[1.1] mb-6 text-[var(--text-main)] uppercase text-pop max-w-4xl px-2">
        BINGUNG PILIHANNYA BANYAK <br />
        <span className="text-[var(--brand-blue)]">PAKAI QUICKFOOD AJA</span>
      </motion.h2>

      <motion.div variants={itemVariants} className="w-full max-w-xl mb-16 px-4">
        <span className="text-[10px] md:text-xs font-heading text-[var(--text-main)] uppercase opacity-60 ml-4 mb-2 block text-left">
          cari tau lokasi makananmu
        </span>
        <div className="relative group/search">
          <div className="relative flex items-center bg-[var(--card-bg)] cartoon-border rounded-3xl p-1.5 md:p-2 transition-all cartoon-shadow-lg">
            <div className="hidden sm:flex pl-4 text-[var(--text-main)]"><Search size={22} /></div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onDirectSearch(searchQuery)}
              placeholder="Cari makanan (mis: Bakso)..."
              className="flex-1 bg-transparent px-3 md:px-4 py-3 md:py-4 outline-none text-base md:text-xl font-display placeholder:text-[var(--text-main)]/40 min-w-0"
            />
            <button onClick={() => onDirectSearch(searchQuery)} className="cartoon-button bg-[var(--brand-blue)] text-white mr-1 md:mr-2 !px-4 md:!px-8 !py-2 md:!py-4 text-xs md:text-base">
              CARI
            </button>
          </div>
        </div>
      </motion.div>

      <motion.div variants={containerVariants} className="grid grid-cols-2 sm:grid-cols-3 gap-4 md:gap-8 w-full max-w-5xl px-4 mt-8">
        {[
          { id: 'MAKANAN_SAJA', label: 'Makanan', icon: Pizza, subtitle: 'Pilih Lauk' },
          { id: 'MINUMAN_SAJA', label: 'Minuman', icon: Coffee, subtitle: 'Haus Pol' },
          { id: 'KEDUANYA', label: 'Mix', icon: ChefHat, subtitle: 'Menu Lengkap' }
        ].map(cat => (
          <motion.button
            key={cat.id}
            variants={itemVariants}
            onClick={() => onCategorySelect(cat.id as any)}
            className={`group relative p-4 md:p-10 rounded-[1.5rem] md:rounded-[3rem] cartoon-border cartoon-shadow-lg transition-all hover:scale-105 active:scale-95 flex flex-col items-center gap-3 md:gap-6 w-full bg-[var(--brand-blue)] text-white overflow-hidden ${cat.id === 'KEDUANYA' ? 'col-span-2 sm:col-span-1' : ''}`}
          >
            <div className="w-12 h-12 md:w-24 md:h-24 bg-[var(--cartoon-yellow)] cartoon-border rounded-[1rem] md:rounded-[2.5rem] flex items-center justify-center text-[var(--text-main)] group-hover:rotate-[15deg] transition-all duration-500">
              <cat.icon size={24} className="md:size-[44px]" />
            </div>
            <div className="flex flex-col items-center gap-1">
              <span className="text-lg md:text-2xl font-heading uppercase text-pop tracking-tight leading-none text-white">{cat.label}</span>
              <span className="text-[8px] md:text-[10px] font-black uppercase opacity-60 tracking-[0.2em] text-white">{cat.subtitle}</span>
            </div>
            {cat.id === 'KEDUANYA' && (
              <div className="absolute top-5 right-5 bg-[var(--cartoon-pink)] text-[var(--brand-blue)] cartoon-border-sm px-4 py-1.5 rounded-2xl text-[9px] font-black uppercase rotate-[15deg] cartoon-shadow-sm">
                PILIHAN BOS!
              </div>
            )}
          </motion.button>
        ))}
      </motion.div>
    </motion.div>
  );
}
