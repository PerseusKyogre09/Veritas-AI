import React from 'react';
import { CommunityVoteItem, VoteDirection, View } from '../types';
import { ThumbUpIcon } from './icons/ThumbUpIcon';
import { ThumbDownIcon } from './icons/ThumbDownIcon';
import { ClockIcon } from './icons/ClockIcon';

interface CommunityFeedProps {
  items: CommunityVoteItem[];
  onVote: (id: string, direction: VoteDirection) => void;
  onNavigate: (view: View) => void;
  isLoggedIn: boolean;
  onRequestLogin: () => void;
  isLoading: boolean;
  errorMessage?: string | null;
}

const formatTimestamp = (timestamp: string): string => {
  const parsed = new Date(timestamp);
  if (Number.isNaN(parsed.getTime())) {
    return timestamp;
  }
  return parsed.toLocaleString();
};

const getVerdictBadge = (verdict?: CommunityVoteItem['aiVerdict']) => {
  switch (verdict) {
    case 'Likely AI-generated':
      return 'bg-danger/15 text-danger border-danger/30';
    case 'Possibly AI-assisted':
      return 'bg-warning/15 text-warning border-warning/30';
    case 'Likely human-authored':
      return 'bg-success/15 text-success border-success/30';
    default:
      return 'bg-primary/10 text-primary border-primary/30 dark:bg-accent/10 dark:text-accent dark:border-accent/30';
  }
};

interface CommunityFeedCardProps {
  item: CommunityVoteItem;
  onVote: (id: string, direction: VoteDirection) => void;
}

const CommunityFeedCard: React.FC<CommunityFeedCardProps> = ({ item, onVote }) => {
  const totalVotes = item.supportCount + item.disputeCount;
  const supportShare = totalVotes > 0 ? Math.round((item.supportCount / totalVotes) * 100) : 0;
  const upActive = item.userVote === 'up';
  const downActive = item.userVote === 'down';
  const aiDetection = item.aiDetection;

  return (
    <article
      className="relative overflow-hidden rounded-3xl border border-white/40 bg-white/70 p-7 shadow-xl shadow-primary/10 transition duration-200 hover:-translate-y-[1px] hover:shadow-2xl dark:border-gray-800/60 dark:bg-gray-900/70 dark:shadow-black/30"
    >
      <div className="pointer-events-none absolute -top-20 right-16 h-40 w-40 rounded-full bg-secondary/10 blur-3xl dark:bg-secondary/20" />
      <div className="pointer-events-none absolute -bottom-16 left-20 h-36 w-36 rounded-full bg-primary/10 blur-3xl dark:bg-accent/20" />
      <div className="relative space-y-4">
        <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.3em] text-gray-400 dark:text-gray-500">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 font-semibold text-primary dark:border-accent/30 dark:bg-accent/10 dark:text-accent">
            Score {item.credibilityScore}
          </span>
          {item.aiVerdict && (
            <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 font-semibold ${getVerdictBadge(item.aiVerdict)}`}>
              {item.aiVerdict}
            </span>
          )}
          <span className="inline-flex items-center gap-2 font-semibold">
            <ClockIcon className="h-4 w-4" />
            {formatTimestamp(item.timestamp)}
          </span>
        </div>

        <div className="space-y-2">
          <h3 className="text-xl font-semibold text-dark dark:text-white">
            {item.headline}
          </h3>
          <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-300">
            {item.summary}
          </p>
        </div>

        {aiDetection && (
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 text-sm text-gray-700 shadow-sm dark:border-accent/25 dark:bg-accent/5 dark:text-gray-200">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="font-semibold text-primary dark:text-accent">
                AI generation signals
              </div>
              <div className="flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">
                <span className="rounded-full bg-white/80 px-3 py-1 dark:bg-gray-900/60">
                  Likelihood {aiDetection.likelihoodScore}
                </span>
                <span className="rounded-full bg-white/80 px-3 py-1 dark:bg-gray-900/60">
                  Confidence {aiDetection.confidence}
                </span>
              </div>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
              {aiDetection.rationale}
            </p>
            <ul className="mt-3 grid gap-2 text-sm text-gray-600 dark:text-gray-300 sm:grid-cols-2">
              {aiDetection.indicators.map((indicator, index) => (
                <li key={`${item.id}-indicator-${index}`} className="flex items-start gap-2 rounded-xl bg-white/80 px-3 py-2 text-left shadow-sm dark:bg-gray-900/70">
                  <span className="mt-1 inline-block h-2 w-2 min-w-[0.5rem] rounded-full bg-primary dark:bg-accent" aria-hidden="true" />
                  <span>{indicator}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {totalVotes > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-gray-500 dark:text-gray-400">
              <span>Community consensus</span>
              <span>
                {supportShare}% support · {totalVotes} vote{totalVotes === 1 ? '' : 's'}
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200/70 dark:bg-gray-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-success via-primary to-accent transition-all duration-500 dark:from-success dark:via-accent dark:to-primary"
                style={{ width: `${supportShare}%` }}
              />
            </div>
          </div>
        )}

        <div className="flex flex-col gap-3 border-t border-white/40 pt-4 sm:flex-row sm:items-center sm:justify-between dark:border-gray-800/60">
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => onVote(item.id, 'up')}
              aria-pressed={upActive}
              className={`group inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition duration-200 ${
                upActive
                  ? 'border-success/50 bg-success/10 text-success dark:border-success/40 dark:bg-success/10 dark:text-success'
                  : 'border-white/40 bg-white/70 text-gray-700 hover:border-success/40 hover:text-success dark:border-gray-700/60 dark:bg-gray-900/70 dark:text-gray-300 dark:hover:border-success/50 dark:hover:text-success'
              }`}
            >
              <ThumbUpIcon className="h-5 w-5" />
              <span>Support</span>
              <span className="font-semibold">{item.supportCount}</span>
            </button>
            <button
              type="button"
              onClick={() => onVote(item.id, 'down')}
              aria-pressed={downActive}
              className={`group inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition duration-200 ${
                downActive
                  ? 'border-danger/50 bg-danger/10 text-danger dark:border-danger/40 dark:bg-danger/10 dark:text-danger'
                  : 'border-white/40 bg-white/70 text-gray-700 hover:border-danger/40 hover:text-danger dark:border-gray-700/60 dark:bg-gray-900/70 dark:text-gray-300 dark:hover:border-danger/50 dark:hover:text-danger'
              }`}
            >
              <ThumbDownIcon className="h-5 w-5" />
              <span>Dispute</span>
              <span className="font-semibold">{item.disputeCount}</span>
            </button>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Votes reset if you change sides. Your latest take is what counts.
          </div>
        </div>
      </div>
    </article>
  );
};

export const CommunityFeed: React.FC<CommunityFeedProps> = ({
  items,
  onVote,
  onNavigate,
  isLoggedIn,
  onRequestLogin,
  isLoading,
  errorMessage,
}) => {
  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <h2 className="text-3xl font-semibold tracking-tight text-dark dark:text-white">
            Community signals
          </h2>
          <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-300">
            Review how the wider audience is judging recent narratives. Cast your own vote to signal if you think a story holds up—or falls apart.
          </p>
        </div>
        <button
          type="button"
          onClick={() => onNavigate(View.ANALYZER)}
          className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-primary via-accent to-secondary px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/30 transition-transform duration-200 hover:-translate-y-[2px] hover:shadow-2xl"
        >
          Submit new article
        </button>
      </div>

      {!isLoggedIn && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-primary/25 bg-primary/5 px-5 py-4 text-sm text-primary shadow-sm dark:border-accent/30 dark:bg-accent/10 dark:text-accent">
          <span className="font-medium">Log in to have your vote counted in the community ledger.</span>
          <button
            type="button"
            onClick={onRequestLogin}
            className="rounded-full border border-primary/40 bg-white/80 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-primary transition-colors duration-200 hover:border-primary hover:text-primary dark:border-accent/40 dark:bg-gray-900/70 dark:text-accent"
          >
            Log in
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="rounded-2xl border border-red-200/70 bg-red-50/80 px-4 py-3 text-sm text-red-700 shadow-sm dark:border-red-500/40 dark:bg-red-900/40 dark:text-red-200">
          {errorMessage}
        </div>
      )}

      {isLoading ? (
        <div className="relative overflow-hidden rounded-3xl border border-white/40 bg-white/70 p-12 text-center shadow-xl shadow-primary/10 backdrop-blur dark:border-gray-800/60 dark:bg-gray-900/70 dark:shadow-black/30">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10 dark:from-accent/10" />
          <div className="relative space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary dark:bg-accent/10 dark:text-accent">
              <ThumbUpIcon className="h-6 w-6 animate-pulse" />
            </div>
            <h3 className="text-lg font-semibold text-dark dark:text-white">Loading community verdicts</h3>
            <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">
              Syncing the latest fact-checks and votes from the ledger.
            </p>
          </div>
        </div>
      ) : items.length === 0 ? (
        <div className="relative overflow-hidden rounded-3xl border border-dashed border-primary/30 bg-white/70 p-12 text-center shadow-inner shadow-primary/10 backdrop-blur dark:border-accent/30 dark:bg-gray-900/60 dark:shadow-black/20">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/10 dark:from-accent/5" />
          <div className="relative space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary dark:bg-accent/15 dark:text-accent">
              <ThumbUpIcon className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-semibold text-dark dark:text-white">No community entries yet</h3>
            <p className="mx-auto max-w-md text-sm leading-relaxed text-gray-600 dark:text-gray-400">
              Run your first credibility analysis to seed the community ledger. Each report becomes a post that peers can support or dispute.
            </p>
            <button
              type="button"
              onClick={() => onNavigate(View.ANALYZER)}
              className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-primary via-accent to-secondary px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/30 transition-transform duration-200 hover:-translate-y-[2px] hover:shadow-2xl"
            >
              Analyze an article
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          {items.map((item) => (
            <CommunityFeedCard key={item.id} item={item} onVote={onVote} />
          ))}
        </div>
      )}
    </div>
  );
};
