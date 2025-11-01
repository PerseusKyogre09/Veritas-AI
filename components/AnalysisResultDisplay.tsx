import React from 'react';
import { AnalysisResult, AIGenerationAssessment } from '../types';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { XCircleIcon } from './icons/XCircleIcon';
import { LinkIcon } from './icons/LinkIcon';

interface AnalysisResultDisplayProps {
  result: AnalysisResult;
}

const injectScoreWaveStyles = (() => {
  let injected = false;

  return () => {
    if (injected || typeof document === 'undefined') {
      return;
    }

    const style = document.createElement('style');
    style.id = 'score-wave-animation';
    style.textContent = `
      @keyframes score-wave-spin {
        to {
          transform: rotate(360deg);
        }
      }

      @keyframes score-wave-glow {
        0%,
        100% {
          opacity: 0.9;
        }
        50% {
          opacity: 0.55;
        }
      }

      .score-wave-ring {
        position: absolute;
        inset: 0;
        border-radius: 9999px;
        background: conic-gradient(from 0deg, rgba(25, 118, 210, 0.08) 0deg, rgba(13, 71, 161, 0.7) 120deg, rgba(25, 118, 210, 0.98) 210deg, rgba(13, 71, 161, 0.7) 300deg, rgba(25, 118, 210, 0.08) 360deg);
        filter: drop-shadow(0 0 18px rgba(25, 118, 210, 0.35));
        mask: radial-gradient(farthest-side, transparent calc(100% - 18px), rgba(0, 0, 0, 0.95) calc(100% - 10px));
        -webkit-mask: radial-gradient(farthest-side, transparent calc(100% - 18px), rgba(0, 0, 0, 0.95) calc(100% - 10px));
        pointer-events: none;
      }

      .score-wave-ring-alt {
        background: conic-gradient(from 90deg, rgba(13, 71, 161, 0.08) 0deg, rgba(25, 118, 210, 0.85) 140deg, rgba(13, 71, 161, 0.6) 240deg, rgba(25, 118, 210, 0.85) 360deg);
        filter: drop-shadow(0 0 22px rgba(13, 71, 161, 0.25));
      }
    `;

    document.head.appendChild(style);
    injected = true;
  };
})();

const ScoreCircle: React.FC<{ score: number }> = ({ score }) => {
  injectScoreWaveStyles();

  const getPalette = () => {
    if (score >= 75) return { ring: 'stroke-success', text: 'text-success', ringAccent: 'ring-success/30' };
    if (score >= 40) return { ring: 'stroke-warning', text: 'text-warning', ringAccent: 'ring-warning/30' };
    return { ring: 'stroke-danger', text: 'text-danger', ringAccent: 'ring-danger/30' };
  };

  const palette = getPalette();
  const circumference = 2 * Math.PI * 45;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative flex h-44 w-44 items-center justify-center">
      <div className="pointer-events-none absolute inset-0">
        <div
          className="score-wave-ring"
          style={{ animation: 'score-wave-spin 8s linear infinite, score-wave-glow 3.6s ease-in-out infinite' }}
        />
        <div
          className="score-wave-ring score-wave-ring-alt"
          style={{ animation: 'score-wave-spin 12s linear infinite reverse, score-wave-glow 5s ease-in-out infinite' }}
        />
      </div>

      <div className={`relative z-10 flex h-[168px] w-[168px] items-center justify-center rounded-full bg-white/80 ring-2 backdrop-blur dark:bg-gray-900/70 ${palette.ringAccent}`}>
        <svg className="h-40 w-40" viewBox="0 0 100 100">
        <defs>
          <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0D47A1" />
            <stop offset="100%" stopColor="#1976D2" />
          </linearGradient>
        </defs>
        <circle
          className="stroke-gray-200/70 dark:stroke-gray-700"
          strokeWidth="10"
          stroke="currentColor"
          fill="transparent"
          r="45"
          cx="50"
          cy="50"
        />
        <circle
          className={`transition-all duration-1000 ease-out ${palette.ring}`}
          strokeWidth="10"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          stroke={score >= 75 ? 'url(#scoreGradient)' : undefined}
          fill="transparent"
          r="45"
          cx="50"
          cy="50"
          transform="rotate(-90 50 50)"
        />
        </svg>
        <div className={`absolute flex flex-col items-center text-4xl font-extrabold ${palette.text}`}>
          <span>{score}</span>
          <span className="mt-1 text-xs font-semibold uppercase tracking-[0.4em] text-gray-400 dark:text-gray-500">Score</span>
        </div>
      </div>
    </div>
  );
};

const getAiVerdictPalette = (aiGeneration: AIGenerationAssessment) => {
  switch (aiGeneration.verdict) {
    case 'Likely AI-generated':
      return {
        border: 'border-danger/40 dark:border-danger/30',
        text: 'text-danger',
        accent: 'bg-danger/10',
        badge: 'bg-danger/15 text-danger border-danger/40',
      };
    case 'Possibly AI-assisted':
      return {
        border: 'border-warning/40 dark:border-warning/30',
        text: 'text-warning',
        accent: 'bg-warning/10',
        badge: 'bg-warning/15 text-warning border-warning/40',
      };
    case 'Likely human-authored':
    default:
      return {
        border: 'border-success/40 dark:border-success/30',
        text: 'text-success',
        accent: 'bg-success/10',
        badge: 'bg-success/15 text-success border-success/40',
      };
  }
};

export const AnalysisResultDisplay: React.FC<AnalysisResultDisplayProps> = ({ result }) => {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/40 bg-white/70 p-8 shadow-2xl shadow-primary/10 backdrop-blur-md transition-colors duration-200 dark:border-gray-800/60 dark:bg-gray-900/70 dark:shadow-black/40 sm:p-10">
      <div className="pointer-events-none absolute -top-24 right-24 h-56 w-56 rounded-full bg-primary/15 blur-3xl dark:bg-accent/20" />
      <div className="pointer-events-none absolute bottom-0 left-0 h-40 w-40 rounded-full bg-secondary/15 blur-3xl dark:bg-secondary/25" />

      <div className="relative space-y-10">
        <div className="flex flex-col items-center gap-8 text-center md:flex-row md:text-left">
          <ScoreCircle score={result.credibilityScore} />
          <div className="space-y-4">
            <div className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-primary dark:border-accent/30 dark:bg-accent/10 dark:text-accent">
              Credibility overview
            </div>
            <h3 className="text-3xl font-bold leading-tight text-dark dark:text-white">AI summary</h3>
            <p className="rounded-2xl border border-white/40 bg-white/80 p-5 text-base leading-relaxed text-gray-700 shadow-inner shadow-primary/5 dark:border-gray-700/70 dark:bg-gray-900/70 dark:text-gray-200">
              {result.summary}
            </p>
          </div>
        </div>

        {result.aiGeneration && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-semibold text-dark dark:text-white">AI generation detection</h4>
              <span className="text-xs uppercase tracking-[0.35em] text-gray-400 dark:text-gray-500">Authorship signal</span>
            </div>
            {(() => {
              const palette = getAiVerdictPalette(result.aiGeneration!);
              return (
                <div className={`rounded-2xl border ${palette.border} bg-white/80 p-6 shadow-sm shadow-primary/5 dark:bg-gray-900/70`}>
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="space-y-2">
                      <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] ${palette.badge}`}>
                        {result.aiGeneration.verdict}
                      </span>
                      <p className={`text-sm font-medium ${palette.text}`}>
                        {result.aiGeneration.rationale}
                      </p>
                    </div>
                    <div className="min-w-[220px] space-y-2">
                      <div className="flex items-center justify-between text-xs font-semibold text-gray-500 dark:text-gray-400">
                        <span>Likelihood</span>
                        <span>{result.aiGeneration.likelihoodScore}%</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200/70 dark:bg-gray-800">
                        <div
                          className={`${palette.text.replace('text-', 'bg-')} h-full rounded-full transition-all duration-500`}
                          style={{ width: `${result.aiGeneration.likelihoodScore}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Confidence: {result.aiGeneration.confidence}%
                      </p>
                    </div>
                  </div>
                  {result.aiGeneration.indicators.length > 0 && (
                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      {result.aiGeneration.indicators.map((indicator, index) => (
                        <div key={index} className={`rounded-xl ${palette.accent} p-3 text-sm text-gray-700 dark:text-gray-300`}>
                          {indicator}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}

        <div className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-semibold text-dark dark:text-white">Key claims analysis</h4>
              <span className="text-xs uppercase tracking-[0.35em] text-gray-400 dark:text-gray-500">Evidence trail</span>
            </div>
            <ul className="space-y-4">
              {result.keyClaims.map((item, index) => (
                <li key={index} className="group relative overflow-hidden rounded-2xl border border-white/30 bg-white/70 p-5 shadow-sm shadow-primary/5 transition duration-200 hover:-translate-y-[1px] hover:shadow-lg dark:border-gray-700/60 dark:bg-gray-900/70 dark:shadow-black/20">
                  <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-primary to-accent opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
                  <div className="relative flex items-start gap-4">
                    {item.isMisleading ? (
                      <XCircleIcon className="mt-0.5 h-6 w-6 text-danger" />
                    ) : (
                      <CheckCircleIcon className="mt-0.5 h-6 w-6 text-success" />
                    )}
                    <div className="space-y-2">
                      <p className="font-semibold text-dark dark:text-white">{item.claim}</p>
                      <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-300">{item.assessment}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {result.sources && result.sources.length > 0 && (
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-dark dark:text-white">Verified sources</h4>
              <ul className="grid gap-3 md:grid-cols-2">
                {result.sources.map((source, index) => (
                  <li key={index}>
                    <a
                      href={source.uri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 rounded-2xl border border-transparent bg-white/60 px-4 py-3 text-sm font-medium text-primary transition duration-200 hover:border-primary/30 hover:bg-white/90 hover:text-primary dark:bg-gray-900/60 dark:text-accent dark:hover:border-accent/30 dark:hover:bg-gray-900/80 dark:hover:text-accent"
                    >
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-primary dark:bg-accent/15 dark:text-accent">
                        <LinkIcon className="h-4 w-4" />
                      </span>
                      <span className="flex-1 text-left text-sm leading-snug text-current">
                        {source.title}
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
