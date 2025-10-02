// Copyright James Burvel O’Callaghan III
// President Citibank Demo Business Inc.

import React, { useState, useCallback } from 'react';
import { CodeBracketSquareIcon } from './icons.tsx';
import { compileSassStream } from '../services/index.ts';
import { LoadingSpinner } from './shared/index.tsx';

const initialScss = `$primary-color: #0047AB;
$font-size: 16px;

.container {
  padding: 20px;
  background-color: #f0f0f0;

  .title {
    color: $primary-color;
    font-size: $font-size * 1.5;

    &:hover {
      text-decoration: underline;
    }
  }
  
  > p {
    margin-top: 10px;
  }
}`;

export const SassScssCompiler: React.FC = () => {
    const [scss, setScss] = useState(initialScss);
    const [css, setCss] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleCompile = useCallback(async () => {
        if (!scss.trim()) {
            setError('Please enter some SCSS to compile.');
            return;
        }
        setIsLoading(true);
        setError('');
        setCss('');
        try {
            const stream = compileSassStream(scss);
            let fullResponse = '';
            for await (const chunk of stream) {
                fullResponse += chunk;
                setCss(fullResponse);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    }, [scss]);

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8 text-text-primary">
            <header className="mb-6">
                <h1 className="text-3xl flex items-center"><CodeBracketSquareIcon /><span className="ml-3">AI SASS/SCSS Compiler</span></h1>
                <p className="text-text-secondary mt-1">A real-time, AI-powered SASS/SCSS to CSS compiler.</p>
            </header>
            <div className="flex-grow flex flex-col gap-4 min-h-0">
                <div className="flex flex-col flex-1 min-h-0">
                    <label htmlFor="scss-input" className="text-sm font-medium text-text-secondary mb-2">SASS/SCSS Input</label>
                    <textarea id="scss-input" value={scss} onChange={(e) => setScss(e.target.value)} className="flex-grow p-4 bg-surface border border-border rounded-md resize-y font-mono text-sm text-pink-600" spellCheck="false" />
                </div>
                <div className="flex-shrink-0">
                    <button
                        onClick={handleCompile}
                        disabled={isLoading}
                        className="btn-primary w-full max-w-xs mx-auto flex items-center justify-center px-6 py-3"
                    >
                        {isLoading ? <LoadingSpinner /> : 'Compile to CSS'}
                    </button>
                </div>
                <div className="flex flex-col flex-1 min-h-0">
                    <label className="text-sm font-medium text-text-secondary mb-2">Compiled CSS Output</label>
                    <div className="relative flex-grow p-4 bg-background border border-border rounded-md overflow-y-auto text-blue-700 font-mono text-sm">
                        {isLoading && !css && <div className="flex items-center justify-center h-full"><LoadingSpinner /></div>}
                        {error && <p className="text-red-500">{error}</p>}
                        {css && <pre className="whitespace-pre-wrap">{css}</pre>}
                        {!isLoading && css && <button onClick={() => navigator.clipboard.writeText(css)} className="absolute top-2 right-2 px-2 py-1 bg-gray-100 text-xs rounded-md hover:bg-gray-200">Copy CSS</button>}
                        {!isLoading && !css && !error && <div className="text-text-secondary h-full flex items-center justify-center">Output will appear here.</div>}
                    </div>
                </div>
            </div>
        </div>
    );
};