// Copyright James Burvel O’Callaghan III
// President Citibank Demo Business Inc.

import React, { useState, useCallback } from 'react';
import { CiCdGeneratorIcon } from './icons.tsx';
import { generateCiCdPipelineStream } from '../services/geminiService.ts';
import { LoadingSpinner, MarkdownRenderer } from './shared/index.tsx';

const providers = ['GitHub Actions', 'GitLab CI', 'CircleCI'];
const exampleDescription = 'A Node.js project. Install dependencies, run lint, run tests, then build the project.';

export const CiCdGenerator: React.FC = () => {
    const [description, setDescription] = useState(exampleDescription);
    const [provider, setProvider] = useState('GitHub Actions');
    const [pipeline, setPipeline] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleGenerate = useCallback(async () => {
        if (!description.trim()) {
            setError('Please describe your pipeline steps.');
            return;
        }
        setIsLoading(true);
        setError('');
        setPipeline('');
        try {
            const stream = generateCiCdPipelineStream(description, provider);
            let fullResponse = '';
            for await (const chunk of stream) {
                fullResponse += chunk;
                setPipeline(fullResponse);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    }, [description, provider]);

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8 text-text-primary">
            <header className="mb-6">
                <h1 className="text-3xl font-bold flex items-center">
                    <CiCdGeneratorIcon />
                    <span className="ml-3">AI CI/CD Pipeline Generator</span>
                </h1>
                <p className="text-text-secondary mt-1">Describe your build, test, and deploy process to generate a CI/CD configuration file.</p>
            </header>
            <div className="flex-grow grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0">
                <div className="flex flex-col h-full gap-4">
                    <div>
                        <label htmlFor="provider-select" className="text-sm font-medium text-text-secondary">CI/CD Provider</label>
                        <select id="provider-select" value={provider} onChange={e => setProvider(e.target.value)} className="w-full mt-1 p-2 bg-surface border border-border rounded-md">
                            {providers.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                    </div>
                    <div className="flex flex-col flex-grow">
                        <label htmlFor="desc-input" className="text-sm font-medium text-text-secondary mb-2">Describe Your Pipeline</label>
                        <textarea
                            id="desc-input"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="flex-grow p-4 bg-surface border border-border rounded-md resize-none font-mono text-sm"
                        />
                    </div>
                     <button
                        onClick={handleGenerate}
                        disabled={isLoading}
                        className="btn-primary w-full flex items-center justify-center px-6 py-3"
                    >
                        {isLoading ? <LoadingSpinner /> : `Generate ${provider} Config`}
                    </button>
                </div>
                <div className="flex flex-col h-full">
                    <label className="text-sm font-medium text-text-secondary mb-2">Generated Configuration (YAML)</label>
                    <div className="flex-grow p-1 bg-background border border-border rounded-md overflow-y-auto">
                        {isLoading && !pipeline && <div className="flex items-center justify-center h-full"><LoadingSpinner /></div>}
                        {error && <p className="p-4 text-red-500">{error}</p>}
                        {pipeline && <MarkdownRenderer content={pipeline} />}
                        {!isLoading && !pipeline && !error && <div className="text-text-secondary h-full flex items-center justify-center">Generated YAML will appear here.</div>}
                    </div>
                </div>
            </div>
        </div>
    );
};