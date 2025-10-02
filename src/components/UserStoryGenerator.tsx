// Copyright James Burvel O’Callaghan III
// President Citibank Demo Business Inc.

import React, { useState, useCallback } from 'react';
import { UserStoryGeneratorIcon } from './icons.tsx';
import { generateUserStoriesStream } from '../services/geminiService.ts';
import { LoadingSpinner, MarkdownRenderer } from './shared/index.tsx';

const exampleDescription = "A user profile page where users can update their display name and upload a new profile picture.";

export const UserStoryGenerator: React.FC = () => {
    const [description, setDescription] = useState(exampleDescription);
    const [stories, setStories] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleGenerate = useCallback(async () => {
        if (!description.trim()) {
            setError('Please describe the feature.');
            return;
        }
        setIsLoading(true);
        setError('');
        setStories('');
        try {
            const stream = generateUserStoriesStream(description);
            let fullResponse = '';
            for await (const chunk of stream) {
                fullResponse += chunk;
                setStories(fullResponse);
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
                    <UserStoryGeneratorIcon />
                    <span className="ml-3">AI User Story Generator</span>
                </h1>
                <p className="text-text-secondary mt-1">Describe a feature to generate user stories with acceptance criteria.</p>
            </header>
            <div className="flex-grow flex flex-col min-h-0">
                 <div className="flex flex-col flex-1 min-h-0 mb-4">
                    <label htmlFor="desc-input" className="text-sm font-medium text-text-secondary mb-2">Feature Description</label>
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
                        {isLoading ? <LoadingSpinner /> : 'Generate User Stories'}
                    </button>
                </div>
                 <div className="flex flex-col flex-1 min-h-0 mt-4">
                    <label className="text-sm font-medium text-text-secondary mb-2">Generated Stories</label>
                    <div className="flex-grow p-4 bg-background border border-border rounded-md overflow-y-auto">
                        {isLoading && !stories && <div className="flex items-center justify-center h-full"><LoadingSpinner /></div>}
                        {error && <p className="text-red-500">{error}</p>}
                        {stories && <MarkdownRenderer content={stories} />}
                        {!isLoading && !stories && !error && <div className="text-text-secondary h-full flex items-center justify-center">User stories will appear here.</div>}
                    </div>
                </div>
            </div>
        </div>
    );
};