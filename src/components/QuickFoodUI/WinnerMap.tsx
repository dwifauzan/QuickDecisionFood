import React, { useState, useEffect } from 'react';
import { useMap, useMapsLibrary, Map, AdvancedMarker } from '@vis.gl/react-google-maps';
import { Navigation, MapPin } from 'lucide-react';

interface WinnerMapProps {
  winnerName: string;
  userLocation: google.maps.LatLngLiteral | null;
}

export function WinnerMap({ winnerName, userLocation }: WinnerMapProps) {
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
            <span className="text-[var(--text-main)] leading-snug line-clamp-2 break-words text-left">{winnerPlace.formattedAddress}</span>
          </div>
        </div>
      )}
    </div>
  );
}
