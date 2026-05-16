import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { motion, AnimatePresence } from 'motion/react';
import { 
  Utensils, Wallet, Wind, Sparkles, Plus, X, 
  ChevronRight, Loader2, MapPin, RefreshCcw, 
  Thermometer, CloudRain, Navigation, History,
  Info, Map as MapIcon, Heart, Camera
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
            <div className="bg-brand-blue text-white px-4 py-2.5 rounded-full font-bold text-sm shadow-2xl flex items-center gap-2 whitespace-nowrap border-2 border-white scale-100 hover:scale-105 transition-transform">
              <Navigation size={14} className="fill-white" />
              {winnerPlace.displayName}
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
          <div className="flex flex-col gap-0.5">
            <span className="text-slate-400 uppercase text-[9px] tracking-widest font-black">Alamat Lokasi</span>
            <span className="text-slate-900 leading-snug">{winnerPlace.formattedAddress}</span>
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
            fields: ['displayName'],
            locationRestriction: { center, radius: 2000 },
            includedPrimaryTypes: includedTypes,
            maxResultCount: 15
          });

          if (places && places.length > 0) {
            onPlacesFound(places.map(p => p.displayName as string).filter(n => n));
          } else {
            alert('Tidak ditemukan tempat makan di sekitar.');
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
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute top-full right-0 mt-3 w-72 bg-white border border-slate-200 rounded-2xl p-5 shadow-2xl z-50 overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-1 h-full bg-red-500" />
            <h4 className="text-sm font-bold text-slate-900 mb-2">Places API Belum Aktif</h4>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">Fitur ini membutuhkan aktivasi "Places API (New)" di Google Cloud Console.</p>
            <a 
              href="https://console.developers.google.com/apis/api/places.googleapis.com/overview" 
              target="_blank" rel="noopener"
              className="block w-full py-2.5 bg-brand-dark text-white text-center text-xs font-bold rounded-xl hover:bg-slate-800 transition-colors"
            >
              Aktifkan Sekarang
            </a>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function MakanManaUI() {
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
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

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

  const formatBudget = (val: string) => {
    // Remove non-digit characters
    const numericValue = val.replace(/\D/g, '');
    if (!numericValue) return '';
    // Format with commas
    return new Intl.NumberFormat('en-US').format(parseInt(numericValue));
  };

  const handleBudgetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatBudget(e.target.value);
    setBudget(formatted);
  };

  const handleDecision = async () => {
    if (options.length === 0) {
      setError('Masukkan pilihan makanan dulu.');
      return;
    }
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const healthyContext = isHealthyMode ? "\nCATATAN: Berikan tips Healthy Switch yang sangat bermanfaat." : "\nCATATAN: Abaikan Healthy_Switch (Isi dengan 'N/A').";
      const fastContext = isFastMode ? "\nURGENSI: Sangat Tinggi (Buru-buru). Prioritaskan makanan cepat saji/siap santap." : "\nURGENSI: Normal.";
      const instaContext = isInstaMode ? "\nAESTHETIC MODE: Aktif. Prioritaskan pilihan yang Instagrammable dan berikan tips fotografi." : "\nAESTHETIC MODE: Mati. Abaikan Insta-Vibe (Isi dengan 'N/A').";
      const prompt = `Pilihan: ${options.join(', ')}\n${budget ? `Budget: Rp ${budget}` : ''}\n${context ? `Konteks: ${context}` : ''}\nSuhu: ${temperature}°C\nWeather: ${weather}\nKATEGORI: ${category || 'KEDUANYA'}${healthyContext}${fastContext}${instaContext}`;
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: { systemInstruction: SYSTEM_PROMPT, temperature: 0.7 },
      });

      const text = response.text || '';
      const cleanText = (t: string) => t.replace(/\*\*|\*|#|__|🏷️|🍃|📸|⏱️/g, '').replace(/\[|\]/g, '').trim();
      
      const lines = text.split('\n').filter(l => l.trim());
      let name = '';
      let reason = '';
      let tags: string[] = [];
      let mapsQuery = '';
      let healthySwitch = '';
      let instaVibe = '';
      let urgencyStatus = '';

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
        else if (currentSection === 'tags') {
          const parts = trimmed.split('|').map(p => cleanText(p)).filter(p => p);
          tags.push(...parts);
        }
        else if (currentSection === 'healthy') healthySwitch = (healthySwitch + ' ' + cleanText(trimmed)).trim();
        else if (currentSection === 'insta') instaVibe = (instaVibe + ' ' + cleanText(trimmed)).trim();
        else if (currentSection === 'urgency') urgencyStatus = (urgencyStatus + ' ' + cleanText(trimmed)).trim();
        else if (currentSection === 'maps') mapsQuery = (mapsQuery + ' ' + cleanText(trimmed)).trim();
      });

      // Fallbacks if parsing missed something
      if (!name && lines.length > 0) name = cleanText(lines[0]);
      if (!reason) reason = 'Pilihan terbaik untukmu saat ini.';
      if (tags.length === 0) tags = ['Cepat & Nikmat', 'Hemat', 'Pilihan AI'];
      if (!mapsQuery) mapsQuery = name;

      setResult({ 
        name: cleanText(name), 
        reason: reason.replace(/^"|"$/g, ''), 
        tags, 
        mapsQuery, 
        healthySwitch: healthySwitch && healthySwitch.toLowerCase() !== 'n/a' ? healthySwitch : undefined, 
        instaVibe: instaVibe && instaVibe.toLowerCase() !== 'n/a' ? instaVibe : undefined,
        urgencyStatus
      });
    } catch (err) {
      setError('Koneksi AI terhenti. Coba sebentar lagi.');
    } finally {
      setLoading(false);
    }
  };

  const selectQuickstartCategory = (cat: 'MAKANAN_SAJA' | 'MINUMAN_SAJA' | 'KEDUANYA') => {
    setCategory(cat);
    setResult(null);
    if (cat === 'MAKANAN_SAJA') setOptions(['Nasi Padang', 'Mie Ayam', 'Bakso', 'Sate Ayam', 'Ayam Bakar']);
    else if (cat === 'MINUMAN_SAJA') setOptions(['Es Teh Manis', 'Es Jeruk', 'Kopi Susu', 'Jus Alpukat', 'Soda Gembira']);
    else setOptions(['Nasi Goreng + Es Teh', 'Ayam Penyet + Es Jeruk', 'Burger + Cola', 'Mie Instan + Susu', 'Sate + Jus Alpukat']);
  };

  if (!hasValidMapsKey) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white border border-slate-200 p-10 rounded-[2.5rem] max-w-md shadow-2xl shadow-slate-200/50">
          <div className="bg-blue-50 w-16 h-16 rounded-2xl flex items-center justify-center mb-8">
            <MapIcon className="text-brand-blue" size={32} />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-4 leading-tight">Konfigurasi Maps Diperlukan</h2>
          <p className="text-slate-500 mb-8 leading-relaxed">Aplikasi membutuhkan Google Maps API Key untuk fitur deteksi lokasi dan peta.</p>
          <div className="space-y-3">
            <div className="p-4 bg-slate-50 rounded-xl flex items-start gap-3">
              <div className="w-5 h-5 bg-slate-900 text-white rounded-full flex items-center justify-center text-[10px] shrink-0 mt-0.5">1</div>
              <p className="text-sm font-medium">Buka <strong>Secrets</strong> di Settings AI Studio</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl flex items-start gap-3">
              <div className="w-5 h-5 bg-slate-900 text-white rounded-full flex items-center justify-center text-[10px] shrink-0 mt-0.5">2</div>
              <p className="text-sm font-medium">Tambah <code>GOOGLE_MAPS_PLATFORM_KEY</code></p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <APIProvider apiKey={GOOGLE_MAPS_KEY} version="weekly">
      <div className="min-h-screen bg-vibe-bg text-vibe-text relative overflow-x-hidden transition-colors duration-700 flex flex-col items-center py-10 md:py-20 px-4 md:px-6">
        
        {/* Background Decorative Elements */}
        <div className="absolute top-0 left-0 w-full h-[1200px] pointer-events-none opacity-40 overflow-hidden">
           {theme === 'light' ? (
             <>
               <div className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] rounded-full bg-gradient-to-br from-brand-blue/30 to-orange-400/20 blur-[140px] animate-pulse" />
               <div className="absolute top-[10%] -right-[10%] w-[50%] h-[50%] rounded-full bg-gradient-to-bl from-orange-500/20 to-brand-blue/30 blur-[120px]" />
             </>
           ) : (
             <>
               <div className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] rounded-full bg-gradient-to-br from-indigo-900/40 to-purple-900/20 blur-[160px]" />
               <div className="absolute top-[10%] -right-[10%] w-[50%] h-[50%] rounded-full bg-gradient-to-bl from-indigo-800/30 to-slate-900/40 blur-[140px] animate-pulse" />
             </>
           )}
        </div>
        
        {/* Navigation Bar / Branding */}
        <div className="w-full max-w-4xl flex justify-between items-center mb-16 z-50 sticky top-4 bg-vibe-card/60 backdrop-blur-xl border border-white/10 dark:border-white/5 p-4 md:p-6 rounded-[2rem] shadow-xl shadow-vibe-glow/20 transition-all duration-700">
          <div className="flex items-center gap-3">
             <div className="bg-vibe-accent/10 p-2.5 rounded-xl">
               <Utensils className="text-vibe-accent" size={24} />
             </div>
             <h1 className="text-xl font-black tracking-tighter text-vibe-text">MakanMana AI</h1>
          </div>
          <div className="flex items-center gap-3">
            {/* Theme Toggle */}
            <button 
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              className="w-12 h-12 flex items-center justify-center rounded-2xl bg-vibe-bg border border-vibe-glow hover:border-vibe-accent transition-all duration-500 group"
              title={theme === 'light' ? 'Switch to Relaxed Night Mode' : 'Switch to Energetic Light Mode'}
            >
              <div className="relative w-6 h-6">
                <motion.div
                  animate={{ 
                    rotate: theme === 'light' ? 0 : 180,
                    scale: theme === 'light' ? 1 : 0,
                    opacity: theme === 'light' ? 1 : 0 
                  }}
                  className="absolute inset-0 text-orange-500"
                >
                  <RefreshCcw size={24} className="animate-spin-slow" />
                </motion.div>
                <motion.div
                  animate={{ 
                    rotate: theme === 'dark' ? 0 : -180,
                    scale: theme === 'dark' ? 1 : 0,
                    opacity: theme === 'dark' ? 1 : 0 
                  }}
                  className="absolute inset-0 text-indigo-400"
                >
                  <CloudRain size={24} />
                </motion.div>
              </div>
            </button>

            <div className="w-px h-8 bg-vibe-glow mx-1" />

            {category && (
              <button 
                onClick={() => { setCategory(null); setOptions([]); setResult(null); }}
                className="bg-vibe-accent text-white px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 transition-colors flex items-center gap-2"
              >
                <X size={14} /> Kembali
              </button>
            )}
            {userLocation ? (
              <div className="hidden md:flex items-center gap-4 bg-vibe-card/40 border border-vibe-glow px-5 py-2.5 rounded-full transition-colors duration-700">
                <div className="flex items-center gap-2 text-vibe-text transition-colors duration-700">
                  <Thermometer size={16} className="text-orange-500" />
                  <span className="font-bold text-sm tracking-tighter">{temperature}°C</span>
                </div>
                <div className="w-px h-3 bg-vibe-glow transition-colors duration-700" />
                <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase tracking-wider dark:text-slate-400">
                  <CloudRain size={16} className="text-vibe-accent" />
                  {weather}
                </div>
              </div>
            ) : (
              <div className="bg-vibe-card/50 text-slate-400 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest animate-pulse border border-vibe-glow">Menunggu GPS...</div>
            )}
          </div>
        </div>

        {/* Home Hero Section */}
        {!category && options.length === 0 && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-6xl text-center mb-24 px-4 relative"
          >
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="inline-flex items-center gap-3 bg-vibe-accent/10 text-vibe-accent px-5 py-2.5 rounded-full text-[11px] font-black uppercase tracking-[0.25em] mb-10 border border-vibe-accent/20 backdrop-blur-sm shadow-xl shadow-vibe-accent/5"
            >
              <Sparkles size={14} className="fill-vibe-accent animate-pulse" /> 
              <span>State-of-the-art AI Advisor</span>
            </motion.div>
            
            <div className="relative">
              <motion.h1 
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.8 }}
                className="text-7xl md:text-[10rem] font-black tracking-[-0.07em] text-vibe-text leading-[0.82] mb-12"
              >
                Laper, Tapi <br /> 
                <span className="text-vibe-accent italic font-black relative inline-block">
                  Gak Tau?
                  <motion.svg 
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ delay: 1, duration: 1 }}
                    className="absolute -bottom-4 left-0 w-full h-4 text-vibe-accent/30" viewBox="0 0 100 10" preserveAspectRatio="none"
                  >
                    <path d="M0 5 Q 25 0 50 5 T 100 5" fill="none" stroke="currentColor" strokeWidth="12" strokeLinecap="round" />
                  </motion.svg>
                </span>
              </motion.h1>
              
              <div className="absolute -top-10 -right-4 hidden lg:block">
                 <motion.div 
                   animate={{ y: [0, -10, 0], rotate: [0, 5, 0] }}
                   transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                   className="bg-vibe-card p-4 rounded-3xl shadow-2xl border border-vibe-glow flex items-center gap-3 rotate-6"
                 >
                    <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-500">
                       <Utensils size={18} />
                    </div>
                    <div className="text-left">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Trending</p>
                       <p className="text-xs font-bold text-vibe-text">Soto Ayam Aesthetic</p>
                    </div>
                 </motion.div>
              </div>
            </div>

            <motion.p 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-xl md:text-2xl text-slate-500 font-medium max-w-2xl mx-auto leading-relaxed dark:text-slate-400 mt-8"
            >
              Hentikan perdebatan tak berujung. AI kami menganalisis cuaca, budget, dan mood kamu untuk satu keputusan mutlak.
            </motion.p>
          </motion.div>
        )}

        <div className="w-full max-w-6xl space-y-12">
          
          {/* Category Selection Area - High Density Bento Grid */}
          {!category && options.length === 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="grid grid-cols-1 md:grid-cols-12 gap-8 px-4 pb-32"
            >
              {/* Makanan Saja - The Big Player */}
              <motion.button 
                whileHover={{ scale: 1.01, y: -8 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => selectQuickstartCategory('MAKANAN_SAJA')}
                className="md:col-span-12 lg:col-span-7 h-[420px] relative overflow-hidden rounded-[4rem] group shadow-2xl shadow-vibe-glow/30 border border-white/10"
              >
                <img 
                  src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1600&q=80" 
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                  alt="Makanan"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-900/30 to-white/5 opacity-90 transition-opacity group-hover:opacity-100" />
                
                <div className="absolute top-8 left-8 flex gap-3">
                   <div className="bg-white/15 backdrop-blur-md px-4 py-2 rounded-full border border-white/20 text-white text-[10px] font-black uppercase tracking-widest">
                      78% Users Pick This
                   </div>
                </div>

                <div className="absolute bottom-10 left-10 text-left text-white max-w-sm">
                  <div className="bg-vibe-accent w-16 h-16 rounded-[2rem] flex items-center justify-center mb-6 shadow-2xl shadow-vibe-accent/40 group-hover:rotate-[360deg] transition-transform duration-700">
                    <Utensils size={32} />
                  </div>
                  <h3 className="text-5xl font-black tracking-tighter uppercase mb-3 leading-none">Makanan Berat</h3>
                  <p className="text-lg font-medium text-white/60 leading-tight">
                    "Gak cuma lapar mata, tapi butuh porsi yang nyata."
                  </p>
                </div>

                <div className="absolute bottom-10 right-10">
                   <div className="w-14 h-14 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center text-white group-hover:bg-vibe-accent group-hover:border-transparent transition-all duration-500">
                      <ChevronRight size={24} />
                   </div>
                </div>
              </motion.button>

              <div className="md:col-span-12 lg:col-span-5 grid grid-cols-1 gap-8">
                 {/* Minuman Saja */}
                 <motion.button 
                    whileHover={{ scale: 1.02, x: 5 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => selectQuickstartCategory('MINUMAN_SAJA')}
                    className="h-[200px] relative overflow-hidden rounded-[3.5rem] group shadow-xl shadow-vibe-glow/20 border border-white/10"
                 >
                    <img 
                      src="https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=800&q=80" 
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                      alt="Minuman"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-950/90 via-indigo-900/40 to-transparent" />
                    <div className="absolute inset-0 p-8 flex items-center justify-between text-white">
                      <div className="flex flex-col text-left">
                        <div className="bg-white/20 backdrop-blur-md w-12 h-12 rounded-2xl flex items-center justify-center mb-3">
                          <CloudRain size={24} />
                        </div>
                        <h3 className="text-3xl font-black tracking-tighter uppercase"> Haus Banget</h3>
                      </div>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-4 group-hover:translate-x-0 transition-transform">
                         <ChevronRight size={32} />
                      </div>
                    </div>
                 </motion.button>

                 {/* Keduanya / Combo */}
                 <motion.button 
                    whileHover={{ scale: 1.02, x: 5 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => selectQuickstartCategory('KEDUANYA')}
                    className="h-[190px] relative overflow-hidden rounded-[3.5rem] group shadow-xl shadow-vibe-glow/20 border border-white/10"
                 >
                    <img 
                      src="https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80" 
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                      alt="Combo"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-vibe-accent/90 via-vibe-accent/40 to-transparent" />
                    <div className="absolute inset-0 p-8 flex items-center justify-between text-white">
                      <div className="flex flex-col text-left">
                         <div className="flex -space-x-4 mb-4">
                            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
                               <Utensils size={20} />
                            </div>
                            <div className="w-12 h-12 rounded-2xl bg-brand-blue/40 backdrop-blur-md flex items-center justify-center border border-white/30">
                               <CloudRain size={20} />
                            </div>
                         </div>
                         <h3 className="text-3xl font-black tracking-tighter uppercase">Combo Mood</h3>
                      </div>
                      <div className="opacity-20 group-hover:opacity-100 transition-opacity">
                         <Sparkles size={40} className="fill-white" />
                      </div>
                    </div>
                 </motion.button>
              </div>
            </motion.div>
          )}

          {/* Category Info if selected */}
          <AnimatePresence>
            {category && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }} 
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between bg-vibe-card border border-vibe-glow px-6 py-3 rounded-2xl shadow-sm transition-colors duration-700"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-vibe-accent/10 px-3 py-1 rounded-full text-[10px] font-black text-vibe-accent uppercase tracking-widest">
                    Mode Aktif
                  </div>
                  <span className="text-sm font-bold uppercase tracking-widest text-vibe-text transition-colors duration-700">
                    {category.replace('_', ' ')}
                  </span>
                </div>
                <button 
                  onClick={() => { setCategory(null); setOptions([]); setResult(null); }}
                  className="text-[10px] font-black uppercase text-slate-400 hover:text-red-500 dark:text-slate-500 transition-colors underline underline-offset-4"
                >
                  Ganti Kategori
                </button>
              </motion.div>
            )}
           </AnimatePresence>
           
           {/* Selection Section Area */}
          <AnimatePresence mode="wait">
            {(category || options.length > 0) && !result && (
              <motion.section 
                key="selection-area"
                initial={{ opacity: 0, scale: 0.98, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98, y: -30 }}
                className="bg-vibe-card/80 backdrop-blur-3xl rounded-[4rem] p-10 md:p-20 shadow-[0_40px_80px_-15px_rgba(0,0,0,0.1)] dark:shadow-[0_40px_80px_-15px_rgba(0,0,0,0.5)] border border-white/20 dark:border-white/5 relative group transition-all duration-700"
              >
                <div className="absolute -top-6 left-12 md:left-20 bg-vibe-accent text-white px-8 py-3 rounded-full text-[11px] font-black uppercase tracking-[0.25em] flex items-center gap-3 shadow-2xl shadow-vibe-accent/40 transition-all hover:scale-105">
                  <Sparkles size={16} className="animate-pulse" /> Sempurnakan Keinginanmu
                </div>

                <div className="space-y-16">
                  
                  {/* Main Input Area */}
                  <div className="space-y-8">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-4">
                      <div className="space-y-2">
                        <h3 className="text-4xl md:text-5xl font-black tracking-tighter text-vibe-text">Sebutkan <br/> <span className="text-vibe-accent">List Opsimu</span></h3>
                        <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Minimal masukkan 1 pilihan</p>
                      </div>
                      <MapsIntegration 
                        onLocationUpdate={setUserLocation}
                        category={category}
                        onPlacesFound={(names) => setOptions(prev => Array.from(new Set([...prev, ...names])))} 
                      />
                    </div>

                    <div className="relative group/input">
                      <input 
                        type="text" 
                        value={newOption}
                        onChange={(e) => setNewOption(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && addOption()}
                        placeholder="Misal: Sate Padang, Burger King..."
                        className="w-full bg-vibe-bg border-2 border-vibe-glow/50 focus:bg-vibe-card focus:border-vibe-accent focus:ring-4 focus:ring-vibe-accent/10 px-8 md:px-12 py-7 md:py-10 rounded-[2.5rem] font-black md:text-2xl transition-all text-vibe-text placeholder:text-slate-300 dark:placeholder:text-slate-700 shadow-inner"
                      />
                      <button 
                        onClick={addOption}
                        className="absolute right-4 md:right-6 top-1/2 -translate-y-1/2 bg-vibe-accent text-white w-14 h-14 md:w-20 md:h-20 rounded-[1.5rem] md:rounded-[2rem] flex items-center justify-center hover:bg-slate-900 dark:hover:bg-white dark:hover:text-vibe-accent transition-all duration-500 disabled:opacity-20 shadow-2xl shadow-vibe-accent/30"
                        disabled={!newOption.trim()}
                      >
                        <Plus size={32} />
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-3 px-2">
                      <AnimatePresence mode="popLayout">
                        {options.map((opt, i) => (
                          <motion.div 
                            key={opt + i}
                            layout
                            initial={{ opacity: 0, scale: 0.8, x: -10 }}
                            animate={{ opacity: 1, scale: 1, x: 0 }}
                            exit={{ opacity: 0, scale: 0.8, x: 10 }}
                            className="bg-vibe-accent/10 border border-vibe-accent/10 text-vibe-accent px-6 py-3 rounded-2xl font-black text-xs md:text-sm flex items-center gap-3 hover:bg-vibe-accent hover:text-white transition-all group cursor-default shadow-sm"
                          >
                            <span>{opt}</span>
                            <button 
                              onClick={() => removeOption(i)} 
                              className="opacity-40 group-hover:opacity-100 hover:rotate-90 transition-all"
                            >
                              <X size={16} strokeWidth={3} />
                            </button>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                      {options.length > 0 && (
                        <button 
                          onClick={() => { setOptions([]); setResult(null); }} 
                          className="px-6 py-3 text-[10px] font-black text-slate-400 hover:text-red-500 transition-colors uppercase tracking-[0.2em]"
                        >
                          Reset List
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pt-10">
                      <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-6 flex items-center gap-2">
                          <Wallet size={14} className="text-vibe-accent" /> Financial Plan (Rp)
                        </label>
                        <div className="relative group/field">
                          <span className="absolute left-8 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-700 font-black text-xl">Rp</span>
                          <input 
                            type="text" 
                            value={budget}
                            onChange={handleBudgetChange}
                            placeholder="Contoh: 100,000"
                            className="w-full bg-vibe-bg border-2 border-vibe-glow/50 focus:bg-vibe-card focus:border-vibe-accent px-16 py-7 rounded-[2rem] font-black text-xl md:text-2xl transition-all shadow-sm text-vibe-text"
                          />
                        </div>
                      </div>
                      <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-6 flex items-center gap-2">
                          <Wind size={14} className="text-vibe-accent" /> Mood Context
                        </label>
                        <input 
                          type="text" 
                          value={context}
                          onChange={(e) => setContext(e.target.value)}
                          placeholder="Lagi butuh asupan micin, cepat..."
                          className="w-full bg-vibe-bg border-2 border-vibe-glow/50 focus:bg-vibe-card focus:border-vibe-accent px-8 py-7 rounded-[2rem] font-black text-xl md:text-2xl transition-all shadow-sm text-vibe-text"
                        />
                      </div>
                    </div>

                    <div className="pt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
                       {/* Healthy Toggle */}
                       <motion.button 
                          whileHover={{ y: -5 }}
                          onClick={() => setIsHealthyMode(!isHealthyMode)}
                          className={`p-8 rounded-[2.5rem] border-2 transition-all flex flex-col items-center gap-4 ${isHealthyMode ? 'bg-green-500/10 border-green-500' : 'bg-vibe-bg border-vibe-glow/50 hover:border-vibe-accent/30'}`}
                       >
                          <div className={`p-4 rounded-2xl ${isHealthyMode ? 'bg-green-500 text-white' : 'bg-vibe-card text-slate-400'}`}>
                             <Heart size={24} fill={isHealthyMode ? "currentColor" : "none"} />
                          </div>
                          <div className="text-center">
                             <h4 className={`text-sm font-black uppercase tracking-widest mb-1 ${isHealthyMode ? 'text-green-600' : 'text-vibe-text'}`}>Healthy Switch</h4>
                             <p className="text-[10px] text-slate-400 font-bold">Tips modifikasi sehat</p>
                          </div>
                       </motion.button>

                       {/* Fast Toggle */}
                       <motion.button 
                          whileHover={{ y: -5 }}
                          onClick={() => setIsFastMode(!isFastMode)}
                          className={`p-8 rounded-[2.5rem] border-2 transition-all flex flex-col items-center gap-4 ${isFastMode ? 'bg-amber-500/10 border-amber-500' : 'bg-vibe-bg border-vibe-glow/50 hover:border-vibe-accent/30'}`}
                       >
                          <div className={`p-4 rounded-2xl ${isFastMode ? 'bg-amber-500 text-white' : 'bg-vibe-card text-slate-400'}`}>
                             <RefreshCcw size={24} className={isFastMode ? "animate-spin-slow" : ""} />
                          </div>
                          <div className="text-center">
                             <h4 className={`text-sm font-black uppercase tracking-widest mb-1 ${isFastMode ? 'text-amber-600' : 'text-vibe-text'}`}>Buru-buru?</h4>
                             <p className="text-[10px] text-slate-400 font-bold">Fast food priority</p>
                          </div>
                       </motion.button>

                       {/* Aesthetic Toggle */}
                       <motion.button 
                          whileHover={{ y: -5 }}
                          onClick={() => setIsInstaMode(!isInstaMode)}
                          className={`p-8 rounded-[2.5rem] border-2 transition-all flex flex-col items-center gap-4 ${isInstaMode ? 'bg-indigo-500/10 border-indigo-500' : 'bg-vibe-bg border-vibe-glow/50 hover:border-vibe-accent/30'}`}
                       >
                          <div className={`p-4 rounded-2xl ${isInstaMode ? 'bg-indigo-500 text-white' : 'bg-vibe-card text-slate-400'}`}>
                             <Camera size={24} />
                          </div>
                          <div className="text-center">
                             <h4 className={`text-sm font-black uppercase tracking-widest mb-1 ${isInstaMode ? 'text-indigo-600' : 'text-vibe-text'}`}>Insta-Ready</h4>
                             <p className="text-[10px] text-slate-400 font-bold">Aesthetic spot only</p>
                          </div>
                       </motion.button>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="pt-6">
                    <button 
                      onClick={handleDecision}
                      disabled={loading || options.length === 0}
                      className="w-full py-10 md:py-14 bg-vibe-accent text-white rounded-[3rem] text-2xl md:text-4xl font-black flex items-center justify-center gap-6 shadow-[0_30px_60px_-12px_rgba(37,99,235,0.4)] hover:shadow-[0_40px_80px_-12px_rgba(37,99,235,0.6)] hover:scale-[1.01] active:scale-[0.98] transition-all duration-500 disabled:opacity-40 disabled:cursor-not-allowed group"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="animate-spin" size={40} />
                          <span className="tracking-tighter">MENGANALISIS SELERA...</span>
                        </>
                      ) : (
                        <>
                          <span className="tracking-tighter">LIHAT KEPUTUSAN MUTLAK</span>
                          <ChevronRight size={48} className="opacity-30 group-hover:opacity-100 group-hover:translate-x-3 transition-all" />
                        </>
                      )}
                    </button>
                    <AnimatePresence>
                      {error && (
                        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-8 text-center text-xs font-black text-red-500 uppercase tracking-[0.3em]">{error}</motion.p>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.section>
            )}
          </AnimatePresence>
          
          {/* Result Section */}
          <AnimatePresence>
            {result && (
              <motion.section 
                initial={{ opacity: 0, scale: 0.98, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="space-y-8 pb-32"
              >
                <div className="bg-vibe-card rounded-[3rem] overflow-hidden border border-vibe-glow shadow-2xl shadow-vibe-glow/20 transition-all duration-700">
                  <div className="p-10 md:p-16 text-vibe-text relative">
                     <div className="absolute top-0 right-0 p-8 opacity-5">
                        <Sparkles size={120} className="text-vibe-accent" />
                     </div>
                     <div className="inline-flex items-center gap-2 bg-vibe-accent text-white px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-12 shadow-lg shadow-vibe-accent/20 transition-colors duration-700">
                        Hasil Keputusan
                     </div>
                     <div className="space-y-10">
                        <div className="flex items-center gap-2">
                           <div className="h-px flex-1 bg-vibe-glow" />
                           <div className="flex items-center gap-2 px-4 py-1.5 bg-vibe-bg rounded-full border border-vibe-glow transition-colors duration-700">
                              <Sparkles size={12} className="text-vibe-accent fill-vibe-accent" />
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Mengapa ini yang terpilih?</span>
                           </div>
                           <div className="h-px flex-1 bg-vibe-glow" />
                        </div>

                        <div className="relative group pl-8">
                           <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-vibe-accent rounded-full shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-colors duration-700" />
                           
                           <div className="space-y-4">
                              <div className="flex flex-col gap-2">
                                 {result.urgencyStatus && (
                                   <div className="flex items-center gap-1.5 bg-vibe-bg w-fit px-2.5 py-1 rounded-md mb-2 border border-vibe-glow transition-colors duration-700">
                                      <RefreshCcw size={10} className="text-slate-400" />
                                      <span className="text-[9px] font-black uppercase text-slate-400 tracking-tighter">Status: {result.urgencyStatus}</span>
                                   </div>
                                 )}
                                 <h2 className="text-4xl md:text-7xl font-black tracking-tighter leading-none text-vibe-text break-words transition-colors duration-700">
                                    {result.name}
                                 </h2>
                              </div>
                              <p className="text-xl md:text-2xl text-slate-700 dark:text-slate-300 leading-relaxed max-w-2xl font-bold tracking-tight transition-colors duration-700">
                                 "{result.reason}"
                              </p>
                           </div>
                        </div>

                        {result.healthySwitch && (
                          <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="ml-8 p-6 bg-green-50/50 dark:bg-green-900/10 border border-green-100/50 dark:border-green-900/20 rounded-[2rem] flex items-start gap-4 group/healthy"
                          >
                            <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl shadow-sm text-green-500 group-hover/healthy:scale-110 transition-transform">
                               <Heart size={20} fill="currentColor" />
                            </div>
                            <div className="flex flex-col gap-1">
                               <span className="text-[10px] font-black text-green-600 uppercase tracking-widest">Healthy Switch Tips</span>
                               <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 leading-relaxed italic">
                                  {result.healthySwitch}
                                </p>
                            </div>
                          </motion.div>
                        )}

                        {result.instaVibe && (
                          <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="ml-8 p-6 bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-100/50 dark:border-indigo-900/20 rounded-[2rem] flex items-start gap-4 group/insta"
                          >
                            <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl shadow-sm text-indigo-500 group-hover/insta:scale-110 transition-transform">
                               <Camera size={20} fill="none" />
                            </div>
                            <div className="flex flex-col gap-1">
                               <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Aesthetic Mode Analysis</span>
                               <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 leading-relaxed italic transition-colors">
                                  {result.instaVibe}
                                </p>
                            </div>
                          </motion.div>
                        )}
                        
                        <div className="flex flex-wrap gap-3 pt-4 pl-8">
                           {result.tags.map((tag, i) => (
                             <motion.div 
                                key={i}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.3 + (i * 0.1) }}
                                className="bg-vibe-bg border border-vibe-glow px-4 py-2 rounded-xl flex items-center gap-2 group/pt hover:border-vibe-accent/30 transition-all duration-500"
                             >
                                <div className="w-1.5 h-1.5 rounded-full bg-vibe-accent" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover/pt:text-vibe-accent transition-colors">{tag}</span>
                             </motion.div>
                           ))}
                        </div>
                     </div>
                  </div>
                  <div className="px-10 md:px-16 pb-16 pt-0">
                    <div className="flex items-center justify-between mb-6">
                       <div className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded-full bg-vibe-bg flex items-center justify-center transition-colors">
                            <MapPin size={14} className="text-vibe-accent" />
                         </div>
                         <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Detail Lokasi Terdekat</h4>
                       </div>
                    </div>
                    <WinnerMap 
                      winnerName={result.mapsQuery || result.name} 
                      userLocation={userLocation} 
                    />
                  </div>
                </div>
                
                <div className="flex justify-center">
                  <button 
                    onClick={() => {
                        window.scrollTo({top: 0, behavior: 'smooth'});
                        setTimeout(() => {
                           setCategory(null);
                           setOptions([]);
                           setResult(null);
                        }, 500);
                    }} 
                    className="group flex items-center gap-3 bg-vibe-card border border-vibe-glow px-8 py-4 rounded-full shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-500"
                  >
                    <History size={18} className="text-slate-400 group-hover:text-vibe-accent group-hover:rotate-[-45deg] transition-all" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 group-hover:text-vibe-accent transition-colors">Pilih Kategori Lain</span>
                  </button>
                </div>
              </motion.section>
            )}
          </AnimatePresence>
        </div>

        <footer className="w-full max-w-3xl mt-auto pt-10 border-t border-vibe-glow flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-10 transition-colors duration-700">
          <div>© MakanMana AI 2026 • {theme === 'light' ? 'Energetic Mode' : 'Relaxed Mode'}</div>
          <div className="flex gap-6">
            <span className={theme === 'light' ? 'text-vibe-accent' : 'text-indigo-400'}>{theme === 'light' ? 'Vibrant' : 'Ambient'}</span>
            <span>Minimalist</span>
            <span>Functional</span>
          </div>
        </footer>
      </div>
    </APIProvider>
  );
}

