// Copyright James Burvel O’Callaghan III
// President Citibank Demo Business Inc.

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { UmlDiagramGeneratorIcon } from './icons.tsx';
import { generateUmlDiagramStream } from '../services/geminiService.ts';
import { LoadingSpinner } from './shared/index.tsx';

const exampleDescription = "A class diagram showing a Customer class that has a name and email. The Customer can have multiple Order objects. An Order has an orderId and a list of Products.";

// Dynamically load Mermaid.js
const useMermaid = (mermaidCode: string, containerRef: React.RefObject<HTMLDivElement>) => {
    useEffect(() => {
        if (!mermaidCode || !containerRef.current) return;

        let isMounted = true;
        const renderChart = async () => {
            try {
                // @ts-ignore
                const mermaid = (await import('https://esm.sh/mermaid@10.9.1')).default;
                mermaid.initialize({ startOnLoad: false, theme: 'neutral' });
                if (isMounted && containerRef.current) {
                    const { svg } = await mermaid.render('mermaid-graph-uml', mermaidCode);
                    if (containerRef.current) containerRef.current.innerHTML = svg;
                }
            } catch (error) {
                if (containerRef.current) containerRef.current.innerHTML = 'Error rendering diagram.';
                console.error("Mermaid rendering error:", error);
            }
        };
        renderChart();
        return () => { isMounted = false; }
    }, [mermaidCode, containerRef]);
};

export const UmlDiagramGenerator: React.FC = () => {
    const [description, setDescription] = useState(exampleDescription);
    const [diagram, setDiagram] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const mermaidContainerRef = useRef<HTMLDivElement>(null);

    useMermaid(diagram, mermaidContainerRef);

    const handleGenerate = useCallback(async () => {
        if (!description.trim()) {
            setError('Please describe the diagram you want to create.');
            return;
        }
        setIsLoading(true);
        setError('');
        setDiagram('');
        if (mermaidContainerRef.current) mermaidContainerRef.current.innerHTML = '';
        try {
            const stream = generateUmlDiagramStream(description);
            let fullResponse = '';
            for await (const chunk of stream) {
                fullResponse += chunk;
                setDiagram(fullResponse.replace(/^```mermaid\n|```/g, ''));
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
                    <UmlDiagramGeneratorIcon />
                    <span className="ml-3">AI UML Diagram Generator</span>
                </h1>
                <p className="text-text-secondary mt-1">Describe a system or relationship to generate a UML diagram with Mermaid.js.</p>
            </header>
            <div className="flex-grow grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0">
                <div className="flex flex-col h-full">
                    <label htmlFor="desc-input" className="text-sm font-medium text-text-secondary mb-2">Diagram Description</label>
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
                        {isLoading ? <LoadingSpinner /> : 'Generate Diagram'}
                    </button>
                </div>
                <div className="flex flex-col h-full">
                    <label className="text-sm font-medium text-text-secondary mb-2">Generated Diagram</label>
                    <div className="flex-grow p-4 bg-white border border-border rounded-md overflow-auto flex items-center justify-center">
                         {isLoading && <LoadingSpinner />}
                        {error && <p className="text-red-500">{error}</p>}
                        <div ref={mermaidContainerRef} className="w-full h-full" />
                        {!isLoading && !diagram && !error && <div className="text-text-secondary h-full flex items-center justify-center">Diagram will be rendered here.</div>}
                    </div>
                </div>
            </div>
        </div>
    );
};