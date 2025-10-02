// Copyright James Burvel O’Callaghan III
// President Citibank Demo Business Inc.

import React, { useState, useCallback } from 'react';
import { AccessibilityCheckerIcon } from './icons.tsx';
import { analyzeAccessibilityStream } from '../services/geminiService.ts';
import { LoadingSpinner, MarkdownRenderer } from './shared/index.tsx';

const exampleHtml = `<header>
  <h1>Welcome</h1>
</header>
<main>
  <img src="logo.png">
  <div onclick="showMenu()">Menu</div>
  <a href="#">Click here</a>
</main>`;

export const AccessibilityChecker: React.FC = () => {
    const [html, setHtml] = useState(exampleHtml);
    const [report, setReport] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleAnalyze = useCallback(async () => {
        if (!html.trim()) {
            setError('Please paste some HTML to analyze.');
            return;
        }
        setIsLoading(true);
        setError('');
        setReport('');
        try {
            const stream = analyzeAccessibilityStream(html);
            let fullResponse = '';
            for await (const chunk of stream) {
                fullResponse += chunk;
                setReport(fullResponse);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    }, [html]);

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8 text-text-primary">
            <header className="mb-6">
                <h1 className="text-3xl font-bold flex items-center">
                    <AccessibilityCheckerIcon />
                    <span className="ml-3">AI Accessibility Checker</span>
                </h1>
                <p className="text-text-secondary mt-1">Paste HTML to get an AI-powered accessibility (a11y) audit.</p>
            </header>
            <div className="flex-grow grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0">
                <div className="flex flex-col h-full">
                    <label htmlFor="html-input" className="text-sm font-medium text-text-secondary mb-2">HTML Snippet</label>
                    <textarea
                        id="html-input"
                        value={html}
                        onChange={(e) => setHtml(e.target.value)}
                        placeholder="Paste your HTML code here..."
                        className="flex-grow p-4 bg-surface border border-border rounded-md resize-none font-mono text-sm"
                    />
                     <button
                        onClick={handleAnalyze}
                        disabled={isLoading}
                        className="btn-primary mt-4 w-full flex items-center justify-center px-6 py-3"
                    >
                        {isLoading ? <LoadingSpinner /> : 'Analyze for Issues'}
                    </button>
                </div>
                <div className="flex flex-col h-full">
                    <label className="text-sm font-medium text-text-secondary mb-2">AI Generated Report</label>
                    <div className="flex-grow p-4 bg-background border border-border rounded-md overflow-y-auto">
                        {isLoading && !report && <div className="flex items-center justify-center h-full"><LoadingSpinner /></div>}
                        {error && <p className="text-red-500">{error}</p>}
                        {report && <MarkdownRenderer content={report} />}
                        {!isLoading && !report && !error && <div className="text-text-secondary h-full flex items-center justify-center">Accessibility report will appear here.</div>}
                    </div>
                </div>
            </div>
        </div>
    );
};