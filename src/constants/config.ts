export const GOOGLE_MAPS_KEY = process.env.GOOGLE_MAPS_PLATFORM_KEY || '';
export const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

export const WEATHER_CODES: Record<number, string> = {
  0: 'Cerah', 1: 'Cerah Berawan', 2: 'Berawan', 3: 'Mendung',
  45: 'Berkabut', 48: 'Kabut Berembun',
  51: 'Gerimis', 53: 'Gerimis', 55: 'Gerimis Lebat',
  61: 'Hujan Ringan', 63: 'Hujan', 65: 'Hujan Lebat',
  80: 'Hujan Shower', 95: 'Badai Petir'
};
