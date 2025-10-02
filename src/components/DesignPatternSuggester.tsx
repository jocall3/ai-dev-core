// Copyright James Burvel O’Callaghan III
// President Citibank Demo Business Inc.

import React, { useState, useCallback } from 'react';
import { DesignPatternSuggesterIcon } from './icons.tsx';
import { suggestDesignPatternsStream } from '../services/geminiService.ts';
import { LoadingSpinner, MarkdownRenderer } from './shared/index.tsx';

const exampleProblem = "I need to create objects, but I want to let subclasses decide which class to instantiate. I also want to defer the instantiation to subclasses.";

export const DesignPatternSuggester: React.FC = () => {
    const [problem, setProblem] = useState(exampleProblem);
    const [suggestions, setSuggestions] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSuggest = useCallback(async () => {
        if (!problem.trim()) {
            setError('Please describe the programming problem you are trying to solve.');
            return;
        }
        setIsLoading(true);
        setError('');
        setSuggestions('');
        try {
            const stream = suggestDesignPatternsStream(problem);
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
    }, [problem]);

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8 text-text-primary">
            <header className="mb-6">
                <h1 className="text-3xl font-bold flex items-center">
                    <DesignPatternSuggesterIcon />
                    <span className="ml-3">AI Design Pattern Suggester</span>
                </h1>
                <p className="text-text-secondary mt-1">Describe a software design problem and get relevant design pattern suggestions.</p>
            </header>
            <div className="flex-grow flex flex-col min-h-0">
                 <div className="flex flex-col flex-1 min-h-0 mb-4">
                    <label htmlFor="problem-input" className="text-sm font-medium text-text-secondary mb-2">Problem Description</label>
                    <textarea
                        id="problem-input"
                        value={problem}
                        onChange={(e) => setProblem(e.target.value)}
                        className="flex-grow p-4 bg-surface border border-border rounded-md resize-y font-sans text-sm min-h-[120px]"
                    />
                </div>
                <div className="flex-shrink-0">
                    <button
                        onClick={handleSuggest}
                        disabled={isLoading}
                        className="btn-primary w-full max-w-sm mx-auto flex items-center justify-center px-6 py-3"
                    >
                        {isLoading ? <LoadingSpinner /> : 'Suggest Design Patterns'}
                    </button>
                </div>
                 <div className="flex flex-col flex-1 min-h-0 mt-4">
                    <label className="text-sm font-medium text-text-secondary mb-2">Suggested Patterns</label>
                    <div className="flex-grow p-4 bg-background border border-border rounded-md overflow-y-auto">
                        {isLoading && !suggestions && <div className="flex items-center justify-center h-full"><LoadingSpinner /></div>}
                        {error && <p className="text-red-500">{error}</p>}
                        {suggestions && <MarkdownRenderer content={suggestions} />}
                        {!isLoading && !suggestions && !error && <div className="text-text-secondary h-full flex items-center justify-center">Design pattern suggestions will appear here.</div>}
                    </div>
                </div>
            </div>
        </div>
    );
};