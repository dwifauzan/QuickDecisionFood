import { generateMapsUrl } from "../utils/helpers";

export function getMapsSearchUrl(query: string): string {
  return generateMapsUrl(query);
}
