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
      return 'bg-danger/20 text-danger border-danger/30';
    case 'Possibly AI-assisted':
      return 'bg-warning/20 text-warning border-warning/40';
    case 'Likely human-authored':
      return 'bg-success/20 text-success border-success/40';
    default:
      return 'bg-primary/20 text-primary border-primary/40';
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
      className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#0C0C0C] p-7 text-white shadow-xl shadow-black/60 transition duration-200 hover:-translate-y-[1px] hover:shadow-2xl"
    >
      <div className="pointer-events-none absolute -top-20 right-16 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-16 left-20 h-36 w-36 rounded-full bg-secondary/10 blur-3xl" />
      <div className="relative space-y-4">
        <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.3em] text-white/40">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-primary/20 px-3 py-1 font-semibold text-black">
            Score {item.credibilityScore}
          </span>
          {item.aiVerdict && (
            <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 font-semibold ${getVerdictBadge(item.aiVerdict)}`}>
              {item.aiVerdict}
            </span>
          )}
          <span className="inline-flex items-center gap-2 font-semibold text-white/60">
            <ClockIcon className="h-4 w-4" />
            {formatTimestamp(item.timestamp)}
          </span>
        </div>

        <div className="space-y-2">
          <h3 className="text-xl font-semibold text-white">
            {item.headline}
          </h3>
          <p className="text-sm leading-relaxed text-white/70">
            {item.summary}
          </p>
        </div>

        {aiDetection && (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-white/70 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="font-semibold text-primary">
                AI generation signals
              </div>
              <div className="flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-white/40">
                <span className="rounded-full bg-white/5 px-3 py-1">
                  Likelihood {aiDetection.likelihoodScore}
                </span>
                <span className="rounded-full bg-white/5 px-3 py-1">
                  Confidence {aiDetection.confidence}
                </span>
              </div>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-white/70">
              {aiDetection.rationale}
            </p>
            <ul className="mt-3 grid gap-2 text-sm text-white/70 sm:grid-cols-2">
              {aiDetection.indicators.map((indicator, index) => (
                <li key={`${item.id}-indicator-${index}`} className="flex items-start gap-2 rounded-xl bg-white/5 px-3 py-2 text-left shadow-sm">
                  <span className="mt-1 inline-block h-2 w-2 min-w-[0.5rem] rounded-full bg-primary" aria-hidden="true" />
                  <span>{indicator}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {totalVotes > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-white/40">
              <span>Community consensus</span>
              <span>
                {supportShare}% support · {totalVotes} vote{totalVotes === 1 ? '' : 's'}
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary via-accent to-secondary transition-all duration-500"
                style={{ width: `${supportShare}%` }}
              />
            </div>
          </div>
        )}

        <div className="flex flex-col gap-3 border-t border-white/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => onVote(item.id, 'up')}
              aria-pressed={upActive}
              className={`group inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition duration-200 ${
                upActive
                  ? 'border-success/40 bg-success/20 text-success'
                  : 'border-white/10 bg-white/5 text-white/70 hover:border-success/40 hover:text-success'
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
                  ? 'border-danger/40 bg-danger/20 text-danger'
                  : 'border-white/10 bg-white/5 text-white/70 hover:border-danger/40 hover:text-danger'
              }`}
            >
              <ThumbDownIcon className="h-5 w-5" />
              <span>Dispute</span>
              <span className="font-semibold">{item.disputeCount}</span>
            </button>
          </div>
          <div className="text-xs text-white/40">
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
          <h2 className="text-3xl font-semibold tracking-tight text-white">
            Community signals
          </h2>
          <p className="text-sm leading-relaxed text-white/60">
            Review how the wider audience is judging recent narratives. Cast your own vote to signal if you think a story holds up—or falls apart.
          </p>
        </div>
        <button
          type="button"
          onClick={() => onNavigate(View.ANALYZER)}
          className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-semibold text-black shadow-lg shadow-primary/40 transition-transform duration-200 hover:-translate-y-[2px] hover:bg-secondary"
        >
          Submit new article
        </button>
      </div>

      {!isLoggedIn && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-sm text-white/70 shadow-sm">
          <span className="font-medium text-white">Log in to have your vote counted in the community ledger.</span>
          <button
            type="button"
            onClick={onRequestLogin}
            className="rounded-full border border-white/20 bg-white/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-white/70 transition-colors duration-200 hover:border-white/40 hover:text-white"
          >
            Log in
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="rounded-2xl border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger shadow-sm">
          {errorMessage}
        </div>
      )}

      {isLoading ? (
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#0C0C0C] p-12 text-center shadow-xl shadow-black/60">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10" />
          <div className="relative space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/20 text-primary">
              <ThumbUpIcon className="h-6 w-6 animate-pulse" />
            </div>
            <h3 className="text-lg font-semibold text-white">Loading community verdicts</h3>
            <p className="text-sm leading-relaxed text-white/60">
              Syncing the latest fact-checks and votes from the ledger.
            </p>
          </div>
        </div>
      ) : items.length === 0 ? (
        <div className="relative overflow-hidden rounded-3xl border border-dashed border-white/20 bg-[#0C0C0C] p-12 text-center shadow-inner shadow-black/40">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/10" />
          <div className="relative space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/20 text-primary">
              <ThumbUpIcon className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-semibold text-white">No community entries yet</h3>
            <p className="mx-auto max-w-md text-sm leading-relaxed text-white/60">
              Run your first credibility analysis to seed the community ledger. Each report becomes a post that peers can support or dispute.
            </p>
            <button
              type="button"
              onClick={() => onNavigate(View.ANALYZER)}
              className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-semibold text-black shadow-lg shadow-primary/40 transition-transform duration-200 hover:-translate-y-[2px] hover:bg-secondary"
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
