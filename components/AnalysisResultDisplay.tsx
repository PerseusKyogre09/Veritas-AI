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
        background: conic-gradient(from 0deg, rgba(34, 197, 94, 0.08) 0deg, rgba(16, 185, 129, 0.7) 120deg, rgba(52, 211, 153, 0.95) 210deg, rgba(16, 185, 129, 0.7) 300deg, rgba(34, 197, 94, 0.08) 360deg);
        filter: drop-shadow(0 0 18px rgba(52, 211, 153, 0.35));
        mask: radial-gradient(farthest-side, transparent calc(100% - 18px), rgba(0, 0, 0, 0.95) calc(100% - 10px));
        -webkit-mask: radial-gradient(farthest-side, transparent calc(100% - 18px), rgba(0, 0, 0, 0.95) calc(100% - 10px));
        pointer-events: none;
      }

      .score-wave-ring-alt {
        background: conic-gradient(from 90deg, rgba(16, 185, 129, 0.08) 0deg, rgba(34, 197, 94, 0.85) 140deg, rgba(52, 211, 153, 0.6) 240deg, rgba(34, 197, 94, 0.85) 360deg);
        filter: drop-shadow(0 0 22px rgba(16, 185, 129, 0.25));
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

      <div className={`relative z-10 flex h-[168px] w-[168px] items-center justify-center rounded-full border border-white/10 bg-[#050505] ring-2 ring-white/5 backdrop-blur ${palette.ringAccent}`}>
        <svg className="h-40 w-40" viewBox="0 0 100 100">
        <defs>
          <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#22c55e" />
            <stop offset="100%" stopColor="#34d399" />
          </linearGradient>
        </defs>
        <circle
          className="stroke-white/10"
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
          <span className="mt-1 text-xs font-semibold uppercase tracking-[0.4em] text-white/50">Score</span>
        </div>
      </div>
    </div>
  );
};

const getAiVerdictPalette = (aiGeneration: AIGenerationAssessment) => {
  switch (aiGeneration.verdict) {
    case 'Likely AI-generated':
      return {
        border: 'border-danger/40',
        text: 'text-danger',
        accent: 'bg-danger/10',
        badge: 'bg-danger/20 text-danger border-danger/30',
      };
    case 'Possibly AI-assisted':
      return {
        border: 'border-warning/40',
        text: 'text-warning',
        accent: 'bg-warning/10',
        badge: 'bg-warning/20 text-warning border-warning/40',
      };
    case 'Likely human-authored':
    default:
      return {
        border: 'border-success/40',
        text: 'text-success',
        accent: 'bg-success/10',
        badge: 'bg-success/20 text-success border-success/40',
      };
  }
};

export const AnalysisResultDisplay: React.FC<AnalysisResultDisplayProps> = ({ result }) => {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#0C0C0C] p-8 text-white shadow-2xl shadow-black/60 sm:p-10">
      <div className="pointer-events-none absolute -top-24 right-24 h-56 w-56 rounded-full bg-primary/15 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-0 h-40 w-40 rounded-full bg-secondary/15 blur-3xl" />

      <div className="relative space-y-10">
        <div className="flex flex-col items-center gap-8 text-center md:flex-row md:text-left">
          <ScoreCircle score={result.credibilityScore} />
          <div className="space-y-4">
            <div className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-white/60">
              Credibility overview
            </div>
            <h3 className="text-3xl font-bold leading-tight">AI summary</h3>
            <p className="rounded-2xl border border-white/10 bg-white/5 p-5 text-base leading-relaxed text-white/70 shadow-inner shadow-black/40">
              {result.summary}
            </p>
          </div>
        </div>

        {result.aiGeneration && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-semibold">AI generation detection</h4>
              <span className="text-xs uppercase tracking-[0.35em] text-white/40">Authorship signal</span>
            </div>
            {(() => {
              const palette = getAiVerdictPalette(result.aiGeneration!);
              return (
                <div className={`rounded-2xl border ${palette.border} bg-white/5 p-6 shadow-sm shadow-black/40`}>
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
                      <div className="flex items-center justify-between text-xs font-semibold text-white/50">
                        <span>Likelihood</span>
                        <span>{result.aiGeneration.likelihoodScore}%</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                        <div
                          className={`${palette.text.replace('text-', 'bg-')} h-full rounded-full transition-all duration-500`}
                          style={{ width: `${result.aiGeneration.likelihoodScore}%` }}
                        />
                      </div>
                      <p className="text-xs text-white/50">
                        Confidence: {result.aiGeneration.confidence}%
                      </p>
                    </div>
                  </div>
                  {result.aiGeneration.indicators.length > 0 && (
                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      {result.aiGeneration.indicators.map((indicator, index) => (
                        <div key={index} className={`rounded-xl ${palette.accent} p-3 text-sm text-white/70`}>
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
              <h4 className="text-lg font-semibold">Key claims analysis</h4>
              <span className="text-xs uppercase tracking-[0.35em] text-white/40">Evidence trail</span>
            </div>
            <ul className="space-y-4">
              {result.keyClaims.map((item, index) => (
                <li key={index} className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-5 shadow-sm shadow-black/40 transition duration-200 hover:-translate-y-[1px] hover:border-white/20">
                  <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-primary to-secondary opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
                  <div className="relative flex items-start gap-4">
                    {item.isMisleading ? (
                      <XCircleIcon className="mt-0.5 h-6 w-6 text-danger" />
                    ) : (
                      <CheckCircleIcon className="mt-0.5 h-6 w-6 text-success" />
                    )}
                    <div className="space-y-2">
                      <p className="font-semibold text-white">{item.claim}</p>
                      <p className="text-sm leading-relaxed text-white/70">{item.assessment}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {result.sources && result.sources.length > 0 && (
            <div className="space-y-4">
              <h4 className="text-lg font-semibold">Verified sources</h4>
              <ul className="grid gap-3 md:grid-cols-2">
                {result.sources.map((source, index) => (
                  <li key={index}>
                    <a
                      href={source.uri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white/70 transition duration-200 hover:border-white/30 hover:text-white"
                    >
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-primary">
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
