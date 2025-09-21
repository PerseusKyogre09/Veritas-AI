
import React, { useState } from 'react';
import { analyzeContent } from '../services/geminiService';
import { AnalysisResult, AnalysisHistoryItem } from '../types';
import { AnalysisResultDisplay } from './AnalysisResultDisplay';
import { SparklesIcon } from './icons/SparklesIcon';
import { XCircleIcon } from './icons/XCircleIcon';

interface AnalyzerProps {
  onAnalysisComplete: (item: AnalysisHistoryItem) => void;
}

type InputType = 'text' | 'url';

// A simple function to strip HTML tags and extract readable text.
// This is a basic simulation of what a tool like Python's BeautifulSoup would do on a server.
const extractTextFromHtml = (html: string): string => {
    try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        
        // Remove elements that are typically not part of the main content
        doc.querySelectorAll('script, style, nav, header, footer, aside, form, [role="navigation"], [role="banner"], [role="contentinfo"], [role="search"]').forEach(el => el.remove());

        // Try to find the main content container, otherwise fall back to the whole body
        const mainContent = doc.querySelector('main') || doc.querySelector('article') || doc.body;
        
        if (!mainContent) return "";

        // Get text content and clean up excessive whitespace for better readability
        let text = mainContent.textContent || "";
        text = text.replace(/\s\s+/g, ' ').trim(); // Replace multiple whitespaces with a single space

        return text;
    } catch (e) {
        console.error("Could not parse HTML", e);
        // Fallback for parsing errors: a very crude regex strip as a last resort
        return html.replace(/<[^>]*>/g, '').replace(/\s\s+/g, ' ').trim();
    }
}

// Fetch URL content using our Python backend scraping service
const fetchUrlContent = async (url: string): Promise<string> => {
    console.log(`Fetching content for URL via Python scraping service: ${url}`);
    
    // Use production URL in production, localhost in development
    const scraperEndpoint = process.env.NODE_ENV === 'production' 
        ? 'https://veritas-ai-backend.onrender.com/scrape'  // Replace with your actual Render URL
        : 'http://localhost:5000/scrape';
    
    try {
        const response = await fetch(scraperEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ url })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || `Failed to scrape content. Status: ${response.status}`);
        }
        
        if (!data.content || !data.content.trim()) {
            throw new Error("No readable content could be extracted from the URL.");
        }
        
        return data.content;

    } catch (error) {
        console.error("Error fetching URL content:", error);
        if (error instanceof Error && error.message.includes('fetch')) {
            throw new Error("Could not connect to the scraping service. Please ensure the backend service is running.");
        }
        // Re-throw the original or a more generic error
        throw new Error(error instanceof Error ? error.message : "Could not fetch or process content from the URL. It may be offline or protected from scraping.");
    }
};


export const Analyzer: React.FC<AnalyzerProps> = ({ onAnalysisComplete }) => {
  const [inputType, setInputType] = useState<InputType>('text');
  const [inputValue, setInputValue] = useState<string>('');
  const [loadingMessage, setLoadingMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const handleTabChange = (type: InputType) => {
    setInputType(type);
    setInputValue('');
    setError(null);
    setResult(null);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || loadingMessage) return;

    setError(null);
    setResult(null);
    
    let contentToAnalyze = '';

    try {
        if (inputType === 'url') {
            try {
                // Use the URL constructor for reliable, browser-native validation.
                const url = new URL(inputValue);
                if (url.protocol !== 'http:' && url.protocol !== 'https:') {
                    throw new Error(); // Let the catch block handle the specific error message
                }
            } catch (_) {
                 throw new Error("The URL format is invalid. Please enter a complete URL, including 'http://' or 'https://'.");
            }
            
            setLoadingMessage('Fetching content from URL...');
            contentToAnalyze = await fetchUrlContent(inputValue);
             if (!contentToAnalyze.trim()) {
              throw new Error("The URL content appears to be empty or no readable text could be extracted.");
            }
        } else {
            contentToAnalyze = inputValue;
        }

      setLoadingMessage('Analyzing content with AI...');
      const analysisResult = await analyzeContent(contentToAnalyze);
      setResult(analysisResult);
      
      onAnalysisComplete({
        id: new Date().toISOString(),
        query: inputValue.substring(0, 100) + (inputValue.length > 100 ? '...' : ''),
        timestamp: new Date().toLocaleString(),
        result: analysisResult,
      });

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setLoadingMessage(null);
    }
  };
  
  const isLoading = !!loadingMessage;

  const tabClasses = (type: InputType) => `px-4 py-2 font-semibold border-b-2 transition-colors duration-200 ${
    inputType === type
    ? 'border-primary dark:border-accent text-primary dark:text-accent'
    : 'border-transparent text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-500 hover:text-gray-700 dark:hover:text-gray-200'
  }`;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg">
        <h2 className="text-2xl font-bold text-dark dark:text-white mb-2">Content Analyzer</h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6">Paste text or a URL below. Our AI will provide a detailed credibility report.</p>
        
        <div className="flex border-b border-gray-200 dark:border-gray-700 mb-4">
            <button onClick={() => handleTabChange('text')} className={tabClasses('text')}>
                Analyze Text
            </button>
            <button onClick={() => handleTabChange('url')} className={tabClasses('url')}>
                Analyze URL
            </button>
        </div>

        <form onSubmit={handleSubmit}>
          {inputType === 'text' ? (
             <div className="relative w-full">
                <textarea
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Paste an article, social media post, or any text here..."
                    className="w-full h-40 p-4 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-accent transition-shadow duration-200 resize-y bg-light dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-accent dark:focus:border-accent"
                    disabled={isLoading}
                />
                {inputValue && !isLoading && (
                    <button
                        type="button"
                        onClick={() => setInputValue('')}
                        className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
                        aria-label="Clear input"
                    >
                        <XCircleIcon className="h-6 w-6" />
                    </button>
                )}
             </div>
          ) : (
            <div>
                <div className="relative w-full">
                    <input
                        type="url"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder="https://example.com/news-article"
                        className="w-full p-4 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-accent transition-shadow duration-200 bg-light dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-accent dark:focus:border-accent"
                        disabled={isLoading}
                    />
                     {inputValue && !isLoading && (
                        <button
                            type="button"
                            onClick={() => setInputValue('')}
                            className="absolute top-1/2 -translate-y-1/2 right-3 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
                            aria-label="Clear input"
                        >
                            <XCircleIcon className="h-6 w-6" />
                        </button>
                    )}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 px-1">
                    <strong>Note:</strong> This application uses a Python backend with Beautiful Soup to extract clean text content from web pages. Make sure the Python scraping service is running on localhost:5000 for URL analysis to work.
                </p>
            </div>
          )}
         
          <div className="mt-4 flex justify-end">
            <button
              type="submit"
              disabled={isLoading || !inputValue.trim()}
              className="flex items-center justify-center bg-accent text-white font-bold py-2 px-6 rounded-lg hover:bg-primary disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-300 min-w-[140px]"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>{loadingMessage}...</span>
                </>
              ) : (
                <>
                  <SparklesIcon className="h-5 w-5 mr-2" />
                  Analyze
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {isLoading && !result && (
        <div className="mt-8 text-center">
            <div className="animate-pulse-fast">
              <p className="text-secondary dark:text-teal-400 font-semibold">{loadingMessage}...</p>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">This may take a moment.</p>
            </div>
        </div>
      )}

      {error && (
        <div className="mt-8 bg-danger/10 dark:bg-danger/20 p-4 rounded-xl shadow-lg relative animate-fade-in">
             <button
                onClick={() => setError(null)}
                className="absolute top-3 right-3 text-danger/60 dark:text-danger/70 hover:text-danger dark:hover:text-danger transition-colors"
                aria-label="Dismiss error"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
            <div className="flex items-start">
                <XCircleIcon className="h-6 w-6 text-danger dark:text-red-400 mr-3 flex-shrink-0" />
                <div>
                    <h4 className="font-bold text-danger dark:text-red-400">An Error Occurred</h4>
                    <p className="text-danger/90 dark:text-red-400/90 mt-1">{error}</p>
                </div>
            </div>
        </div>
      )}
      
      {result && !isLoading && (
        <div className="mt-8">
          <AnalysisResultDisplay result={result} />
        </div>
      )}
    </div>
  );
};
