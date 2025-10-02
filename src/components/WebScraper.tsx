// Copyright James Burvel O’Callaghan III
// President Citibank Demo Business Inc.

import React, { useState, useCallback } from 'react';
import { WebScraperIcon } from './icons.tsx';
import { scrapeHtmlStream } from '../services/geminiService.ts';
import { LoadingSpinner, MarkdownRenderer } from './shared/index.tsx';

export const WebScraper: React.FC = () => {
    const [html, setHtml] = useState('<body><h1>Jobs</h1><ul><li>Software Engineer</li><li>Product Manager</li></ul></body>');
    const [prompt, setPrompt] = useState('Extract all job titles from the list and present them as a JSON array.');
    const [result, setResult] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleScrape = useCallback(async () => {
        if (!html.trim() || !prompt.trim()) {
            setError('Please provide HTML content and an extraction prompt.');
            return;
        }
        setIsLoading(true);
        setError('');
        setResult('');
        try {
            const stream = scrapeHtmlStream(html, prompt);
            let fullResponse = '';
            for await (const chunk of stream) {
                fullResponse += chunk;
                setResult(fullResponse);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    }, [html, prompt]);

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8 text-text-primary">
            <header className="mb-6">
                <h1 className="text-3xl font-bold flex items-center">
                    <WebScraperIcon />
                    <span className="ml-3">AI Web Scraper</span>
                </h1>
                <p className="text-text-secondary mt-1">Paste HTML content and describe the data you want to extract.</p>
                 <p className="text-xs text-amber-600 mt-2">Note: Direct URL fetching is not possible from the browser. Please copy and paste the page source (View -&gt; Developer -&gt; View Source).</p>
            </header>
            <div className="flex-grow grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0">
                <div className="flex flex-col h-full">
                    <label htmlFor="html-input" className="text-sm font-medium text-text-secondary mb-2">HTML Source</label>
                    <textarea
                        id="html-input"
                        value={html}
                        onChange={(e) => setHtml(e.target.value)}
                        className="flex-grow p-4 bg-surface border border-border rounded-md resize-none font-mono text-sm"
                    />
                </div>
                <div className="flex flex-col h-full">
                     <label htmlFor="prompt-input" className="text-sm font-medium text-text-secondary mb-2">Extraction Prompt</label>
                    <textarea
                        id="prompt-input"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        className="h-24 p-4 bg-surface border border-border rounded-md resize-none font-sans text-sm"
                    />
                     <button
                        onClick={handleScrape}
                        disabled={isLoading}
                        className="btn-primary mt-4 w-full flex items-center justify-center px-6 py-3"
                    >
                        {isLoading ? <LoadingSpinner /> : 'Scrape Data'}
                    </button>
                    <div className="flex-grow p-1 mt-4 bg-background border border-border rounded-md overflow-y-auto">
                        {isLoading && !result && <div className="flex items-center justify-center h-full"><LoadingSpinner /></div>}
                        {error && <p className="p-4 text-red-500">{error}</p>}
                        {result && <MarkdownRenderer content={result} />}
                    </div>
                </div>
            </div>
        </div>
    );
};