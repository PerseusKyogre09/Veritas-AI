import { GoogleGenAI } from "@google/genai";
import {
    AnalysisResult,
    Source,
    AIGenerationAssessment,
    ImageAnalysisResult,
    BiasDetectionAssessment,
    SentimentManipulationAssessment,
    PredictiveAlert,
} from '../types';

// Ensure the API key is available from environment variables
const apiKey = import.meta.env.VITE_API_KEY;
if (!apiKey) {
    console.warn("VITE_API_KEY environment variable not set. Using a mock service.");
}

const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

type VisionVerdict = ImageAnalysisResult['authenticity']['verdict'];

interface VisionLabelHint {
    description: string;
    score: number;
}

interface VisionAnalysisSummary {
    aiScore: number;
    verdict: VisionVerdict;
    confidence: number;
    rationale: string;
    indicators: string[];
    warnings: string[];
    suggestedActions: string[];
    bestGuessLabels: string[];
    labelHints: VisionLabelHint[];
    suspiciousDomains: string[];
}

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

const sanitizeStringArray = (value: unknown, fallback: string[] = [], maxLength = 6): string[] => {
    if (!Array.isArray(value)) {
        return [...fallback];
    }

    const sanitized = value
        .map((item) => (typeof item === 'string' ? item.trim() : ''))
        .filter((item): item is string => item.length > 0)
        .slice(0, maxLength);

    if (sanitized.length === 0) {
        return [...fallback];
    }

    return sanitized;
};

const sanitizeIndicators = (indicators: unknown): string[] => {
    const sanitized = sanitizeStringArray(indicators, [], 6);
    if (sanitized.length === 0) {
        return ['No strong stylistic signals of AI generation were identified.'];
    }
    return sanitized;
};

const sanitizeText = (value: unknown, fallback: string): string => {
    if (typeof value === 'string') {
        const trimmed = value.trim();
        if (trimmed.length > 0) {
            return trimmed;
        }
    }
    return fallback;
};

const arrayBufferToBase64 = async (blob: Blob): Promise<string> => {
    const buffer = await blob.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    const chunkSize = 0x8000;
    let binary = '';

    for (let i = 0; i < bytes.length; i += chunkSize) {
        binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
    }

    if (typeof btoa === 'function') {
        return btoa(binary);
    }

    const BufferCtor = (globalThis as { Buffer?: { from: (input: Uint8Array) => { toString: (encoding: string) => string } } }).Buffer;
    if (BufferCtor) {
        return BufferCtor.from(bytes).toString('base64');
    }

    throw new Error('Base64 encoding is not supported in this environment.');
};

const sanitizeVisionSummary = (payload: unknown): VisionAnalysisSummary | null => {
    if (!payload || typeof payload !== 'object') {
        return null;
    }

    const data = payload as Record<string, unknown>;
    const allowedVerdicts: ReadonlyArray<VisionVerdict> = [
        'Likely AI-generated',
        'Possibly AI-assisted',
        'Likely human-captured',
    ];

    const aiScore = clampScore(data.aiScore);
    const rawVerdict = typeof data.verdict === 'string' ? data.verdict.trim() : '';
    const verdict = allowedVerdicts.includes(rawVerdict as VisionVerdict)
        ? (rawVerdict as VisionVerdict)
        : 'Possibly AI-assisted';

    const confidence = clampScore(data.confidence);
    const rationale = sanitizeText(
        data.rationale,
        'Vision analysis did not surface an explicit rationale.',
    );

    const indicators = sanitizeStringArray(data.indicators, [], 6);
    const warnings = sanitizeStringArray(data.warnings, [], 6);
    const suggestedActions = sanitizeStringArray(data.suggestedActions, [], 6);
    const bestGuessLabels = sanitizeStringArray(data.bestGuessLabels, [], 5);
    const suspiciousDomains = sanitizeStringArray(data.suspiciousDomains, [], 5);

    const labelHintsRaw = Array.isArray(data.labelHints) ? data.labelHints : [];
    const labelHints: VisionLabelHint[] = labelHintsRaw
        .map((hint): VisionLabelHint | null => {
            if (!hint || typeof hint !== 'object') {
                return null;
            }
            const description = sanitizeText((hint as { description?: unknown }).description, '');
            const scoreValue = (hint as { score?: unknown }).score;
            if (!description) {
                return null;
            }
            const numericScore = typeof scoreValue === 'number'
                ? scoreValue
                : Number(scoreValue);
            const safeScore = Number.isFinite(numericScore)
                ? Math.max(0, Math.min(1, Number(numericScore)))
                : 0;
            return {
                description,
                score: Number.parseFloat(safeScore.toFixed(3)),
            };
        })
        .filter((hint): hint is VisionLabelHint => hint !== null)
        .slice(0, 5);

    return {
        aiScore,
        verdict,
        confidence,
        rationale,
        indicators,
        warnings,
        suggestedActions,
        bestGuessLabels,
        labelHints,
        suspiciousDomains,
    };
};

const fetchVisionInsights = async (base64Data: string, mimeType: string): Promise<VisionAnalysisSummary | null> => {
    const backendBase = import.meta.env.VITE_BACKEND_URL
        ? import.meta.env.VITE_BACKEND_URL.replace(/\/$/, '')
        : 'http://localhost:5000';

    const endpoint = `${backendBase}/vision/analyze`;

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ imageBase64: base64Data, mimeType }),
        });

        if (!response.ok) {
            console.warn('Vision analysis request failed:', response.status, response.statusText);
            return null;
        }

        const payload = await response.json();
        return sanitizeVisionSummary(payload);
    } catch (error) {
        console.warn('Vision analysis request encountered an error:', error);
        return null;
    }
};

const applyVisionInsights = (result: ImageAnalysisResult, vision: VisionAnalysisSummary): void => {
    const indicatorSeeds: string[] = [
        ...vision.indicators,
        ...(vision.bestGuessLabels.length > 0
            ? [`Vision best guesses: ${vision.bestGuessLabels.join(', ')}`]
            : []),
        ...(vision.suspiciousDomains.length > 0
            ? [`Vision reverse-search overlap: ${vision.suspiciousDomains.join(', ')}`]
            : []),
        ...(result.authenticity.indicators ?? []),
    ];

    result.authenticity.indicators = sanitizeStringArray(indicatorSeeds, [], 6);

    const mergedWarnings = sanitizeStringArray([
        ...result.contentWarnings,
        ...vision.warnings,
    ], [], 6);
    result.contentWarnings = mergedWarnings;

    const mergedActions = sanitizeStringArray([
        ...vision.suggestedActions,
        ...result.suggestedActions,
    ], [], 6);
    result.suggestedActions = mergedActions;

    const rationaleWithVision = `${result.authenticity.rationale} Vision: ${vision.rationale}`.trim();
    result.authenticity.rationale = sanitizeText(
        rationaleWithVision,
        result.authenticity.rationale,
    );

    const averagedConfidence = Math.round((result.authenticity.confidence + vision.confidence) / 2);
    result.authenticity.confidence = clampScore(averagedConfidence);

    const candidateRisk = clampScore(vision.aiScore);
    if (candidateRisk > 0) {
        const existingRisk = result.authenticity.riskScore;
        if (typeof existingRisk === 'number' && Number.isFinite(existingRisk)) {
            result.authenticity.riskScore = Math.max(existingRisk, candidateRisk);
        } else {
            result.authenticity.riskScore = candidateRisk;
        }
    }

    const escalateVerdict = (
        current: VisionVerdict,
        incoming: VisionVerdict,
    ): VisionVerdict => {
        if (incoming === 'Likely AI-generated') {
            return 'Likely AI-generated';
        }
        if (incoming === 'Possibly AI-assisted' && current === 'Likely human-captured') {
            return 'Possibly AI-assisted';
        }
        return current;
    };

    result.authenticity.verdict = escalateVerdict(
        result.authenticity.verdict,
        vision.verdict,
    );
};

const runImageSuspicionAudit = async (params: {
    base64Data: string;
    mimeType: string;
}): Promise<{ riskScore: number; verdict: ImageAnalysisResult['authenticity']['verdict']; indicators: string[] } | undefined> => {
    if (!ai) {
        return {
            riskScore: 55,
            verdict: 'Possibly AI-assisted',
            indicators: ['Mock audit: heuristic risk score defaults to a cautious posture without real model evaluation.'],
        };
    }

    const { base64Data, mimeType } = params;

    const auditPrompt = `
        You are an investigative forensic analyst specializing in AI-generated imagery.
        Re-examine the provided image solely for signals of synthesis or heavy AI editing (GAN seams, warped structures, inconsistent physics, abnormal lighting, metadata overlays, etc.).
        Be conservative: if uncertainty remains, err toward higher risk.

        Respond strictly in JSON using this schema:
        {
          "riskScore": number (0-100, where 100 = high confidence the image is AI-generated or AI-edited),
          "verdict": "Likely AI-generated" | "Possibly AI-assisted" | "Likely human-captured",
          "indicators": ["short bullet cues highlighting the strongest forensic observations"]
        }

        Do not include any other text or commentary.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [
                {
                    role: 'user',
                    parts: [
                        { text: auditPrompt },
                        { inlineData: { mimeType, data: base64Data } },
                    ],
                },
            ],
        });

        const parsed = extractJsonObject<{ riskScore?: unknown; verdict?: unknown; indicators?: unknown }>(response.text ?? '');

        if (!parsed) {
            return undefined;
        }

        const allowedVerdicts: ReadonlyArray<ImageAnalysisResult['authenticity']['verdict']> = [
            'Likely AI-generated',
            'Possibly AI-assisted',
            'Likely human-captured',
        ];

        const riskScore = clampScore(parsed.riskScore);
        const verdictCandidate = typeof parsed.verdict === 'string' ? parsed.verdict.trim() : '';
        const verdict = allowedVerdicts.includes(verdictCandidate as ImageAnalysisResult['authenticity']['verdict'])
            ? (verdictCandidate as ImageAnalysisResult['authenticity']['verdict'])
            : riskScore >= 65
                ? 'Likely AI-generated'
                : riskScore >= 45
                    ? 'Possibly AI-assisted'
                    : 'Likely human-captured';

        const indicators = sanitizeStringArray(parsed.indicators, [], 6);

        return {
            riskScore,
            verdict,
            indicators,
        };
    } catch (error) {
        console.error('Image suspicion audit failed:', error);
        return undefined;
    }
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

    return { verdict, likelihoodScore, confidence, rationale, indicators };
};

const sanitizeBiasDetection = (raw: unknown): BiasDetectionAssessment | undefined => {
    if (!raw || typeof raw !== 'object') {
        return undefined;
    }

    const biasScore = clampScore((raw as { biasScore?: unknown }).biasScore);
    const summaryRaw = sanitizeText((raw as { summary?: unknown }).summary, '').trim();
    const biasTypes = sanitizeStringArray((raw as { biasTypes?: unknown }).biasTypes, [], 6);
    const impactedAudiences = sanitizeStringArray((raw as { impactedAudiences?: unknown }).impactedAudiences, [], 6);
    const indicators = sanitizeStringArray((raw as { indicators?: unknown }).indicators, [], 6);

    if (!summaryRaw && biasTypes.length === 0 && indicators.length === 0 && impactedAudiences.length === 0 && biasScore === 0) {
        return undefined;
    }

    return {
        biasScore,
        summary: summaryRaw || 'No bias summary provided.',
        biasTypes,
        impactedAudiences,
        indicators,
    };
};

const sanitizeSentimentManipulation = (raw: unknown): SentimentManipulationAssessment | undefined => {
    if (!raw || typeof raw !== 'object') {
        return undefined;
    }

    const allowedSentiments: ReadonlyArray<SentimentManipulationAssessment['overallSentiment']> = ['Positive', 'Negative', 'Neutral'];
    const sentimentCandidate = typeof (raw as { overallSentiment?: unknown }).overallSentiment === 'string'
        ? (raw as { overallSentiment: string }).overallSentiment.trim()
        : '';
    const overallSentiment = allowedSentiments.includes(sentimentCandidate as SentimentManipulationAssessment['overallSentiment'])
        ? (sentimentCandidate as SentimentManipulationAssessment['overallSentiment'])
        : 'Neutral';

    const manipulationScore = clampScore((raw as { manipulationScore?: unknown }).manipulationScore);
    const summaryRaw = sanitizeText((raw as { summary?: unknown }).summary, '').trim();
    const manipulationSignals = sanitizeStringArray((raw as { manipulationSignals?: unknown }).manipulationSignals, [], 6);

    if (!summaryRaw && manipulationSignals.length === 0 && manipulationScore === 0) {
        return undefined;
    }

    return {
        overallSentiment,
        manipulationScore,
        summary: summaryRaw || 'No sentiment summary provided.',
        manipulationSignals,
    };
};

const sanitizePredictiveAlerts = (raw: unknown): PredictiveAlert | undefined => {
    if (!raw || typeof raw !== 'object') {
        return undefined;
    }

    const allowedAlertLevels: ReadonlyArray<PredictiveAlert['alertLevel']> = ['Low', 'Moderate', 'High'];
    const alertLevelCandidate = typeof (raw as { alertLevel?: unknown }).alertLevel === 'string'
        ? (raw as { alertLevel: string }).alertLevel.trim()
        : '';
    const alertLevel = allowedAlertLevels.includes(alertLevelCandidate as PredictiveAlert['alertLevel'])
        ? (alertLevelCandidate as PredictiveAlert['alertLevel'])
        : 'Moderate';

    const summaryRaw = sanitizeText((raw as { summary?: unknown }).summary, '').trim();
    const confidence = clampScore((raw as { confidence?: unknown }).confidence);
    const emergingNarratives = sanitizeStringArray((raw as { emergingNarratives?: unknown }).emergingNarratives, [], 6);
    const recommendedActions = sanitizeStringArray((raw as { recommendedActions?: unknown }).recommendedActions, [], 6);
    const timeframe = sanitizeText((raw as { timeframe?: unknown }).timeframe, 'No timeframe specified.');

    if (!summaryRaw && emergingNarratives.length === 0 && recommendedActions.length === 0 && confidence === 0) {
        return undefined;
    }

    return {
        alertLevel,
        summary: summaryRaw || 'No predictive alert summary provided.',
        confidence,
        emergingNarratives,
        recommendedActions,
        timeframe,
    };
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

const extractJsonObject = <T>(text: string): T | null => {
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
        
        return JSON.parse(correctedJsonString) as T;
    } catch (error) {
        console.error("Failed to parse JSON from model response:", error);
        console.error("Original response text:", text);
        return null;
    }
}

const parseJsonResponse = (text: string): Omit<AnalysisResult, 'sources'> | null => {
    return extractJsonObject<Omit<AnalysisResult, 'sources'>>(text);
}


export const analyzeContent = async (content: string): Promise<AnalysisResult> => {
    if (!apiKey) {
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
            biasDetection: {
                biasScore: 62,
                summary: "Language framing leans toward fear-based rhetoric and selectively highlights data that disadvantages a particular group.",
                biasTypes: ["Ideological", "Confirmation"],
                impactedAudiences: ["General public", "Targeted political group"],
                indicators: [
                    "Disproportionate focus on negative outcomes without counterpoints",
                    "Loaded adjectives reinforcing an in-group/out-group narrative",
                    "Absence of neutral expert testimony",
                ],
            },
            sentimentManipulation: {
                overallSentiment: 'Negative',
                manipulationScore: 71,
                summary: "The tone is sharply critical and leverages anxiety-laden phrasing to push readers toward a defensive stance.",
                manipulationSignals: [
                    "Heightened urgency language without timelines",
                    "Direct appeals to fear and loss aversion",
                    "Binary framing that discourages nuanced interpretation",
                ],
            },
            predictiveAlerts: {
                alertLevel: 'Moderate',
                summary: "Narrative mirrors a resurfacing misinformation theme flagged by fact-checkers earlier this quarter.",
                confidence: 68,
                emergingNarratives: [
                    "Renewed claims around institutional cover-ups",
                    "Coordinated messaging from fringe outlets",
                ],
                recommendedActions: [
                    "Monitor trusted fact-checking feeds for corroborating debunks",
                    "Share context-setting resources with at-risk communities",
                ],
                timeframe: "Likely to trend over the next 1-2 weeks",
            },
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
        Provide your analysis **strictly** as a JSON object with this exact structure and field ordering:
        {
            "credibilityScore": number (0-100, where 0 is highly misleading and 100 is highly credible),
            "summary": "string (Briefly summarize the overall credibility and tone)",
            "keyClaims": [
                {
                    "claim": "string (Identify a specific claim made in the text)",
                    "assessment": "string (Assess validity, missing context, or fallacies)",
                    "isMisleading": boolean (true if the claim is misleading)
                }
            ],
            "biasDetection": {
                "biasScore": number (0-100 severity of bias),
                "summary": "string (Describe the bias and framing detected)",
                "biasTypes": ["string" (specific bias categories, e.g., ideological, confirmation)],
                "impactedAudiences": ["string" (groups or demographics most affected)],
                "indicators": ["string" (2-6 concrete linguistic or sourcing cues of bias)]
            },
            "sentimentManipulation": {
                "overallSentiment": "Positive" | "Negative" | "Neutral",
                "manipulationScore": number (0-100 showing intensity of manipulative rhetoric),
                "summary": "string (How emotion is used to steer perception)",
                "manipulationSignals": ["string" (2-6 observed tactics such as fear appeals, sensational framing, virtue signaling)]
            },
            "predictiveAlerts": {
                "alertLevel": "Low" | "Moderate" | "High",
                "summary": "string (Why this narrative may trend or re-emerge)",
                "confidence": number (0-100 confidence in this alert),
                "emergingNarratives": ["string" (1-5 related narratives to monitor)],
                "recommendedActions": ["string" (1-5 mitigation or monitoring steps)],
                "timeframe": "string (expected window, e.g., next 7 days)"
            },
            "aiGeneration": {
                "verdict": "Likely AI-generated" | "Possibly AI-assisted" | "Likely human-authored",
                "likelihoodScore": number (0-100),
                "confidence": number (0-100),
                "rationale": "string",
                "indicators": ["string" (3-6 short bullet cues)]
            }
        }
        Do not include any additional commentary outside the JSON.
        Use your search tool to verify claims against credible sources when possible.
        Evaluate bias based on framing, source selection, and omission of context.
        Highlight manipulative sentiment cues such as catastrophizing, scapegoating, or emotionally charged absolutes.
        Predict how the narrative could propagate across communities or platforms, noting any early warning signals.

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

        const biasDetection = sanitizeBiasDetection((parsedData as { biasDetection?: unknown }).biasDetection);
        if (biasDetection) {
            sanitizedResult.biasDetection = biasDetection;
        }

        const sentimentManipulation = sanitizeSentimentManipulation((parsedData as { sentimentManipulation?: unknown }).sentimentManipulation);
        if (sentimentManipulation) {
            sanitizedResult.sentimentManipulation = sentimentManipulation;
        }

        const predictiveAlerts = sanitizePredictiveAlerts((parsedData as { predictiveAlerts?: unknown }).predictiveAlerts);
        if (predictiveAlerts) {
            sanitizedResult.predictiveAlerts = predictiveAlerts;
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

        return { ...sanitizedResult, sources };
    } catch (error) {
        console.error("Error calling Gemini API:", error);
        throw new Error("An error occurred while analyzing the content. Please try again.");
    }
};

export const analyzeImage = async (image: File | Blob): Promise<ImageAnalysisResult> => {
    if (!image) {
        throw new Error('No image provided for analysis.');
    }

    const maxBytes = 8 * 1024 * 1024; // 8 MB
    if ('size' in image && typeof image.size === 'number' && image.size > maxBytes) {
        throw new Error('The image exceeds the 8MB size limit. Please choose a smaller file.');
    }

    const mimeType = 'type' in image && typeof image.type === 'string' && image.type.length > 0
        ? image.type
        : 'image/png';

    const base64Data = await arrayBufferToBase64(image);
    const visionInsightsPromise = fetchVisionInsights(base64Data, mimeType);

    if (!apiKey) {
        console.log('Using mock image analyzer...');
        await new Promise(resolve => setTimeout(resolve, 1500));
        const mockResult: ImageAnalysisResult = {
            summary: 'Mock analysis: The composition appears consistent with a staged press photo. Lighting and reflections look natural, but the subject exhibits subtle smoothing consistent with AI touch-ups.',
            authenticity: {
                verdict: 'Possibly AI-assisted',
                confidence: 58,
                rationale: 'Detected unusually uniform skin texture and slightly inconsistent reflections, suggesting selective AI editing.',
                indicators: [
                    'Skin texture lacks micro-details typical of high-resolution photography.',
                    'Minor mismatches between reflections and light sources.',
                    'No obvious background distortions detected.'
                ],
                riskScore: 62,
            },
            contentWarnings: ['Mock warning: Always corroborate with trusted photo archives before sharing.'],
            suggestedActions: [
                'Run a reverse image search to locate original sources.',
                'Inspect EXIF metadata using a trusted tool if available.',
            ],
        };
        const visionInsights = await visionInsightsPromise;
        if (visionInsights) {
            applyVisionInsights(mockResult, visionInsights);
        }
        return mockResult;
    }

        const model = 'gemini-2.5-flash';
        const prompt = `
                You are an authenticity analyst assessing whether an image may be AI-generated, AI-edited, or captured directly from a camera.
                Evaluate lighting consistency, anatomy, optical artifacts, text legibility, depth of field, compression seams, EXIF overlays, and any abnormal manipulations.
                Treat the task as high-stakes fact-checking:
                - If you cannot confidently rule out AI involvement, err toward "Possibly AI-assisted".
                - "Likely human-captured" should only be used when the image shows strong evidence of real-world capture and negligible AI cues.
                - Highlight concrete forensic observations (good or bad) rather than generic statements.

                Provide your findings **strictly** as JSON with the following schema:
                {
                    "summary": "Two sentences describing what the image depicts and overall credibility signals.",
                    "authenticity": {
                        "verdict": "Likely AI-generated" | "Possibly AI-assisted" | "Likely human-captured",
                        "confidence": number (0-100),
                        "rationale": "Short explanation for the verdict",
                        "indicators": ["3-6 concise bullet-style cues you observed"]
                    },
                    "contentWarnings": ["Any potential misinformation, deepfake, or sensitive-safety concerns"],
                    "suggestedActions": ["Optional follow-up verification steps or next actions"]
                }
                Do not include any additional commentary outside the JSON object. If you remain uncertain, default to "Possibly AI-assisted" and explain why.
        `;

    try {
        const suspicionPromise = runImageSuspicionAudit({ base64Data, mimeType });
        const response = await ai.models.generateContent({
            model,
            contents: [
                {
                    role: 'user',
                    parts: [
                        { text: prompt },
                        { inlineData: { mimeType, data: base64Data } },
                    ],
                },
            ],
        });

        const rawText = response.text ?? '';
        const parsed = extractJsonObject<{
            summary?: unknown;
            authenticity?: {
                verdict?: unknown;
                confidence?: unknown;
                rationale?: unknown;
                indicators?: unknown;
            };
            contentWarnings?: unknown;
            suggestedActions?: unknown;
        }>(rawText);

        if (!parsed) {
            throw new Error('Failed to get a structured response from the AI model.');
        }

        const allowedVerdicts: ReadonlyArray<ImageAnalysisResult['authenticity']['verdict']> = [
            'Likely AI-generated',
            'Possibly AI-assisted',
            'Likely human-captured',
        ];

        const verdictCandidate = typeof parsed.authenticity?.verdict === 'string'
            ? parsed.authenticity.verdict.trim()
            : '';

        const verdict = allowedVerdicts.includes(verdictCandidate as ImageAnalysisResult['authenticity']['verdict'])
            ? (verdictCandidate as ImageAnalysisResult['authenticity']['verdict'])
            : 'Possibly AI-assisted';

        const authenticityIndicators = sanitizeStringArray(
            parsed.authenticity?.indicators,
            ['No specific authenticity cues were highlighted.'],
            6,
        );

        const sanitizedResult: ImageAnalysisResult = {
            summary: sanitizeText(parsed.summary, 'No summary provided by the model.'),
            authenticity: {
                verdict,
                confidence: clampScore(parsed.authenticity?.confidence),
                rationale: sanitizeText(parsed.authenticity?.rationale, 'No rationale provided by the model.'),
                indicators: authenticityIndicators,
            },
            contentWarnings: sanitizeStringArray(parsed.contentWarnings, [], 6),
            suggestedActions: sanitizeStringArray(parsed.suggestedActions, [], 6),
        };

        const [visionInsights, suspicion] = await Promise.all([
            visionInsightsPromise,
            suspicionPromise,
        ]);

        if (visionInsights) {
            applyVisionInsights(sanitizedResult, visionInsights);
        }

        if (suspicion) {
            sanitizedResult.authenticity.riskScore = suspicion.riskScore;

            if (suspicion.indicators.length > 0) {
                const mergedIndicators = sanitizeStringArray([
                    `Secondary audit signals (risk ${suspicion.riskScore}%)`,
                    ...suspicion.indicators,
                    ...sanitizedResult.authenticity.indicators,
                ], [], 6);
                sanitizedResult.authenticity.indicators = mergedIndicators;
            }

            const reconcileVerdict = (
                current: ImageAnalysisResult['authenticity']['verdict'],
                backup: ImageAnalysisResult['authenticity']['verdict'],
                riskScore: number,
            ): ImageAnalysisResult['authenticity']['verdict'] => {
                if (riskScore >= 75) {
                    return 'Likely AI-generated';
                }
                if (riskScore >= 55 && current === 'Likely human-captured') {
                    return 'Possibly AI-assisted';
                }
                if (backup === 'Likely AI-generated' && current !== 'Likely AI-generated') {
                    return 'Possibly AI-assisted';
                }
                return current;
            };

            sanitizedResult.authenticity.verdict = reconcileVerdict(
                sanitizedResult.authenticity.verdict,
                suspicion.verdict,
                suspicion.riskScore,
            );

            if (sanitizedResult.authenticity.verdict === 'Likely human-captured' && sanitizedResult.authenticity.confidence < 70) {
                sanitizedResult.authenticity.verdict = 'Possibly AI-assisted';
                sanitizedResult.authenticity.indicators = sanitizeStringArray([
                    'Confidence below 70% triggers a cautious downgrade to "Possibly AI-assisted".',
                    ...sanitizedResult.authenticity.indicators,
                ], [], 6);
            }
        }

        return sanitizedResult;
    } catch (error) {
        console.error('Error calling Gemini API for image analysis:', error);
        throw new Error('An error occurred while analyzing the image. Please try again.');
    }
};

export const detectLanguage = async (content: string): Promise<string> => {
    if (!apiKey) {
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
