// Copyright James Burvel O’Callaghan III
// President Citibank Demo Business Inc.

import React, { useState, useCallback } from 'react';
import { DockerfileGeneratorIcon } from './icons.tsx';
import { generateDockerfileStream } from '../services/geminiService.ts';
import { LoadingSpinner, MarkdownRenderer } from './shared/index.tsx';

const exampleDescription = "A production-ready, multi-stage Dockerfile for a Next.js application. It should install dependencies using 'npm ci', build the app, and serve it using a minimal Node.js image.";

export const DockerfileGenerator: React.FC = () => {
    const [description, setDescription] = useState(exampleDescription);
    const [dockerfile, setDockerfile] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleGenerate = useCallback(async () => {
        if (!description.trim()) {
            setError('Please describe the application you want to containerize.');
            return;
        }
        setIsLoading(true);
        setError('');
        setDockerfile('');
        try {
            const stream = generateDockerfileStream(description);
            let fullResponse = '';
            for await (const chunk of stream) {
                fullResponse += chunk;
                setDockerfile(fullResponse);
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
                    <DockerfileGeneratorIcon />
                    <span className="ml-3">AI Dockerfile Generator</span>
                </h1>
                <p className="text-text-secondary mt-1">Describe your application, and get a production-ready Dockerfile.</p>
            </header>
            <div className="flex-grow grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0">
                <div className="flex flex-col h-full">
                    <label htmlFor="desc-input" className="text-sm font-medium text-text-secondary mb-2">Application Description</label>
                    <textarea
                        id="desc-input"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="flex-grow p-4 bg-surface border border-border rounded-md resize-none font-sans text-sm"
                    />
                     <button
                        onClick={handleGenerate}
                        disabled={isLoading}
                        className="btn-primary mt-4 w-full flex items-center justify-center px-6 py-3"
                    >
                        {isLoading ? <LoadingSpinner /> : 'Generate Dockerfile'}
                    </button>
                </div>
                <div className="flex flex-col h-full">
                    <label className="text-sm font-medium text-text-secondary mb-2">Generated Dockerfile</label>
                    <div className="flex-grow p-1 bg-background border border-border rounded-md overflow-y-auto">
                        {isLoading && !dockerfile && <div className="flex items-center justify-center h-full"><LoadingSpinner /></div>}
                        {error && <p className="p-4 text-red-500">{error}</p>}
                        {dockerfile && <MarkdownRenderer content={dockerfile} />}
                        {!isLoading && !dockerfile && !error && <div className="text-text-secondary h-full flex items-center justify-center">The generated Dockerfile will appear here.</div>}
                    </div>
                </div>
            </div>
        </div>
    );
};