// Copyright James Burvel O’Callaghan III
// President Citibank Demo Business Inc.

import React, { useState, useCallback } from 'react';
import { ErrorMessageExplainerIcon } from './icons.tsx';
import { explainErrorStream } from '../services/index.ts';
import { LoadingSpinner, MarkdownRenderer } from './shared/index.tsx';

const exampleError = `TypeError: Cannot read properties of undefined (reading 'map')
    at UserListComponent (webpack-internal:///./src/components/UserList.tsx:10:25)
    at renderWithHooks (webpack-internal:///./node_modules/react-dom/cjs/react-dom.development.js:14985:18)
    at mountIndeterminateComponent (webpack-internal:///./node_modules/react-dom/cjs/react-dom.development.js:17811:13)`;

export const ErrorMessageExplainer: React.FC = () => {
    const [errorInput, setErrorInput] = useState(exampleError);
    const [explanation, setExplanation] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleExplain = useCallback(async () => {
        if (!errorInput.trim()) {
            setError('Please paste an error message to explain.');
            return;
        }
        setIsLoading(true);
        setError('');
        setExplanation('');
        try {
            const stream = explainErrorStream(errorInput);
            let fullResponse = '';
            for await (const chunk of stream) {
                fullResponse += chunk;
                setExplanation(fullResponse);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    }, [errorInput]);

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8 text-text-primary">
            <header className="mb-6">
                <h1 className="text-3xl font-bold flex items-center">
                    <ErrorMessageExplainerIcon />
                    <span className="ml-3">AI Error Message Explainer</span>
                </h1>
                <p className="text-text-secondary mt-1">Paste a confusing error message and stack trace to get a clear explanation.</p>
            </header>
            <div className="flex-grow grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0">
                <div className="flex flex-col h-full">
                    <label htmlFor="error-input" className="text-sm font-medium text-text-secondary mb-2">Error Message & Stack Trace</label>
                    <textarea
                        id="error-input"
                        value={errorInput}
                        onChange={(e) => setErrorInput(e.target.value)}
                        className="flex-grow p-4 bg-surface border border-border rounded-md resize-none font-mono text-sm"
                    />
                     <button
                        onClick={handleExplain}
                        disabled={isLoading}
                        className="btn-primary mt-4 w-full flex items-center justify-center px-6 py-3"
                    >
                        {isLoading ? <LoadingSpinner /> : 'Explain Error'}
                    </button>
                </div>
                <div className="flex flex-col h-full">
                    <label className="text-sm font-medium text-text-secondary mb-2">AI Explanation</label>
                    <div className="flex-grow p-4 bg-background border border-border rounded-md overflow-y-auto">
                        {isLoading && !explanation && <div className="flex items-center justify-center h-full"><LoadingSpinner /></div>}
                        {error && <p className="text-red-500">{error}</p>}
                        {explanation && <MarkdownRenderer content={explanation} />}
                        {!isLoading && !explanation && !error && <div className="text-text-secondary h-full flex items-center justify-center">The explanation will appear here.</div>}
                    </div>
                </div>
            </div>
        </div>
    );
};