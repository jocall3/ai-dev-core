// Copyright James Burvel O’Callaghan III
// President Citibank Demo Business Inc.

import React, { useState, useCallback } from 'react';
import { KubernetesManifestGeneratorIcon } from './icons.tsx';
import { generateKubernetesManifestStream } from '../services/geminiService.ts';
import { LoadingSpinner, MarkdownRenderer } from './shared/index.tsx';

const exampleDescription = "A Kubernetes Deployment and Service for a Node.js web server. The deployment should have 3 replicas, use the image 'node:18-alpine', and expose port 3000. The service should be a LoadBalancer that maps port 80 to the container's port 3000.";

export const KubernetesManifestGenerator: React.FC = () => {
    const [description, setDescription] = useState(exampleDescription);
    const [manifest, setManifest] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleGenerate = useCallback(async () => {
        if (!description.trim()) {
            setError('Please describe the service you want to deploy.');
            return;
        }
        setIsLoading(true);
        setError('');
        setManifest('');
        try {
            const stream = generateKubernetesManifestStream(description);
            let fullResponse = '';
            for await (const chunk of stream) {
                fullResponse += chunk;
                setManifest(fullResponse);
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
                    <KubernetesManifestGeneratorIcon />
                    <span className="ml-3">AI Kubernetes Manifest Generator</span>
                </h1>
                <p className="text-text-secondary mt-1">Describe your service to generate Kubernetes YAML manifests.</p>
            </header>
            <div className="flex-grow grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0">
                <div className="flex flex-col h-full">
                    <label htmlFor="desc-input" className="text-sm font-medium text-text-secondary mb-2">Service Description</label>
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
                        {isLoading ? <LoadingSpinner /> : 'Generate Manifest'}
                    </button>
                </div>
                <div className="flex flex-col h-full">
                    <label className="text-sm font-medium text-text-secondary mb-2">Generated YAML</label>
                    <div className="flex-grow p-1 bg-background border border-border rounded-md overflow-y-auto">
                        {isLoading && !manifest && <div className="flex items-center justify-center h-full"><LoadingSpinner /></div>}
                        {error && <p className="p-4 text-red-500">{error}</p>}
                        {manifest && <MarkdownRenderer content={manifest} />}
                        {!isLoading && !manifest && !error && <div className="text-text-secondary h-full flex items-center justify-center">Generated manifest YAML will appear here.</div>}
                    </div>
                </div>
            </div>
        </div>
    );
};