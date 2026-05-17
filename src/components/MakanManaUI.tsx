import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { motion, AnimatePresence } from 'motion/react';
import { 
  Utensils, Wallet, Wind, Sparkles, Plus, X, 
  ChevronRight, Loader2, MapPin, RefreshCcw, 
  Thermometer, CloudRain, Navigation, History,
  Info, Map as MapIcon, Heart, Camera, Sun, Moon
} from 'lucide-react';
import { APIProvider, useMapsLibrary, Map, AdvancedMarker, useMap } from '@vis.gl/react-google-maps';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const GOOGLE_MAPS_KEY = process.env.GOOGLE_MAPS_PLATFORM_KEY || '';
const hasValidMapsKey = Boolean(GOOGLE_MAPS_KEY) && GOOGLE_MAPS_KEY !== 'YOUR_API_KEY';

const SYSTEM_PROMPT = `Anda adalah "MakanMana AI Engine". Tugas Anda adalah memberikan keputusan kuliner yang diproses ke dalam struktur data yang sangat rapi untuk UI modern.

STRUKTUR OUTPUT (WAJIB KAKU):
Gunakan format label di bawah ini agar sistem dapat memetakan elemen ke dalam komponen UI secara presisi:

[TITLE]
(Tuliskan Nama Makanan Utama dalam Huruf Kapital + Ikon Emoji yang relevan)

[REASON]
(Tuliskan 1-2 kalimat alasan yang elegan dan persuasif. Mulai dengan tanda kutip "...")

[DYNAMIC_TAGS]
(Berikan 3 tag singkat dengan format: 🏷️ Label | 🏷️ Label | 🏷️ Label)

[HEALTHY_CARD]
(Gunakan ikon 🍃. Berikan 1 tips modifikasi sehat yang spesifik)

[INSTA_VIBE_CARD]
(Gunakan ikon 📸. Berikan analisis visual dan tips sudut pandang foto/lighting)

[URGENCY_STATUS]
(Gunakan ikon ⏱️. Berikan status kecepatan penyajian: CEPAT/SEDANG/LAMA)

[MAPS_LINK]
(Kata kunci pencarian Google Maps)

GAYA BAHASA:
Informatif, berkelas, namun tetap santai. Hindari kalimat pembuka seperti "Berdasarkan pilihan Anda...". Langsung ke hasil keputusan.`;

const WEATHER_CODES: Record<number, string> = {
  0: 'Cerah', 1: 'Cerah Berawan', 2: 'Berawan', 3: 'Mendung',
  45: 'Berkabut', 48: 'Kabut Berembun',
  51: 'Gerimis', 53: 'Gerimis', 55: 'Gerimis Lebat',
  61: 'Hujan Ringan', 63: 'Hujan', 65: 'Hujan Lebat',
  80: 'Hujan Shower', 95: 'Badai Petir'
};

function WinnerMap({ winnerName, userLocation }: { winnerName: string, userLocation: google.maps.LatLngLiteral | null }) {
  const map = useMap();
  const placesLib = useMapsLibrary('places');
  const [winnerPlace, setWinnerPlace] = useState<google.maps.places.Place | null>(null);

  useEffect(() => {
    if (!placesLib || !map || !winnerName || !userLocation) return;
    
    const searchTerm = winnerName.split('+')[0].trim();

    placesLib.Place.searchByText({
      textQuery: searchTerm,
      fields: ['displayName', 'location', 'formattedAddress'],
      locationBias: { center: userLocation, radius: 5000 },
      maxResultCount: 1,
    }).then(({ places }) => {
      if (places && places[0]) {
        setWinnerPlace(places[0]);
        if (places[0].location) {
          map.panTo(places[0].location);
          map.setZoom(16);
        }
      }
    }).catch(err => console.error('Error finding winner place:', err));
  }, [placesLib, map, winnerName, userLocation]);

  return (
    <div className="w-full h-80 rounded-3xl border border-slate-100 mt-6 relative bg-slate-50 overflow-hidden group shadow-inner">
      <Map
        defaultCenter={userLocation || { lat: -6.2, lng: 106.8 }}
        defaultZoom={13}
        mapId="makanmana_minimal_map"
        gestureHandling={'greedy'}
        disableDefaultUI={true}
        internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
        style={{ width: '100%', height: '100%' }}
      >
        {winnerPlace?.location && (
          <AdvancedMarker position={winnerPlace.location}>
            <div className="bg-brand-blue text-white px-4 py-2.5 rounded-full font-bold text-sm shadow-2xl flex items-center gap-2 max-w-[180px] md:max-w-xs border-2 border-white scale-100 hover:scale-105 transition-transform">
              <Navigation size={14} className="fill-white shrink-0" />
              <span className="truncate">
                {typeof winnerPlace.displayName === 'string' 
                  ? winnerPlace.displayName 
                  : (winnerPlace.displayName as any)?.text || (winnerPlace.displayName as any)?.toString()}
              </span>
            </div>
          </AdvancedMarker>
        )}
      </Map>
      <div className="absolute inset-0 pointer-events-none border-[8px] border-white/50 rounded-3xl" />
      {winnerPlace && (
        <div className="absolute bottom-6 left-6 right-6 bg-white/90 backdrop-blur-md border border-slate-100 p-4 rounded-2xl text-xs font-semibold shadow-xl z-10 flex items-start gap-3 transform translate-y-0 group-hover:-translate-y-1 transition-transform duration-500">
          <div className="bg-brand-blue/10 p-2 rounded-lg">
            <MapPin size={16} className="text-brand-blue" />
          </div>
          <div className="flex flex-col gap-0.5 min-w-0 flex-1">
            <span className="text-slate-400 uppercase text-[9px] tracking-widest font-black shrink-0">Alamat Lokasi</span>
            <span className="text-slate-900 leading-snug line-clamp-2 break-words">{winnerPlace.formattedAddress}</span>
          </div>
        </div>
      )}
    </div>
  );
}

function MapsIntegration({ onPlacesFound, onLocationUpdate, category }: { 
  onPlacesFound: (places: string[]) => void, 
  onLocationUpdate: (loc: google.maps.LatLngLiteral) => void,
  category: 'MAKANAN_SAJA' | 'MINUMAN_SAJA' | 'KEDUANYA' | null
}) {
  const placesLib = useMapsLibrary('places');
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const findNearby = () => {
    if (!placesLib) return;
    setLoading(true);
    setApiError(null);
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const center = { lat: position.coords.latitude, lng: position.coords.longitude };
        onLocationUpdate(center);

        try {
          // Filter types based on category
          let includedTypes = ['restaurant', 'cafe', 'bakery', 'meal_takeaway'];
          if (category === 'MAKANAN_SAJA') includedTypes = ['restaurant', 'bakery', 'meal_takeaway'];
          if (category === 'MINUMAN_SAJA') includedTypes = ['cafe', 'bar'];

          const { places } = await placesLib.Place.searchNearby({
            fields: ['displayName', 'id'],
            locationRestriction: { center, radius: 2000 },
            includedPrimaryTypes: includedTypes,
            maxResultCount: 20
          });

          if (places && places.length > 0) {
            const placeNames = places
              .map(p => {
                const dn = p.displayName;
                if (typeof dn === 'string') return dn;
                return (dn as any)?.text || (dn as any)?.toString() || '';
              })
              .filter((n): n is string => Boolean(n));
            
            onPlacesFound(placeNames);
          } else {
            alert('Tidak ditemukan tempat makan atau minum di sekitar lokasi Anda.');
          }
        } catch (err: any) {
          console.error(err);
          if (err.message?.includes('PERMISSION_DENIED')) setApiError('NOT_ACTIVATED');
        } finally {
          setLoading(false);
        }
      },
      () => {
        setLoading(false);
        alert('Izin lokasi diperlukan untuk mencari di sekitar.');
      },
      { enableHighAccuracy: true }
    );
  };

  return (
    <div className="relative">
      <button 
        onClick={findNearby}
        disabled={loading || !placesLib}
        className="flex items-center gap-2 text-xs font-semibold px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full transition-all disabled:opacity-50"
      >
        {loading ? <RefreshCcw className="animate-spin h-3.5 w-3.5" /> : <MapPin className="h-3.5 w-3.5 text-brand-blue" />}
        Auto Cari Sekitar
      </button>

      <AnimatePresence>
        {apiError === 'NOT_ACTIVATED' && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="absolute top-full left-0 md:right-0 md:left-auto mt-3 w-[calc(100vw-4rem)] md:w-72 bg-white dark:bg-vibe-card border border-vibe-glow rounded-2xl p-6 shadow-2xl z-50 overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-1.5 h-full bg-red-500" />
            <h4 className="text-sm font-black text-vibe-text mb-2 uppercase tracking-tight">Places API Belum Aktif</h4>
            <p className="text-xs text-slate-500 mb-5 leading-relaxed">Fitur ini membutuhkan aktivasi "Places API (New)" di Google Cloud Console.</p>
            <a 
              href="https://console.developers.google.com/apis/api/places.googleapis.com/overview" 
              target="_blank" rel="noopener"
              className="block w-full py-3 bg-vibe-accent text-white text-center text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-slate-900 transition-colors shadow-lg shadow-vibe-accent/20"
            >
              Aktifkan Sekarang
            </a>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

type Step = 'LANDING' | 'SELECTION' | 'RESULT';

function CinematicBackground({ step, isDark }: { step: Step, isDark: boolean }) {
  const images = {
    LANDING: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=2070&auto=format&fit=crop",
    SELECTION: "https://images.unsplash.com/photo-1490818387583-1baba5e638af?q=80&w=2064&auto=format&fit=crop",
    RESULT: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=1974&auto=format&fit=crop"
  };

  return (
    <div className="cinematic-bg">
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.5 }}
          className="absolute inset-0"
        >
          <img 
            src={images[step]} 
            className="w-full h-full object-cover ken-burns" 
            alt="background"
            referrerPolicy="no-referrer"
          />
          <div className={`absolute inset-0 bg-gradient-to-b ${isDark ? 'from-black/80 via-black/40 to-black/90' : 'from-black/60 via-black/20 to-black/80'} transition-colors duration-1000`} />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export default function MakanManaUI() {
  const [step, setStep] = useState<Step>('LANDING');
  const [options, setOptions] = useState<string[]>([]);
  const [newOption, setNewOption] = useState('');
  const [budget, setBudget] = useState<string>('');
  const [context, setContext] = useState('');
  const [temperature, setTemperature] = useState<number>(28);
  const [weather, setWeather] = useState('Mendeteksi...');
  const [userLocation, setUserLocation] = useState<google.maps.LatLngLiteral | null>(null);
  const [result, setResult] = useState<{ 
    name: string; 
    reason: string; 
    tags: string[]; 
    mapsQuery: string; 
    healthySwitch?: string; 
    instaVibe?: string;
    urgencyStatus?: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [category, setCategory] = useState<'MAKANAN_SAJA' | 'MINUMAN_SAJA' | 'KEDUANYA' | null>(null);
  const [isHealthyMode, setIsHealthyMode] = useState(false);
  const [isFastMode, setIsFastMode] = useState(false);
  const [isInstaMode, setIsInstaMode] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  useEffect(() => {
    // Automatically use dark mode for cinematic feel
    document.documentElement.classList.add('dark');
  }, []);

  useEffect(() => {
    if (!userLocation) return;
    fetch(`https://api.open-meteo.com/v1/forecast?latitude=${userLocation.lat}&longitude=${userLocation.lng}&current=temperature_2m,weather_code`)
      .then(res => res.json())
      .then(data => {
        setTemperature(Math.round(data.current.temperature_2m));
        setWeather(WEATHER_CODES[data.current.weather_code] || 'Cerah');
      })
      .catch(() => setWeather('Cerah'));
  }, [userLocation]);

  const addOption = () => {
    const val = newOption.trim();
    if (val && !options.includes(val)) {
      setOptions([...options, val]);
      setNewOption('');
    }
  };

  const removeOption = (index: number) => {
    setOptions(options.filter((_, i) => i !== index));
  };

  const handleBudgetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '');
    setBudget(val ? new Intl.NumberFormat('en-US').format(parseInt(val)) : '');
  };

  const handleDecision = async () => {
    if (options.length === 0) {
      setError('Masukkan pilihan makanan dulu.');
      return;
    }
    setLoading(true);
    setError('');
    
    try {
      const healthyContext = isHealthyMode ? "\nCATATAN: Berikan tips Healthy Switch." : "\nCATATAN: Abaikan Healthy_Switch.";
      const fastContext = isFastMode ? "\nURGENSI: Sangat Tinggi." : "\nURGENSI: Normal.";
      const instaContext = isInstaMode ? "\nAESTHETIC MODE: Aktif." : "\nAESTHETIC MODE: Mati.";
      const prompt = `Pilihan: ${options.join(', ')}\n${budget ? `Budget: Rp ${budget}` : ''}\n${context ? `Konteks: ${context}` : ''}\nSuhu: ${temperature}°C\nWeather: ${weather}\nKATEGORI: ${category || 'KEDUANYA'}${healthyContext}${fastContext}${instaContext}`;
      
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: { systemInstruction: SYSTEM_PROMPT, temperature: 0.7 },
      });

      const text = response.text || '';
      const cleanText = (t: string) => t.replace(/\*\*|\*|#|__|🏷️|🍃|📸|⏱️/g, '').replace(/\[|\]/g, '').trim();
      const lines = text.split('\n').filter(l => l.trim());
      
      let name = '', reason = '', tags: string[] = [], mapsQuery = '', healthySwitch = '', instaVibe = '', urgencyStatus = '';
      let currentSection = '';

      lines.forEach(line => {
        const trimmed = line.trim();
        const upper = trimmed.toUpperCase();
        if (upper === '[TITLE]') { currentSection = 'title'; return; }
        if (upper === '[REASON]') { currentSection = 'reason'; return; }
        if (upper === '[DYNAMIC_TAGS]') { currentSection = 'tags'; return; }
        if (upper === '[HEALTHY_CARD]') { currentSection = 'healthy'; return; }
        if (upper === '[INSTA_VIBE_CARD]') { currentSection = 'insta'; return; }
        if (upper === '[URGENCY_STATUS]') { currentSection = 'urgency'; return; }
        if (upper === '[MAPS_LINK]') { currentSection = 'maps'; return; }

        if (currentSection === 'title') name = (name + ' ' + trimmed).trim();
        else if (currentSection === 'reason') reason = (reason + ' ' + trimmed).trim();
        else if (currentSection === 'tags') tags.push(...trimmed.split('|').map(p => cleanText(p)).filter(p => p));
        else if (currentSection === 'healthy') healthySwitch = (healthySwitch + ' ' + cleanText(trimmed)).trim();
        else if (currentSection === 'insta') instaVibe = (instaVibe + ' ' + cleanText(trimmed)).trim();
        else if (currentSection === 'urgency') urgencyStatus = (urgencyStatus + ' ' + cleanText(trimmed)).trim();
        else if (currentSection === 'maps') mapsQuery = (mapsQuery + ' ' + cleanText(trimmed)).trim();
      });

      setResult({ 
        name: cleanText(name), 
        reason: reason.replace(/^"|"$/g, ''), 
        tags, mapsQuery, 
        healthySwitch: healthySwitch && healthySwitch.toLowerCase() !== 'n/a' ? healthySwitch : undefined, 
        instaVibe: instaVibe && instaVibe.toLowerCase() !== 'n/a' ? instaVibe : undefined,
        urgencyStatus
      });
      setStep('RESULT');
    } catch (err) {
      setError('Gagal memproses keputusan. Coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const selectQuickstartCategory = (cat: 'MAKANAN_SAJA' | 'MINUMAN_SAJA' | 'KEDUANYA') => {
    setCategory(cat);
    if (cat === 'MAKANAN_SAJA') setOptions(['Nasi Padang', 'Mie Ayam', 'Bakso', 'Sate Ayam', 'Ayam Bakar']);
    else if (cat === 'MINUMAN_SAJA') setOptions(['Es Teh Manis', 'Es Jeruk', 'Kopi Susu', 'Jus Alpukat', 'Soda Gembira']);
    else setOptions(['Nasi Goreng + Es Teh', 'Ayam Penyet + Es Jeruk', 'Burger + Cola', 'Mie Instan + Susu', 'Sate + Jus Alpukat']);
  };

  if (!hasValidMapsKey) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6 text-white">
        <div className="glass-card p-10 rounded-[2.5rem] max-w-md w-full text-center">
          <MapIcon className="text-brand-blue mx-auto mb-6" size={48} />
          <h2 className="text-3xl font-black mb-4">Konfigurasi Maps</h2>
          <p className="text-white/60 mb-8">Tambah <code>GOOGLE_MAPS_PLATFORM_KEY</code> ke Secrets.</p>
        </div>
      </div>
    );
  }

  return (
    <APIProvider apiKey={GOOGLE_MAPS_KEY}>
      <div className="relative min-h-screen w-full overflow-x-hidden font-sans text-white bg-black selection:bg-brand-blue">
        <CinematicBackground step={step} isDark={theme === 'dark'} />

        {/* OVERLAY CONTENT */}
        <div className="relative z-10 flex flex-col min-h-screen">
          
          {/* TOP NAV */}
          <nav className="h-20 px-6 md:px-12 flex items-center justify-between pointer-events-auto">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => setStep('LANDING')}>
              <div className="w-10 h-10 bg-brand-blue rounded-xl flex items-center justify-center shadow-lg shadow-brand-blue/30">
                <Utensils size={20} />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl font-black tracking-tighter leading-none">MAKANMANA</h1>
                <span className="text-[10px] font-bold text-brand-blue tracking-[0.3em] uppercase">Decision Engine</span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {step !== 'LANDING' && (
                <button 
                  onClick={() => setStep('LANDING')}
                  className="glass-button px-5 py-2 rounded-full text-xs font-black uppercase tracking-widest flex items-center gap-2"
                >
                  <RefreshCcw size={14} /> Reset
                </button>
              )}
            </div>
          </nav>

          <main className="flex-1 flex flex-col px-6 md:px-12 max-w-7xl mx-auto w-full pb-20 pt-10">
            <AnimatePresence mode="wait">
              
              {/* 1. LANDING STEP */}
              {step === 'LANDING' && (
                <motion.div
                  key="landing"
                  initial={{ opacity: 0, scale: 0.95, y: 30 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 1.05, y: -20 }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="flex-1 flex flex-col justify-center items-center text-center py-12"
                >
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="mb-6 flex items-center gap-3 px-6 py-2 bg-brand-blue/20 backdrop-blur-xl border border-brand-blue/30 rounded-full"
                  >
                    <Sparkles size={16} className="text-brand-blue" />
                    <span className="text-xs font-black uppercase tracking-[0.2em] text-brand-blue">AI-Powered Decisions</span>
                  </motion.div>

                  <h2 className="text-6xl md:text-8xl lg:text-9xl font-black tracking-tighter leading-[0.9] mb-8 text-glow">
                    BINGUNG <br />
                    <span className="text-brand-blue">MAKAN MANA?</span>
                  </h2>
                  
                  <p className="max-w-2xl text-lg md:text-xl text-white/50 mb-12 font-medium leading-relaxed italic">
                    "Pilih kategori untuk memulai navigasi rasa Anda."
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-4xl">
                    <button
                      onClick={() => { selectQuickstartCategory('MAKANAN_SAJA'); setStep('SELECTION'); }}
                      className="group relative px-8 py-10 bg-white/5 border border-white/10 rounded-[2.5rem] font-black uppercase tracking-[0.2em] transition-all hover:bg-brand-blue hover:scale-105 active:scale-95 shadow-2xl"
                    >
                      <div className="flex flex-col items-center gap-4">
                        <span className="text-4xl">🍔</span>
                        <span className="text-sm">Makanan Saja</span>
                      </div>
                    </button>

                    <button
                      onClick={() => { selectQuickstartCategory('MINUMAN_SAJA'); setStep('SELECTION'); }}
                      className="group relative px-8 py-10 bg-white/5 border border-white/10 rounded-[2.5rem] font-black uppercase tracking-[0.2em] transition-all hover:bg-brand-blue hover:scale-105 active:scale-95 shadow-2xl"
                    >
                      <div className="flex flex-col items-center gap-4">
                        <span className="text-4xl">🍹</span>
                        <span className="text-sm">Minuman Saja</span>
                      </div>
                    </button>

                    <button
                      onClick={() => { selectQuickstartCategory('KEDUANYA'); setStep('SELECTION'); }}
                      className="group relative px-8 py-10 bg-white/5 border border-white/10 rounded-[2.5rem] font-black uppercase tracking-[0.2em] transition-all hover:bg-brand-blue hover:scale-105 active:scale-95 shadow-2xl"
                    >
                      <div className="flex flex-col items-center gap-4">
                        <span className="text-4xl">✨</span>
                        <span className="text-sm">Mix Keduanya</span>
                      </div>
                    </button>
                  </div>
                </motion.div>
              )}

              {/* 2. SELECTION STEP */}
              {step === 'SELECTION' && (
                <motion.div
                  key="selection"
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
                >
                  {/* Left: Inputs */}
                  <div className="lg:col-span-7 space-y-8">
                    <div className="glass-card rounded-[3rem] p-8 md:p-12">
                      <div className="flex items-center justify-between mb-8">
                        <h3 className="text-sm font-black uppercase tracking-[0.3em] text-white/40">Daftar Pilihan: <span className="text-brand-blue">{category?.replace('_', ' ')}</span></h3>
                        <MapsIntegration 
                          category={category}
                          onLocationUpdate={setUserLocation} 
                          onPlacesFound={(places) => setOptions(prev => [...new Set([...prev, ...places])])} 
                        />
                      </div>

                      <div className="flex gap-2 p-2 bg-white/5 border border-white/10 rounded-full mb-8 focus-within:ring-2 ring-brand-blue/30 transition-all">
                        <input
                          type="text"
                          value={newOption}
                          onChange={(e) => setNewOption(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && addOption()}
                          placeholder="Ketik menu atau tempat idaman..."
                          className="flex-1 bg-transparent px-6 py-3 outline-none text-base font-bold placeholder:text-white/20"
                        />
                        <button 
                          onClick={addOption}
                          className="bg-brand-blue text-white p-4 rounded-full hover:bg-white hover:text-black transition-all"
                        >
                          <Plus size={24} />
                        </button>
                      </div>

                      <div className="flex flex-wrap gap-3 mb-10">
                        <AnimatePresence>
                          {options.map((opt, i) => (
                            <motion.div
                              key={opt}
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.8 }}
                              className="flex items-center gap-3 px-5 py-3 bg-white/5 border border-white/10 rounded-2xl text-sm font-bold group hover:border-brand-blue/50 transition-colors"
                            >
                              <span>{opt}</span>
                              <button onClick={() => removeOption(i)} className="text-white/20 group-hover:text-red-400 transition-colors">
                                <X size={16} />
                              </button>
                            </motion.div>
                          ))}
                        </AnimatePresence>
                        {options.length === 0 && <p className="text-white/20 text-sm font-medium italic">Belum ada pilihan kuliner...</p>}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        <div>
                          <label className="text-[10px] font-black uppercase tracking-widest text-white/30 block mb-3 ml-2">Budget (IDR)</label>
                          <div className="flex items-center gap-4 p-4 glass-button rounded-2xl">
                            <Wallet size={18} className="text-brand-blue" />
                            <input type="text" value={budget} onChange={handleBudgetChange} placeholder="Unlimited" className="bg-transparent outline-none font-bold w-full" />
                          </div>
                        </div>
                        <div>
                          <label className="text-[10px] font-black uppercase tracking-widest text-white/30 block mb-3 ml-2">Cravings / Vibe</label>
                          <div className="flex items-center gap-4 p-4 glass-button rounded-2xl">
                            <Wind size={18} className="text-brand-blue" />
                            <input type="text" value={context} onChange={(e) => setContext(e.target.value)} placeholder="Spicy, cozy..." className="bg-transparent outline-none font-bold w-full" />
                          </div>
                        </div>
                      </div>

                      {/* FEATURE TOGGLES */}
                      <div className="space-y-4 mb-8">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-2">Special Filters</label>
                          <button 
                            onClick={() => { setIsHealthyMode(false); setIsFastMode(false); setIsInstaMode(false); }}
                            className="text-[9px] font-bold text-red-400/60 hover:text-red-400 uppercase tracking-[0.2em] transition-colors"
                          >
                            Disable All Features
                          </button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <button 
                            onClick={() => setIsInstaMode(!isInstaMode)}
                            className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${isInstaMode ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-white/5 border-white/10 text-white/40'}`}
                          >
                            <div className="flex items-center gap-3">
                              <Camera size={16} />
                              <span className="text-xs font-bold uppercase tracking-tight">Aesthetic Photo</span>
                            </div>
                            <div className={`w-3 h-3 rounded-full shadow-lg ${isInstaMode ? 'bg-green-500 shadow-green-500/50' : 'bg-red-500 shadow-red-500/50'}`} />
                          </button>

                          <button 
                            onClick={() => setIsHealthyMode(!isHealthyMode)}
                            className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${isHealthyMode ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-white/5 border-white/10 text-white/40'}`}
                          >
                            <div className="flex items-center gap-3">
                              <Heart size={16} />
                              <span className="text-xs font-bold uppercase tracking-tight">Healthy Food</span>
                            </div>
                            <div className={`w-3 h-3 rounded-full shadow-lg ${isHealthyMode ? 'bg-green-500 shadow-green-500/50' : 'bg-red-500 shadow-red-500/50'}`} />
                          </button>

                          <button 
                            onClick={() => setIsFastMode(!isFastMode)}
                            className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${isFastMode ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-white/5 border-white/10 text-white/40'}`}
                          >
                            <div className="flex items-center gap-3">
                              <Sparkles size={16} />
                              <span className="text-xs font-bold uppercase tracking-tight">Fastfood</span>
                            </div>
                            <div className={`w-3 h-3 rounded-full shadow-lg ${isFastMode ? 'bg-green-500 shadow-green-500/50' : 'bg-red-500 shadow-red-500/50'}`} />
                          </button>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={handleDecision}
                      disabled={loading || options.length === 0}
                      className="w-full bg-brand-blue text-white py-8 rounded-[3rem] font-black uppercase tracking-[0.4em] text-sm shadow-3xl shadow-brand-blue/40 hover:bg-white hover:text-black transition-all active:scale-[0.98] disabled:opacity-30 disabled:cursor-not-allowed group relative overflow-hidden"
                    >
                      <span className="relative z-10 flex items-center justify-center gap-4">
                        {loading ? <Loader2 className="animate-spin" /> : <Sparkles />}
                        {loading ? 'Synthesizing Taste...' : 'Finalize Decision'}
                      </span>
                    </button>
                    {error && <p className="text-red-500 text-center text-xs font-black uppercase tracking-widest">{error}</p>}
                  </div>

                  {/* Right: Atmosphere Panel */}
                  <div className="lg:col-span-5 space-y-6">
                    <div className="glass-card rounded-[3rem] p-10 text-center relative overflow-hidden h-full flex flex-col justify-center">
                      <div className="absolute top-0 right-0 w-64 h-64 bg-brand-blue/10 rounded-full -mr-32 -mt-32 blur-[100px]" />
                      <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em] block mb-8">Atmosphere Meta</span>
                      
                      <div className="space-y-12">
                        <div>
                          <div className="bg-white/5 w-20 h-20 rounded-3xl mx-auto mb-4 flex items-center justify-center border border-white/10">
                            <Thermometer className="text-orange-400" size={32} />
                          </div>
                          <h4 className="text-4xl font-black mb-1">{temperature}°C</h4>
                          <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest italic">Local Temp</span>
                        </div>

                        <div className="w-12 h-0.5 bg-white/10 mx-auto" />

                        <div>
                          <div className="bg-white/5 w-20 h-20 rounded-3xl mx-auto mb-4 flex items-center justify-center border border-white/10">
                            {weather.includes('Cerah') ? <Sun className="text-yellow-400" size={32} /> : <CloudRain className="text-brand-blue" size={32} />}
                          </div>
                          <h4 className="text-3xl font-black mb-1 px-4">{weather}</h4>
                          <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest italic">Sky Condition</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* 3. RESULT STEP */}
              {step === 'RESULT' && result && (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, scale: 1.1 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="max-w-4xl mx-auto w-full"
                >
                  <div className="glass-card rounded-[4rem] p-12 md:p-16 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-transparent via-brand-blue to-transparent" />
                    
                    <button 
                      onClick={() => setStep('SELECTION')}
                      className="absolute top-10 right-10 p-4 rounded-full glass-button opacity-50 hover:opacity-100"
                    >
                      <X size={24} />
                    </button>

                    <div className="flex flex-col items-center text-center">
                      <motion.div 
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="mb-8"
                      >
                        <span className="px-6 py-2 bg-brand-blue/20 text-brand-blue rounded-full text-[10px] font-black uppercase tracking-[0.4em] border border-brand-blue/30 inline-block mb-4">Verdict Delivered</span>
                        <h2 className="text-6xl md:text-8xl font-black italic tracking-tighter leading-none mb-6">
                          {result.name}
                        </h2>
                        <p className="text-2xl md:text-3xl text-white/60 font-medium italic leading-relaxed px-4">
                          "{result.reason}"
                        </p>
                      </motion.div>

                      <div className="flex flex-wrap justify-center gap-3 mb-12">
                        {result.tags.map((tag, i) => (
                          <motion.span 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 + (i * 0.1) }}
                            key={tag} 
                            className="px-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest"
                          >
                            {tag}
                          </motion.span>
                        ))}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full mb-12">
                        {result.healthySwitch && (
                          <div className="text-left p-8 glass-button rounded-[2.5rem]">
                            <Sparkles size={24} className="text-emerald-400 mb-4" />
                            <h5 className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-3 italic">Healthy Switch</h5>
                            <p className="text-sm font-bold text-white/80 leading-relaxed">{result.healthySwitch}</p>
                          </div>
                        )}
                        {result.instaVibe && (
                          <div className="text-left p-8 glass-button rounded-[2.5rem]">
                            <Camera size={24} className="text-indigo-400 mb-4" />
                            <h5 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-3 italic">Insta-Vibe Tip</h5>
                            <p className="text-sm font-bold text-white/80 leading-relaxed">{result.instaVibe}</p>
                          </div>
                        )}
                      </div>

                      <div className="w-full relative rounded-[3rem] overflow-hidden border border-white/10">
                        <WinnerMap winnerName={result.mapsQuery} userLocation={userLocation} />
                      </div>

                      <div className="mt-12 flex flex-col sm:flex-row gap-4 w-full">
                        <a 
                          href={`https://www.google.com/maps/search/${encodeURIComponent(result.mapsQuery)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 py-7 bg-white text-black rounded-full font-black uppercase text-xs tracking-[0.4em] hover:bg-brand-blue hover:text-white transition-all text-center flex items-center justify-center gap-4 group"
                        >
                          Navigate Destination <ChevronRight size={18} className="group-hover:translate-x-2 transition-transform" />
                        </a>
                        <button 
                          onClick={() => setStep('SELECTION')}
                          className="flex-1 py-7 glass-button rounded-full font-black uppercase text-xs tracking-[0.4em]"
                        >
                          Try Again
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </main>
        </div>
      </div>
    </APIProvider>
  );
}

