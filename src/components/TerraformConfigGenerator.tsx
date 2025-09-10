import React, { useState, useCallback } from 'react';
import { TerraformConfigGeneratorIcon } from './icons.tsx';
import { generateTerraformConfigStream } from '../services/geminiService.ts';
import { LoadingSpinner, MarkdownRenderer } from './shared/index.tsx';

const exampleDescription = "Create an AWS S3 bucket for static website hosting. The bucket name should be 'my-static-website-bucket-unique-name'. Also, create a basic IAM policy that allows public read access to the bucket.";

export const TerraformConfigGenerator: React.FC = () => {
    const [description, setDescription] = useState(exampleDescription);
    const [config, setConfig] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleGenerate = useCallback(async () => {
        if (!description.trim()) {
            setError('Please describe the infrastructure you want to create.');
            return;
        }
        setIsLoading(true);
        setError('');
        setConfig('');
        try {
            const stream = generateTerraformConfigStream(description);
            let fullResponse = '';
            for await (const chunk of stream) {
                fullResponse += chunk;
                setConfig(fullResponse);
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
                    <TerraformConfigGeneratorIcon />
                    <span className="ml-3">AI Terraform Config Generator</span>
                </h1>
                <p className="text-text-secondary mt-1">Describe your desired cloud resources to generate Terraform HCL code.</p>
            </header>
            <div className="flex-grow grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0">
                <div className="flex flex-col h-full">
                    <label htmlFor="desc-input" className="text-sm font-medium text-text-secondary mb-2">Infrastructure Description</label>
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
                        {isLoading ? <LoadingSpinner /> : 'Generate Config'}
                    </button>
                </div>
                <div className="flex flex-col h-full">
                    <label className="text-sm font-medium text-text-secondary mb-2">Generated Terraform Config</label>
                    <div className="flex-grow p-1 bg-background border border-border rounded-md overflow-y-auto">
                        {isLoading && !config && <div className="flex items-center justify-center h-full"><LoadingSpinner /></div>}
                        {error && <p className="p-4 text-red-500">{error}</p>}
                        {config && <MarkdownRenderer content={config} />}
                        {!isLoading && !config && !error && <div className="text-text-secondary h-full flex items-center justify-center">Generated Terraform (.tf) code will appear here.</div>}
                    </div>
                </div>
            </div>
        </div>
    );
};