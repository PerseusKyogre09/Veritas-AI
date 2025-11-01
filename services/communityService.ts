import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  Timestamp,
  type Firestore,
} from 'firebase/firestore';
import { getFirestoreInstance, isFirebaseConfigured } from './firebaseClient';
import { CommunityVoteItem, VoteDirection, AIGenerationAssessment } from '../types';

const COLLECTION_NAME = 'communityFeed';

const placeholderDate = new Date(0).toISOString();

const hasToDate = (candidate: unknown): candidate is { toDate(): Date } => {
  return Boolean(candidate && typeof candidate === 'object' && typeof (candidate as { toDate?: () => Date }).toDate === 'function');
};

const coerceTimestamp = (value: unknown): string => {
  if (value instanceof Timestamp) {
    return value.toDate().toISOString();
  }
  if (hasToDate(value)) {
    try {
      return value.toDate().toISOString();
    } catch {
      return placeholderDate;
    }
  }
  if (typeof value === 'string') {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? placeholderDate : parsed.toISOString();
  }
  return placeholderDate;
};

const allowedVerdicts: ReadonlyArray<CommunityVoteItem['aiVerdict']> = [
  'Likely AI-generated',
  'Possibly AI-assisted',
  'Likely human-authored',
];

const clampScore = (value: unknown): number => {
  const numeric = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(numeric)) {
    return 0;
  }
  return Math.max(0, Math.min(100, Math.round(numeric)));
};

const sanitizeIndicators = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map(entry => (typeof entry === 'string' ? entry.trim() : ''))
    .filter((entry): entry is string => entry.length > 0)
    .slice(0, 6);
};

const parseAiDetection = (candidate: unknown): AIGenerationAssessment | undefined => {
  if (!candidate || typeof candidate !== 'object') {
    return undefined;
  }

  const verdictCandidate = typeof (candidate as { verdict?: unknown }).verdict === 'string'
    ? (candidate as { verdict: string }).verdict.trim()
    : '';
  const verdict = allowedVerdicts.includes(verdictCandidate as CommunityVoteItem['aiVerdict'])
    ? (verdictCandidate as AIGenerationAssessment['verdict'])
    : undefined;

  if (!verdict) {
    return undefined;
  }

  const likelihoodScore = clampScore((candidate as { likelihoodScore?: unknown }).likelihoodScore);
  const confidence = clampScore((candidate as { confidence?: unknown }).confidence);
  const rationaleRaw = typeof (candidate as { rationale?: unknown }).rationale === 'string'
    ? (candidate as { rationale: string }).rationale.trim()
    : '';
  const indicators = sanitizeIndicators((candidate as { indicators?: unknown }).indicators);

  return {
    verdict,
    likelihoodScore,
    confidence,
    rationale: rationaleRaw || 'No rationale provided.',
    indicators: indicators.length > 0 ? indicators : ['No explicit indicators were shared.'],
  } satisfies AIGenerationAssessment;
};

const sanitizeVoteDirection = (value: unknown): VoteDirection | null => {
  if (value === 'up' || value === 'down') {
    return value;
  }
  return null;
};

const ensureDb = (): Firestore => {
  if (!isFirebaseConfigured()) {
    throw new Error('Firebase is not configured.');
  }
  return getFirestoreInstance();
};

export const streamCommunityFeed = (
  userId: string,
  onUpdate: (items: CommunityVoteItem[]) => void,
  onError?: (error: Error) => void,
) => {
  if (!isFirebaseConfigured()) {
    queueMicrotask(() => {
      onUpdate([]);
    });
    return () => undefined;
  }

  const db = ensureDb();
  const feedQuery = query(collection(db, COLLECTION_NAME), orderBy('timestamp', 'desc'));

  return onSnapshot(feedQuery, (snapshot) => {
    const items = snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      const supportCount = Number.isFinite(data.supportCount) ? Number(data.supportCount) : 0;
      const disputeCount = Number.isFinite(data.disputeCount) ? Number(data.disputeCount) : 0;
      const credibilityScore = Number.isFinite(data.credibilityScore) ? Number(data.credibilityScore) : 0;
      const aiVerdict = typeof data.aiVerdict === 'string' && allowedVerdicts.includes(data.aiVerdict as CommunityVoteItem['aiVerdict'])
        ? (data.aiVerdict as CommunityVoteItem['aiVerdict'])
        : undefined;
      const summary = typeof data.summary === 'string' ? data.summary : '';
      const headline = typeof data.headline === 'string' ? data.headline : 'Community submission';
      const timestamp = coerceTimestamp(data.timestamp);

  const userVotes = data.userVotes ?? {};
  const userVote = sanitizeVoteDirection(userVotes[userId]);

      return {
        id: docSnap.id,
        headline,
        summary,
        timestamp,
        credibilityScore,
        aiVerdict,
        aiDetection: parseAiDetection(data.aiDetection),
        supportCount,
        disputeCount,
        userVote,
      } satisfies CommunityVoteItem;
    });

    onUpdate(items);
  }, (error) => {
    console.error('Error streaming community feed:', error);
    onError?.(error);
  });
};

export const upsertCommunityEntry = async (entry: CommunityVoteItem) => {
  if (!isFirebaseConfigured()) {
    return;
  }

  const db = ensureDb();
  const ref = doc(collection(db, COLLECTION_NAME), entry.id);

  await setDoc(
    ref,
    {
      headline: entry.headline,
      summary: entry.summary,
      credibilityScore: entry.credibilityScore,
      aiVerdict: entry.aiVerdict ?? null,
      aiDetection: entry.aiDetection ?? null,
      timestamp: serverTimestamp(),
    },
    { merge: true },
  );
};

const adjustCounts = (
  previousVote: VoteDirection | null,
  nextVote: VoteDirection | null,
  supportCount: number,
  disputeCount: number,
) => {
  let nextSupport = supportCount;
  let nextDispute = disputeCount;

  if (previousVote === 'up') {
    nextSupport = Math.max(0, nextSupport - 1);
  }

  if (previousVote === 'down') {
    nextDispute = Math.max(0, nextDispute - 1);
  }

  if (nextVote === 'up') {
    nextSupport += 1;
  }

  if (nextVote === 'down') {
    nextDispute += 1;
  }

  return { supportCount: nextSupport, disputeCount: nextDispute };
};

export const recordCommunityVote = async (
  itemId: string,
  userId: string,
  direction: VoteDirection | null,
) => {
  if (!isFirebaseConfigured()) {
    return;
  }

  const db = ensureDb();
  const ref = doc(db, COLLECTION_NAME, itemId);

  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(ref);
    if (!snapshot.exists()) {
      throw new Error('Community entry does not exist.');
    }

    const data = snapshot.data() ?? {};

    const existingVotes = (data.userVotes ?? {}) as Record<string, VoteDirection | null>;
    const previousVote = existingVotes[userId] ?? null;
    const counts = adjustCounts(
      previousVote,
      direction,
      Number.isFinite(data.supportCount) ? Number(data.supportCount) : 0,
      Number.isFinite(data.disputeCount) ? Number(data.disputeCount) : 0,
    );

    transaction.update(ref, {
      supportCount: counts.supportCount,
      disputeCount: counts.disputeCount,
      [`userVotes.${userId}`]: direction,
    });
  });
};
