import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { motion, AnimatePresence } from 'motion/react';
import { 
  Utensils, Wallet, Wind, Sparkles, Plus, X, Search,
  ChevronRight, Loader2, MapPin, RefreshCcw, 
  Thermometer, CloudRain, Navigation, History,
  Info, Map as MapIcon, Heart, Camera, Sun, Moon,
  Pizza, Coffee, ChefHat
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
    <div className="w-full h-80 rounded-3xl border border-[var(--border-color)] mt-6 relative bg-[var(--card-bg)] overflow-hidden group shadow-inner">
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
      <div className="absolute inset-0 pointer-events-none border-[8px] border-white/10 rounded-3xl" />
      {winnerPlace && (
        <div className="absolute bottom-6 left-6 right-6 bg-[var(--card-bg)]/90 backdrop-blur-md border border-[var(--border-color)] p-4 rounded-2xl text-xs font-semibold shadow-xl z-10 flex items-start gap-3 transform translate-y-0 group-hover:-translate-y-1 transition-transform duration-500">
          <div className="bg-brand-blue/10 p-2 rounded-lg">
            <MapPin size={16} className="text-brand-blue" />
          </div>
          <div className="flex flex-col gap-0.5 min-w-0 flex-1">
            <span className="text-slate-400 uppercase text-[9px] tracking-widest font-black shrink-0">Alamat Lokasi</span>
            <span className="text-[var(--text-main)] leading-snug line-clamp-2 break-words">{winnerPlace.formattedAddress}</span>
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
        className="cartoon-button bg-[#6BCB77] text-white"
      >
        {loading ? <RefreshCcw className="animate-spin" size={16} /> : <MapPin size={16} />}
        Auto Cari Sekitar
      </button>

      <AnimatePresence>
        {apiError === 'NOT_ACTIVATED' && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="absolute top-full left-0 md:right-0 md:left-auto mt-4 w-[calc(100vw-4rem)] md:w-80 cartoon-card bg-white z-50 p-6 shadow-2xl"
          >
            <div className="bg-[#EF4444] cartoon-border-sm px-4 py-1.5 rounded-xl cartoon-shadow-sm inline-block rotate-[-1deg] mb-4">
               <h4 className="text-[10px] font-heading uppercase text-white">API Belum Aktif</h4>
            </div>
            <p className="text-xs font-display text-[var(--text-main)] mb-6 leading-relaxed">
               Fitur ini butuh "Places API (New)" aktif di Google Cloud Console.
            </p>
            <a 
              href="https://console.developers.google.com/apis/api/places.googleapis.com/overview" 
              target="_blank" rel="noopener"
              className="cartoon-button bg-[#FF8400] text-white text-[10px] w-full"
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

function ResultSkeleton() {
  return (
    <div className="max-w-4xl mx-auto w-full pb-10">
      <div className="cartoon-card !p-10 relative bg-white/50 animate-pulse">
        <div className="flex flex-col items-center text-center">
          <div className="mb-8 p-8 bg-[var(--card-bg)]/40 cartoon-border cartoon-shadow-sm rounded-[3rem] w-full flex flex-col items-center">
            <div className="w-32 h-6 bg-[var(--text-main)]/10 rounded-full mb-6" />
            <div className="w-3/4 h-16 bg-[var(--text-main)]/10 rounded-2xl mb-8" />
            <div className="w-1/2 h-8 bg-[var(--text-main)]/5 rounded-xl mb-8" />
            <div className="flex gap-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="w-24 h-10 bg-[var(--text-main)]/10 rounded-full" />
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mb-10">
            {[1, 2, 3].map(i => (
              <div key={i} className="cartoon-card !p-6 bg-[var(--card-bg)]/40 flex flex-col items-center">
                <div className="w-12 h-12 bg-[var(--text-main)]/10 rounded-xl mb-4" />
                <div className="w-16 h-4 bg-[var(--text-main)]/10 rounded-full mb-2" />
                <div className="w-24 h-4 bg-[var(--text-main)]/5 rounded-full" />
              </div>
            ))}
          </div>

          <div className="w-full">
            <div className="flex items-center justify-between mb-4 px-4">
              <div className="w-24 h-4 bg-[var(--text-main)]/10 rounded-full" />
              <div className="w-16 h-6 bg-red-100/50 rounded-full" />
            </div>
            <div className="w-full cartoon-border cartoon-shadow-sm rounded-[3rem] h-80 bg-[var(--card-bg)]/30" />
          </div>

          <div className="mt-12 flex flex-col sm:flex-row gap-4 w-full">
            <div className="flex-[2] h-20 bg-[var(--text-main)]/10 rounded-2xl" />
            <div className="flex-1 h-20 bg-[var(--text-main)]/5 rounded-2xl" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MakanManaUI() {
  const [step, setStep] = useState<Step>('LANDING');
  const [isModalOpen, setIsModalOpen] = useState(false);
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
  const [searchQuery, setSearchQuery] = useState('');

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

  const handleBudgetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '');
    setBudget(val ? new Intl.NumberFormat('en-US').format(parseInt(val)) : '');
  };

  const handleDirectSearch = async (query?: string) => {
    const finalQuery = query || searchQuery;
    if (!finalQuery.trim()) return;
    
    setOptions([finalQuery]);
    setCategory('KEDUANYA');
    setLoading(true);
    setStep('RESULT'); // Go to result immediately to show loading there
    
    try {
      const healthyContext = isHealthyMode ? "\nCATATAN: Berikan tips Healthy Switch." : "\nCATATAN: Abaikan Healthy_Switch.";
      const fastContext = isFastMode ? "\nURGENSI: Sangat Tinggi." : "\nURGENSI: Normal.";
      const instaContext = isInstaMode ? "\nAESTHETIC MODE: Aktif." : "\nAESTHETIC MODE: Mati.";
      const prompt = `Pencarian Langsung: ${finalQuery}\n${budget ? `Budget: Rp ${budget}` : ''}\nSuhu: ${temperature}°C\nWeather: ${weather}\nKATEGORI: KEDUANYA${healthyContext}${fastContext}${instaContext}`;
      
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
        name: cleanText(name) || finalQuery, 
        reason: reason.replace(/^"|"$/g, ''), 
        tags, mapsQuery: mapsQuery || finalQuery, 
        healthySwitch: healthySwitch && healthySwitch.toLowerCase() !== 'n/a' ? healthySwitch : undefined, 
        instaVibe: instaVibe && instaVibe.toLowerCase() !== 'n/a' ? instaVibe : undefined,
        urgencyStatus
      });
    } catch (err) {
      setError('Gagal memproses keputusan. Coba lagi.');
      setStep('LANDING');
    } finally {
      setLoading(false);
    }
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
      <div className="relative min-h-screen w-full overflow-x-hidden font-sans text-[var(--text-main)] transition-colors duration-500 selection:bg-brand-blue/30">
        
        {/* OVERLAY CONTENT */}
        <div className="relative z-10 flex flex-col min-h-screen">
          
          {/* TOP NAV */}
          <nav className="h-16 px-6 md:px-12 flex items-center justify-between pointer-events-auto sticky top-0 z-50">
            <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setStep('LANDING')}>
              <div className="w-12 h-12 bg-[var(--card-bg)] cartoon-border cartoon-shadow-sm rounded-2xl flex items-center justify-center group-hover:rotate-6 transition-transform duration-500">
                <Utensils size={24} className="text-[var(--text-main)]" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-2xl font-heading tracking-tight leading-none text-[var(--text-main)] group-hover:text-brand-blue transition-colors uppercase">MAKAN MANA</h1>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-brand-blue animate-pulse" />
                  <span className="text-[10px] font-black text-[var(--text-main)] tracking-[0.2em] uppercase">Cartoon V3.0</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <button
                onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                className="w-12 h-12 bg-[var(--card-bg)] cartoon-border rounded-2xl flex items-center justify-center cartoon-shadow-sm hover:scale-110 active:scale-95 transition-all text-[var(--text-main)]"
                title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
              >
                {theme === 'light' ? <Moon size={24} /> : <Sun size={24} className="text-yellow-400" />}
              </button>

              {step !== 'LANDING' ? (
                <button 
                  onClick={() => setStep('LANDING')}
                  className="cartoon-button bg-[#FF8400] text-white"
                >
                  <RefreshCcw size={14} /> RESET
                </button>
              ) : (
                <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#1E1E1E] cartoon-border rounded-full shadow-sm transition-colors duration-500">
                  <div className="w-2 h-2 rounded-full bg-[#6BCB77]" />
                  <span className="text-[10px] font-heading text-[var(--text-main)] uppercase tracking-widest">Active</span>
                </div>
              )}
            </div>
          </nav>

          <main className="flex-1 flex flex-col px-6 md:px-12 max-w-6xl mx-auto w-full pb-10 pt-6">
            <AnimatePresence mode="wait">
              
              {/* 1. LANDING STEP */}
              {step === 'LANDING' && (
                <motion.div
                  key="landing"
                  initial={{ opacity: 0, scale: 0.9, rotate: -2 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  exit={{ opacity: 0, scale: 1.1, rotate: 2 }}
                  transition={{ type: "spring", damping: 12 }}
                  className="flex-1 flex flex-col justify-center items-center text-center py-6"
                >
                  <motion.div
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="mb-8 rotate-[-2deg] bg-[#FFD93D] cartoon-border p-4 cartoon-shadow-sm rounded-3xl"
                  >
                    <div className="flex items-center gap-2">
                       <Sparkles size={20} className="text-[#2D2727]" />
                       <span className="text-sm font-heading uppercase tracking-widest text-[#2D2727]">AI-Powered Ideas!</span>
                    </div>
                  </motion.div>

                  <h2 className="text-6xl md:text-8xl lg:text-9xl font-heading leading-none mb-4 text-[var(--text-main)] uppercase text-pop">
                    BINGUNG <br />
                    <span className="text-[#FF00E4]">MAKAN MANA?</span>
                  </h2>
                  
                  <p className="max-w-xl text-xl md:text-2xl text-[var(--text-main)] mb-12 font-display bg-[var(--card-bg)]/50 backdrop-blur-sm p-4 rounded-2xl border-2 border-dashed border-[var(--border-color)]">
                    Pilih kategori atau cari menu favoritmu di bawah!
                  </p>

                  {/* GLOBAL SEARCH BAR */}
                  <div className="w-full max-w-xl mb-16 px-4">
                    <div className="relative group/search">
                      <div className="relative flex items-center bg-[var(--card-bg)] cartoon-border rounded-3xl p-2 transition-all cartoon-shadow-lg">
                        <div className="pl-4 text-[var(--text-main)]">
                          <Search size={22} />
                        </div>
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleDirectSearch()}
                          placeholder="Cari makanan (mis: Bakso)..."
                          className="flex-1 bg-transparent px-4 py-4 outline-none text-xl font-display placeholder:text-[var(--text-main)]/40"
                        />
                        <button
                          onClick={() => handleDirectSearch()}
                          className="cartoon-button bg-brand-blue text-white mr-2"
                        >
                          CARI
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full max-w-4xl px-4 mt-4">
                    {[
                      { id: 'MAKANAN_SAJA', label: 'Makanan', icon: Pizza, color: '#EF4444' },
                      { id: 'MINUMAN_SAJA', label: 'Minuman', icon: Coffee, color: '#3B82F6' },
                      { id: 'KEDUANYA', label: 'Mix', icon: ChefHat, color: '#8B5CF6' }
                    ].map(cat => (
                      <button
                        key={cat.id}
                        onClick={() => { selectQuickstartCategory(cat.id as any); setStep('SELECTION'); }}
                        className="group relative p-8 rounded-3xl cartoon-border cartoon-shadow transition-all hover:scale-105 active:scale-95 flex flex-col items-center gap-6"
                        style={{ backgroundColor: cat.color }}
                      >
                        <div className="w-16 h-16 bg-white dark:bg-[#333333] cartoon-border rounded-2xl flex items-center justify-center text-[#2D2727] dark:text-white group-hover:rotate-12 transition-transform">
                          <cat.icon size={32} />
                        </div>
                        <span className="text-lg font-heading text-white uppercase text-pop">{cat.label}</span>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* 2. SELECTION STEP */}
              {step === 'SELECTION' && (
                <motion.div
                  key="selection"
                  initial={{ opacity: 0, x: 100 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative pb-10"
                >
                  {/* Left: Inputs */}
                  <div className="lg:col-span-8 space-y-8">
                    <div className="cartoon-card bg-[var(--bg-color)]">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
                        <div>
                          <div className="bg-[#FF8400] cartoon-border px-6 py-2 rounded-2xl cartoon-shadow-sm inline-block rotate-[-1deg] mb-2">
                             <h3 className="text-[10px] font-heading uppercase text-white">Engine Mode</h3>
                          </div>
                          <div className="flex items-center gap-3">
                            <Utensils size={24} className="text-[var(--text-main)]" />
                            <span className="text-xl font-heading tracking-tight uppercase text-[var(--text-main)]">{category?.replace('_', ' ')}</span>
                          </div>
                        </div>
                        <MapsIntegration 
                          category={category}
                          onLocationUpdate={setUserLocation} 
                          onPlacesFound={(places) => setOptions(prev => [...new Set([...prev, ...places])])} 
                        />
                      </div>

                      <div className="space-y-4">
                        <label className="text-sm font-heading uppercase ml-2 text-[var(--text-main)]">Tulis Menu / Tempat:</label>
                        <div className="flex gap-4 p-3 bg-[var(--card-bg)] cartoon-border rounded-2xl cartoon-shadow-sm">
                          <input
                            type="text"
                            value={newOption}
                            onChange={(e) => setNewOption(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && addOption()}
                            placeholder="Ketik ide kulinermu..."
                            className="flex-1 bg-transparent px-4 py-3 outline-none text-xl font-display placeholder:text-[var(--text-main)]/40"
                          />
                          <button 
                            onClick={addOption}
                            className="cartoon-button bg-[#FF8400] text-white p-4"
                          >
                            <Plus size={32} />
                          </button>
                        </div>
                      </div>

                      <div className="mt-8 flex flex-wrap gap-3">
                        <AnimatePresence mode="popLayout">
                          {options.slice(0, 5).map((opt, i) => (
                            <motion.div
                              key={`${opt}-${i}`}
                              layout
                              initial={{ opacity: 0, scale: 0.5, rotate: -10 }}
                              animate={{ opacity: 1, scale: 1, rotate: (i % 2 === 0 ? 1 : -1) }}
                              exit={{ opacity: 0, scale: 0 }}
                              className="flex items-center gap-3 px-6 py-3 bg-[var(--card-bg)] cartoon-border rounded-2xl text-sm font-heading cartoon-shadow-sm group"
                            >
                              <span className="max-w-[150px] truncate text-[var(--text-main)]">{opt}</span>
                              <button onClick={() => removeOption(i)} className="text-[var(--text-main)] group-hover:text-red-500 transition-colors">
                                <X size={18} />
                              </button>
                            </motion.div>
                          ))}
                        </AnimatePresence>
                        
                        {options.length > 5 && (
                          <button 
                            onClick={() => setIsModalOpen(true)}
                            className="flex items-center gap-2 px-6 py-3 bg-[#FFD93D] cartoon-border rounded-2xl text-sm font-heading cartoon-shadow-sm hover:scale-105 transition-transform font-bold text-[#2D2727]"
                          >
                            <Plus size={18} /> LIHAT SEMUA ({options.length})
                          </button>
                        )}

                        {options.length === 0 && (
                          <div className="w-full py-12 px-4 border-4 border-dashed border-[var(--border-color)] opacity-30 rounded-3xl text-center bg-[var(--text-main)]/5">
                            <p className="text-[var(--text-main)] font-heading text-sm uppercase italic">
                              Pilihan Masih Kosong!
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-10 bg-[#FFD93D]/20 p-6 rounded-3xl border-4 border-[var(--border-color)] cartoon-shadow-sm">
                        <div className="space-y-3">
                          <label className="text-xs font-heading uppercase ml-1 text-[var(--text-main)]">Berapa Duit?</label>
                          <div className="flex items-center gap-4 bg-[var(--card-bg)] cartoon-border p-4 rounded-2xl cartoon-shadow-sm">
                            <Wallet size={24} className="text-[var(--text-main)]" />
                            <input type="text" value={budget} onChange={handleBudgetChange} placeholder="No Limit" className="bg-transparent outline-none font-display text-xl w-full" />
                          </div>
                        </div>
                        <div className="space-y-3">
                          <label className="text-xs font-heading uppercase ml-1 text-[var(--text-main)]">Ada Vibe Khusus?</label>
                          <div className="flex items-center gap-4 bg-[var(--card-bg)] cartoon-border p-4 rounded-2xl cartoon-shadow-sm">
                            <Wind size={24} className="text-[var(--text-main)]" />
                            <input type="text" value={context} onChange={(e) => setContext(e.target.value)} placeholder="Pedas, Santai..." className="bg-transparent outline-none font-display text-xl w-full" />
                          </div>
                        </div>
                      </div>

                      {/* FEATURE TOGGLES */}
                        <div className="mt-10 space-y-4">
                        <div className="flex items-center justify-between px-2">
                          <label className="text-xs font-heading uppercase text-[var(--text-main)]">Optimization</label>
                          <button 
                            onClick={() => { setIsHealthyMode(false); setIsFastMode(false); setIsInstaMode(false); }}
                            className="text-[10px] font-heading text-red-500 hover:scale-110 transition-transform"
                          >
                            RESET
                          </button>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          {[
                            { id: 'insta', active: isInstaMode, set: setIsInstaMode, icon: Camera, label: 'Visual', color: '#9D76C1' },
                            { id: 'healthy', active: isHealthyMode, set: setIsHealthyMode, icon: Heart, label: 'Healthy', color: '#6BCB77' },
                            { id: 'fast', active: isFastMode, set: setIsFastMode, icon: Sparkles, label: 'Fastfood', color: '#FF4E50' }
                          ].map((feat) => (
                            <button 
                              key={feat.id}
                              onClick={() => feat.set(!feat.active)}
                              className={`flex items-center justify-between p-4 cartoon-border rounded-2xl transition-all ${feat.active ? 'bg-[var(--card-bg)] cartoon-shadow-sm scale-105' : 'bg-[var(--bg-color)] opacity-50'}`}
                              style={feat.active ? { borderColor: feat.color, color: feat.color } : {}}
                            >
                              <div className="flex items-center gap-3">
                                <feat.icon size={20} />
                                <span className="font-heading text-sm uppercase">{feat.label}</span>
                              </div>
                              <div className={`w-3 h-3 rounded-full cartoon-border ${feat.active ? 'bg-current' : 'bg-transparent'}`} />
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right: Meta & Action */}
                  <div className="lg:col-span-4 space-y-8 lg:sticky lg:top-20">
                    <div className="cartoon-card bg-[#3B82F6] text-white">
                      <div className="flex items-center justify-between mb-6">
                        <span className="text-xs font-heading uppercase">Cek Telemetri</span>
                        <Sun className="animate-spin duration-[10s]" size={24} />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-white/20 p-4 rounded-2xl border-4 border-white/30">
                          <h4 className="text-4xl font-heading text-pop">{temperature}°</h4>
                          <span className="text-[10px] font-heading uppercase">Celcius</span>
                        </div>
                        <div className="bg-white/20 p-4 rounded-2xl border-4 border-white/30 text-right">
                          <h4 className="text-xl font-heading truncate text-pop">{weather}</h4>
                          <span className="text-[10px] font-heading uppercase">Sky</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <button
                        onClick={handleDecision}
                        disabled={loading || options.length === 0}
                        className="w-full cartoon-button bg-[#FF00E4] !py-8 text-white !text-2xl cartoon-shadow-lg !rounded-[3rem] shadow-pink-500/20"
                      >
                        <span className="flex items-center justify-center gap-4 text-pop">
                          {loading ? <Loader2 className="animate-spin" size={32} /> : <ChefHat size={32} />}
                          {loading ? 'MEMASAK...' : 'GASKEUN!'}
                        </span>
                      </button>
                      
                      {error && (
                        <div className="p-4 bg-red-100 border-4 border-red-500 rounded-2xl flex items-center gap-3">
                          <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-[10px]">!</div>
                          <span className="text-[10px] font-heading uppercase text-red-600">{error}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* 3. RESULT STEP */}
              {step === 'RESULT' && (loading ? <ResultSkeleton /> : result && (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, scale: 0.5, rotate: -20 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  exit={{ opacity: 0, scale: 2, rotate: 20 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15 }}
                  className="max-w-4xl mx-auto w-full pb-10"
                >
                  <div className="cartoon-card !p-10 relative bg-[#FFD93D]">
                    <button 
                      onClick={() => setStep('SELECTION')}
                      className="absolute top-4 right-4 w-12 h-12 bg-red-500 rounded-full cartoon-border flex items-center justify-center text-white cartoon-shadow-sm z-20 hover:scale-110 active:scale-95"
                    >
                      <X size={24} />
                    </button>
                    
                    <div className="flex flex-col items-center text-center relative z-10">
                      <div className="mb-8 p-8 bg-[var(--card-bg)] cartoon-border cartoon-shadow rounded-[3rem] rotate-[-2deg] w-full transition-colors duration-500">
                        <div className="bg-[#EF4444] cartoon-border px-6 py-2 rounded-2xl cartoon-shadow-sm inline-block mb-4 rotate-[1deg]">
                           <span className="text-[10px] font-heading uppercase text-white tracking-widest">HASIL ANALISIS AI</span>
                        </div>
                        <h2 className="text-5xl md:text-7xl lg:text-8xl font-heading text-[#2D2727] uppercase text-pop leading-none mt-2">
                          {result.name}
                        </h2>
                        
                        <div className="mt-8 max-w-2xl mx-auto">
                          <p className="text-xl md:text-3xl text-[#2D2727] font-display mb-8 italic">
                            "{result.reason}"
                          </p>
                        </div>

                        <div className="flex flex-wrap justify-center gap-3">
                          {result.tags.map((tag, i) => (
                            <span 
                              key={i} 
                              className="px-6 py-2 bg-[#FF8400] text-white cartoon-border rounded-full text-xs font-heading uppercase text-pop"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mb-10">
                        {result.urgencyStatus && (
                          <div className="cartoon-card !p-6 bg-[var(--card-bg)] flex flex-col items-center transition-colors duration-500">
                            <div className="w-12 h-12 bg-[#FFD93D] cartoon-border rounded-xl flex items-center justify-center mb-4 cartoon-shadow-sm">
                              <Loader2 size={24} className="text-[var(--text-main)]" />
                            </div>
                            <h5 className="text-[9px] font-heading text-[var(--text-main)] mb-2 uppercase">Tempo</h5>
                            <p className="text-sm font-heading text-[var(--text-main)]">{result.urgencyStatus}</p>
                          </div>
                        )}
                        {result.healthySwitch && (
                          <div className="cartoon-card !p-6 bg-[#6BCB77] flex flex-col items-center">
                            <div className="w-12 h-12 bg-[var(--card-bg)] cartoon-border rounded-xl flex items-center justify-center mb-4 cartoon-shadow-sm">
                              <Heart size={24} className="text-[#6BCB77]" />
                            </div>
                            <h5 className="text-[9px] font-heading text-white mb-2 uppercase">Wellness</h5>
                            <p className="text-xs font-display text-white italic">"{result.healthySwitch}"</p>
                          </div>
                        )}
                        {result.instaVibe && (
                          <div className="cartoon-card !p-6 bg-[#9D76C1] flex flex-col items-center">
                            <div className="w-12 h-12 bg-[var(--card-bg)] cartoon-border rounded-xl flex items-center justify-center mb-4 cartoon-shadow-sm">
                              <Camera size={24} className="text-[#9D76C1]" />
                            </div>
                            <h5 className="text-[9px] font-heading text-white mb-2 uppercase">Aesthetic</h5>
                            <p className="text-xs font-display text-white italic">"{result.instaVibe}"</p>
                          </div>
                        )}
                      </div>

                      <div className="w-full">
                        <div className="flex items-center justify-between mb-4 px-4">
                          <span className="text-sm font-heading uppercase text-[var(--text-main)] italic text-pop">INTEL MAP</span>
                          <div className="bg-[#EF4444] text-white px-4 py-1 cartoon-border-sm rounded-full text-[10px] font-heading animate-pulse">LIVE</div>
                        </div>
                        <div className="w-full relative cartoon-border cartoon-shadow rounded-[3rem] h-80 overflow-hidden bg-[var(--card-bg)]">
                          <WinnerMap winnerName={result.mapsQuery} userLocation={userLocation} />
                        </div>
                      </div>

                      <div className="mt-12 flex flex-col sm:flex-row gap-4 w-full">
                        <a 
                          href={`https://www.google.com/maps/search/${encodeURIComponent(result.mapsQuery)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-[2] cartoon-button bg-[#6BCB77] text-white !py-8 !text-lg text-pop"
                        >
                          OTW SEKARANG! <Navigation size={24} />
                        </a>
                        <button 
                          onClick={() => setStep('SELECTION')}
                          className="flex-1 cartoon-button bg-[var(--card-bg)] text-[var(--text-main)] !py-8 !text-lg"
                        >
                          GANTI MENU
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}

            </AnimatePresence>
          </main>

          {/* OPTIONS MODAL */}
          <AnimatePresence>
            {isModalOpen && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, rotate: -5 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  exit={{ opacity: 0, scale: 0.9, rotate: 5 }}
                  className="cartoon-card bg-[var(--card-bg)] w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col relative"
                >
                  <div className="p-8 border-b-4 border-[var(--border-color)] bg-[#FFD93D] flex items-center justify-between">
                    <h3 className="text-2xl font-heading uppercase text-pop">Daftar Pilihan Menu</h3>
                    <button 
                      onClick={() => setIsModalOpen(false)}
                      className="w-12 h-12 bg-red-500 rounded-full cartoon-border flex items-center justify-center text-white cartoon-shadow-sm hover:scale-110 active:scale-95 transition-transform"
                    >
                      <X size={24} />
                    </button>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-8 bg-[var(--bg-color)]">
                    <div className="flex flex-wrap gap-4">
                      {options.map((opt, i) => (
                        <motion.div
                          key={`${opt}-${i}`}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="flex items-center gap-4 px-6 py-4 bg-[var(--card-bg)] cartoon-border rounded-2xl text-lg font-heading cartoon-shadow-sm group"
                        >
                          <span className="text-[var(--text-main)]">{opt}</span>
                          <button 
                            onClick={() => removeOption(i)} 
                            className="text-[var(--text-main)] hover:text-red-500 transition-colors"
                          >
                            <X size={22} />
                          </button>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  <div className="p-6 border-t-4 border-[var(--border-color)] bg-[var(--card-bg)] text-center">
                    <button 
                      onClick={() => setIsModalOpen(false)}
                      className="cartoon-button bg-[#6BCB77] text-white px-12"
                    >
                      OK, LANJUT!
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </APIProvider>
  );
}

