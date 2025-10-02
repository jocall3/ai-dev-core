// Copyright James Burvel O’Callaghan III
// President Citibank Demo Business Inc.

import React, { useState, useCallback } from 'react';
import { CodeDocumentationGeneratorIcon } from './icons.tsx';
import { generateDocumentationStream } from '../services/geminiService.ts';
import { LoadingSpinner, MarkdownRenderer } from './shared/index.tsx';
import { ArrowDownTrayIcon } from './icons.tsx';
import { downloadFile } from '../services/fileUtils.ts';

const exampleCode = `class ApiClient {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
  }

  async fetch(endpoint, options = {}) {
    const url = \`\${this.baseUrl}\${endpoint}\`;
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(\`HTTP error! status: \${response.status}\`);
    }
    return response.json();
  }

  get(endpoint) {
    return this.fetch(endpoint);
  }

  post(endpoint, body) {
    return this.fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  }
}`;

export const CodeDocumentationGenerator: React.FC = () => {
    const [code, setCode] = useState(exampleCode);
    const [docs, setDocs] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleGenerate = useCallback(async () => {
        if (!code.trim()) {
            setError('Please enter some code to document.');
            return;
        }
        setIsLoading(true);
        setError('');
        setDocs('');
        try {
            const stream = generateDocumentationStream(code);
            let fullResponse = '';
            for await (const chunk of stream) {
                fullResponse += chunk;
                setDocs(fullResponse);
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
                    <CodeDocumentationGeneratorIcon />
                    <span className="ml-3">AI Code Documentation Generator</span>
                </h1>
                <p className="text-text-secondary mt-1">Generate comprehensive markdown documentation from your source code.</p>
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
                        {isLoading ? <LoadingSpinner /> : 'Generate Docs'}
                    </button>
                </div>
                <div className="flex flex-col h-full">
                    <div className="flex justify-between items-center mb-2">
                        <label className="text-sm font-medium text-text-secondary">Generated Documentation</label>
                        {docs && !isLoading && (
                            <button onClick={() => downloadFile(docs, 'DOCUMENTATION.md', 'text/markdown')} className="flex items-center gap-1 px-3 py-1 bg-gray-100 text-xs rounded-md hover:bg-gray-200">
                                <ArrowDownTrayIcon className="w-4 h-4"/> Download
                            </button>
                        )}
                    </div>
                    <div className="flex-grow p-4 bg-background border border-border rounded-md overflow-y-auto">
                        {isLoading && !docs && <div className="flex items-center justify-center h-full"><LoadingSpinner /></div>}
                        {error && <p className="text-red-500">{error}</p>}
                        {docs && <MarkdownRenderer content={docs} />}
                        {!isLoading && !docs && !error && <div className="text-text-secondary h-full flex items-center justify-center">Documentation will appear here.</div>}
                    </div>
                </div>
            </div>
        </div>
    );
};