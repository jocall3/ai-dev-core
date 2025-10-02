// Copyright James Burvel O’Callaghan III
// President Citibank Demo Business Inc.

import React, { useState, useCallback } from 'react';
import { DependencyUpdateSuggesterIcon } from './icons.tsx';
import { suggestDependencyUpdatesStream } from '../services/geminiService.ts';
import { LoadingSpinner, MarkdownRenderer } from './shared/index.tsx';

const examplePackageJson = `{
  "dependencies": {
    "react": "18.0.0",
    "axios": "0.27.2",
    "lodash": "4.17.20"
  },
  "devDependencies": {
    "vite": "4.1.0",
    "eslint": "8.30.0"
  }
}`;

export const DependencyUpdateSuggester: React.FC = () => {
    const [packageJson, setPackageJson] = useState(examplePackageJson);
    const [suggestions, setSuggestions] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleAnalyze = useCallback(async () => {
        try {
            JSON.parse(packageJson);
        } catch (e) {
            setError('Invalid JSON in package.json content.');
            return;
        }
        setIsLoading(true);
        setError('');
        setSuggestions('');
        try {
            const stream = suggestDependencyUpdatesStream(packageJson);
            let fullResponse = '';
            for await (const chunk of stream) {
                fullResponse += chunk;
                setSuggestions(fullResponse);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    }, [packageJson]);

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8 text-text-primary">
            <header className="mb-6">
                <h1 className="text-3xl font-bold flex items-center">
                    <DependencyUpdateSuggesterIcon />
                    <span className="ml-3">AI Dependency Update Suggester</span>
                </h1>
                <p className="text-text-secondary mt-1">Paste your package.json to get AI-powered update suggestions and changelog summaries.</p>
            </header>
            <div className="flex-grow grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0">
                <div className="flex flex-col h-full">
                    <label htmlFor="json-input" className="text-sm font-medium text-text-secondary mb-2">package.json Content</label>
                    <textarea
                        id="json-input"
                        value={packageJson}
                        onChange={(e) => setPackageJson(e.target.value)}
                        className="flex-grow p-4 bg-surface border border-border rounded-md resize-none font-mono text-sm"
                    />
                     <button
                        onClick={handleAnalyze}
                        disabled={isLoading}
                        className="btn-primary mt-4 w-full flex items-center justify-center px-6 py-3"
                    >
                        {isLoading ? <LoadingSpinner /> : 'Suggest Updates'}
                    </button>
                </div>
                <div className="flex flex-col h-full">
                    <label className="text-sm font-medium text-text-secondary mb-2">AI Suggestions</label>
                    <div className="flex-grow p-4 bg-background border border-border rounded-md overflow-y-auto">
                        {isLoading && !suggestions && <div className="flex items-center justify-center h-full"><LoadingSpinner /></div>}
                        {error && <p className="text-red-500">{error}</p>}
                        {suggestions && <MarkdownRenderer content={suggestions} />}
                        {!isLoading && !suggestions && !error && <div className="text-text-secondary h-full flex items-center justify-center">Update suggestions will appear here.</div>}
                    </div>
                </div>
            </div>
        </div>
    );
};