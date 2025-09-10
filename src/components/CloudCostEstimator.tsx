import React, { useState, useCallback } from 'react';
import { CloudCostEstimatorIcon } from './icons.tsx';
import { estimateCloudCostStream } from '../services/geminiService.ts';
import { LoadingSpinner, MarkdownRenderer } from './shared/index.tsx';

const exampleDescription = "A web application with a load balancer, two medium-sized virtual machines (like t3.medium on AWS), a managed PostgreSQL database, and about 500GB of object storage.";

export const CloudCostEstimator: React.FC = () => {
    const [description, setDescription] = useState(exampleDescription);
    const [estimate, setEstimate] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleGenerate = useCallback(async () => {
        if (!description.trim()) {
            setError('Please describe your infrastructure.');
            return;
        }
        setIsLoading(true);
        setError('');
        setEstimate('');
        try {
            const stream = estimateCloudCostStream(description);
            let fullResponse = '';
            for await (const chunk of stream) {
                fullResponse += chunk;
                setEstimate(fullResponse);
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
                    <CloudCostEstimatorIcon />
                    <span className="ml-3">AI Cloud Cost Estimator</span>
                </h1>
                <p className="text-text-secondary mt-1">Describe your infrastructure to get a high-level monthly cost estimate.</p>
            </header>
            <div className="flex-grow flex flex-col min-h-0">
                <div className="flex flex-col flex-1 min-h-0 mb-4">
                    <label htmlFor="desc-input" className="text-sm font-medium text-text-secondary mb-2">Infrastructure Description</label>
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
                        {isLoading ? <LoadingSpinner /> : 'Estimate Monthly Cost'}
                    </button>
                </div>
                 <div className="flex flex-col flex-1 min-h-0 mt-4">
                    <label className="text-sm font-medium text-text-secondary mb-2">Generated Estimate</label>
                    <div className="flex-grow p-4 bg-background border border-border rounded-md overflow-y-auto">
                        {isLoading && !estimate && <div className="flex items-center justify-center h-full"><LoadingSpinner /></div>}
                        {error && <p className="text-red-500">{error}</p>}
                        {estimate && <MarkdownRenderer content={estimate} />}
                        {!isLoading && !estimate && !error && <div className="text-text-secondary h-full flex items-center justify-center">Cost estimate will appear here. Note: This is a high-level estimate and not a quote.</div>}
                    </div>
                </div>
            </div>
        </div>
    );
};