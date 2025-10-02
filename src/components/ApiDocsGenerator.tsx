// Copyright James Burvel O’Callaghan III
// President Citibank Demo Business Inc.

import React, { useState, useCallback } from 'react';
import { ApiDocsGeneratorIcon } from './icons.tsx';
import { generateApiDocsStream } from '../services/geminiService.ts';
import { LoadingSpinner, MarkdownRenderer } from './shared/index.tsx';

const exampleCode = `/**
 * @route GET /api/users/{id}
 * @group Users - Operations about users
 * @param {string} id.path.required - The ID of the user to retrieve.
 * @returns {User.model} 200 - The user object.
 * @returns {Error} 404 - User not found.
 */
function getUser(id) {
  // implementation
}`;

export const ApiDocsGenerator: React.FC = () => {
    const [code, setCode] = useState(exampleCode);
    const [docs, setDocs] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleGenerate = useCallback(async () => {
        if (!code.trim()) {
            setError('Please enter some code to generate documentation for.');
            return;
        }
        setIsLoading(true);
        setError('');
        setDocs('');
        try {
            const stream = generateApiDocsStream(code);
            let fullResponse = '';
            for await (const chunk of stream) {
                fullResponse += chunk;
                setDocs(fullResponse);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    }, [code]);

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8 text-text-primary">
            <header className="mb-6">
                <h1 className="text-3xl font-bold flex items-center">
                    <ApiDocsGeneratorIcon />
                    <span className="ml-3">AI API Docs Generator</span>
                </h1>
                <p className="text-text-secondary mt-1">Paste your API endpoint code (e.g., Express, FastAPI) to generate markdown documentation.</p>
            </header>
            <div className="flex-grow grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0">
                <div className="flex flex-col h-full">
                    <label htmlFor="code-input" className="text-sm font-medium text-text-secondary mb-2">API Code</label>
                    <textarea
                        id="code-input"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        placeholder="Paste your API endpoint code here..."
                        className="flex-grow p-4 bg-surface border border-border rounded-md resize-none font-mono text-sm"
                    />
                     <button
                        onClick={handleGenerate}
                        disabled={isLoading}
                        className="btn-primary mt-4 w-full flex items-center justify-center px-6 py-3"
                    >
                        {isLoading ? <LoadingSpinner /> : 'Generate Documentation'}
                    </button>
                </div>
                <div className="flex flex-col h-full">
                    <label className="text-sm font-medium text-text-secondary mb-2">Generated Markdown</label>
                    <div className="flex-grow p-4 bg-background border border-border rounded-md overflow-y-auto">
                        {isLoading && !docs && <div className="flex items-center justify-center h-full"><LoadingSpinner /></div>}
                        {error && <p className="text-red-500">{error}</p>}
                        {docs && <MarkdownRenderer content={docs} />}
                        {!isLoading && !docs && !error && <div className="text-text-secondary h-full flex items-center justify-center">API documentation will appear here.</div>}
                    </div>
                </div>
            </div>
        </div>
    );
};