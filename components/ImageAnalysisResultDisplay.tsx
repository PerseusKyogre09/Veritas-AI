import React from 'react';
import { ImageAnalysisResult } from '../types';
import { ShieldCheckIcon } from './icons/ShieldCheckIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { LightBulbIcon } from './icons/LightBulbIcon';
import { XCircleIcon } from './icons/XCircleIcon';

interface ImageAnalysisResultDisplayProps {
  result: ImageAnalysisResult;
}

const getVerdictPalette = (verdict: ImageAnalysisResult['authenticity']['verdict']) => {
  switch (verdict) {
    case 'Likely AI-generated':
      return {
        badge: 'bg-danger/20 text-danger border-danger/40',
        accent: 'bg-danger/10 border-danger/30',
        indicator: 'bg-danger/15 text-danger/90',
        bar: 'bg-danger',
        icon: <XCircleIcon className="h-5 w-5" />,
        headline: 'High likelihood of AI synthesis detected',
      };
    case 'Likely human-captured':
      return {
        badge: 'bg-success/20 text-success border-success/40',
        accent: 'bg-success/10 border-success/30',
        indicator: 'bg-success/15 text-success/90',
        bar: 'bg-success',
        icon: <ShieldCheckIcon className="h-5 w-5" />,
        headline: 'Signals align with authentic photography',
      };
    case 'Possibly AI-assisted':
    default:
      return {
        badge: 'bg-warning/20 text-warning border-warning/40',
        accent: 'bg-warning/10 border-warning/30',
        indicator: 'bg-warning/15 text-warning/90',
        bar: 'bg-warning',
        icon: <SparklesIcon className="h-5 w-5" />,
        headline: 'Mixed cues suggest potential AI involvement',
      };
  }
};

const getRiskDetails = (riskScore: number) => {
  if (riskScore >= 75) {
    return {
      label: 'High AI manipulation risk',
      message: 'The secondary audit surfaced strong evidence of AI involvement. Treat this image as synthetic until proven otherwise and seek corroborating sources.',
      container: 'border-danger/40 bg-danger/5',
      iconWrapper: 'bg-danger/20 text-danger',
      bar: 'bg-danger',
      icon: <XCircleIcon className="h-5 w-5" />,
    } as const;
  }

  if (riskScore >= 45) {
    return {
      label: 'Elevated AI cues detected',
      message: 'Audit signals suggest the image may include AI-assisted edits. Investigate the source and scrutinise key visual details before trusting it.',
      container: 'border-warning/40 bg-warning/5',
      iconWrapper: 'bg-warning/20 text-warning',
      bar: 'bg-warning',
      icon: <SparklesIcon className="h-5 w-5" />,
    } as const;
  }

  return {
    label: 'Low AI manipulation risk',
    message: 'No strong AI cues were detected, but still verify provenance when accuracy matters—absence of evidence is not evidence of absence.',
    container: 'border-success/40 bg-success/5',
    iconWrapper: 'bg-success/20 text-success',
    bar: 'bg-success',
    icon: <ShieldCheckIcon className="h-5 w-5" />,
  } as const;
};

export const ImageAnalysisResultDisplay: React.FC<ImageAnalysisResultDisplayProps> = ({ result }) => {
  const palette = getVerdictPalette(result.authenticity.verdict);
  const indicators = result.authenticity.indicators ?? [];
  const warnings = result.contentWarnings ?? [];
  const actions = result.suggestedActions ?? [];
  const rawRiskScore = result.authenticity.riskScore;
  const hasRiskScore = typeof rawRiskScore === 'number' && !Number.isNaN(rawRiskScore);
  const clampedRiskScore = hasRiskScore ? Math.min(100, Math.max(0, Math.round(rawRiskScore!))) : null;
  const riskDetails = clampedRiskScore !== null ? getRiskDetails(clampedRiskScore) : null;

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#0C0C0C] p-8 text-white shadow-2xl shadow-black/60 sm:p-10">
      <div className="pointer-events-none absolute -top-24 left-24 h-56 w-56 rounded-full bg-primary/15 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-40 w-40 rounded-full bg-secondary/15 blur-3xl" />

      <div className="relative space-y-10">
        <div className="space-y-4">
          <div className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-white/60">
            Image credibility overview
          </div>
          <h3 className="text-3xl font-bold leading-tight">AI image analysis</h3>
          <p className="rounded-2xl border border-white/10 bg-white/5 p-5 text-base leading-relaxed text-white/70 shadow-inner shadow-black/40">
            {result.summary}
          </p>
        </div>

        <div className={`space-y-4 rounded-2xl border ${palette.accent} bg-white/5 p-6 shadow-sm shadow-black/40`}>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] ${palette.badge}`}>
                {result.authenticity.verdict}
              </span>
              <span className="text-sm text-white/50">{palette.headline}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-white/50">
              {palette.icon}
              <span>Confidence:</span>
              <span className="font-semibold text-white">{result.authenticity.confidence}%</span>
            </div>
          </div>
          <p className="text-sm text-white/70">{result.authenticity.rationale}</p>
          <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className={`${palette.bar} h-full rounded-full transition-all duration-500`}
              style={{ width: `${Math.min(100, Math.max(0, result.authenticity.confidence))}%` }}
            />
          </div>
          {riskDetails && clampedRiskScore !== null && (
            <div className={`space-y-4 rounded-2xl border ${riskDetails.container} p-4 transition-all duration-300`}>
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-3">
                  <span className={`flex h-11 w-11 items-center justify-center rounded-full border border-white/10 ${riskDetails.iconWrapper}`}>
                    {riskDetails.icon}
                  </span>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.35em] text-white/40">Secondary risk audit</p>
                    <p className="text-base font-semibold text-white">{riskDetails.label}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-white">{clampedRiskScore}%</p>
                  <p className="text-[11px] uppercase tracking-[0.35em] text-white/40">AI risk index</p>
                </div>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className={`${riskDetails.bar} h-full rounded-full transition-all duration-500`}
                  style={{ width: `${clampedRiskScore}%` }}
                />
              </div>
              <p className="text-sm leading-relaxed text-white/70">{riskDetails.message}</p>
            </div>
          )}
          {indicators.length > 0 && (
            <div className="grid gap-3 md:grid-cols-2">
              {indicators.map((indicator, index) => (
                <div key={index} className={`rounded-xl px-4 py-3 text-sm ${palette.indicator}`}>
                  {indicator}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6 shadow-sm shadow-black/40">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-semibold">Content warnings</h4>
              <span className="text-xs uppercase tracking-[0.35em] text-white/40">Flagged cues</span>
            </div>
            {warnings.length > 0 ? (
              <ul className="space-y-3 text-sm text-white/70">
                {warnings.map((warning, index) => (
                  <li key={index} className="rounded-xl border border-danger/20 bg-danger/5 px-4 py-3 text-danger/90">
                    {warning}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white/50">
                No specific warnings were surfaced for this image.
              </p>
            )}
          </div>

          <div className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6 shadow-sm shadow-black/40">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-semibold">Suggested actions</h4>
              <span className="text-xs uppercase tracking-[0.35em] text-white/40">Next steps</span>
            </div>
            {actions.length > 0 ? (
              <ul className="space-y-3 text-sm text-white/70">
                {actions.map((action, index) => (
                  <li key={index} className="flex items-start gap-3 rounded-xl border border-white/10 bg-black/30 px-4 py-3">
                    <LightBulbIcon className="mt-1 h-4 w-4 flex-shrink-0 text-primary" />
                    <span>{action}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white/50">
                No additional follow-up actions recommended.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
