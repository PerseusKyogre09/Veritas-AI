
export enum View {
    DASHBOARD = 'DASHBOARD',
    ANALYZER = 'ANALYZER',
    PROFILE = 'PROFILE',
    HISTORY = 'HISTORY',
    SETTINGS = 'SETTINGS',
}

export enum Theme {
    LIGHT = 'light',
    DARK = 'dark',
    SYSTEM = 'system',
}

export interface UserProfile {
    uid: string;
    displayName: string | null;
    email: string | null;
    photoURL: string | null;
    createdAt?: string;
    lastLoginAt?: string;
}

export interface Source {
    uri: string;
    title: string;
}

export interface KeyClaim {
    claim: string;
    assessment: string;
    isMisleading: boolean;
}

export interface AIGenerationAssessment {
    verdict: 'Likely AI-generated' | 'Possibly AI-assisted' | 'Likely human-authored';
    likelihoodScore: number;
    confidence: number;
    rationale: string;
    indicators: string[];
}

export interface AnalysisResult {
    credibilityScore: number;
    summary: string;
    keyClaims: KeyClaim[];
    aiGeneration?: AIGenerationAssessment;
    sources: Source[];
}

export interface AnalysisHistoryItem {
    id: string;
    query: string;
    timestamp: string;
    result: AnalysisResult;
}
