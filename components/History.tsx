
import React, { useState } from 'react';
import { AnalysisHistoryItem, View } from '../types';
import { AnalysisResultDisplay } from './AnalysisResultDisplay';
import { ChevronDownIcon } from './icons/ChevronDownIcon';
import { ClockIcon } from './icons/ClockIcon';

interface HistoryProps {
  history: AnalysisHistoryItem[];
  onNavigate: (view: View) => void;
}

const HistoryItem: React.FC<{ item: AnalysisHistoryItem }> = ({ item }) => {
  const [isOpen, setIsOpen] = useState(false);
  const score = item.result.credibilityScore;
  const scoreTone = score >= 75 ? 'text-success' : score >= 40 ? 'text-warning' : 'text-danger';

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/40 bg-white/70 shadow-lg shadow-primary/5 transition duration-200 hover:-translate-y-[1px] hover:shadow-xl dark:border-gray-800/60 dark:bg-gray-900/60 dark:shadow-black/20">
      <div className="pointer-events-none absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-primary/80 via-accent/80 to-secondary/80 opacity-60" />
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-start gap-4 px-6 py-5 text-left"
        aria-expanded={isOpen}
        aria-controls={`history-item-${item.id}`}
      >
        <div className="mt-1 flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary dark:bg-accent/10 dark:text-accent">
          <span>{score}</span>
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <p className="text-sm font-semibold leading-5 text-dark dark:text-white">
            {item.query}
          </p>
          <p className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.3em] text-gray-400 dark:text-gray-500">
            <ClockIcon className="h-4 w-4" />
            {item.timestamp}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <span className={`text-sm font-semibold ${scoreTone}`}>Score</span>
          <ChevronDownIcon className={`h-6 w-6 text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>
      {isOpen && (
        <div id={`history-item-${item.id}`} className="border-t border-white/40 bg-white/60 p-6 dark:border-gray-800/60 dark:bg-gray-900/70">
          <AnalysisResultDisplay result={item.result} />
        </div>
      )}
    </div>
  );
};


export const History: React.FC<HistoryProps> = ({ history, onNavigate }) => {
  return (
  <div className="mx-auto max-w-4xl space-y-6">
    <div className="space-y-2">
    <h2 className="text-3xl font-semibold tracking-tight text-dark dark:text-white">Analysis history</h2>
    <p className="text-sm text-gray-500 dark:text-gray-400">Revisit past credibility scans, replay insights, and monitor narratives as they evolve.</p>
    </div>
      {history.length > 0 ? (
    <div className="space-y-5">
          {history.map((item) => (
            <HistoryItem key={item.id} item={item} />
          ))}
        </div>
      ) : (
    <div className="relative overflow-hidden rounded-3xl border border-dashed border-primary/30 bg-white/60 p-12 text-center shadow-inner shadow-primary/10 backdrop-blur dark:border-accent/30 dark:bg-gray-900/60 dark:shadow-black/20">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/10 dark:from-accent/5" />
      <div className="relative flex flex-col items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary dark:bg-accent/15 dark:text-accent">
          <ClockIcon className="h-8 w-8" aria-hidden="true" />
        </div>
        <h3 className="text-xl font-semibold text-dark dark:text-white">No history yet</h3>
        <p className="max-w-md text-sm leading-relaxed text-gray-600 dark:text-gray-400">
          Your credibility reports will appear here once you start analyzing content. Build your library of verified insights.
        </p>
        <button
          onClick={() => onNavigate(View.ANALYZER)}
          className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-primary via-accent to-secondary px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/30 transition-transform duration-200 hover:-translate-y-[2px] hover:shadow-2xl"
        >
          Analyze your first article
        </button>
      </div>
    </div>
      )}
    </div>
  );
};