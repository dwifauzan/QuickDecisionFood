import { useState, useEffect } from 'react';
import { fetchWeather } from '../services/weather';
import { getAIDecision } from '../services/gemini';
import { parseAIResponse, ParsedDecision } from '../utils/parser';
import { getBudgetPrompt } from '../features/logic_budget';
import { getWeatherPrompt } from '../features/logic_weather';

export function useDecisionLogic() {
  const [userLocation, setUserLocation] = useState<google.maps.LatLngLiteral | null>(null);
  const [temperature, setTemperature] = useState<number>(28);
  const [weather, setWeather] = useState('Mendeteksi...');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<ParsedDecision | null>(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => console.log('Location access denied', err),
        { enableHighAccuracy: true }
      );
    }
  }, []);

  useEffect(() => {
    if (!userLocation) return;
    fetchWeather(userLocation.lat, userLocation.lng).then(data => {
      setTemperature(data.temperature);
      setWeather(data.description);
    });
  }, [userLocation]);

  const processDecision = async (params: {
    options: string[];
    category: string | null;
    budget: string;
    context: string;
    isHealthy: boolean;
    isFast: boolean;
    isInsta: boolean;
    isOptimizationEnabled: boolean;
  }) => {
    setLoading(true);
    setError('');
    
    try {
      const { options, category, budget, context, isHealthy, isFast, isInsta, isOptimizationEnabled } = params;
      
      const optimizationInstructions = isOptimizationEnabled ? `
PENTING: Hanya berikan bagian kartu di bawah ini jika diinstruksikan Ya:
- [HEALTHY_CARD]: ${isHealthy ? "Ya" : "Hanya jika sangat relevan secara natural, jika tidak tulis N/A"}
- [URGENCY_STATUS]: ${isFast ? "Ya (Berikan status CEPAT)" : "Hanya jika sangat relevan, jika tidak tulis N/A"}
- [INSTA_VIBE_CARD]: ${isInsta ? "Ya" : "Hanya jika sangat relevan, jika tidak tulis N/A"}
` : "\nJANGAN berikan bagian [HEALTHY_CARD], [URGENCY_STATUS], atau [INSTA_VIBE_CARD].";

      const prompt = `Pilihan: ${options.join(', ')}
${getBudgetPrompt(budget)}
${context ? `Konteks: ${context}` : ''}
${getWeatherPrompt({ temp: temperature, condition: weather })}
KATEGORI: ${category || 'KEDUANYA'}
${optimizationInstructions}`;

      const aiResponse = await getAIDecision(prompt);
      const parsed = parseAIResponse(aiResponse, options[0] || "Makanan Enak");
      setResult(parsed);
    } catch (err: any) {
      setError("Waduh, AI-nya lagi capek nih. Coba klik sekali lagi ya!");
    } finally {
      setLoading(false);
    }
  };

  return {
    userLocation,
    setUserLocation,
    temperature,
    weather,
    loading,
    error,
    setError,
    result,
    setResult,
    processDecision
  };
}
