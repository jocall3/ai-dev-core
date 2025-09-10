import React, { useState, useCallback } from 'react';
import { CodeSnippetToApiIcon } from './icons.tsx';
import { generateApiFromSnippetStream } from '../services/geminiService.ts';
import { LoadingSpinner, MarkdownRenderer } from './shared/index.tsx';

const exampleCode = `// Simple function to convert Celsius to Fahrenheit
function celsiusToFahrenheit(celsius) {
  return (celsius * 9/5) + 32;
}`;

export const CodeSnippetToApi: React.FC = () => {
    const [code, setCode] = useState(exampleCode);
    const [description, setDescription] = useState('Accepts a celsius value from the query string and returns the fahrenheit value in JSON.');
    const [apiCode, setApiCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleGenerate = useCallback(async () => {
        if (!code.trim() || !description.trim()) {
            setError('Please provide a code snippet and a description.');
            return;
        }
        setIsLoading(true);
        setError('');
        setApiCode('');
        try {
            const stream = generateApiFromSnippetStream(code, description);
            let fullResponse = '';
            for await (const chunk of stream) {
                fullResponse += chunk;
                setApiCode(fullResponse);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    }, [code, description]);

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8 text-text-primary">
            <header className="mb-6">
                <h1 className="text-3xl font-bold flex items-center">
                    <CodeSnippetToApiIcon />
                    <span className="ml-3">AI Code Snippet to API</span>
                </h1>
                <p className="text-text-secondary mt-1">Turn any code snippet into a simple, runnable API endpoint.</p>
            </header>
            <div className="flex-grow grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0">
                <div className="flex flex-col h-full gap-4">
                    <div className="flex flex-col flex-1">
                        <label htmlFor="code-input" className="text-sm font-medium text-text-secondary mb-2">Code Snippet</label>
                        <textarea
                            id="code-input"
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            className="flex-grow p-4 bg-surface border border-border rounded-md resize-none font-mono text-sm"
                        />
                    </div>
                     <div className="flex flex-col flex-1">
                        <label htmlFor="desc-input" className="text-sm font-medium text-text-secondary mb-2">API Behavior Description</label>
                        <textarea
                            id="desc-input"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="flex-grow p-4 bg-surface border border-border rounded-md resize-none font-sans text-sm"
                        />
                    </div>
                     <button
                        onClick={handleGenerate}
                        disabled={isLoading}
                        className="btn-primary w-full flex items-center justify-center px-6 py-3"
                    >
                        {isLoading ? <LoadingSpinner /> : 'Generate API Code'}
                    </button>
                </div>
                <div className="flex flex-col h-full">
                    <label className="text-sm font-medium text-text-secondary mb-2">Generated API (Node.js/Express)</label>
                    <div className="flex-grow p-1 bg-background border border-border rounded-md overflow-y-auto">
                        {isLoading && !apiCode && <div className="flex items-center justify-center h-full"><LoadingSpinner /></div>}
                        {error && <p className="p-4 text-red-500">{error}</p>}
                        {apiCode && <MarkdownRenderer content={apiCode} />}
                        {!isLoading && !apiCode && !error && <div className="text-text-secondary h-full flex items-center justify-center">API endpoint code will appear here.</div>}
                    </div>
                </div>
            </div>
        </div>
    );
};