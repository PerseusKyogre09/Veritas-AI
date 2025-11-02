import { GoogleGenAI } from "@google/genai";
import { AnalysisResult, Source, AIGenerationAssessment } from '../types';

// Ensure the API key is available from environment variables
if (!import.meta.env.VITE_API_KEY) {
    // In a real app, you'd want to handle this more gracefully.
    // For this project, we assume it's set.
    console.warn("VITE_API_KEY environment variable not set. Using a mock service.");
}

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY! });

const clampScore = (input: unknown): number => {
    const numericValue = typeof input === 'number' ? input : Number(input);
    if (!Number.isFinite(numericValue)) {
        return 0;
    }
    return Math.max(0, Math.min(100, Math.round(numericValue)));
};

const mockAiGenerationAssessment = (content: string): AIGenerationAssessment => {
    const wordCount = content.trim().split(/\s+/).length;
    const citationMatches = (content.match(/https?:\/\/|\[[0-9]+\]/gi) ?? []).length;
    const repeatedPhrases = (content.match(/(\b\w{5,}\b)(?:[^.!?]{0,40}\1){2,}/gi) ?? []).length;
    const bulletMatches = (content.match(/\n[-*]/g) ?? []).length;

    let likelihoodScore = 35;

    if (repeatedPhrases > 0) {
        likelihoodScore += Math.min(25, repeatedPhrases * 8);
    }

    if (citationMatches === 0 && wordCount > 200) {
        likelihoodScore += 15;
    }

    if (bulletMatches > 2) {
        likelihoodScore += 10;
    }

    if (wordCount < 120) {
        likelihoodScore -= 10;
    }

    const normalizedScore = clampScore(likelihoodScore);
    const confidence = clampScore(60 + (repeatedPhrases > 0 ? 15 : 0) - (citationMatches > 0 ? 10 : 0));

    let verdict: AIGenerationAssessment['verdict'];
    if (normalizedScore >= 70) {
        verdict = 'Likely AI-generated';
    } else if (normalizedScore >= 45) {
        verdict = 'Possibly AI-assisted';
    } else {
        verdict = 'Likely human-authored';
    }

    const indicators: string[] = [];
    if (repeatedPhrases > 0) {
        indicators.push('Detected repeated phrases that suggest templated generation.');
    }
    if (citationMatches === 0 && wordCount > 200) {
        indicators.push('Long-form passage does not reference verifiable sources.');
    }
    if (bulletMatches > 2) {
        indicators.push('Multiple bullet lists with uniform phrasing detected.');
    }
    if (indicators.length === 0) {
        indicators.push('No strong stylistic signals of AI generation were detected.');
    }

    return {
        verdict,
        likelihoodScore: normalizedScore,
        confidence,
        rationale: "Mock detector heuristics estimated likelihood based on repetitions, citations, and formatting cues.",
        indicators,
    };
};

const sanitizeIndicators = (indicators: unknown): string[] => {
    if (!Array.isArray(indicators)) {
        return [];
    }

    return indicators
        .map((value) => (typeof value === 'string' ? value.trim() : ''))
        .filter((value): value is string => value.length > 0)
        .slice(0, 6);
};

const sanitizeAiGeneration = (raw: unknown): AIGenerationAssessment | undefined => {
    if (!raw || typeof raw !== 'object') {
        return undefined;
    }

    const allowedVerdicts: ReadonlyArray<AIGenerationAssessment['verdict']> = [
        'Likely AI-generated',
        'Possibly AI-assisted',
        'Likely human-authored',
    ];

    const verdictCandidate = typeof (raw as { verdict?: unknown }).verdict === 'string'
        ? (raw as { verdict: string }).verdict.trim()
        : '';

    const verdict = allowedVerdicts.includes(verdictCandidate as AIGenerationAssessment['verdict'])
        ? (verdictCandidate as AIGenerationAssessment['verdict'])
        : 'Likely human-authored';

    const likelihoodScore = clampScore((raw as { likelihoodScore?: unknown }).likelihoodScore);
    const confidence = clampScore((raw as { confidence?: unknown }).confidence);

    const rationaleRaw = typeof (raw as { rationale?: unknown }).rationale === 'string'
        ? (raw as { rationale: string }).rationale.trim()
        : '';
    const rationale = rationaleRaw.length > 0
        ? rationaleRaw
        : 'No explicit rationale provided by the model.';

    const indicators = sanitizeIndicators((raw as { indicators?: unknown }).indicators);
    if (indicators.length === 0) {
        indicators.push('No strong stylistic signals of AI generation were identified.');
    }

    return { verdict, likelihoodScore, confidence, rationale, indicators };
};

const sanitizeKeyClaims = (claims: unknown): AnalysisResult['keyClaims'] => {
    if (!Array.isArray(claims)) {
        return [];
    }

    return claims
        .map((claim) => {
            if (!claim || typeof claim !== 'object') {
                return null;
            }

            const claimText = typeof (claim as { claim?: unknown }).claim === 'string'
                ? (claim as { claim: string }).claim.trim()
                : '';
            const assessmentText = typeof (claim as { assessment?: unknown }).assessment === 'string'
                ? (claim as { assessment: string }).assessment.trim()
                : '';
            const isMisleading = Boolean((claim as { isMisleading?: unknown }).isMisleading);

            if (!claimText || !assessmentText) {
                return null;
            }

            return {
                claim: claimText,
                assessment: assessmentText,
                isMisleading,
            };
        })
        .filter((claim): claim is AnalysisResult['keyClaims'][number] => claim !== null)
        .slice(0, 10);
};

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
            aiGeneration: mockAiGenerationAssessment(content),
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
            ],
            "aiGeneration": {
                "verdict": "Likely AI-generated",
                "likelihoodScore": number,
                "confidence": number,
                "rationale": "string",
                "indicators": ["string", ...]
            }
        }
        Do not include any text outside of the JSON object.
        Use your search tool to verify claims against credible sources.
        For the aiGeneration.verdict field you must choose one of: "Likely AI-generated", "Possibly AI-assisted", "Likely human-authored".
        The aiGeneration.indicators array should list 3-6 short bullet-style explanations of the signals you observed (e.g., repetitive phrasing, lack of citations, unnatural structure).
        Explicitly consider AI-generation signals such as perplexity, repetition, unnatural transitions, template-like structure, inconsistent voice, lack of concrete references, or suspicious citation patterns.
        
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

        const summaryRaw = typeof parsedData.summary === 'string' ? parsedData.summary.trim() : '';
        const sanitizedResult: Omit<AnalysisResult, 'sources'> = {
            credibilityScore: clampScore(parsedData.credibilityScore),
            summary: summaryRaw.length > 0 ? summaryRaw : 'No summary provided by the model.',
            keyClaims: sanitizeKeyClaims(parsedData.keyClaims),
            aiGeneration: sanitizeAiGeneration(parsedData.aiGeneration),
        };

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

        return { ...sanitizedResult, sources };
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
