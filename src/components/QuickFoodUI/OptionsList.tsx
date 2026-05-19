import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, X, Trash2 } from 'lucide-react';
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
        <div className="flex flex-wrap gap-2 md:gap-3">
          <AnimatePresence mode="popLayout">
            {options.map((opt, i) => (
              <motion.div
                key={`${opt}-${i}`}
                layout
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1, rotate: (i % 2 === 0 ? 1 : -1) }}
                exit={{ opacity: 0, scale: 0 }}
                className="flex items-center gap-2 px-4 py-2 bg-[var(--card-bg)] cartoon-border rounded-full text-[10px] md:text-sm font-heading cartoon-shadow-sm group"
              >
                <span className="max-w-[120px] md:max-w-[150px] truncate">{opt}</span>
                <button onClick={() => removeOption(i)} className="text-[var(--text-main)] hover:text-[var(--brand-blue)]">
                  <X size={14} />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
