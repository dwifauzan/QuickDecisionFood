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

const SYSTEM_PROMPT = `Anda adalah "QuickFood AI Engine". Tugas Anda adalah memberikan keputusan kuliner yang diproses ke dalam struktur data yang sangat rapi untuk UI modern.

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
    <div className="w-full h-full relative group">
      <Map
        defaultCenter={userLocation || { lat: -6.2, lng: 106.8 }}
        defaultZoom={13}
        mapId="quickfood_minimal_map"
        gestureHandling={'greedy'}
        disableDefaultUI={true}
        internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
        style={{ width: '100%', height: '100%' }}
      >
        {winnerPlace?.location && (
          <AdvancedMarker position={winnerPlace.location}>
            <div className="bg-[var(--brand-blue)] text-white px-4 py-2.5 rounded-full font-bold text-sm shadow-2xl flex items-center gap-2 max-w-[180px] md:max-w-xs border-2 border-white scale-100 hover:scale-105 transition-transform">
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
      <div className="absolute inset-0 pointer-events-none border-[8px] border-[var(--text-main)]/10 rounded-3xl" />
      {winnerPlace && (
        <div className="absolute bottom-6 left-6 right-6 bg-[var(--card-bg)]/90 backdrop-blur-md border border-[var(--border-color)] p-4 rounded-2xl text-xs font-semibold shadow-xl z-10 flex items-start gap-3 transform translate-y-0 group-hover:-translate-y-1 transition-transform duration-500">
          <div className="bg-[var(--brand-blue)]/10 p-2 rounded-lg">
            <MapPin size={16} className="text-[var(--brand-blue)]" />
          </div>
          <div className="flex flex-col gap-0.5 min-w-0 flex-1">
            <span className="text-[var(--text-main)] opacity-50 uppercase text-[9px] tracking-widest font-black shrink-0">Alamat Lokasi</span>
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
        className="cartoon-button bg-[var(--brand-blue)] text-white !px-4 !py-2 text-[10px] md:text-sm md:!px-6 md:!py-3"
      >
        {loading ? <RefreshCcw className="animate-spin" size={16} /> : <MapPin size={16} />}
        Auto Cari Sekitar
      </button>

      <AnimatePresence>
        {apiError === 'NOT_ACTIVATED' && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="absolute top-full left-0 md:right-0 md:left-auto mt-4 w-[calc(100vw-4rem)] md:w-80 cartoon-card bg-[var(--card-bg)] z-50 p-6 shadow-2xl"
          >
            <div className="bg-[var(--brand-blue)] cartoon-border-sm px-4 py-1.5 rounded-xl cartoon-shadow-sm inline-block rotate-[-1deg] mb-4">
               <h4 className="text-[10px] font-heading uppercase text-white">API Belum Aktif</h4>
            </div>
            <p className="text-xs font-display text-[var(--text-main)] mb-6 leading-relaxed">
               Fitur ini butuh "Places API (New)" aktif di Google Cloud Console.
            </p>
            <a 
              href="https://console.developers.google.com/apis/api/places.googleapis.com/overview" 
              target="_blank" rel="noopener"
              className="cartoon-button bg-[var(--cartoon-yellow)] text-white text-[10px] w-full"
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
      <div className="cartoon-card !p-10 relative bg-[var(--card-bg)]/50 animate-pulse">
        <div className="flex flex-col items-center text-center">
          <div className="mb-8 p-8 bg-[var(--brand-blue)]/5 cartoon-border cartoon-shadow-sm rounded-[3rem] w-full flex flex-col items-center">
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
                <div className="w-12 h-12 bg-[var(--cartoon-yellow)]/20 rounded-xl mb-4" />
                <div className="w-16 h-4 bg-[var(--text-main)]/10 rounded-full mb-2" />
                <div className="w-24 h-4 bg-[var(--text-main)]/5 rounded-full" />
              </div>
            ))}
          </div>

          <div className="w-full">
            <div className="flex items-center justify-between mb-4 px-4">
              <div className="w-24 h-4 bg-[var(--text-main)]/10 rounded-full" />
              <div className="w-16 h-6 bg-[var(--brand-blue)]/20 rounded-full" />
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

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.9 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { type: "spring", stiffness: 300, damping: 20 }
  }
};

export default function QuickFoodUI() {
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
  const [isOptimizationEnabled, setIsOptimizationEnabled] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

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
      const healthyContext = isOptimizationEnabled 
        ? (isHealthyMode 
            ? "\nLOGIKA KEPUTUSAN: Prioritaskan memilih opsi yang paling menyehatkan secara nutrisi (misalnya: pilih Jus Buah murni di atas Kopi Susu/Sodagembira). Berikan tips Healthy Switch yang konkret." 
            : "\nCATATAN: Berikan tips modifikasi sehat secara umum.") 
        : "\nCATATAN: Abaikan pertimbangan nutrisi khusus.";
      
      const fastContext = isOptimizationEnabled 
        ? (isFastMode ? "\nURGENSI: Sangat Tinggi, pilih yang tercepat disajikan." : "\nURGENSI: Berikan estimasi kecepatan standar.") 
        : "";
        
      const instaContext = isOptimizationEnabled 
        ? (isInstaMode ? "\nAESTHETIC MODE: Aktif, pilih yang visualnya paling menarik/Instagrammable." : "\nAESTHETIC MODE: Berikan tips visual umum.") 
        : "";

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
      const healthyContext = isOptimizationEnabled 
        ? (isHealthyMode 
            ? "\nLOGIKA KEPUTUSAN: WAJIB memilih satu opsi yang paling sehat/bergizi dari daftar pilihan yang diberikan (contoh: Jus Alpukat > Es Teh). Berikan alasan medis/nutrisi singkat di [REASON] dan tips Healthy Switch di [HEALTHY_CARD]." 
            : "\nCATATAN: Berikan tips modifikasi sehat umum.") 
        : "\nCATATAN: Abaikan pertimbangan kesehatan khusus.";

      const fastContext = isOptimizationEnabled 
        ? (isFastMode ? "\nURGENSI: Sangat Tinggi, pilih yang penyajiannya paling cepat." : "\nURGENSI: Berikan estimasi kecepatan.") 
        : "";

      const instaContext = isOptimizationEnabled 
        ? (isInstaMode ? "\nAESTHETIC MODE: Aktif, pilih yang paling bagus untuk difoto." : "\nAESTHETIC MODE: Berikan tips visual umum.") 
        : "";

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
      <div className="relative min-h-screen w-full overflow-x-hidden font-sans text-[var(--text-main)] transition-colors duration-500 selection:bg-[var(--brand-blue)]/30">
        
        {/* BACKGROUND DECORATIONS */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden select-none z-0 opacity-10">
          <motion.img 
            initial={{ opacity: 0, scale: 0.8, rotate: 15 }}
            animate={{ opacity: 1, scale: 1, rotate: 10 }}
            transition={{ duration: 2, ease: "easeOut" }}
            src="/src/assets/images/cartoon_burger_sticker_1779040184450.png" 
            className="absolute -bottom-24 -right-24 w-[35rem] md:w-[50rem] lg:w-[65rem] h-auto" 
            alt=""
            referrerPolicy="no-referrer"
          />
        </div>

        {/* OVERLAY CONTENT */}
        <div className="relative z-10 flex flex-col min-h-screen">
          
          {/* TOP NAV */}
          <nav className="h-16 px-6 md:px-12 flex items-center justify-between pointer-events-auto sticky top-0 z-50">
            <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setStep('LANDING')}>
              <div className="w-12 h-12 bg-[var(--cartoon-yellow)] cartoon-border cartoon-shadow-sm rounded-2xl flex items-center justify-center group-hover:rotate-6 transition-transform duration-500">
                <Utensils size={24} className="text-[var(--text-main)]" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-2xl font-heading tracking-tight leading-none text-[var(--text-main)] group-hover:text-[var(--brand-blue)] transition-colors uppercase">QUICK FOOD</h1>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[var(--brand-blue)] animate-pulse" />
                  <span className="text-[10px] font-black text-[var(--text-main)] tracking-[0.2em] uppercase">Cartoon V3.0</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
      {step !== 'LANDING' ? (
        <button 
          onClick={() => setStep('LANDING')}
          className="cartoon-button bg-[var(--cartoon-orange)] text-white !px-3 md:!px-8 !py-1.5 md:!py-3 text-[10px] md:text-base"
        >
          <RefreshCcw size={14} /> RESET
        </button>
      ) : (
        <div className="flex items-center gap-2 px-4 py-2 bg-[var(--card-bg)] cartoon-border rounded-full shadow-sm transition-colors duration-500">
          <div className="w-2 h-2 rounded-full bg-[var(--cartoon-green)]" />
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
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  exit={{ opacity: 0, scale: 1.1, rotate: 2 }}
                  className="flex-1 flex flex-col justify-center items-center text-center py-6"
                >
                  <motion.div
                    variants={itemVariants}
                    className="mb-8 rotate-[-2deg] bg-[var(--cartoon-yellow)] cartoon-border p-4 cartoon-shadow-sm rounded-3xl"
                  >
                    <div className="flex items-center gap-2">
                       <Sparkles size={20} className="text-[var(--text-main)]" />
                       <span className="text-sm font-heading uppercase tracking-widest text-[var(--text-main)]">AI-Powered Ideas!</span>
                    </div>
                  </motion.div>

                  <motion.h2 variants={itemVariants} className="text-2xl md:text-6xl lg:text-7xl font-heading leading-[1.1] mb-6 md:mb-12 text-[var(--text-main)] uppercase text-pop max-w-4xl px-2">
                    BINGUNG PILIHANNYA BANYAK <br />
                    <span className="text-[var(--brand-blue)]">PAKAI QUICKFOOD AJA</span>
                  </motion.h2>
                  
                  {/* GLOBAL SEARCH BAR */}
                  <motion.div variants={itemVariants} className="w-full max-w-xl mb-16 px-4">
                    <div className="relative group/search">
                      <div className="relative flex items-center bg-[var(--card-bg)] cartoon-border rounded-3xl p-1.5 md:p-2 transition-all cartoon-shadow-lg">
                        <div className="hidden sm:flex pl-4 text-[var(--text-main)]">
                          <Search size={22} />
                        </div>
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleDirectSearch()}
                          placeholder="Cari makanan (mis: Bakso)..."
                          className="flex-1 bg-transparent px-3 md:px-4 py-3 md:py-4 outline-none text-base md:text-xl font-display placeholder:text-[var(--text-main)]/40 min-w-0"
                        />
                        <button
                          onClick={() => handleDirectSearch()}
                          className="cartoon-button bg-[var(--brand-blue)] text-white mr-1 md:mr-2 !px-4 md:!px-8 !py-2 md:!py-4 text-xs md:text-base"
                        >
                          CARI
                        </button>
                      </div>
                      <motion.p variants={itemVariants} className="mt-4 text-[10px] font-heading opacity-50 uppercase tracking-[0.2em] text-center text-[var(--text-main)]">
                        * cari tahu lokasi makanan yang kamu mau ada dimana
                      </motion.p>
                    </div>
                  </motion.div>

                  <motion.div variants={containerVariants} className="grid grid-cols-2 sm:grid-cols-3 gap-4 md:gap-8 w-full max-w-5xl px-4 mt-8">
                    {[
                      { id: 'MAKANAN_SAJA', label: 'Makanan', icon: Pizza, color: 'var(--brand-blue)', subtitle: 'Pilih Lauk' },
                      { id: 'MINUMAN_SAJA', label: 'Minuman', icon: Coffee, color: 'var(--brand-blue)', subtitle: 'Haus Pol' },
                      { id: 'KEDUANYA', label: 'Mix', icon: ChefHat, color: 'var(--brand-blue)', subtitle: 'Menu Lengkap' }
                    ].map(cat => (
                      <motion.button
                        key={cat.id}
                        variants={itemVariants}
                        onClick={() => { selectQuickstartCategory(cat.id as any); setStep('SELECTION'); }}
                        className={`group relative p-4 md:p-10 rounded-[1.5rem] md:rounded-[3rem] cartoon-border cartoon-shadow-lg transition-all hover:scale-105 active:scale-95 flex flex-col items-center gap-3 md:gap-6 w-full bg-[var(--brand-blue)] text-white overflow-hidden ${cat.id === 'KEDUANYA' ? 'col-span-2 sm:col-span-1' : ''}`}
                      >
                        {/* SHINE/GLARE EFFECT */}
                        <div className="absolute top-[-100%] left-[-100%] w-[300%] h-[300%] bg-gradient-to-tr from-transparent via-[var(--bg-color)]/10 to-transparent rotate-[35deg] translate-y-[-100%] group-hover:translate-y-[100%] transition-transform duration-1000 pointer-events-none" />
                        
                        {/* ICON CLUSTER */}
                        <div className="relative">
                          <motion.div 
                            className="w-12 h-12 md:w-24 md:h-24 bg-[var(--cartoon-yellow)] cartoon-border rounded-[1rem] md:rounded-[2.5rem] flex items-center justify-center text-[var(--text-main)] cartoon-shadow-sm relative z-10 group-hover:rotate-[15deg] transition-all duration-500"
                            whileHover={{ y: -5 }}
                          >
                            <cat.icon size={24} className="md:size-[44px] group-hover:scale-110 transition-transform" />
                          </motion.div>
                          
                          {/* FLOATING DECORATIONS */}
                          <div className="absolute -top-3 -right-3 p-1.5 bg-[var(--card-bg)] rounded-full cartoon-border-sm text-[var(--brand-blue)] opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0 cartoon-shadow-sm z-20">
                            <Sparkles size={16} />
                          </div>
                        </div>

                        {/* TEXT STACK */}
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-lg md:text-2xl font-heading uppercase text-pop tracking-tight leading-none text-white">{cat.label}</span>
                          <span className="text-[8px] md:text-[10px] font-black uppercase opacity-60 tracking-[0.2em] text-white">{cat.subtitle}</span>
                        </div>

                        {/* DECORATIVE BAR */}
                        <div className="w-12 h-1.5 bg-white/20 rounded-full mt-2 group-hover:w-24 group-hover:bg-white/40 transition-all duration-500" />


                        {cat.id === 'KEDUANYA' && (
                          <div className="absolute top-5 right-5 bg-[var(--cartoon-pink)] text-[var(--brand-blue)] cartoon-border-sm px-4 py-1.5 rounded-2xl text-[9px] font-black uppercase rotate-[15deg] group-hover:rotate-[5deg] transition-all cartoon-shadow-sm whitespace-nowrap">
                            PILIHAN BOS!
                          </div>
                        )}
                      </motion.button>
                    ))}
                  </motion.div>
                </motion.div>
              )}

              {/* 2. SELECTION STEP */}
              {step === 'SELECTION' && (
                <motion.div
                  key="selection"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  exit={{ opacity: 0, x: -100 }}
                  className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative pb-10"
                >
                  {/* Left: Inputs */}
                  <motion.div variants={itemVariants} className="lg:col-span-8 space-y-6 md:space-y-8">
                    <div className="cartoon-card bg-[var(--bg-color)] !p-5 md:!p-10">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 md:mb-8 gap-4">
                        <motion.div variants={itemVariants}>
                          <div className="bg-[var(--cartoon-orange)] cartoon-border px-4 md:px-6 py-1.5 md:py-2 rounded-full cartoon-shadow-sm inline-block rotate-[-1deg] mb-2">
                             <h3 className="text-[9px] md:text-[10px] font-heading uppercase text-white">Engine Mode</h3>
                          </div>
                          <div className="flex items-center gap-3">
                            <Utensils size={20} className="md:size-6 text-[var(--text-main)]" />
                            <span className="text-lg md:text-xl font-heading tracking-tight uppercase text-[var(--text-main)]">{category?.replace('_', ' ')}</span>
                          </div>
                        </motion.div>
                      </div>

                      <motion.div variants={itemVariants} className="space-y-4 md:space-y-6">
                        <label className="text-xs md:text-sm font-heading uppercase ml-2 text-[var(--text-main)] block mb-1 md:mb-2">Tulis Menu / Tempat:</label>
                        <div className="flex gap-2 md:gap-4 p-2 md:p-3 bg-[var(--card-bg)] cartoon-border rounded-2xl md:rounded-full cartoon-shadow-sm">
                          <input
                            type="text"
                            value={newOption}
                            onChange={(e) => setNewOption(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && addOption()}
                            placeholder="Ketik ide kulinermu..."
                            className="flex-1 bg-transparent px-3 md:px-4 py-2 md:py-3 outline-none text-base md:text-xl font-display placeholder:text-[var(--text-main)]/40 min-w-0"
                          />
                          <button 
                            onClick={addOption}
                            className="cartoon-button bg-[var(--cartoon-orange)] text-white !p-3 md:!p-4"
                          >
                            <Plus size={24} className="md:size-8" />
                          </button>
                        </div>
                        
                        <motion.div variants={itemVariants} className="flex justify-start px-2">
                           <MapsIntegration 
                            category={category}
                            onLocationUpdate={setUserLocation} 
                            onPlacesFound={(places) => setOptions(prev => [...new Set([...prev, ...places])])} 
                           />
                        </motion.div>
                      </motion.div>

                      <motion.div variants={itemVariants} className="mt-6 md:mt-8">
                        {options.length > 0 && (
                          <label className="text-[10px] md:text-xs font-heading uppercase ml-2 text-[var(--text-main)] block mb-3 opacity-70">
                            Makanan yang anda pilih:
                          </label>
                        )}
                        <div className="flex flex-wrap gap-2 md:gap-3">
                          <AnimatePresence mode="popLayout">
                            {options.slice(0, options.length > 8 ? 6 : options.length).map((opt, i) => (
                              <motion.div
                                key={`${opt}-${i}`}
                                layout
                                initial={{ opacity: 0, scale: 0.5, rotate: -10 }}
                                animate={{ opacity: 1, scale: 1, rotate: (i % 2 === 0 ? 1 : -1) }}
                                exit={{ opacity: 0, scale: 0 }}
                                className="flex items-center gap-2 md:gap-3 px-4 md:px-6 py-2 md:py-3 bg-[var(--card-bg)] cartoon-border rounded-full text-[10px] md:text-sm font-heading cartoon-shadow-sm group"
                              >
                                <span className="max-w-[120px] md:max-w-[150px] truncate text-[var(--text-main)]">{opt}</span>
                                <button onClick={() => removeOption(i)} className="text-[var(--text-main)] hover:text-[var(--brand-blue)] transition-colors">
                                  <X size={14} className="md:size-[18px]" />
                                </button>
                              </motion.div>
                            ))}
                          </AnimatePresence>
                          
                          {options.length > (options.length > 8 ? 6 : options.length) && (
                            <button 
                              onClick={() => setIsModalOpen(true)}
                              className="flex items-center gap-2 px-4 md:px-6 py-2 md:py-3 bg-[var(--cartoon-yellow)] cartoon-border rounded-full text-[10px] md:text-sm font-heading cartoon-shadow-sm hover:scale-105 transition-transform font-bold text-[#2D2727]"
                            >
                              <Plus size={14} /> LIHAT ({options.length})
                            </button>
                          )}
                        </div>

                        {options.length === 0 && (
                          <div className="w-full py-12 px-4 border-4 border-dashed border-[var(--border-color)] opacity-30 rounded-3xl text-center bg-[var(--text-main)]/5">
                            <p className="text-[var(--text-main)] font-heading text-sm uppercase italic">
                              Pilihan Masih Kosong!
                            </p>
                          </div>
                        )}
                      </motion.div>

                      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mt-8 md:mt-10 p-4 md:p-6 rounded-[2rem] md:rounded-3xl border-4 border-[var(--border-color)] cartoon-shadow-sm transition-colors duration-500" style={{ backgroundColor: 'var(--accent-soft)' }}>
                        <div className="space-y-2 md:space-y-4">
                          <label className="text-[10px] md:text-xs font-heading uppercase ml-1 text-[var(--text-main)] block mb-1">Berapa Duit?</label>
                          <div className="flex items-center gap-3 md:gap-4 bg-[var(--card-bg)] cartoon-border p-3 md:p-4 rounded-full cartoon-shadow-sm">
                            <Wallet size={20} className="md:size-6 text-[var(--text-main)]" />
                            <input type="text" value={budget} onChange={handleBudgetChange} placeholder="No Limit" className="bg-transparent outline-none font-display text-base md:text-xl w-full" />
                          </div>
                        </div>
                        <div className="space-y-2 md:space-y-4">
                          <label className="text-[10px] md:text-xs font-heading uppercase ml-1 text-[var(--text-main)] block mb-1">Ada Vibe Khusus?</label>
                          <div className="flex items-center gap-3 md:gap-4 bg-[var(--card-bg)] cartoon-border p-3 md:p-4 rounded-full cartoon-shadow-sm">
                            <Wind size={20} className="md:size-6 text-[var(--text-main)]" />
                            <input type="text" value={context} onChange={(e) => setContext(e.target.value)} placeholder="Pedas, Santai..." className="bg-transparent outline-none font-display text-base md:text-xl w-full" />
                          </div>
                        </div>
                      </motion.div>

                      {/* FEATURE TOGGLES */}
                        <motion.div variants={itemVariants} className="mt-10 space-y-8 md:space-y-6">
                        <div className="flex items-center justify-between px-2">
                          <label className="text-xs font-heading uppercase text-[var(--text-main)] block mb-2">Optimization Engine</label>
                          <div className="flex items-center bg-[var(--card-bg)] cartoon-border-sm rounded-full p-1 cartoon-shadow-sm">
                            <button 
                              onClick={() => setIsOptimizationEnabled(true)}
                              className={`px-4 py-1 rounded-full text-[10px] font-heading transition-all ${isOptimizationEnabled ? 'bg-[var(--brand-blue)] text-white' : 'text-[var(--text-main)]/40 hover:text-[var(--text-main)]'}`}
                            >
                              ON
                            </button>
                            <button 
                              onClick={() => {
                                setIsOptimizationEnabled(false);
                                setIsHealthyMode(false);
                                setIsFastMode(false);
                                setIsInstaMode(false);
                              }}
                              className={`px-4 py-1 rounded-full text-[10px] font-heading transition-all ${!isOptimizationEnabled ? 'bg-[var(--brand-blue)] text-white' : 'text-[var(--text-main)]/40 hover:text-[var(--text-main)]'}`}
                            >
                              OFF
                            </button>
                          </div>
                        </div>
                        
                        <div className={`grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-4 transition-all duration-500 ${!isOptimizationEnabled ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>
                          {[
                            { id: 'insta', active: isInstaMode, set: setIsInstaMode, icon: Camera, label: 'Visual', color: 'var(--brand-blue)', bg: 'var(--accent-soft)' },
                            { id: 'healthy', active: isHealthyMode, set: setIsHealthyMode, icon: Heart, label: 'Healthy', color: 'var(--brand-blue)', bg: 'var(--accent-soft)' },
                            { id: 'fast', active: isFastMode, set: setIsFastMode, icon: Sparkles, label: 'Fast', color: 'var(--brand-blue)', bg: 'var(--accent-soft)' }
                          ].map((feat) => (
                            <button 
                              key={feat.id}
                              onClick={() => isOptimizationEnabled && feat.set(!feat.active)}
                              className={`flex items-center justify-between p-3 md:p-4 cartoon-border rounded-2xl md:rounded-3xl transition-all ${feat.id === 'fast' ? 'col-span-2 sm:col-span-1' : ''} ${feat.active && isOptimizationEnabled ? 'cartoon-shadow-sm scale-105' : 'bg-[var(--bg-color)] opacity-50'}`}
                              style={feat.active && isOptimizationEnabled ? { borderColor: feat.color, color: feat.color, backgroundColor: feat.bg } : {}}
                            >
                              <div className="flex items-center gap-2 md:gap-3">
                                <feat.icon size={16} className="md:size-5" />
                                <span className="font-heading text-[10px] md:text-sm uppercase">{feat.label}</span>
                              </div>
                              <div className={`w-2 h-2 md:w-3 md:h-3 rounded-full cartoon-border ${feat.active && isOptimizationEnabled ? 'bg-current' : 'bg-transparent'}`} />
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    </div>
                  </motion.div>

                  {/* Right: Meta & Action */}
                  <motion.div variants={itemVariants} className="lg:col-span-4 space-y-8 lg:sticky lg:top-20">
                    <motion.div variants={itemVariants} className="cartoon-card bg-[var(--cartoon-orange)] text-white">
                      <div className="flex items-center justify-between mb-6">
                        <span className="text-xs font-heading uppercase">Cek Telemetri</span>
                        <Sun className={`animate-spin-slow duration-[10s] text-yellow-400`} size={24} />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-[var(--card-bg)]/20 p-4 rounded-2xl border-4 border-[var(--card-bg)]/30">
                          <h4 className="text-2xl md:text-4xl font-heading text-pop">{temperature}°</h4>
                          <span className="text-[10px] font-heading uppercase">Celcius</span>
                        </div>
                        <div className="bg-[var(--card-bg)]/20 p-4 rounded-2xl border-4 border-[var(--card-bg)]/30 text-right">
                          <h4 className="text-base md:text-xl font-heading truncate text-pop">{weather}</h4>
                          <span className="text-[10px] font-heading uppercase">Sky</span>
                        </div>
                      </div>
                    </motion.div>

                    <motion.div variants={itemVariants} className="space-y-4">
                      <button
                        onClick={handleDecision}
                        disabled={loading || options.length === 0}
                        className="w-full cartoon-button bg-[var(--brand-blue)] !py-5 md:!py-8 text-white !text-xl md:!text-2xl cartoon-shadow-lg !rounded-[2rem] md:!rounded-[3rem] shadow-[var(--brand-blue)]/20"
                      >
                        <span className="flex items-center justify-center gap-3 md:gap-4 text-pop">
                          {loading ? <Loader2 size={24} className="animate-spin md:size-8" /> : <ChefHat size={24} className="md:size-8" />}
                          {loading ? 'MEMASAK...' : 'GASKEUN!'}
                        </span>
                      </button>
                      
                      {error && (
                        <div className="p-4 bg-[var(--card-bg)] border-4 border-[var(--brand-blue)] rounded-2xl flex items-center gap-3">
                          <div className="w-6 h-6 bg-[var(--brand-blue)] rounded-full flex items-center justify-center text-white text-[10px]">!</div>
                          <span className="text-[10px] font-heading uppercase text-[var(--brand-blue)]">{error}</span>
                        </div>
                      )}
                    </motion.div>
                  </motion.div>
                </motion.div>
              )}

              {/* 3. RESULT STEP */}
              {step === 'RESULT' && (loading ? <ResultSkeleton /> : result && (
                <motion.div
                  key="result"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  exit={{ opacity: 0, scale: 2, rotate: 20 }}
                  className="max-w-4xl mx-auto w-full pb-10"
                >
                    <motion.div variants={itemVariants} className="cartoon-card !p-5 md:!p-10 relative bg-[var(--card-bg)] transition-colors duration-500">
                      <button 
                        onClick={() => setStep('SELECTION')}
                        className="absolute top-2 right-2 md:top-4 md:right-4 w-10 h-10 md:w-12 md:h-12 bg-[var(--brand-blue)] rounded-full cartoon-border flex items-center justify-center text-white cartoon-shadow-sm z-20 hover:scale-110 active:scale-95"
                      >
                        <X size={20} className="md:size-6" />
                      </button>
                      
                      <div className="flex flex-col items-center text-center relative z-10">
                        <motion.div variants={itemVariants} className="mb-6 md:mb-8 p-6 md:p-8 bg-[var(--brand-blue)]/5 cartoon-border cartoon-shadow rounded-[2rem] md:rounded-[3rem] rotate-[-1deg] md:rotate-[-2deg] w-full transition-colors duration-500">
                          <div className="bg-[var(--brand-blue)] cartoon-border px-4 md:px-6 py-1.5 md:py-2 rounded-full cartoon-shadow-sm inline-block mb-4 rotate-[1deg]">
                             <span className="text-[9px] md:text-[10px] font-heading uppercase text-white tracking-widest">HASIL ANALISIS AI</span>
                          </div>
                        <h2 className="text-3xl md:text-7xl lg:text-8xl font-heading text-[var(--text-main)] uppercase text-pop leading-tight md:leading-none mt-2">
                          {result.name}
                        </h2>
                        
                        <div className="mt-4 md:mt-8 max-w-2xl mx-auto">
                          <p className="text-lg md:text-3xl text-[var(--text-main)] font-display mb-6 md:mb-8 italic">
                            "{result.reason}"
                          </p>
                        </div>
 
                        <div className="flex flex-wrap justify-center gap-2 md:gap-3">
                          {result.tags.map((tag, i) => (
                            <span 
                              key={i} 
                              className="px-4 md:px-6 py-1.5 md:py-2 bg-[var(--cartoon-orange)] text-white cartoon-border rounded-full text-[10px] md:text-xs font-heading uppercase"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </motion.div>

                      {isOptimizationEnabled && (
                        <motion.div variants={containerVariants} className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mb-10">
                          {result.urgencyStatus && (
                            <motion.div variants={itemVariants} className="cartoon-card !p-6 bg-[var(--card-bg)] flex flex-col items-center transition-colors duration-500">
                              <div className="w-12 h-12 bg-[var(--cartoon-yellow)] cartoon-border rounded-xl flex items-center justify-center mb-4 cartoon-shadow-sm">
                                <Loader2 size={24} className="text-[var(--text-main)]" />
                              </div>
                              <h5 className="text-[9px] font-heading text-[var(--text-main)] mb-2 uppercase">Tempo</h5>
                              <p className="text-sm font-heading text-[var(--text-main)]">{result.urgencyStatus}</p>
                            </motion.div>
                          )}
                          {result.healthySwitch && (
                            <motion.div variants={itemVariants} className="cartoon-card !p-6 flex flex-col items-center transition-all duration-500" style={{ backgroundColor: 'var(--feature-healthy-bg)', borderColor: 'var(--feature-healthy)' }}>
                              <div className="w-12 h-12 bg-[var(--cartoon-yellow)] cartoon-border rounded-xl flex items-center justify-center mb-4 cartoon-shadow-sm">
                                <Heart size={24} style={{ color: 'var(--feature-healthy)' }} />
                              </div>
                              <h5 className="text-[9px] font-heading text-[var(--text-main)] mb-2 uppercase opacity-80">Wellness</h5>
                              <p className="text-xs font-display text-[var(--text-main)] italic">"{result.healthySwitch}"</p>
                            </motion.div>
                          )}
                          {result.instaVibe && (
                            <motion.div variants={itemVariants} className="cartoon-card !p-6 flex flex-col items-center transition-all duration-500" style={{ backgroundColor: 'var(--feature-insta-bg)', borderColor: 'var(--feature-insta)' }}>
                              <div className="w-12 h-12 bg-[var(--cartoon-yellow)] cartoon-border rounded-xl flex items-center justify-center mb-4 cartoon-shadow-sm">
                                <Camera size={24} style={{ color: 'var(--feature-insta)' }} />
                              </div>
                              <h5 className="text-[9px] font-heading text-[var(--text-main)] mb-2 uppercase opacity-80">Aesthetic</h5>
                              <p className="text-xs font-display text-[var(--text-main)] italic">"{result.instaVibe}"</p>
                            </motion.div>
                          )}
                        </motion.div>
                      )}

                      <motion.div variants={itemVariants} className="w-full">
                        <div className="flex items-center justify-between mb-4 px-4">
                          <span className="text-sm font-heading uppercase text-[var(--text-main)] italic text-pop">INTEL MAP</span>
                          <div className="bg-[var(--brand-blue)] text-white px-4 py-1 cartoon-border-sm rounded-full text-[10px] font-heading animate-pulse">LIVE</div>
                        </div>
                        <div className="w-full relative cartoon-border cartoon-shadow rounded-[3rem] h-80 overflow-hidden bg-[var(--card-bg)]">
                          <WinnerMap winnerName={result.mapsQuery} userLocation={userLocation} />
                        </div>
                      </motion.div>
 
                      <motion.div variants={itemVariants} className="mt-8 md:mt-12 flex flex-col sm:flex-row gap-4 w-full">
                        <a 
                          href={`https://www.google.com/maps/search/${encodeURIComponent(result.mapsQuery)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-[2] cartoon-button bg-[var(--brand-blue)] text-white !py-5 md:!py-8 !text-base md:!text-lg text-pop"
                        >
                          OTW SEKARANG! <Navigation size={20} className="md:size-6" />
                        </a>
                        <button 
                          onClick={() => setStep('SELECTION')}
                          className="flex-1 cartoon-button bg-[var(--card-bg)] text-[var(--text-main)] !py-5 md:!py-8 !text-base md:!text-lg"
                        >
                          GANTI MENU
                        </button>
                      </motion.div>
                    </div>
                  </motion.div>
                </motion.div>
              ))}

            </AnimatePresence>
          </main>

          {/* OPTIONS MODAL */}
          <AnimatePresence>
            {isModalOpen && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[var(--text-main)]/60 backdrop-blur-sm">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, rotate: -5 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  exit={{ opacity: 0, scale: 0.9, rotate: 5 }}
                  className="cartoon-card bg-[var(--card-bg)] w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col relative"
                >
                  <div className="p-8 border-b-4 border-[var(--border-color)] bg-[var(--cartoon-yellow)] flex items-center justify-between rounded-t-[3rem] -mb-1">

                    <h3 className="text-2xl font-heading uppercase text-pop">Daftar Menu ({options.length})</h3>
                    <button 
                      onClick={() => setIsModalOpen(false)}
                      className="w-12 h-12 bg-[var(--brand-blue)] rounded-full cartoon-border flex items-center justify-center text-white cartoon-shadow-sm hover:scale-110 active:scale-95 transition-transform"
                    >
                      <X size={24} />
                    </button>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-8 bg-[var(--bg-color)]">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {options.map((opt, i) => (
                        <motion.div
                          key={`${opt}-${i}`}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="flex items-center justify-between gap-4 px-6 py-4 bg-[var(--card-bg)] cartoon-border rounded-full text-lg font-heading cartoon-shadow-sm group w-full border-l-[12px] border-l-[var(--cartoon-orange)]"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-full bg-[var(--text-main)]/10 flex items-center justify-center text-xs text-[var(--text-main)]/40 font-black shrink-0">
                              {i + 1}
                            </div>
                            <span className="text-[var(--text-main)] truncate">{opt}</span>
                          </div>
                          <button 
                            onClick={() => removeOption(i)} 
                            className="text-[var(--text-main)] hover:text-[var(--brand-blue)] transition-colors"
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
                      className="cartoon-button bg-[var(--brand-blue)] text-white px-12"
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

