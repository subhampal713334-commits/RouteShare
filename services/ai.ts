import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Uses Gemini to parse a natural language query into structured search filters.
 */
export async function parseSearchQuery(query: string) {
  if (!query) return null;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Extract search intent from this ride-share query: "${query}". 
      Return ONLY a JSON object with these optional keys: 'from' (origin), 'to' (destination), 'vehicleType' (Sedan, SUV, Luxury, Bike). 
      If a location isn't specified, ignore it. Example input: "Luxury car to airport". Output: {"to": "Airport", "vehicleType": "Luxury"}`,
      config: {
        responseMimeType: "application/json",
      },
    });
    
    return JSON.parse(response.text);
  } catch (error) {
    console.error("AI Parsing failed:", error);
    return null;
  }
}
