// Copyright James Burvel O’Callaghan III
// President Citibank Demo Business Inc.

import React, { useState, useCallback } from 'react';
import { SystemDesignPlannerIcon } from './icons.tsx';
import { designSystemStream } from '../services/geminiService.ts';
import { LoadingSpinner, MarkdownRenderer } from './shared/index.tsx';

const exampleDescription = "A scalable social media application for sharing photos. It needs user authentication, image uploads, a news feed, and a commenting system. Use a microservices architecture.";

export const SystemDesignPlanner: React.FC = () => {
    const [description, setDescription] = useState(exampleDescription);
    const [plan, setPlan] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleGenerate = useCallback(async () => {
        if (!description.trim()) {
            setError('Please describe the system you want to design.');
            return;
        }
        setIsLoading(true);
        setError('');
        setPlan('');
        try {
            const stream = designSystemStream(description);
            let fullResponse = '';
            for await (const chunk of stream) {
                fullResponse += chunk;
                setPlan(fullResponse);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    }, [description]);

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8 text-text-primary">
            <header className="mb-6">
                <h1 className="text-3xl font-bold flex items-center">
                    <SystemDesignPlannerIcon />
                    <span className="ml-3">AI System Design Planner</span>
                </h1>
                <p className="text-text-secondary mt-1">Describe your application to generate a high-level system design plan.</p>
            </header>
            <div className="flex-grow flex flex-col min-h-0">
                 <div className="flex flex-col flex-1 min-h-0 mb-4">
                    <label htmlFor="desc-input" className="text-sm font-medium text-text-secondary mb-2">System Requirements</label>
                    <textarea
                        id="desc-input"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="flex-grow p-4 bg-surface border border-border rounded-md resize-y font-sans text-sm min-h-[120px]"
                    />
                </div>
                <div className="flex-shrink-0">
                    <button
                        onClick={handleGenerate}
                        disabled={isLoading}
                        className="btn-primary w-full max-w-sm mx-auto flex items-center justify-center px-6 py-3"
                    >
                        {isLoading ? <LoadingSpinner /> : 'Generate Design Plan'}
                    </button>
                </div>
                 <div className="flex flex-col flex-1 min-h-0 mt-4">
                    <label className="text-sm font-medium text-text-secondary mb-2">Generated Plan</label>
                    <div className="flex-grow p-4 bg-background border border-border rounded-md overflow-y-auto">
                        {isLoading && !plan && <div className="flex items-center justify-center h-full"><LoadingSpinner /></div>}
                        {error && <p className="text-red-500">{error}</p>}
                        {plan && <MarkdownRenderer content={plan} />}
                        {!isLoading && !plan && !error && <div className="text-text-secondary h-full flex items-center justify-center">The system design plan will appear here.</div>}
                    </div>
                </div>
            </div>
        </div>
    );
};