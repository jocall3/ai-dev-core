// Copyright James Burvel O’Callaghan III
// President Citibank Demo Business Inc.

import React, { useState, useCallback } from 'react';
import { GithubProfileReadmeGeneratorIcon } from './icons.tsx';
import { generateProfileReadmeStream } from '../services/geminiService.ts';
import { LoadingSpinner, MarkdownRenderer } from './shared/index.tsx';

export const GithubProfileReadmeGenerator: React.FC = () => {
    const [prompt, setPrompt] = useState('I am a full-stack developer specializing in React and Node.js. I love open source and enjoy building tools for developers. I am currently learning Go.');
    const [readme, setReadme] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleGenerate = useCallback(async () => {
        if (!prompt.trim()) {
            setError('Please tell me a little about yourself.');
            return;
        }
        setIsLoading(true);
        setError('');
        setReadme('');
        try {
            const stream = generateProfileReadmeStream(prompt);
            let fullResponse = '';
            for await (const chunk of stream) {
                fullResponse += chunk;
                setReadme(fullResponse);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    }, [prompt]);

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8 text-text-primary">
            <header className="mb-6">
                <h1 className="text-3xl font-bold flex items-center">
                    <GithubProfileReadmeGeneratorIcon />
                    <span className="ml-3">AI GitHub Profile README Generator</span>
                </h1>
                <p className="text-text-secondary mt-1">Describe yourself and your skills to generate a great GitHub profile README.</p>
            </header>
            <div className="flex-grow grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0">
                <div className="flex flex-col h-full">
                    <label htmlFor="prompt-input" className="text-sm font-medium text-text-secondary mb-2">About You (skills, interests, etc.)</label>
                    <textarea
                        id="prompt-input"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        className="flex-grow p-4 bg-surface border border-border rounded-md resize-none font-sans text-sm"
                    />
                     <button
                        onClick={handleGenerate}
                        disabled={isLoading}
                        className="btn-primary mt-4 w-full flex items-center justify-center px-6 py-3"
                    >
                        {isLoading ? <LoadingSpinner /> : 'Generate README'}
                    </button>
                </div>
                <div className="flex flex-col h-full">
                    <label className="text-sm font-medium text-text-secondary mb-2">Generated README.md</label>
                    <div className="flex-grow p-4 bg-background border border-border rounded-md overflow-y-auto">
                        {isLoading && !readme && <div className="flex items-center justify-center h-full"><LoadingSpinner /></div>}
                        {error && <p className="text-red-500">{error}</p>}
                        {readme && <MarkdownRenderer content={readme} />}
                        {!isLoading && !readme && !error && <div className="text-text-secondary h-full flex items-center justify-center">Your profile README will appear here.</div>}
                    </div>
                </div>
            </div>
        </div>
    );
};