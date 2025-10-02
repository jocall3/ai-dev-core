// Copyright James Burvel O’Callaghan III
// President Citibank Demo Business Inc.

import React, { useState, useCallback } from 'react';
import { ApiSdkGeneratorIcon } from './icons.tsx';
import { generateSdkFromApiSpecStream } from '../services/geminiService.ts';
import { LoadingSpinner, MarkdownRenderer } from './shared/index.tsx';

const exampleSpec = `{
  "openapi": "3.0.0",
  "info": {
    "title": "Simple User API",
    "version": "1.0.0"
  },
  "paths": {
    "/users/{id}": {
      "get": {
        "summary": "Get a user by ID",
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": { "type": "string" }
          }
        ],
        "responses": {
          "200": { "description": "A single user." }
        }
      }
    }
  }
}`;

const languages = ['TypeScript', 'Python', 'Go', 'JavaScript'];

export const ApiSdkGenerator: React.FC = () => {
    const [spec, setSpec] = useState(exampleSpec);
    const [language, setLanguage] = useState('TypeScript');
    const [sdk, setSdk] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleGenerate = useCallback(async () => {
        if (!spec.trim()) {
            setError('Please paste an API specification.');
            return;
        }
        setIsLoading(true);
        setError('');
        setSdk('');
        try {
            const stream = generateSdkFromApiSpecStream(spec, language);
            let fullResponse = '';
            for await (const chunk of stream) {
                fullResponse += chunk;
                setSdk(fullResponse);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    }, [spec, language]);

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8 text-text-primary">
            <header className="mb-6">
                <h1 className="text-3xl font-bold flex items-center">
                    <ApiSdkGeneratorIcon />
                    <span className="ml-3">AI API SDK Generator</span>
                </h1>
                <p className="text-text-secondary mt-1">Paste an OpenAPI spec and generate a client SDK in your desired language.</p>
            </header>
            <div className="flex-grow grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0">
                <div className="flex flex-col h-full">
                    <label htmlFor="spec-input" className="text-sm font-medium text-text-secondary mb-2">OpenAPI/Swagger Spec (JSON/YAML)</label>
                    <textarea
                        id="spec-input"
                        value={spec}
                        onChange={(e) => setSpec(e.target.value)}
                        className="flex-grow p-4 bg-surface border border-border rounded-md resize-none font-mono text-sm"
                    />
                    <div className="flex items-end gap-4 mt-4">
                        <div className="flex-grow">
                            <label htmlFor="lang-select" className="text-sm font-medium text-text-secondary">Target Language</label>
                            <select id="lang-select" value={language} onChange={e => setLanguage(e.target.value)} className="w-full mt-1 p-2 bg-surface border border-border rounded-md">
                                {languages.map(lang => <option key={lang} value={lang}>{lang}</option>)}
                            </select>
                        </div>
                        <button
                            onClick={handleGenerate}
                            disabled={isLoading}
                            className="btn-primary flex-shrink-0 px-6 py-2"
                        >
                            {isLoading ? <LoadingSpinner /> : 'Generate SDK'}
                        </button>
                    </div>
                </div>
                <div className="flex flex-col h-full">
                    <label className="text-sm font-medium text-text-secondary mb-2">Generated SDK Code</label>
                    <div className="flex-grow p-1 bg-background border border-border rounded-md overflow-y-auto">
                        {isLoading && !sdk && <div className="flex items-center justify-center h-full"><LoadingSpinner /></div>}
                        {error && <p className="p-4 text-red-500">{error}</p>}
                        {sdk && <MarkdownRenderer content={sdk} />}
                        {!isLoading && !sdk && !error && <div className="text-text-secondary h-full flex items-center justify-center">Generated SDK will appear here.</div>}
                    </div>
                </div>
            </div>
        </div>
    );
};