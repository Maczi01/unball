import { GoogleGenerativeAI } from "@google/generative-ai";

export interface PhotoAnalysisResult {
  location?: string;
  year?: number;
  tags?: string[];
  description?: string;
  stadium?: string;
  teams?: string[];
  competition?: string;
  confidence: "high" | "medium" | "low";
  rawResponse?: string;
  wikipediaEnriched?: boolean;
  wikipediaSources?: string[];
}

export interface PhotoAnalysisError {
  error: string;
  details?: string;
}

/**
 * Analyzes a football photo using Google Gemini AI
 * @param imageData - Base64 encoded image data (without the data:image/... prefix)
 * @param mimeType - MIME type of the image (e.g., 'image/jpeg', 'image/png')
 * @returns Analysis results or error
 */
export async function analyzePhotoWithGemini(
  imageData: string,
  mimeType: string
): Promise<PhotoAnalysisResult | PhotoAnalysisError> {
  try {
    const apiKey = import.meta.env.GOOGLE_GEMINI_API_KEY;

    if (!apiKey) {
      return {
        error: "Gemini API key not configured",
        details: "Please set GOOGLE_GEMINI_API_KEY in your environment variables",
      };
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

    const prompt = `Analyze this football/soccer match photo and extract the following information in JSON format:

{
  "location": "City, Country (if identifiable from stadium or context)",
  "year": estimated year (number, based on image quality, kit styles, stadium features),
  "stadium": "Stadium name (if recognizable)",
  "teams": ["Team 1", "Team 2"] (based on jersey colors, sponsors, or visible logos),
  "competition": "Competition name (e.g., Premier League, Champions League, World Cup)",
  "tags": ["tag1", "tag2", "tag3"] (relevant keywords like: match-action, celebration, crowd, historic-moment, rivalry, etc.),
  "description": "Brief 1-2 sentence description of what's happening in the photo",
  "confidence": "high" | "medium" | "low" (your overall confidence in the analysis)
}

Important:
- Only include fields you can identify with reasonable confidence
- If you're unsure about something, either omit it or mark confidence as "low"
- For tags, include relevant keywords that describe the scene, atmosphere, or significance
- Be specific about teams if jerseys/logos are visible
- Year estimation can be approximate (e.g., early 2000s = 2003, late 90s = 1998)

Return ONLY valid JSON, no additional text.`;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: imageData,
          mimeType,
        },
      },
    ]);

    const response = await result.response;
    const text = response.text();

    // Try to extract JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      // If no JSON found, return raw response
      return {
        confidence: "low",
        description: text,
        rawResponse: text,
      };
    }

    const analysisData = JSON.parse(jsonMatch[0]);

    // Validate and structure the response
    const result_: PhotoAnalysisResult = {
      confidence: analysisData.confidence || "medium",
      rawResponse: text,
    };

    if (analysisData.location) result_.location = analysisData.location;
    if (analysisData.year && typeof analysisData.year === "number") {
      result_.year = analysisData.year;
    }
    if (analysisData.stadium) result_.stadium = analysisData.stadium;
    if (Array.isArray(analysisData.teams) && analysisData.teams.length > 0) {
      result_.teams = analysisData.teams;
    }
    if (analysisData.competition) result_.competition = analysisData.competition;
    if (Array.isArray(analysisData.tags) && analysisData.tags.length > 0) {
      result_.tags = analysisData.tags;
    }
    if (analysisData.description) result_.description = analysisData.description;

    // Enrich with Wikipedia data
    const enrichedResult = await enrichWithWikipedia(result_);

    return enrichedResult;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Gemini API error:", error);
    return {
      error: "Failed to analyze photo",
      details: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Search Wikipedia for information about a topic
 */
async function searchWikipedia(query: string): Promise<{ title: string; extract: string; url: string } | null> {
  try {
    const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&origin=*`;
    const searchResponse = await fetch(searchUrl);
    const searchData = await searchResponse.json();

    if (!searchData.query?.search?.[0]) {
      return null;
    }

    const pageTitle = searchData.query.search[0].title;
    const extractUrl = `https://en.wikipedia.org/w/api.php?action=query&prop=extracts&exintro&explaintext&titles=${encodeURIComponent(pageTitle)}&format=json&origin=*`;
    const extractResponse = await fetch(extractUrl);
    const extractData = await extractResponse.json();

    const pages = extractData.query?.pages;
    const pageId = Object.keys(pages)[0];
    const extract = pages[pageId]?.extract;

    if (!extract) {
      return null;
    }

    return {
      title: pageTitle,
      extract: extract.substring(0, 500), // First 500 chars
      url: `https://en.wikipedia.org/wiki/${encodeURIComponent(pageTitle.replace(/ /g, "_"))}`,
    };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Wikipedia search error:", error);
    return null;
  }
}

/**
 * Enrich analysis with Wikipedia data
 */
async function enrichWithWikipedia(analysis: PhotoAnalysisResult): Promise<PhotoAnalysisResult> {
  const wikipediaSources: string[] = [];
  const enrichedAnalysis = { ...analysis };

  try {
    // Search for stadium information
    if (analysis.stadium) {
      const stadiumInfo = await searchWikipedia(`${analysis.stadium} football stadium`);
      if (stadiumInfo) {
        wikipediaSources.push(stadiumInfo.url);

        // Try to extract location from Wikipedia if not already set
        if (!enrichedAnalysis.location) {
          // Simple pattern matching for city/country in stadium descriptions
          const locationMatch = stadiumInfo.extract.match(
            /in ([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/
          );
          if (locationMatch) {
            enrichedAnalysis.location = `${locationMatch[1]}, ${locationMatch[2]}`;
          }
        }
      }
    }

    // Search for competition information
    if (analysis.competition) {
      const competitionInfo = await searchWikipedia(analysis.competition);
      if (competitionInfo) {
        wikipediaSources.push(competitionInfo.url);
      }
    }

    // Search for team information to verify
    if (analysis.teams && analysis.teams.length > 0) {
      for (const team of analysis.teams.slice(0, 2)) {
        // Limit to 2 teams
        const teamInfo = await searchWikipedia(`${team} football club`);
        if (teamInfo) {
          wikipediaSources.push(teamInfo.url);
        }
      }
    }

    // If we found Wikipedia sources, mark as enriched and upgrade confidence
    if (wikipediaSources.length > 0) {
      enrichedAnalysis.wikipediaEnriched = true;
      enrichedAnalysis.wikipediaSources = wikipediaSources;

      // Upgrade confidence if we found verification
      if (enrichedAnalysis.confidence === "low") {
        enrichedAnalysis.confidence = "medium";
      } else if (enrichedAnalysis.confidence === "medium") {
        enrichedAnalysis.confidence = "high";
      }
    }

    return enrichedAnalysis;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Wikipedia enrichment error:", error);
    // Return original analysis if enrichment fails
    return analysis;
  }
}

/**
 * Converts a File object to base64 string
 * @param file - File object to convert
 * @returns Promise with base64 string (without data URL prefix) and MIME type
 */
export function fileToBase64(file: File): Promise<{ data: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
      const base64Data = result.split(",")[1];
      resolve({
        data: base64Data,
        mimeType: file.type,
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
