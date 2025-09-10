import React, { useState, useCallback } from 'react';
import { CodePerformanceAnalyzerIcon } from './icons.tsx';
import { analyzeCodePerformanceStream } from '../services/geminiService.ts';
import { LoadingSpinner, MarkdownRenderer } from './shared/index.tsx';

const exampleCode = `const findDuplicates = (arr) => {
  const duplicates = [];
  for (let i = 0; i < arr.length; i++) {
    for (let j = i + 1; j < arr.length; j++) {
      if (arr[i] === arr[j] && !duplicates.includes(arr[i])) {
        duplicates.push(arr[i]);
      }
    }
  }
  return duplicates;
};`;

export const CodePerformanceAnalyzer: React.FC = () => {
    const [code, setCode] = useState(exampleCode);
    const [analysis, setAnalysis] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleAnalyze = useCallback(async () => {
        if (!code.trim()) {
            setError('Please enter some code to analyze.');
            return;
        }
        setIsLoading(true);
        setError('');
        setAnalysis('');
        try {
            const stream = analyzeCodePerformanceStream(code);
            let fullResponse = '';
            for await (const chunk of stream) {
                fullResponse += chunk;
                setAnalysis(fullResponse);
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
                    <CodePerformanceAnalyzerIcon />
                    <span className="ml-3">AI Code Performance Analyzer</span>
                </h1>
                <p className="text-text-secondary mt-1">Get AI-powered suggestions to optimize your code's performance.</p>
            </header>
            <div className="flex-grow grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0">
                <div className="flex flex-col h-full">
                    <label htmlFor="code-input" className="text-sm font-medium text-text-secondary mb-2">Code to Analyze</label>
                    <textarea
                        id="code-input"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        className="flex-grow p-4 bg-surface border border-border rounded-md resize-none font-mono text-sm"
                    />
                     <button
                        onClick={handleAnalyze}
                        disabled={isLoading}
                        className="btn-primary mt-4 w-full flex items-center justify-center px-6 py-3"
                    >
                        {isLoading ? <LoadingSpinner /> : 'Analyze Performance'}
                    </button>
                </div>
                <div className="flex flex-col h-full">
                    <label className="text-sm font-medium text-text-secondary mb-2">Performance Analysis</label>
                    <div className="flex-grow p-4 bg-background border border-border rounded-md overflow-y-auto">
                        {isLoading && !analysis && <div className="flex items-center justify-center h-full"><LoadingSpinner /></div>}
                        {error && <p className="text-red-500">{error}</p>}
                        {analysis && <MarkdownRenderer content={analysis} />}
                        {!isLoading && !analysis && !error && <div className="text-text-secondary h-full flex items-center justify-center">Performance suggestions will appear here.</div>}
                    </div>
                </div>
            </div>
        </div>
    );
};