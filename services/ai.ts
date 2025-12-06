import { GoogleGenAI } from "@google/genai";

// Use process.env.API_KEY as strictly required by the environment
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
    
    // Robustly parse JSON by stripping potential Markdown code blocks
    const text = response.text || "{}";
    const cleanText = text.replace(/```json\n?|\n?```/g, "").trim();
    return JSON.parse(cleanText);
  } catch (error) {
    console.error("AI Parsing failed:", error);
    return null;
  }
}

/**
 * Uses Gemini to reverse geocode a latitude/longitude pair into a readable address.
 */
export async function reverseGeocode(lat: number, lng: number) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `What is the approximate address or landmark for latitude ${lat}, longitude ${lng}? Return ONLY the address as a string. Keep it concise (e.g., "Connaught Place, New Delhi").`,
    });
    return response.text ? response.text.trim() : `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  } catch (error) {
    console.error("AI Reverse Geocode failed:", error);
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  }
}