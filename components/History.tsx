
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
    const scoreColor = score >= 75 ? 'bg-success' : score >= 40 ? 'bg-warning' : 'bg-danger';
    const scoreTextColor = score >= 75 ? 'text-success' : score >= 40 ? 'text-warning' : 'text-danger';

    return (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex justify-between items-center p-4 text-left"
                aria-expanded={isOpen}
                aria-controls={`history-item-${item.id}`}
            >
                <div className="flex items-center min-w-0">
                    <div className={`w-4 h-4 rounded-full ${scoreColor} mr-3 flex-shrink-0`}></div>
                    <div className="flex-grow min-w-0">
                        <p className="font-semibold text-dark dark:text-white truncate pr-4">{item.query}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center"><ClockIcon className="h-4 w-4 mr-1" /> {item.timestamp}</p>
                    </div>
                </div>
                <div className="flex items-center flex-shrink-0 pl-2">
                    <span className={`text-sm font-bold mr-4 ${scoreTextColor}`}>{score}</span>
                    <ChevronDownIcon className={`h-6 w-6 text-gray-500 dark:text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                </div>
            </button>
            {isOpen && (
                <div id={`history-item-${item.id}`} className="p-4 border-t border-gray-200 dark:border-gray-700">
                    <AnalysisResultDisplay result={item.result} />
                </div>
            )}
        </div>
    );
};


export const History: React.FC<HistoryProps> = ({ history, onNavigate }) => {
  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold text-dark dark:text-white mb-6">Analysis History</h2>
      {history.length > 0 ? (
        <div className="space-y-4">
          {history.map((item) => (
            <HistoryItem key={item.id} item={item} />
          ))}
        </div>
      ) : (
        <div className="text-center bg-white dark:bg-gray-800 p-12 rounded-lg shadow flex flex-col items-center">
            <ClockIcon className="h-16 w-16 text-gray-300 dark:text-gray-600 mb-4" aria-hidden="true" />
            <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-200">No History Found</h3>
            <p className="text-gray-500 dark:text-gray-400 mt-2 mb-6 max-w-sm">
                It looks like you haven't analyzed any content yet. Your past analyses will appear here.
            </p>
            <button
                onClick={() => onNavigate(View.ANALYZER)}
                className="bg-accent text-white font-bold py-2 px-6 rounded-full hover:bg-primary transition-transform transform hover:scale-105 duration-300 shadow"
            >
                Analyze Your First Article
            </button>
        </div>
      )}
    </div>
  );
};