// Copyright James Burvel O’Callaghan III
// President Citibank Demo Business Inc.

import React, { useState, useCallback } from 'react';
import { generateImage } from '../services/index.ts';
import { LogoGeneratorIcon } from './icons.tsx';
import { LoadingSpinner } from './shared/index.tsx';
import { ArrowDownTrayIcon } from './icons.tsx';

export const LogoGenerator: React.FC = () => {
    const [prompt, setPrompt] = useState<string>('A minimalist logo for a coffee shop called "The Daily Grind", featuring a coffee bean and a mountain line.');
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');

    const handleGenerate = useCallback(async () => {
        if (!prompt.trim()) {
            setError('Please enter a prompt to generate a logo.');
            return;
        }
        setIsLoading(true);
        setError('');
        setImageUrl(null);
        try {
            // Add specific instructions for logo generation to the prompt
            const finalPrompt = `logo design, vector, flat icon, minimalist, ${prompt}`;
            const resultUrl = await generateImage(finalPrompt);
            setImageUrl(resultUrl);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
            setError(`Failed to generate logo: ${errorMessage}`);
        } finally {
            setIsLoading(false);
        }
    }, [prompt]);
    
    const handleDownload = () => {
        if (!imageUrl) return;
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = `logo_${prompt.slice(0, 20).replace(/\s/g, '_')}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8 text-text-primary">
            <header className="mb-6">
                <h1 className="text-3xl font-bold flex items-center">
                    <LogoGeneratorIcon />
                    <span className="ml-3">AI Logo Generator</span>
                </h1>
                <p className="text-text-secondary mt-1">Describe the logo you want, and let Imagen 3 create it for you.</p>
            </header>
            
            <div className="flex flex-col gap-4 mb-4">
                <label htmlFor="prompt-input" className="text-sm font-medium text-text-secondary">Logo Description</label>
                <textarea
                    id="prompt-input"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="e.g., A shield logo for a cybersecurity company called 'Securify'"
                    className="w-full p-3 rounded-md bg-surface border border-border focus:ring-2 focus:ring-primary focus:outline-none resize-y"
                    rows={3}
                />
                <button
                    onClick={handleGenerate}
                    disabled={isLoading}
                    className="btn-primary w-full max-w-sm mx-auto flex items-center justify-center px-6 py-3"
                >
                    {isLoading ? <LoadingSpinner /> : 'Generate Logo'}
                </button>
            </div>

            <div className="flex-grow flex items-center justify-center bg-background border-2 border-dashed border-border rounded-lg p-4 relative overflow-auto">
                {isLoading && <LoadingSpinner />}
                {error && <p className="text-red-500 text-center">{error}</p>}
                {imageUrl && !isLoading && (
                    <>
                        <img src={imageUrl} alt={prompt} className="max-w-full max-h-full h-64 w-64 object-contain" />
                        <button 
                          onClick={handleDownload}
                          className="absolute top-4 right-4 p-2 bg-black/30 text-white rounded-full hover:bg-black/50 backdrop-blur-sm"
                          title="Download Logo"
                        >
                            <ArrowDownTrayIcon />
                        </button>
                    </>
                )}
                {!isLoading && !imageUrl && !error && (
                    <div className="text-center text-text-secondary">
                        <p>Your generated logo will appear here.</p>
                    </div>
                )}
            </div>
        </div>
    );
};