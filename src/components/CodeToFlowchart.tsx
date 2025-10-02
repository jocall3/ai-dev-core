// Copyright James Burvel O’Callaghan III
// President Citibank Demo Business Inc.

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { CodeToFlowchartIcon } from './icons.tsx';
import { generateFlowchartStream } from '../services/geminiService.ts';
import { LoadingSpinner } from './shared/index.tsx';

const exampleCode = `function checkWeather(temperature) {
  if (temperature > 25) {
    return "It's hot!";
  } else if (temperature > 15) {
    return "It's warm.";
  } else {
    return "It's cold.";
  }
}`;

// Dynamically load Mermaid.js to avoid adding it to the main bundle
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
                    const { svg } = await mermaid.render('mermaid-graph', mermaidCode);
                    if (containerRef.current) {
                        containerRef.current.innerHTML = svg;
                    }
                }
            } catch (error) {
                if (containerRef.current) {
                    containerRef.current.innerHTML = 'Error rendering flowchart. Check Mermaid syntax.';
                }
                console.error("Mermaid rendering error:", error);
            }
        };

        renderChart();

        return () => { isMounted = false; }

    }, [mermaidCode, containerRef]);
};


export const CodeToFlowchart: React.FC = () => {
    const [code, setCode] = useState(exampleCode);
    const [flowchart, setFlowchart] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const mermaidContainerRef = useRef<HTMLDivElement>(null);

    useMermaid(flowchart, mermaidContainerRef);

    const handleGenerate = useCallback(async () => {
        if (!code.trim()) {
            setError('Please enter some code to generate a flowchart for.');
            return;
        }
        setIsLoading(true);
        setError('');
        setFlowchart('');
        if (mermaidContainerRef.current) mermaidContainerRef.current.innerHTML = '';
        try {
            const stream = generateFlowchartStream(code);
            let fullResponse = '';
            for await (const chunk of stream) {
                fullResponse += chunk;
                // Clean up the response as it streams in
                setFlowchart(fullResponse.replace(/^```mermaid\n|```/g, ''));
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    }, [code]);

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8 text-text-primary">
            <header className="mb-6">
                <h1 className="text-3xl font-bold flex items-center">
                    <CodeToFlowchartIcon />
                    <span className="ml-3">AI Code to Flowchart</span>
                </h1>
                <p className="text-text-secondary mt-1">Visualize your code's logic by generating a Mermaid.js flowchart.</p>
            </header>
            <div className="flex-grow grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0">
                <div className="flex flex-col h-full">
                    <label htmlFor="code-input" className="text-sm font-medium text-text-secondary mb-2">Source Code</label>
                    <textarea
                        id="code-input"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        className="flex-grow p-4 bg-surface border border-border rounded-md resize-none font-mono text-sm"
                    />
                     <button
                        onClick={handleGenerate}
                        disabled={isLoading}
                        className="btn-primary mt-4 w-full flex items-center justify-center px-6 py-3"
                    >
                        {isLoading ? <LoadingSpinner /> : 'Generate Flowchart'}
                    </button>
                </div>
                <div className="flex flex-col h-full">
                    <label className="text-sm font-medium text-text-secondary mb-2">Generated Flowchart</label>
                    <div className="flex-grow p-4 bg-white border border-border rounded-md overflow-auto flex items-center justify-center">
                        {isLoading && <LoadingSpinner />}
                        {error && <p className="text-red-500">{error}</p>}
                        <div ref={mermaidContainerRef} className="w-full h-full" />
                        {!isLoading && !flowchart && !error && <div className="text-text-secondary h-full flex items-center justify-center">Flowchart will be rendered here.</div>}
                    </div>
                </div>
            </div>
        </div>
    );
};