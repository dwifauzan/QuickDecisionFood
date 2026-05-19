import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { APIProvider } from '@vis.gl/react-google-maps';

import { GOOGLE_MAPS_KEY } from '../constants/config';
import { useDecisionLogic } from '../hooks/useDecisionLogic';
import { validateBudget } from '../features/logic_budget';

import { Header } from './QuickFoodUI/Header';
import { MainControls } from './QuickFoodUI/MainControls';
import { OptionsList } from './QuickFoodUI/OptionsList';
import { SettingsBar } from './QuickFoodUI/SettingsBar';
import { ResultView } from './QuickFoodUI/ResultView';
import { AlertModal } from './ui/AlertModal';
import { ConfirmModal } from './ui/ConfirmModal';

type Step = 'LANDING' | 'SELECTION' | 'RESULT';

export default function QuickFoodUI() {
  const {
    userLocation, setUserLocation,
    loading, error, setError,
    result, setResult,
    processDecision
  } = useDecisionLogic();

  const [step, setStep] = useState<Step>('LANDING');
  const [options, setOptions] = useState<string[]>([]);
  const [newOption, setNewOption] = useState('');
  const [budget, setBudget] = useState('');
  const [context, setContext] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState<'MAKANAN_SAJA' | 'MINUMAN_SAJA' | 'KEDUANYA' | null>(null);
  
  const [isHealthyMode, setIsHealthyMode] = useState(false);
  const [isFastMode, setIsFastMode] = useState(false);
  const [isInstaMode, setIsInstaMode] = useState(false);
  const [isOptimizationEnabled, setIsOptimizationEnabled] = useState(true);
  
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const resetAll = () => {
    setStep('LANDING');
    setOptions([]);
    setResult(null);
    setCategory(null);
    setSearchQuery('');
  };

  const handleDecision = () => {
    if (options.length === 0) {
      setError('Pilihannya masih kosong nih, isi minimal satu ya!');
      return;
    }
    setStep('RESULT');
    processDecision({
      options, category, budget, context,
      isHealthy: isHealthyMode,
      isFast: isFastMode,
      isInsta: isInstaMode,
      isOptimizationEnabled
    });
  };

  const handleDirectSearch = (query: string) => {
    if (!query.trim()) return;
    setOptions([query]);
    setCategory('KEDUANYA');
    setStep('RESULT');
    processDecision({
      options: [query], category: 'KEDUANYA', budget, context,
      isHealthy: isHealthyMode, isFast: isFastMode, isInsta: isInstaMode,
      isOptimizationEnabled
    });
  };

  const selectQuickstartCategory = (cat: 'MAKANAN_SAJA' | 'MINUMAN_SAJA' | 'KEDUANYA') => {
    setCategory(cat);
    if (cat === 'MAKANAN_SAJA') setOptions(['Nasi Padang', 'Mie Ayam', 'Bakso', 'Sate Ayam', 'Ayam Bakar']);
    else if (cat === 'MINUMAN_SAJA') setOptions(['Es Teh Manis', 'Es Jeruk', 'Kopi Sosis', 'Jus Alpukat', 'Soda Gembira']);
    else setOptions(['Nasi Goreng + Es Teh', 'Ayam Penyet + Es Jeruk', 'Burger + Cola', 'Mie Instan + Susu']);
    setStep('SELECTION');
  };

  return (
    <APIProvider apiKey={GOOGLE_MAPS_KEY}>
      <div className="relative min-h-screen w-full overflow-x-hidden font-sans text-[var(--text-main)] transition-colors duration-500 selection:bg-[var(--brand-blue)]/30">
        
        <div className="fixed inset-0 pointer-events-none z-0 opacity-10">
          <motion.img 
            initial={{ opacity: 0, scale: 0.8, rotate: 15 }}
            animate={{ opacity: 1, scale: 1, rotate: 10 }}
            src="/src/assets/images/noodle_satay_bg_1779187560508.png" 
            className="absolute -bottom-24 -right-24 w-[35rem] md:w-[65rem]" 
            alt="background"
            referrerPolicy="no-referrer"
          />
        </div>

        <div className="relative z-10 flex flex-col min-h-screen">
          <Header onReset={resetAll} showReset={step !== 'LANDING'} />

          <main className="flex-1 flex flex-col px-6 md:px-12 max-w-6xl mx-auto w-full pb-10 pt-6">
            <AnimatePresence mode="wait">
              {step === 'LANDING' && (
                <MainControls 
                  onDirectSearch={handleDirectSearch}
                  onCategorySelect={selectQuickstartCategory}
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  userLocation={userLocation}
                  requestLocation={() => {}}
                />
              )}

              {step === 'SELECTION' && (
                <motion.div key="selection" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative pb-10">
                  <div className="lg:col-span-8">
                    <div className="cartoon-card bg-[var(--bg-color)] !p-5 md:!p-10">
                      <OptionsList 
                        options={options} newOption={newOption} setNewOption={setNewOption}
                        addOption={() => {
                          const val = newOption.trim();
                          if (options.some(o => o.toLowerCase() === val.toLowerCase())) setAlertMessage(`"${val}" sudah ada!`);
                          else if (val) setOptions([...options, val]);
                          setNewOption('');
                        }}
                        removeOption={(i) => setOptions(options.filter((_, idx) => idx !== i))}
                        clearAll={() => setShowClearConfirm(true)}
                        category={category} userLocation={userLocation} setUserLocation={setUserLocation}
                        setAlertMessage={setAlertMessage} setOptions={setOptions}
                      />
                      
                      <div className="mt-12 flex justify-center">
                        <button onClick={handleDecision} disabled={loading} className="cartoon-button bg-[var(--brand-blue)] text-white !px-12 !py-5 text-xl w-full cartoon-shadow-lg">
                          CEK KEPUTUSAN AI
                        </button>
                      </div>
                    </div>
                  </div>

                  <SettingsBar 
                    budget={budget} handleBudgetChange={(e) => setBudget(validateBudget(e.target.value))}
                    context={context} setContext={setContext}
                    isHealthyMode={isHealthyMode} setIsHealthyMode={setIsHealthyMode}
                    isFastMode={isFastMode} setIsFastMode={setIsFastMode}
                    isInstaMode={isInstaMode} setIsInstaMode={setIsInstaMode}
                    isOptimizationEnabled={isOptimizationEnabled} setIsOptimizationEnabled={setIsOptimizationEnabled}
                  />
                </motion.div>
              )}

              {step === 'RESULT' && (
                <div key="result">
                  {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-6">
                      <div className="w-20 h-20 bg-[var(--brand-blue)] cartoon-border rounded-[2rem] flex items-center justify-center animate-bounce shadow-2xl">
                         <div className="w-10 h-10 border-4 border-white border-t-transparent rounded-full animate-spin" />
                      </div>
                      <p className="text-xl font-heading text-[var(--text-main)] animate-pulse uppercase tracking-[0.2em]">Quickfood Menghitung...</p>
                    </div>
                  ) : result ? (
                    <ResultView result={result} userLocation={userLocation} onReset={() => setStep('SELECTION')} />
                  ) : (
                    <div className="text-center py-20"><p className="text-red-500 font-heading">{error}</p></div>
                  )}
                </div>
              )}
            </AnimatePresence>
          </main>
        </div>

        <AlertModal message={alertMessage} onClose={() => setAlertMessage(null)} />
        <ConfirmModal isOpen={showClearConfirm} message="Apakah kamu yakin ingin menghapus semua pilihan makanan?" onConfirm={() => { setOptions([]); setShowClearConfirm(false); }} onCancel={() => setShowClearConfirm(false)} />
      </div>
    </APIProvider>
  );
}
