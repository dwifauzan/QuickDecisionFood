import React from 'react';
import { motion } from 'motion/react';
import { 
  Navigation, RefreshCcw, Heart, Camera, 
  MapPin, Sparkles, ChefHat, Pizza, Coffee, Clock
} from 'lucide-react';
import { WinnerMap } from './WinnerMap';
import { ParsedDecision } from '../../utils/parser';
import { getMapsSearchUrl } from '../../features/logic_maps';

interface ResultViewProps {
  result: ParsedDecision;
  userLocation: google.maps.LatLngLiteral | null;
  onReset: () => void;
}

const itemVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.9 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { type: "spring", stiffness: 300, damping: 20 }
  }
};

export function ResultView({ result, userLocation, onReset }: ResultViewProps) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      className="max-w-4xl mx-auto w-full pb-10"
    >
      <div className="cartoon-card !p-6 md:!p-10 relative bg-[var(--card-bg)]">
        <div className="flex flex-col items-center text-center">
          
          <motion.div variants={itemVariants} className="mb-6 md:mb-8 p-6 md:p-8 bg-[var(--brand-blue)]/5 cartoon-border-sm cartoon-shadow-sm rounded-[2rem] md:rounded-[3rem] w-full flex flex-col items-center">
            <div className="bg-[var(--cartoon-pink)] cartoon-border px-4 py-1.5 rounded-full cartoon-shadow-sm inline-block rotate-[-2deg] mb-6">
              <h3 className="text-[10px] font-heading uppercase text-[var(--brand-blue)] tracking-widest">Keputusan AI QuickFood</h3>
            </div>
            
            <h1 className="text-4xl md:text-7xl font-heading mb-6 text-[var(--text-main)] uppercase text-pop leading-tight">
              {result.name}
            </h1>
            
            <p className="text-lg md:text-2xl font-display text-[var(--text-main)]/80 italic mb-8 max-w-2xl px-4 leading-relaxed">
              "{result.reason}"
            </p>

            <div className="flex flex-wrap justify-center gap-3">
              {result.tags.map((tag, i) => (
                <div key={i} className="px-4 py-2 bg-[var(--card-bg)] cartoon-border rounded-full text-[10px] md:text-xs font-heading cartoon-shadow-sm uppercase">
                  🏷️ {tag}
                </div>
              ))}
            </div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mb-10">
            {result.urgencyStatus && (
              <motion.div variants={itemVariants} className="cartoon-card !p-6 bg-[var(--cartoon-yellow)]/10 flex flex-col items-center border-[var(--cartoon-yellow)]">
                <div className="w-12 h-12 bg-[var(--cartoon-yellow)] cartoon-border rounded-xl flex items-center justify-center mb-4 cartoon-shadow-sm">
                  <Clock size={24} className="text-[var(--text-main)]" />
                </div>
                <span className="text-[9px] font-heading uppercase text-[var(--text-main)] opacity-50 mb-1">Status Kecepatan</span>
                <span className="text-xs font-black uppercase text-[var(--text-main)]">{result.urgencyStatus}</span>
              </motion.div>
            )}

            {result.healthySwitch && (
              <motion.div variants={itemVariants} className="cartoon-card !p-6 bg-[var(--cartoon-green)]/10 flex flex-col items-center border-[var(--cartoon-green)]">
                <div className="w-12 h-12 bg-[var(--cartoon-green)] cartoon-border rounded-xl flex items-center justify-center mb-4 cartoon-shadow-sm">
                  <Heart size={24} className="text-white" />
                </div>
                <span className="text-[9px] font-heading uppercase text-[var(--text-main)] opacity-50 mb-1">Healthy Switch</span>
                <p className="text-[10px] font-bold text-[var(--text-main)] leading-relaxed">{result.healthySwitch}</p>
              </motion.div>
            )}

            {result.instaVibe && (
              <motion.div variants={itemVariants} className="cartoon-card !p-6 bg-[var(--cartoon-pink)]/10 flex flex-col items-center border-[var(--cartoon-pink)]">
                <div className="w-12 h-12 bg-[var(--cartoon-pink)] cartoon-border rounded-xl flex items-center justify-center mb-4 cartoon-shadow-sm">
                  <Camera size={24} className="text-[var(--brand-blue)]" />
                </div>
                <span className="text-[9px] font-heading uppercase text-[var(--text-main)] opacity-50 mb-1">Insta Vibe Tips</span>
                <p className="text-[10px] font-bold text-[var(--text-main)] leading-relaxed">{result.instaVibe}</p>
              </motion.div>
            )}
          </div>

          <motion.div variants={itemVariants} className="w-full">
            <div className="flex items-center justify-between mb-4 px-4">
              <span className="text-xs font-heading text-[var(--text-main)] uppercase opacity-60">Lokasi Rekomendasi:</span>
              <div className="bg-[var(--brand-blue)]/5 px-4 py-1.5 rounded-full flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[var(--brand-blue)] animate-pulse" />
                <span className="text-[10px] font-heading text-[var(--brand-blue)] uppercase tracking-widest">Mencari di Sekitar...</span>
              </div>
            </div>
            <div className="w-full cartoon-border cartoon-shadow-sm overflow-hidden h-[350px] md:h-[450px] rounded-[2rem] md:rounded-[3rem] bg-[var(--bg-color)]">
              <WinnerMap winnerName={result.mapsQuery} userLocation={userLocation} />
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="mt-12 flex flex-col sm:flex-row gap-4 w-full">
            <a 
              href={getMapsSearchUrl(result.mapsQuery)} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex-[2] cartoon-button bg-[var(--brand-blue)] text-white w-full uppercase font-heading text-base !py-5 cartoon-shadow-lg scale-100 hover:scale-102"
            >
              <Navigation size={24} className="fill-white" /> BUKA DI GOOGLE MAPS
            </a>
            <button 
              onClick={onReset}
              className="flex-1 cartoon-button bg-[var(--bg-color)] text-[var(--text-main)] w-full uppercase font-heading text-base !py-5 border-4 border-[var(--border-color)]"
            >
              <RefreshCcw size={20} /> COBA LAGI
            </button>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
