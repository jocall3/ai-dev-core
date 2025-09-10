import React, { useState, useCallback } from 'react';
import { CodeDependencyVisualizerIcon } from './icons.tsx';
import { analyzeDependenciesStream } from '../services/geminiService.ts';
import { LoadingSpinner, MarkdownRenderer } from './shared/index.tsx';

const examplePackageJson = `{
  "name": "my-react-app",
  "version": "1.0.0",
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "axios": "^1.4.0",
    "lodash": "^4.17.21",
    "moment": "^2.29.4"
  },
  "devDependencies": {
    "vite": "^4.3.9",
    "eslint": "^8.42.0",
    "tailwindcss": "^3.3.2"
  }
}`;

export const CodeDependencyVisualizer: React.FC = () => {
    const [packageJson, setPackageJson] = useState(examplePackageJson);
    const [analysis, setAnalysis] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleAnalyze = useCallback(async () => {
        try {
            JSON.parse(packageJson);
        } catch (e) {
            setError('Invalid JSON in package.json content.');
            return;
        }
        setIsLoading(true);
        setError('');
        setAnalysis('');
        try {
            const stream = analyzeDependenciesStream(packageJson);
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
    }, [packageJson]);

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8 text-text-primary">
            <header className="mb-6">
                <h1 className="text-3xl font-bold flex items-center">
                    <CodeDependencyVisualizerIcon />
                    <span className="ml-3">AI Dependency Visualizer</span>
                </h1>
                <p className="text-text-secondary mt-1">Paste your package.json content to get an AI-powered breakdown of your dependencies.</p>
            </header>
            <div className="flex-grow grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0">
                <div className="flex flex-col h-full">
                    <label htmlFor="json-input" className="text-sm font-medium text-text-secondary mb-2">package.json Content</label>
                    <textarea
                        id="json-input"
                        value={packageJson}
                        onChange={(e) => setPackageJson(e.target.value)}
                        className="flex-grow p-4 bg-surface border border-border rounded-md resize-none font-mono text-sm"
                    />
                     <button
                        onClick={handleAnalyze}
                        disabled={isLoading}
                        className="btn-primary mt-4 w-full flex items-center justify-center px-6 py-3"
                    >
                        {isLoading ? <LoadingSpinner /> : 'Analyze Dependencies'}
                    </button>
                </div>
                <div className="flex flex-col h-full">
                    <label className="text-sm font-medium text-text-secondary mb-2">AI Analysis</label>
                    <div className="flex-grow p-4 bg-background border border-border rounded-md overflow-y-auto">
                        {isLoading && !analysis && <div className="flex items-center justify-center h-full"><LoadingSpinner /></div>}
                        {error && <p className="text-red-500">{error}</p>}
                        {analysis && <MarkdownRenderer content={analysis} />}
                        {!isLoading && !analysis && !error && <div className="text-text-secondary h-full flex items-center justify-center">Dependency analysis will appear here.</div>}
                    </div>
                </div>
            </div>
        </div>
    );
};