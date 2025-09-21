import React from 'react';
import { AnalysisResult } from '../types';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { XCircleIcon } from './icons/XCircleIcon';
import { LinkIcon } from './icons/LinkIcon';

interface AnalysisResultDisplayProps {
  result: AnalysisResult;
}

const ScoreCircle: React.FC<{ score: number }> = ({ score }) => {
  const getScoreColor = () => {
    if (score >= 75) return 'text-success';
    if (score >= 40) return 'text-warning';
    return 'text-danger';
  };

  const circumference = 2 * Math.PI * 45;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative w-40 h-40">
      <svg className="w-full h-full" viewBox="0 0 100 100">
        <circle
          className="text-gray-200 dark:text-gray-700"
          strokeWidth="10"
          stroke="currentColor"
          fill="transparent"
          r="45"
          cx="50"
          cy="50"
        />
        <circle
          className={`${getScoreColor()} transition-all duration-1000 ease-out`}
          strokeWidth="10"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r="45"
          cx="50"
          cy="50"
          transform="rotate(-90 50 50)"
        />
      </svg>
      <div className={`absolute inset-0 flex items-center justify-center text-4xl font-extrabold ${getScoreColor()}`}>
        {score}
      </div>
    </div>
  );
};

export const AnalysisResultDisplay: React.FC<AnalysisResultDisplayProps> = ({ result }) => {
  return (
    <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg animate-fade-in">
      <h3 className="text-2xl font-bold text-dark dark:text-white mb-6 text-center">Analysis Report</h3>
      <div className="grid md:grid-cols-3 gap-8 items-center mb-8">
        <div className="flex justify-center md:col-span-1">
          <ScoreCircle score={result.credibilityScore} />
        </div>
        <div className="md:col-span-2">
            <h4 className="text-lg font-semibold text-dark dark:text-white mb-2">AI Summary</h4>
            <p className="text-gray-700 dark:text-gray-200 bg-light dark:bg-gray-700/50 p-4 rounded-md">{result.summary}</p>
        </div>
      </div>
      
      <div className="space-y-6">
        <div>
            <h4 className="text-lg font-semibold text-dark dark:text-white mb-3 border-b border-gray-200 dark:border-gray-700 pb-2">Key Claims Analysis</h4>
            <ul className="space-y-4">
            {result.keyClaims.map((item, index) => (
                <li key={index} className="flex items-start p-4 bg-light dark:bg-gray-700/50 rounded-lg">
                {item.isMisleading ? 
                    <XCircleIcon className="h-6 w-6 text-danger flex-shrink-0 mr-3 mt-1" /> :
                    <CheckCircleIcon className="h-6 w-6 text-success flex-shrink-0 mr-3 mt-1" />
                }
                <div>
                    <p className="font-semibold text-dark dark:text-white">{item.claim}</p>
                    <p className="text-gray-600 dark:text-gray-300">{item.assessment}</p>
                </div>
                </li>
            ))}
            </ul>
        </div>
        
        {result.sources && result.sources.length > 0 && (
            <div>
                <h4 className="text-lg font-semibold text-dark dark:text-white mb-3 border-b border-gray-200 dark:border-gray-700 pb-2">Verified Sources</h4>
                <ul className="space-y-2">
                    {result.sources.map((source, index) => (
                    <li key={index}>
                        <a 
                            href={source.uri} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="flex items-center text-accent hover:text-primary dark:text-blue-400 dark:hover:text-blue-300 transition-colors duration-200"
                        >
                            <LinkIcon className="h-4 w-4 mr-2 flex-shrink-0" />
                            <span className="truncate">{source.title}</span>
                        </a>
                    </li>
                    ))}
                </ul>
            </div>
        )}
      </div>
    </div>
  );
};
