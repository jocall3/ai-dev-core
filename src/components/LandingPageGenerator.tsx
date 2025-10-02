// Copyright James Burvel O’Callaghan III
// President Citibank Demo Business Inc.

import React, { useState, useCallback } from 'react';
import { LandingPageGeneratorIcon } from './icons.tsx';
import { generateLandingPageStream } from '../services/geminiService.ts';
import { LoadingSpinner } from './shared/index.tsx';

const exampleDescription = "A landing page for a new mobile app called 'TaskFlow' that helps users organize their daily tasks. It should have a hero section with a call-to-action, a features section with three key benefits, and a simple footer.";

export const LandingPageGenerator: React.FC = () => {
    const [description, setDescription] = useState(exampleDescription);
    const [html, setHtml] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleGenerate = useCallback(async () => {
        if (!description.trim()) {
            setError('Please describe the landing page you want to create.');
            return;
        }
        setIsLoading(true);
        setError('');
        setHtml('');
        try {
            const stream = generateLandingPageStream(description);
            let fullResponse = '';
            for await (const chunk of stream) {
                fullResponse += chunk;
                // Clean up markdown fences as they come in
                setHtml(fullResponse.replace(/^```html\n|```/g, ''));
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
                    <LandingPageGeneratorIcon />
                    <span className="ml-3">AI Landing Page Generator</span>
                </h1>
                <p className="text-text-secondary mt-1">Describe your product or service to generate a complete HTML landing page.</p>
            </header>
            <div className="flex-grow grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0">
                <div className="flex flex-col h-full">
                    <label htmlFor="desc-input" className="text-sm font-medium text-text-secondary mb-2">Product/Service Description</label>
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
                        {isLoading ? <LoadingSpinner /> : 'Generate Landing Page'}
                    </button>
                </div>
                <div className="flex flex-col h-full">
                    <div className="flex justify-between items-center mb-2">
                        <label className="text-sm font-medium text-text-secondary">Live Preview</label>
                        <button onClick={() => navigator.clipboard.writeText(html)} disabled={!html} className="px-3 py-1 bg-gray-100 text-xs rounded-md hover:bg-gray-200">Copy HTML</button>
                    </div>
                    <div className="flex-grow bg-white border-2 border-border rounded-md overflow-hidden">
                        {isLoading && <div className="h-full flex items-center justify-center"><LoadingSpinner /></div>}
                        {error && <p className="p-4 text-red-500">{error}</p>}
                        {html && <iframe srcDoc={html} title="Landing Page Preview" className="w-full h-full" />}
                    </div>
                </div>
            </div>
        </div>
    );
};