import { GoogleGenAI } from "@google/genai";
import { AnalysisResult, Source } from '../types';

// Ensure the API key is available from environment variables
if (!process.env.API_KEY) {
    // In a real app, you'd want to handle this more gracefully.
    // For this project, we assume it's set.
    console.warn("API_KEY environment variable not set. Using a mock service.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

const parseJsonResponse = (text: string): Omit<AnalysisResult, 'sources'> | null => {
    try {
        // The model might return markdown ```json ... ```, so we extract the JSON part.
        const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
        const jsonString = jsonMatch ? jsonMatch[1] : text;
        
        // Sometimes the model might still add extra text. Let's find the main object.
        const firstBrace = jsonString.indexOf('{');
        const lastBrace = jsonString.lastIndexOf('}');
        if (firstBrace === -1 || lastBrace === -1) {
            console.error("No valid JSON object found in response string.");
            return null;
        }
        const correctedJsonString = jsonString.substring(firstBrace, lastBrace + 1);
        
        return JSON.parse(correctedJsonString);
    } catch (error) {
        console.error("Failed to parse JSON from model response:", error);
        console.error("Original response text:", text);
        return null;
    }
}


export const analyzeContent = async (content: string): Promise<AnalysisResult> => {
    if (!process.env.API_KEY) {
        // MOCK IMPLEMENTATION FOR UI DEVELOPMENT
        console.log("Using mock Gemini service...");
        await new Promise(resolve => setTimeout(resolve, 2000));
        const mockScore = Math.floor(Math.random() * 50) + 40;
        if (content.toLowerCase().includes("error")) {
             throw new Error("This is a mock error for testing purposes.");
        }
        return {
            credibilityScore: mockScore,
            summary: "This is a mock analysis. The content appears to use emotionally charged language and makes several claims without citing credible sources. The primary narrative seems designed to provoke a strong reaction rather than inform.",
            keyClaims: [
                { claim: "Claim A is presented as fact.", assessment: "This is an opinion piece presented as news. There is no verifiable evidence for this claim.", isMisleading: true },
                { claim: "Source B is quoted.", assessment: "Source B is a known biased source with a history of promoting conspiracy theories.", isMisleading: true },
                { claim: "Statistic C is used.", assessment: "This statistic is accurate but presented out of context to support a misleading conclusion.", isMisleading: false },
            ],
            sources: [
                { uri: "https://www.example-fact-check.com/article1", title: "Fact Check on Claim A - Example News" },
                { uri: "https://www.credible-source.org/research-paper", title: "Original Research Paper on Related Topic - Credible Source" },
            ],
        };
    }

    // REAL GEMINI API IMPLEMENTATION
    const model = 'gemini-2.5-flash';
    const prompt = `
        Analyze the following text for potential misinformation, propaganda, or logical fallacies.
        Act as an expert fact-checker. Be objective and neutral.
        Provide your analysis in a JSON object with this exact structure: 
        {
            "credibilityScore": number (0-100, where 0 is highly misleading and 100 is highly credible),
            "summary": "string (A brief summary of your findings, highlighting the overall tone and trustworthiness)",
            "keyClaims": [
                {
                    "claim": "string (Identify a specific claim made in the text)",
                    "assessment": "string (Assess the claim's validity, context, and potential for being misleading)",
                    "isMisleading": boolean (true if the claim is misleading, false otherwise)
                }
            ]
        }
        Do not include any text outside of the JSON object.
        Use your search tool to verify claims against credible sources.
        
        Text to analyze:
        ---
        ${content}
        ---
    `;

    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }],
            },
        });

        const parsedData = parseJsonResponse(response.text);

        if (!parsedData) {
            throw new Error("Failed to get a valid structured response from the AI model.");
        }

        const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];
        // FIX: Replaced the generic type argument on `reduce` with a typed initial value to resolve the "Untyped function calls may not accept type arguments" TypeScript error.
        const sources: Source[] = groundingChunks
            .map(chunk => chunk.web)
            .filter((web): web is { uri: string; title: string; } => !!web?.uri && !!web.title)
            .reduce((acc, current) => { // Remove duplicates
                if (!acc.some(item => item.uri === current.uri)) {
                    acc.push(current);
                }
                return acc;
            }, [] as Source[]);

        return { ...parsedData, sources };
    } catch (error) {
        console.error("Error calling Gemini API:", error);
        throw new Error("An error occurred while analyzing the content. Please try again.");
    }
};

export const detectLanguage = async (content: string): Promise<string> => {
    if (!process.env.API_KEY) {
        // MOCK IMPLEMENTATION FOR UI DEVELOPMENT
        console.log("Using mock language detection...");
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Simple mock language detection based on common words
        const lowerContent = content.toLowerCase();
        if (lowerContent.includes('the ') || lowerContent.includes(' and ') || lowerContent.includes(' is ')) {
            return 'English';
        } else if (lowerContent.includes('el ') || lowerContent.includes(' y ') || lowerContent.includes(' es ')) {
            return 'Spanish';
        } else if (lowerContent.includes('le ') || lowerContent.includes(' et ') || lowerContent.includes(' est ')) {
            return 'French';
        } else if (lowerContent.includes('der ') || lowerContent.includes(' und ') || lowerContent.includes(' ist ')) {
            return 'German';
        } else if (lowerContent.includes('il ') || lowerContent.includes(' e ') || lowerContent.includes(' è ')) {
            return 'Italian';
        } else {
            return 'English'; // Default fallback
        }
    }

    // REAL GEMINI API IMPLEMENTATION
    const model = 'gemini-2.5-flash';
    const prompt = `
        Detect the primary language of the following text. Respond with ONLY the language name in English (e.g., "English", "Spanish", "French", "German", "Chinese", etc.). Do not include any other text or explanation.
        
        Text to analyze:
        ${content.substring(0, 1000)} // Limit to first 1000 characters for efficiency
    `;

    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
        });

        const detectedLanguage = response.text.trim();
        
        // Validate that we got a reasonable language name
        if (detectedLanguage.length > 0 && detectedLanguage.length < 50) {
            return detectedLanguage;
        } else {
            return 'Unknown';
        }
    } catch (error) {
        console.error("Error detecting language:", error);
        return 'Unknown';
    }
};
