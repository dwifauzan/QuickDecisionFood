import { WEATHER_CODES } from "../constants/config";

export interface WeatherData {
  temperature: number;
  description: string;
}

export async function fetchWeather(lat: number, lon: number): Promise<WeatherData> {
  try {
    const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code`);
    const data = await res.json();
    
    return {
      temperature: Math.round(data.current.temperature_2m),
      description: WEATHER_CODES[data.current.weather_code] || 'Cerah'
    };
  } catch (error) {
    console.error("Weather Fetch Error:", error);
    return { temperature: 28, description: 'Cerah' };
  }
}
