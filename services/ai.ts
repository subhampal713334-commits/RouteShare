/**
 * Local heuristic service to replace Gemini AI.
 * Provides basic text parsing for search queries and coordinate formatting.
 */

/**
 * Parses a natural language query into structured search filters using basic string manipulation.
 * Supports patterns like "Bike to Cyber Hub" or "Delhi to Gurgaon".
 */
export async function parseSearchQuery(query: string) {
  if (!query) return null;
  const lowerQuery = query.toLowerCase().trim();

  let from = "";
  let to = "";
  let vehicleType = "";

  // 1. Detect Vehicle Type
  const vehicleKeywords = ["sedan", "suv", "hatchback", "bike", "scooty", "ev scooty", "luxury"];
  for (const v of vehicleKeywords) {
    if (lowerQuery.includes(v)) {
      // Find the match in the original query to preserve casing if we wanted, 
      // but here we just standardize the output tag.
      vehicleType = v.charAt(0).toUpperCase() + v.slice(1);
      
      // We don't remove it from the string to keep the 'from/to' parsing simple below,
      // as usually vehicle comes at start or end.
      break;
    }
  }

  // 2. Detect "From X To Y" or "X To Y"
  // Split by " to " (with spaces to avoid matching words like 'top')
  if (lowerQuery.includes(" to ")) {
    const parts = query.split(/ to /i); // Case insensitive split
    
    if (parts.length >= 2) {
      // If the first part contains "from ", strip it
      let rawFrom = parts[0].trim();
      if (rawFrom.toLowerCase().startsWith("from ")) {
        rawFrom = rawFrom.substring(5).trim();
      }

      // If the first part was just the vehicle type (e.g. "Bike to Office"), 
      // then 'from' is likely empty or implied current location.
      // However, usually users type "Loc A to Loc B".
      
      // Clean up vehicle name from location strings if it appears there
      if (vehicleType) {
        const vehicleRegex = new RegExp(vehicleType, "gi");
        rawFrom = rawFrom.replace(vehicleRegex, "").trim();
        parts[1] = parts[1].replace(vehicleRegex, "").trim();
      }

      from = rawFrom;
      to = parts[1].trim();
    }
  } else {
    // If no "to" keyword, strictly check if it's just a vehicle search
    if (!vehicleType) {
      // Treat whole string as generic search (handled by caller fallback)
      return null;
    }
  }

  // Simulate network delay for "AI" feel
  await new Promise(resolve => setTimeout(resolve, 600));

  if (from || to || vehicleType) {
    return { from, to, vehicleType };
  }

  return null;
}

/**
 * Mocks reverse geocoding by returning formatted coordinates.
 * (Real reverse geocoding requires Google Maps API or similar).
 */
export async function reverseGeocode(lat: number, lng: number) {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
}