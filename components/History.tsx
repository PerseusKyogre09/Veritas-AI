
import React, { useState } from 'react';
import { AnalysisHistoryItem, View, AIGenerationAssessment } from '../types';
import { AnalysisResultDisplay } from './AnalysisResultDisplay';
import { ChevronDownIcon } from './icons/ChevronDownIcon';
import { ClockIcon } from './icons/ClockIcon';

interface HistoryProps {
  history: AnalysisHistoryItem[];
  onNavigate: (view: View) => void;
}

const getVerdictBadgeStyle = (assessment: AIGenerationAssessment) => {
  switch (assessment.verdict) {
    case 'Likely AI-generated':
      return 'bg-danger/20 text-danger border-danger/30';
    case 'Possibly AI-assisted':
      return 'bg-warning/20 text-warning border-warning/40';
    default:
      return 'bg-success/20 text-success border-success/40';
  }
};

const HistoryItem: React.FC<{ item: AnalysisHistoryItem }> = ({ item }) => {
  const [isOpen, setIsOpen] = useState(false);
  const score = item.result.credibilityScore;
  const scoreTone = score >= 75 ? 'text-success' : score >= 40 ? 'text-warning' : 'text-danger';
  const aiGeneration = item.result.aiGeneration;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 text-white shadow-lg shadow-black/40 transition duration-200 hover:-translate-y-[1px] hover:shadow-xl">
      <div className="pointer-events-none absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-primary via-accent to-secondary opacity-60" />
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-start gap-4 px-6 py-5 text-left"
        aria-expanded={isOpen}
        aria-controls={`history-item-${item.id}`}
      >
        <div className="mt-1 flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-full bg-primary/20 text-sm font-semibold text-primary">
          <span>{score}</span>
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <p className="text-sm font-semibold leading-5 text-white">
            {item.query}
          </p>
          <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.3em] text-white/40">
            <span className="inline-flex items-center gap-2 font-medium">
              <ClockIcon className="h-4 w-4" />
              {item.timestamp}
            </span>
            {aiGeneration && (
              <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 font-semibold tracking-[0.2em] ${getVerdictBadgeStyle(aiGeneration)}`}>
                {aiGeneration.verdict}
              </span>
            )}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <span className={`text-sm font-semibold ${scoreTone}`}>Score</span>
          <ChevronDownIcon className={`h-6 w-6 text-white/40 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>
      {isOpen && (
        <div id={`history-item-${item.id}`} className="border-t border-white/10 bg-white/5 p-6">
          <AnalysisResultDisplay result={item.result} />
        </div>
      )}
    </div>
  );
};


export const History: React.FC<HistoryProps> = ({ history, onNavigate }) => {
  return (
  <div className="mx-auto max-w-4xl space-y-6 text-white">
    <div className="space-y-2">
    <h2 className="text-3xl font-semibold tracking-tight">Analysis history</h2>
    <p className="text-sm text-white/50">Revisit past credibility scans, replay insights, and monitor narratives as they evolve.</p>
    </div>
      {history.length > 0 ? (
    <div className="space-y-5">
          {history.map((item) => (
            <HistoryItem key={item.id} item={item} />
          ))}
        </div>
      ) : (
    <div className="relative overflow-hidden rounded-3xl border border-dashed border-white/20 bg-white/5 p-12 text-center shadow-inner shadow-black/40">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10" />
      <div className="relative flex flex-col items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/20 text-primary">
          <ClockIcon className="h-8 w-8" aria-hidden="true" />
        </div>
        <h3 className="text-xl font-semibold">No history yet</h3>
        <p className="max-w-md text-sm leading-relaxed text-white/60">
          Your credibility reports will appear here once you start analyzing content. Build your library of verified insights.
        </p>
        <button
          onClick={() => onNavigate(View.ANALYZER)}
          className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-semibold text-black shadow-lg shadow-primary/40 transition-transform duration-200 hover:-translate-y-[2px] hover:bg-secondary"
        >
          Analyze your first article
        </button>
      </div>
    </div>
      )}
    </div>
  );
};