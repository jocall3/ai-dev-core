import React, { useState, useCallback } from 'react';
import { MockDataGeneratorIcon } from './icons.tsx';
import { generateMockDataStream } from '../services/geminiService.ts';
import { LoadingSpinner, MarkdownRenderer } from './shared/index.tsx';

const examplePrompt = "A JSON array of 5 user objects. Each user should have an id (number), a name (string), an email (string), and an isActive (boolean) property.";

export const MockDataGenerator: React.FC = () => {
    const [prompt, setPrompt] = useState(examplePrompt);
    const [data, setData] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleGenerate = useCallback(async () => {
        if (!prompt.trim()) {
            setError('Please describe the mock data you need.');
            return;
        }
        setIsLoading(true);
        setError('');
        setData('');
        try {
            const stream = generateMockDataStream(prompt);
            let fullResponse = '';
            for await (const chunk of stream) {
                fullResponse += chunk;
                setData(fullResponse);
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
                    <MockDataGeneratorIcon />
                    <span className="ml-3">AI Mock Data Generator</span>
                </h1>
                <p className="text-text-secondary mt-1">Describe the data you need in plain English to generate mock JSON data.</p>
            </header>
            <div className="flex-grow grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0">
                <div className="flex flex-col h-full">
                    <label htmlFor="prompt-input" className="text-sm font-medium text-text-secondary mb-2">Data Description</label>
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
                        {isLoading ? <LoadingSpinner /> : 'Generate Data'}
                    </button>
                </div>
                <div className="flex flex-col h-full">
                    <label className="text-sm font-medium text-text-secondary mb-2">Generated JSON</label>
                    <div className="flex-grow p-1 bg-background border border-border rounded-md overflow-y-auto">
                        {isLoading && !data && <div className="flex items-center justify-center h-full"><LoadingSpinner /></div>}
                        {error && <p className="p-4 text-red-500">{error}</p>}
                        {data && <MarkdownRenderer content={data} />}
                        {!isLoading && !data && !error && <div className="text-text-secondary h-full flex items-center justify-center">Generated mock data will appear here.</div>}
                    </div>
                </div>
            </div>
        </div>
    );
};