import React from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface ConfirmModalProps {
  isOpen: boolean;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({ isOpen, message, onConfirm, onCancel }: ConfirmModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.9, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 20, opacity: 0 }}
            className="cartoon-card bg-[var(--card-bg)] !p-8 max-w-sm w-full relative z-[111]"
          >
            <div className="bg-[var(--brand-blue)] cartoon-border px-4 py-1.5 rounded-xl cartoon-shadow-sm inline-block rotate-[-2deg] mb-6">
               <h4 className="text-[10px] font-heading uppercase text-white tracking-widest">Konfirmasi</h4>
            </div>
            <p className="text-sm md:text-base font-display text-[var(--text-main)] mb-8 leading-relaxed text-center">
              {message}
            </p>
            <div className="flex gap-3">
              <button 
                onClick={onConfirm}
                className="flex-1 cartoon-button bg-[var(--cartoon-orange)] text-white uppercase font-heading text-xs !py-3"
              >
                Ya, Hapus
              </button>
              <button 
                onClick={onCancel}
                className="flex-1 cartoon-button bg-[var(--card-bg)] text-[var(--text-main)] uppercase font-heading text-xs !py-3"
              >
                Tidak
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
