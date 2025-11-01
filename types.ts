
export enum View {
    LANDING = 'LANDING',
    DASHBOARD = 'DASHBOARD',
    ANALYZER = 'ANALYZER',
    COMMUNITY = 'COMMUNITY',
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

export interface CommunityAnnotation {
    id: string;
    note: string;
    createdAt: string;
    author?: string;
}

export interface CommunityLedgerEntry {
    claimId: string;
    claim: string;
    aiAssessment: 'Misleading' | 'Credible';
    supportCount: number;
    disputeCount: number;
    annotations: CommunityAnnotation[];
}

export type CommunityLedgerMap = Record<string, CommunityLedgerEntry>;

export type VoteDirection = 'up' | 'down';

export interface AIGenerationAssessment {
    verdict: 'Likely AI-generated' | 'Possibly AI-assisted' | 'Likely human-authored';
    likelihoodScore: number;
    confidence: number;
    rationale: string;
    indicators: string[];
}

export interface CommunityVoteItem {
    id: string;
    headline: string;
    summary: string;
    timestamp: string;
    credibilityScore: number;
    aiVerdict?: AIGenerationAssessment['verdict'];
    aiDetection?: AIGenerationAssessment | null;
    supportCount: number;
    disputeCount: number;
    userVote: VoteDirection | null;
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
