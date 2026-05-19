export interface WeatherInfo {
  temp: number;
  condition: string;
}

export function getWeatherPrompt(info: WeatherInfo): string {
  return `\nSuhu: ${info.temp}°C\nWeather: ${info.condition}`;
}
