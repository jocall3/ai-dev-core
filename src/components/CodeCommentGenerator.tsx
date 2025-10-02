// Copyright James Burvel O’Callaghan III
// President Citibank Demo Business Inc.

import React, { useState, useCallback } from 'react';
import { CodeCommentGeneratorIcon } from './icons.tsx';
import { generateCodeCommentsStream } from '../services/geminiService.ts';
import { LoadingSpinner, MarkdownRenderer } from './shared/index.tsx';

const exampleCode = `function factorial(n) {
  if (n < 0) {
    return -1;
  }
  if (n === 0) {
    return 1;
  }
  return n * factorial(n - 1);
}`;

export const CodeCommentGenerator: React.FC = () => {
    const [code, setCode] = useState(exampleCode);
    const [commentedCode, setCommentedCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleGenerate = useCallback(async () => {
        if (!code.trim()) {
            setError('Please enter some code to comment.');
            return;
        }
        setIsLoading(true);
        setError('');
        setCommentedCode('');
        try {
            const stream = generateCodeCommentsStream(code);
            let fullResponse = '';
            for await (const chunk of stream) {
                fullResponse += chunk;
                setCommentedCode(fullResponse);
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
                    <CodeCommentGeneratorIcon />
                    <span className="ml-3">AI Code Comment Generator</span>
                </h1>
                <p className="text-text-secondary mt-1">Automatically add explanatory comments to your code.</p>
            </header>
            <div className="flex-grow grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0">
                <div className="flex flex-col h-full">
                    <label htmlFor="code-input" className="text-sm font-medium text-text-secondary mb-2">Uncommented Code</label>
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
                        {isLoading ? <LoadingSpinner /> : 'Generate Comments'}
                    </button>
                </div>
                <div className="flex flex-col h-full">
                    <label className="text-sm font-medium text-text-secondary mb-2">Commented Code</label>
                    <div className="flex-grow p-1 bg-background border border-border rounded-md overflow-y-auto">
                        {isLoading && !commentedCode && <div className="flex items-center justify-center h-full"><LoadingSpinner /></div>}
                        {error && <p className="p-4 text-red-500">{error}</p>}
                        {commentedCode && <MarkdownRenderer content={commentedCode} />}
                        {!isLoading && !commentedCode && !error && <div className="text-text-secondary h-full flex items-center justify-center">The commented code will appear here.</div>}
                    </div>
                </div>
            </div>
        </div>
    );
};