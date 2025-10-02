// Copyright James Burvel O’Callaghan III
// President Citibank Demo Business Inc.

import React, { useState, useCallback } from 'react';
import { ProductRoadmapGeneratorIcon } from './icons.tsx';
import { generateRoadmapStream } from '../services/geminiService.ts';
import { LoadingSpinner, MarkdownRenderer } from './shared/index.tsx';

const exampleGoals = `Product: A new project management tool called 'Clarity'.
Q3 Goals: Launch MVP with core task management features.
Q4 Goals: Add team collaboration features like comments and assignments.
Next Year: Focus on integrations with other tools like Slack and GitHub.`;

export const ProductRoadmapGenerator: React.FC = () => {
    const [goals, setGoals] = useState(exampleGoals);
    const [roadmap, setRoadmap] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleGenerate = useCallback(async () => {
        if (!goals.trim()) {
            setError('Please provide your product goals.');
            return;
        }
        setIsLoading(true);
        setError('');
        setRoadmap('');
        try {
            const stream = generateRoadmapStream(goals);
            let fullResponse = '';
            for await (const chunk of stream) {
                fullResponse += chunk;
                setRoadmap(fullResponse);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    }, [goals]);

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8 text-text-primary">
            <header className="mb-6">
                <h1 className="text-3xl font-bold flex items-center">
                    <ProductRoadmapGeneratorIcon />
                    <span className="ml-3">AI Product Roadmap Generator</span>
                </h1>
                <p className="text-text-secondary mt-1">Outline your product goals to generate a structured roadmap.</p>
            </header>
            <div className="flex-grow grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0">
                <div className="flex flex-col h-full">
                    <label htmlFor="goals-input" className="text-sm font-medium text-text-secondary mb-2">Product Goals & Timeline</label>
                    <textarea
                        id="goals-input"
                        value={goals}
                        onChange={(e) => setGoals(e.target.value)}
                        className="flex-grow p-4 bg-surface border border-border rounded-md resize-none font-sans text-sm"
                    />
                     <button
                        onClick={handleGenerate}
                        disabled={isLoading}
                        className="btn-primary mt-4 w-full flex items-center justify-center px-6 py-3"
                    >
                        {isLoading ? <LoadingSpinner /> : 'Generate Roadmap'}
                    </button>
                </div>
                <div className="flex flex-col h-full">
                    <label className="text-sm font-medium text-text-secondary mb-2">Generated Roadmap</label>
                    <div className="flex-grow p-4 bg-background border border-border rounded-md overflow-y-auto">
                        {isLoading && !roadmap && <div className="flex items-center justify-center h-full"><LoadingSpinner /></div>}
                        {error && <p className="text-red-500">{error}</p>}
                        {roadmap && <MarkdownRenderer content={roadmap} />}
                        {!isLoading && !roadmap && !error && <div className="text-text-secondary h-full flex items-center justify-center">The generated roadmap will appear here.</div>}
                    </div>
                </div>
            </div>
        </div>
    );
};