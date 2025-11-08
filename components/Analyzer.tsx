
import React, { useState, useEffect, useCallback } from 'react';
import { analyzeContent, analyzeImage, detectLanguage } from '../services/geminiService';
import { AnalysisResult, AnalysisHistoryItem, ImageAnalysisResult } from '../types';
import { AnalysisResultDisplay } from './AnalysisResultDisplay';
import { ImageAnalysisResultDisplay } from './ImageAnalysisResultDisplay';
import { SparklesIcon } from './icons/SparklesIcon';
import { XCircleIcon } from './icons/XCircleIcon';

interface AnalyzerProps {
  onAnalysisComplete: (item: AnalysisHistoryItem) => void;
}

type InputType = 'text' | 'url' | 'image';
type ImageInputMode = 'upload' | 'url';

const MAX_IMAGE_BYTES = 8 * 1024 * 1024; // 8 MB

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
    
  const scraperEndpoint = import.meta.env.VITE_BACKEND_URL
    ? `${import.meta.env.VITE_BACKEND_URL}/scrape`
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

const fetchImageBlobFromUrl = async (imageUrl: string): Promise<Blob> => {
  let normalizedUrl: URL;
  try {
    normalizedUrl = new URL(imageUrl);
  } catch (error) {
    throw new Error("The image URL format is invalid. Please include 'http://' or 'https://'.");
  }

  if (normalizedUrl.protocol !== 'http:' && normalizedUrl.protocol !== 'https:') {
    throw new Error('Only HTTP and HTTPS image URLs are supported.');
  }

  let response: Response;
  try {
    response = await fetch(normalizedUrl.toString(), { mode: 'cors' });
  } catch (error) {
    console.error('Failed to fetch image from URL:', error);
    throw new Error('Could not reach the image host. It may block cross-origin downloads or be offline.');
  }

  if (!response.ok) {
    throw new Error(`Failed to download image. Server responded with status ${response.status}.`);
  }

  const contentType = response.headers.get('content-type') ?? '';
  if (contentType && !contentType.startsWith('image/')) {
    throw new Error('The provided link does not appear to point to an image file.');
  }

  const blob = await response.blob();

  if (blob.size > MAX_IMAGE_BYTES) {
    throw new Error('The downloaded image exceeds the 8MB size limit. Please choose a smaller image.');
  }

  if (blob.type && !blob.type.startsWith('image/')) {
    throw new Error('The downloaded file is not recognised as an image.');
  }

  return blob;
};


export const Analyzer: React.FC<AnalyzerProps> = ({ onAnalysisComplete }) => {
  const [inputType, setInputType] = useState<InputType>('text');
  const [inputValue, setInputValue] = useState<string>('');
  const [loadingMessage, setLoadingMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [detectedLanguage, setDetectedLanguage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [imageAnalysis, setImageAnalysis] = useState<ImageAnalysisResult | null>(null);
  const [imageInputMode, setImageInputMode] = useState<ImageInputMode>('upload');
  const [imageUrl, setImageUrl] = useState<string>('');

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
      // For URLs or images, clear language detection until we fetch content
      setDetectedLanguage(null);
    }
  }, [inputValue, inputType, debouncedLanguageDetection]);

  const revokePreviewUrl = useCallback((url: string | null) => {
    if (url && url.startsWith('blob:')) {
      URL.revokeObjectURL(url);
    }
  }, []);

  useEffect(() => {
    return () => {
      revokePreviewUrl(imagePreviewUrl);
    };
  }, [imagePreviewUrl, revokePreviewUrl]);

  const handleTabChange = (type: InputType) => {
    setInputType(type);
    setInputValue('');
    setError(null);
    setResult(null);
    setDetectedLanguage(null);
    setImageFile(null);
    revokePreviewUrl(imagePreviewUrl);
    setImagePreviewUrl(null);
    setImageAnalysis(null);
    setImageInputMode('upload');
    setImageUrl('');
  }

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      event.target.value = '';
      return;
    }

    if (!file.type.startsWith('image/')) {
      setError('Please choose a valid image file (PNG, JPG, WebP).');
      event.target.value = '';
      return;
    }

    if (file.size > MAX_IMAGE_BYTES) {
      setError('Image must be 8MB or smaller for analysis.');
      event.target.value = '';
      return;
    }

    revokePreviewUrl(imagePreviewUrl);

    setError(null);
    setResult(null);
    setImageAnalysis(null);

    const objectUrl = URL.createObjectURL(file);
    setImagePreviewUrl(objectUrl);
    setImageFile(file);
    event.target.value = '';
  };

  const handleImageClear = () => {
    revokePreviewUrl(imagePreviewUrl);
    setImagePreviewUrl(null);
    setImageFile(null);
    setImageAnalysis(null);
    setImageUrl('');
  };

  const handleImageModeChange = (mode: ImageInputMode) => {
    if (mode === imageInputMode) return;

    setImageInputMode(mode);
    setError(null);
    setResult(null);
    setImageAnalysis(null);
    setImageFile(null);
    setImageUrl('');
    revokePreviewUrl(imagePreviewUrl);
    setImagePreviewUrl(null);
  };

  const handleImageUrlInput = (value: string) => {
    setImageUrl(value);
    setError(null);
    setImageAnalysis(null);

    if (!value.trim()) {
      revokePreviewUrl(imagePreviewUrl);
      setImagePreviewUrl(null);
      setImageFile(null);
      return;
    }

    setImageFile(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loadingMessage) return;

    setError(null);

    if (inputType === 'image') {
      setResult(null);
      setImageAnalysis(null);

      try {
        if (imageInputMode === 'upload') {
          if (!imageFile) {
            setError('Please select an image to analyze.');
            return;
          }

          setLoadingMessage('Analyzing image with AI...');
          const analysis = await analyzeImage(imageFile);
          setImageAnalysis(analysis);
        } else {
          if (!imageUrl.trim()) {
            setError('Please paste an image URL to analyze.');
            return;
          }

          setLoadingMessage('Fetching image from URL...');
          const blob = await fetchImageBlobFromUrl(imageUrl.trim());

          const parsedName = (() => {
            try {
              const candidate = new URL(imageUrl.trim());
              const pathname = candidate.pathname.split('/').filter(Boolean).pop() ?? 'remote-image';
              const cleanName = decodeURIComponent(pathname.split('?')[0]);
              return cleanName.length > 2 ? cleanName : 'remote-image';
            } catch {
              return 'remote-image';
            }
          })();

          const fileForAnalysis = new File([blob], parsedName, { type: blob.type || 'image/png' });

          revokePreviewUrl(imagePreviewUrl);
          const previewObjectUrl = blob.size > 0 ? URL.createObjectURL(blob) : null;
          setImagePreviewUrl(previewObjectUrl ?? imageUrl.trim());
          setImageFile(fileForAnalysis);
          setImageUrl(imageUrl.trim());

          setLoadingMessage('Analyzing image with AI...');
          const analysis = await analyzeImage(fileForAnalysis);
          setImageAnalysis(analysis);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      } finally {
        setLoadingMessage(null);
      }

      return;
    }

    if (!inputValue.trim()) {
      setError('Please enter text or a URL to analyze.');
      return;
    }

    setResult(null);
    setImageAnalysis(null);
    
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
  const canSubmit = inputType === 'image'
    ? imageInputMode === 'upload'
      ? Boolean(imageFile)
      : imageUrl.trim().length > 0
    : inputValue.trim().length > 0;
  const submitLabel = inputType === 'image' ? 'Run image authenticity scan' : 'Run credibility scan';

  const tabClasses = (type: InputType) => `relative flex-1 rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200 ${
    inputType === type
    ? 'bg-primary text-black shadow-md shadow-primary/40'
    : 'text-white/60 hover:bg-white/5 hover:text-white'
  }`;

  const imageModeClasses = (mode: ImageInputMode) => `relative flex-1 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] transition-all duration-200 ${
    imageInputMode === mode
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
              Paste text, drop in a URL, or assess an image. We auto-detect language, cleanse the content, and surface a transparent credibility breakdown.
            </p>
          </div>

          <div className="relative grid grid-cols-3 gap-1 rounded-full border border-white/10 bg-white/5 p-1 text-center">
            <button onClick={() => handleTabChange('text')} className={tabClasses('text')}>
              Analyze text
            </button>
            <button onClick={() => handleTabChange('url')} className={tabClasses('url')}>
              Analyze URL
            </button>
            <button onClick={() => handleTabChange('image')} className={tabClasses('image')}>
              Analyze image
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
            ) : inputType === 'url' ? (
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
            ) : (
              <div className="space-y-4">
                <div className="relative grid grid-cols-2 gap-1 rounded-full border border-white/10 bg-white/5 p-1 text-center">
                  <button type="button" onClick={() => handleImageModeChange('upload')} className={imageModeClasses('upload')}>
                    Upload image
                  </button>
                  <button type="button" onClick={() => handleImageModeChange('url')} className={imageModeClasses('url')}>
                    Paste image URL
                  </button>
                </div>

                {imageInputMode === 'upload' ? (
                  <div className="relative flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-white/20 bg-white/5 p-6 text-center text-white/60">
                    {!imagePreviewUrl ? (
                      <>
                        <div className="flex flex-col items-center gap-3">
                          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10 text-white/50">
                            <svg className="h-7 w-7" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5V8.25M3 8.25V5.25a2.25 2.25 0 012.25-2.25h3M3 8.25h4.875a2.25 2.25 0 012.25 2.25v.75M21 16.5V8.25M21 8.25V5.25a2.25 2.25 0 00-2.25-2.25h-3M21 8.25h-4.875a2.25 2.25 0 00-2.25 2.25v.75" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5h4.125a2.25 2.25 0 012.25 2.25V19.5M21 16.5h-4.125a2.25 2.25 0 00-2.25 2.25V19.5" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 13.5l2.25-2.25a.75.75 0 011.06 0L15 13.5m-6 0l-.78.78a.75.75 0 00.53 1.28h7.5a.75.75 0 00.53-1.28L15 13.5m-6 0V9.75A2.25 2.25 0 0111.25 7.5h1.5A2.25 2.25 0 0115 9.75V13.5" />
                            </svg>
                          </span>
                          <div className="space-y-1">
                            <p className="text-sm font-semibold text-white">Drop an image or upload</p>
                            <p className="text-xs text-white/50">PNG, JPG, or WebP • Max 8MB</p>
                          </div>
                        </div>
                        <label className="inline-flex cursor-pointer items-center justify-center rounded-full border border-white/20 px-5 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-white/60 transition duration-200 hover:border-white/40 hover:text-white">
                          <input
                            type="file"
                            accept="image/png,image/jpeg,image/webp"
                            className="hidden"
                            onChange={handleImageChange}
                            disabled={isLoading}
                          />
                          Choose file
                        </label>
                      </>
                    ) : (
                      <div className="w-full space-y-4">
                        <div className="relative mx-auto max-w-md overflow-hidden rounded-2xl border border-white/10 bg-black/30 shadow-lg">
                          <img src={imagePreviewUrl} alt="Selected for analysis" className="h-full w-full object-contain" />
                          <button
                            type="button"
                            onClick={handleImageClear}
                            className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-black/70 px-3 py-1 text-xs font-semibold text-white/70 transition duration-200 hover:bg-black/90"
                            disabled={isLoading}
                          >
                            <XCircleIcon className="h-4 w-4" />
                            Remove
                          </button>
                        </div>
                        <label className="inline-flex cursor-pointer items-center justify-center rounded-full border border-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-white/60 transition duration-200 hover:border-white/30 hover:text-white">
                          <input
                            type="file"
                            accept="image/png,image/jpeg,image/webp"
                            className="hidden"
                            onChange={handleImageChange}
                            disabled={isLoading}
                          />
                          Replace image
                        </label>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="relative">
                      <input
                        type="url"
                        value={imageUrl}
                        onChange={(e) => handleImageUrlInput(e.target.value)}
                        placeholder="https://example.com/photo.jpg"
                        className="w-full rounded-2xl border border-white/10 bg-[#111111] p-5 pr-12 text-sm text-white/80 shadow-inner shadow-black/40 transition duration-200 placeholder:text-white/30 focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/30"
                        disabled={isLoading}
                      />
                      {imageUrl && !isLoading && (
                        <button
                          type="button"
                          onClick={() => handleImageUrlInput('')}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 transition-colors duration-150 hover:text-white/70"
                          aria-label="Clear image URL"
                        >
                          <XCircleIcon className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                    {(imagePreviewUrl || imageUrl) && (
                      <div className="relative mx-auto max-w-md overflow-hidden rounded-2xl border border-white/10 bg-black/30 shadow-lg">
                        <img
                          src={imagePreviewUrl ?? imageUrl}
                          alt="Image selected via URL"
                          className="h-full w-full object-contain"
                        />
                        <button
                          type="button"
                          onClick={handleImageClear}
                          className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-black/70 px-3 py-1 text-xs font-semibold text-white/70 transition duration-200 hover:bg-black/90"
                          disabled={isLoading}
                        >
                          <XCircleIcon className="h-4 w-4" />
                          Remove
                        </button>
                      </div>
                    )}
                    <p className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs leading-5 text-white/60">
                      <strong className="font-semibold text-white">Tip:</strong> we’ll download the image before scanning it. If the host blocks cross-origin requests, try saving and uploading it instead.
                    </p>
                  </div>
                )}

                <p className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs leading-5 text-white/60">
                  <strong className="font-semibold text-white">What we look for:</strong> compression patterns, lighting irregularities, anatomical distortions, and other cues that hint at AI synthesis or heavy editing.
                </p>
              </div>
            )}

            <div className="flex items-center justify-end gap-3">
              <div className="text-xs text-white/40">
                {detectedLanguage && inputType !== 'image' && (
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
                disabled={isLoading || !canSubmit}
                className="inline-flex min-w-[200px] items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-semibold text-black shadow-lg shadow-primary/40 transition-all duration-200 hover:-translate-y-[2px] hover:bg-secondary disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/30 disabled:shadow-none"
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
                    {submitLabel}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {isLoading && !result && !imageAnalysis && (
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

      {imageAnalysis && !isLoading && (
        <ImageAnalysisResultDisplay result={imageAnalysis} />
      )}
    </div>
  );
};
