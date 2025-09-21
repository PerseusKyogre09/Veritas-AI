
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

export interface Source {
    uri: string;
    title: string;
}

export interface KeyClaim {
    claim: string;
    assessment: string;
    isMisleading: boolean;
}

export interface AnalysisResult {
    credibilityScore: number;
    summary: string;
    keyClaims: KeyClaim[];
    sources: Source[];
}

export interface AnalysisHistoryItem {
    id: string;
    query: string;
    timestamp: string;
    result: AnalysisResult;
}
