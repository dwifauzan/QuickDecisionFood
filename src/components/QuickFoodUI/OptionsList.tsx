import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, X, Trash2, Eye } from 'lucide-react';
import { MapsIntegration } from './MapsIntegration';

interface OptionsListProps {
  options: string[];
  newOption: string;
  setNewOption: (val: string) => void;
  addOption: () => void;
  removeOption: (index: number) => void;
  clearAll: () => void;
  category: any;
  userLocation: any;
  setUserLocation: any;
  setAlertMessage: any;
  setOptions: (options: string[]) => void;
}

export function OptionsList({ 
  options, newOption, setNewOption, addOption, removeOption, clearAll, 
  category, userLocation, setUserLocation, setAlertMessage, setOptions 
}: OptionsListProps) {
  const [showAllModal, setShowAllModal] = useState(false);

  const visibleOptions = options.slice(0, 5);
  const remainingCount = options.length - 5;

  return (
    <div className="space-y-4 md:space-y-6">
      <label className="text-xs md:text-sm font-heading uppercase ml-2 text-[var(--text-main)] block mb-1 md:mb-2">Tulis Menu / Tempat:</label>
      <div className="flex gap-2 md:gap-4 p-2 md:p-3 bg-[var(--card-bg)] cartoon-border rounded-2xl md:rounded-full cartoon-shadow-sm">
        <input
          type="text"
          value={newOption}
          onChange={(e) => setNewOption(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addOption()}
          placeholder="Ketik ide kulinermu..."
          className="flex-1 bg-transparent px-3 md:px-4 py-2 md:py-3 outline-none text-base md:text-xl font-display placeholder:text-[var(--text-main)]/40 min-w-0"
        />
        <button onClick={addOption} className="cartoon-button bg-[var(--cartoon-orange)] text-white !p-3 md:!p-4">
          <Plus size={24} className="md:size-8" />
        </button>
      </div>
      
      <div className="flex justify-start px-2">
        <MapsIntegration 
          category={category} 
          onLocationUpdate={setUserLocation} 
          setAlertMessage={setAlertMessage}
          onPlacesFound={(places) => {
            const newOnes = places.filter(p => !options.some(o => o.toLowerCase() === p.toLowerCase()));
            if (newOnes.length > 0) setOptions([...options, ...newOnes]);
            else if (places.length > 0) setAlertMessage("Semua tempat sudah ada di daftar!");
          }}
        />
      </div>

      <div className="mt-6 md:mt-8">
        {options.length > 0 && (
          <div className="flex items-center justify-between mb-3 px-2">
            <label className="text-[10px] md:text-xs font-heading uppercase text-[var(--text-main)] opacity-70">Pilihanmu ({options.length}):</label>
            <button onClick={clearAll} className="text-[10px] md:text-xs font-heading uppercase text-[var(--brand-blue)] hover:underline flex items-center gap-1">
              <Trash2 size={12} className="md:size-4" /> Hapus Semua
            </button>
          </div>
        )}
        <div id="options-chips-container" className="flex flex-wrap gap-2 md:gap-3 items-center">
          <AnimatePresence mode="popLayout" initial={false}>
            {visibleOptions.map((opt, i) => (
              <motion.div
                key={`${opt}-${i}`}
                layout
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1, rotate: (i % 2 === 0 ? 1 : -1) }}
                exit={{ opacity: 0, scale: 0 }}
                className="flex items-center gap-2 px-4 py-2 bg-[var(--card-bg)] cartoon-border rounded-full text-[10px] md:text-sm font-heading cartoon-shadow-sm group shrink-0"
              >
                <span className="max-w-[120px] md:max-w-[150px] truncate">{opt}</span>
                <button onClick={() => removeOption(i)} className="text-[var(--text-main)] hover:text-[var(--brand-blue)]">
                  <X size={14} />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>

          {options.length > 5 && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowAllModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-[var(--brand-blue)] text-white cartoon-border rounded-full text-[10px] md:text-sm font-heading cartoon-shadow-sm hover:bg-[var(--brand-blue)]/90 transition-colors"
            >
              <Eye size={14} />
              <span>Lihat Semua (+{remainingCount})</span>
            </motion.button>
          )}
        </div>
      </div>

      {/* POPUP MODAL UNTUK LIHAT SEMUA */}
      <AnimatePresence>
        {showAllModal && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 20, opacity: 0 }}
              className="cartoon-card bg-[var(--card-bg)] !p-6 md:!p-8 max-w-lg w-full relative z-[121]"
            >
              <div className="flex items-center justify-between mb-6 border-b-4 border-[var(--border-color)] border-dashed pb-4">
                <div className="bg-[var(--brand-blue)] cartoon-border px-4 py-1.5 rounded-xl cartoon-shadow-sm inline-block rotate-[-2deg]">
                  <h4 className="text-[10px] md:text-xs font-heading uppercase text-white tracking-widest flex items-center gap-2">
                    <Eye size={12} /> Semua Pilihan ({options.length})
                  </h4>
                </div>
                <button 
                  onClick={() => setShowAllModal(false)}
                  className="cartoon-button bg-[var(--cartoon-pink)] text-[var(--brand-blue)] !p-2 rounded-full font-heading"
                >
                  <X size={18} />
                </button>
              </div>

              {/* LIST MENU */}
              <div className="max-h-[350px] overflow-y-auto pr-2 space-y-3 scrollbar-thin">
                <AnimatePresence mode="popLayout" initial={false}>
                  {options.map((opt, i) => (
                    <motion.div
                      key={`${opt}-${i}`}
                      layout
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      className="flex items-center justify-between p-3 bg-[var(--bg-color)] cartoon-border rounded-xl cartoon-shadow-sm font-heading text-xs md:text-sm"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="w-6 h-6 rounded-full bg-[var(--cartoon-yellow)] text-[var(--text-main)] cartoon-border-sm flex items-center justify-center text-[10px] font-black shrink-0">
                          {i + 1}
                        </span>
                        <span className="truncate text-[var(--text-main)]">{opt}</span>
                      </div>
                      <button 
                        onClick={() => {
                          removeOption(i);
                          // If length drops below or equal to 5, we can close the modal
                          if (options.length <= 6) { 
                            // Because state change will make it 5 or less
                            setTimeout(() => {
                              if (options.length <= 6) setShowAllModal(false);
                            }, 10);
                          }
                        }} 
                        className="p-1 text-[var(--text-main)]/60 hover:text-[var(--cartoon-pink)] transition-colors"
                      >
                        <X size={16} />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {options.length === 0 && (
                  <div className="text-center py-10">
                    <p className="text-xs font-display text-[var(--text-main)]/40">Daftar pilihan kosong.</p>
                  </div>
                )}
              </div>

              <div className="mt-6 flex gap-3">
                <button 
                  onClick={() => {
                    clearAll();
                    setShowAllModal(false);
                  }}
                  className="flex-1 cartoon-button bg-[var(--cartoon-pink)] text-[var(--brand-blue)] uppercase font-heading text-xs !py-3"
                >
                  <Trash2 size={14} /> Hapus Semua
                </button>
                <button 
                  onClick={() => setShowAllModal(false)}
                  className="flex-1 cartoon-button bg-[var(--brand-blue)] text-white uppercase font-heading text-xs !py-3"
                >
                  Tutup
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

