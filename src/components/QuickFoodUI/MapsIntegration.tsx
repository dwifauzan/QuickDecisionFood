import React, { useState } from 'react';
import { useMapsLibrary } from '@vis.gl/react-google-maps';
import { MapPin, RefreshCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface MapsIntegrationProps {
  onPlacesFound: (places: string[]) => void;
  onLocationUpdate: (loc: google.maps.LatLngLiteral) => void;
  category: 'MAKANAN_SAJA' | 'MINUMAN_SAJA' | 'KEDUANYA' | null;
  setAlertMessage: (msg: string) => void;
}

export function MapsIntegration({ onPlacesFound, onLocationUpdate, category, setAlertMessage }: MapsIntegrationProps) {
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
            setAlertMessage('Tidak ditemukan tempat makan atau minum di sekitar lokasi Anda.');
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
        setAlertMessage('QuickFood butuh tahu lokasimu biar bisa cari tempat makan terdekat. Boleh ya?');
      },
      { enableHighAccuracy: true }
    );
  };

  return (
    <div className="relative">
      <button 
        onClick={findNearby}
        disabled={loading || !placesLib}
        className="cartoon-button bg-[var(--brand-blue)] text-white !pl-3 !pr-3 !pt-2 !pb-2 !border-2 md:!border-4 !shadow-[2px_2px_0px_0px_var(--border-color)] md:!shadow-[4px_4px_0px_0px_var(--border-color)] text-[10px] md:text-sm md:!pl-6 md:!pr-6 md:!pt-3 md:!pb-3 !rounded-xl md:!rounded-2xl shrink-0"
      >
        {loading ? <RefreshCcw size={12} className="animate-spin md:size-4" /> : <MapPin size={12} className="md:size-4" />}
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
