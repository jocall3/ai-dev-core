// Copyright James Burvel O’Callaghan III
// President Citibank Demo Business Inc.

import React, { useState, useCallback } from 'react';
import { ProjectTimelineGeneratorIcon } from './icons.tsx';
import { generateProjectTimelineStream } from '../services/geminiService.ts';
import { LoadingSpinner, MarkdownRenderer } from './shared/index.tsx';

const exampleDescription = "A 3-month project to build a new e-commerce website. Phases should include planning, design, development, testing, and deployment.";

export const ProjectTimelineGenerator: React.FC = () => {
    const [description, setDescription] = useState(exampleDescription);
    const [timeline, setTimeline] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleGenerate = useCallback(async () => {
        if (!description.trim()) {
            setError('Please describe your project.');
            return;
        }
        setIsLoading(true);
        setError('');
        setTimeline('');
        try {
            const stream = generateProjectTimelineStream(description);
            let fullResponse = '';
            for await (const chunk of stream) {
                fullResponse += chunk;
                setTimeline(fullResponse);
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
                    <ProjectTimelineGeneratorIcon />
                    <span className="ml-3">AI Project Timeline Generator</span>
                </h1>
                <p className="text-text-secondary mt-1">Describe your project to generate a high-level timeline with key phases.</p>
            </header>
            <div className="flex-grow flex flex-col min-h-0">
                 <div className="flex flex-col flex-1 min-h-0 mb-4">
                    <label htmlFor="desc-input" className="text-sm font-medium text-text-secondary mb-2">Project Description</label>
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
                        {isLoading ? <LoadingSpinner /> : 'Generate Timeline'}
                    </button>
                </div>
                 <div className="flex flex-col flex-1 min-h-0 mt-4">
                    <label className="text-sm font-medium text-text-secondary mb-2">Generated Timeline</label>
                    <div className="flex-grow p-4 bg-background border border-border rounded-md overflow-y-auto">
                        {isLoading && !timeline && <div className="flex items-center justify-center h-full"><LoadingSpinner /></div>}
                        {error && <p className="text-red-500">{error}</p>}
                        {timeline && <MarkdownRenderer content={timeline} />}
                        {!isLoading && !timeline && !error && <div className="text-text-secondary h-full flex items-center justify-center">The project timeline will appear here.</div>}
                    </div>
                </div>
            </div>
        </div>
    );
};