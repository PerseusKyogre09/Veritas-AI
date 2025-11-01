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
} from 'firebase/firestore';
import { db } from '../firebaseClient';
import { CommunityVoteItem, VoteDirection } from '../types';

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

const sanitizeVoteDirection = (value: unknown): VoteDirection | null => {
  if (value === 'up' || value === 'down') {
    return value;
  }
  return null;
};

export const streamCommunityFeed = (
  userId: string,
  onUpdate: (items: CommunityVoteItem[]) => void,
  onError?: (error: Error) => void,
) => {
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
  const ref = doc(collection(db, COLLECTION_NAME), entry.id);

  await setDoc(
    ref,
    {
      headline: entry.headline,
      summary: entry.summary,
      credibilityScore: entry.credibilityScore,
      aiVerdict: entry.aiVerdict ?? null,
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
