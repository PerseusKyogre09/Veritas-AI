
import React, { useState, useEffect, useCallback } from 'react';
import { analyzeContent, detectLanguage } from '../services/geminiService';
import { AnalysisResult, AnalysisHistoryItem } from '../types';
import { AnalysisResultDisplay } from './AnalysisResultDisplay';
import { SparklesIcon } from './icons/SparklesIcon';
import { XCircleIcon } from './icons/XCircleIcon';

interface AnalyzerProps {
  onAnalysisComplete: (item: AnalysisHistoryItem) => void;
}

type InputType = 'text' | 'url';

// Debounce utility function
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

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
        ? 'https://veritas-ai-vpls.onrender.com/scrape'  // Fixed: Added /scrape endpoint
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
  const [detectedLanguage, setDetectedLanguage] = useState<string | null>(null);

  // Debounced language detection
  const debouncedLanguageDetection = useCallback(
    debounce(async (text: string) => {
      if (!text.trim() || text.length < 3) {
        setDetectedLanguage(null);
        return;
      }

      try {
        const language = await detectLanguage(text);
        setDetectedLanguage(language);
      } catch (error) {
        console.warn('Language detection failed:', error);
        // Don't show error for language detection failures, just clear the language
        setDetectedLanguage(null);
      }
    }, 1000), // 1 second debounce
    []
  );

  // Auto-detect language when input changes (even for very short phrases)
  useEffect(() => {
    if (inputType === 'text') {
      debouncedLanguageDetection(inputValue);
    } else {
      // For URLs, clear language detection until we fetch content
      setDetectedLanguage(null);
    }
  }, [inputValue, inputType, debouncedLanguageDetection]);

  const handleTabChange = (type: InputType) => {
    setInputType(type);
    setInputValue('');
    setError(null);
    setResult(null);
    setDetectedLanguage(null);
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
            
            // Detect language for URL content
            setLoadingMessage('Detecting language...');
            const language = await detectLanguage(contentToAnalyze);
            setDetectedLanguage(language);
            
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

  const tabClasses = (type: InputType) => `relative flex-1 rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200 ${
    inputType === type
    ? 'bg-primary text-black shadow-md shadow-primary/40'
    : 'text-white/60 hover:bg-white/5 hover:text-white'
  }`;

  return (
    <div className="mx-auto max-w-4xl space-y-8 text-white">
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#0C0C0C] p-8 shadow-xl shadow-black/60 sm:p-10">
        <div className="pointer-events-none absolute inset-x-0 -top-40 mx-auto h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 left-16 h-32 w-32 rounded-full bg-secondary/20 blur-2xl" />
        <div className="relative space-y-6">
          <div className="space-y-2">
            <h2 className="text-3xl font-semibold tracking-tight text-white">Content Analyzer</h2>
            <p className="text-sm leading-relaxed text-white/60">
              Paste text or drop in a URL. We auto-detect language, cleanse the content, and surface a transparent credibility breakdown.
            </p>
          </div>

          <div className="relative grid grid-cols-2 gap-1 rounded-full border border-white/10 bg-white/5 p-1 text-center">
            <button onClick={() => handleTabChange('text')} className={tabClasses('text')}>
              Analyze text
            </button>
            <button onClick={() => handleTabChange('url')} className={tabClasses('url')}>
              Analyze URL
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {inputType === 'text' ? (
              <div className="relative">
                <textarea
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Paste an article, post, or transcript here..."
                  className="min-h-[180px] w-full resize-y rounded-2xl border border-white/10 bg-[#111111] p-5 pr-12 text-sm leading-6 text-white/80 shadow-inner shadow-black/40 transition duration-200 placeholder:text-white/30 focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/30"
                  disabled={isLoading}
                />
                {inputValue && !isLoading && (
                  <button
                    type="button"
                    onClick={() => setInputValue('')}
                    className="absolute right-4 top-4 text-white/40 transition-colors duration-150 hover:text-white/70"
                    aria-label="Clear input"
                  >
                    <XCircleIcon className="h-5 w-5" />
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="relative">
                  <input
                    type="url"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="https://example.com/investigative-article"
                    className="w-full rounded-2xl border border-white/10 bg-[#111111] p-5 pr-12 text-sm text-white/80 shadow-inner shadow-black/40 transition duration-200 placeholder:text-white/30 focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/30"
                    disabled={isLoading}
                  />
                  {inputValue && !isLoading && (
                    <button
                      type="button"
                      onClick={() => setInputValue('')}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 transition-colors duration-150 hover:text-white/70"
                      aria-label="Clear input"
                    >
                      <XCircleIcon className="h-5 w-5" />
                    </button>
                  )}
                </div>
                <p className="rounded-2xl border border-dashed border-white/20 bg-white/5 px-4 py-3 text-xs leading-5 text-white/60">
                  <strong className="font-semibold text-white">Heads up:</strong> our Python microservice extracts readable content for deeper analysis. Confirm the scraper is running locally on <code className="rounded bg-black/50 px-1 py-0.5 text-[10px] tracking-wide">http://localhost:5000</code> when testing URLs.
                </p>
              </div>
            )}

            <div className="flex items-center justify-end gap-3">
              <div className="text-xs text-white/40">
                {detectedLanguage && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/20 px-3 py-1 font-medium text-black">
                    <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                      <path fillRule="evenodd" d="M4.5 3A1.5 1.5 0 003 4.5v11A1.5 1.5 0 004.5 17h4a.5.5 0 00.4-.2l1.7-2.4h4.9a1.5 1.5 0 001.5-1.5v-7A1.5 1.5 0 0015.5 4h-5l-1.7-1.4A.5.5 0 008.4 2h-3.9z" clipRule="evenodd" />
                    </svg>
                    {detectedLanguage}
                  </span>
                )}
              </div>
              <button
                type="submit"
                disabled={isLoading || !inputValue.trim()}
                className="inline-flex min-w-[160px] items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-semibold text-black shadow-lg shadow-primary/40 transition-all duration-200 hover:-translate-y-[2px] hover:bg-secondary disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/30 disabled:shadow-none"
              >
                {isLoading ? (
                  <>
                    <svg className="-ml-1 mr-3 h-5 w-5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>{loadingMessage ?? 'Processing'}...</span>
                  </>
                ) : (
                  <>
                    <SparklesIcon className="mr-2 h-5 w-5" />
                    Run credibility scan
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {isLoading && !result && (
        <div className="flex justify-center">
          <div className="inline-flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-white/70 shadow-sm">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/60 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary" />
            </span>
            {loadingMessage ?? 'Running multi-layer analysis'}...
          </div>
        </div>
      )}

      {error && (
        <div className="relative overflow-hidden rounded-2xl border border-danger/40 bg-danger/10 p-5 text-danger shadow-lg shadow-danger/20">
          <button
            onClick={() => setError(null)}
            className="absolute right-4 top-4 text-danger/70 transition-colors duration-150 hover:text-danger"
            aria-label="Dismiss error"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div className="flex items-start gap-3">
            <XCircleIcon className="mt-0.5 h-6 w-6 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-semibold text-white">We hit a snag</h4>
              <p className="mt-1 text-sm leading-relaxed text-white/80">{error}</p>
            </div>
          </div>
        </div>
      )}

      {result && !isLoading && (
        <AnalysisResultDisplay result={result} />
      )}
    </div>
  );
};
