import { GoogleGenAI } from "@google/genai";
import { GEMINI_API_KEY } from "../constants/config";
import { SYSTEM_PROMPT } from "../constants/prompts";

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

export async function getAIDecision(prompt: string) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        temperature: 0.7
      }
    });
    
    return response.text || '';
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
}
