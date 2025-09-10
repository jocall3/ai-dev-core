import React, { useState, useCallback } from 'react';
import { JsonSchemaGeneratorIcon } from './icons.tsx';
import { generateJsonSchemaStream } from '../services/geminiService.ts';
import { LoadingSpinner, MarkdownRenderer } from './shared/index.tsx';

const exampleJson = `{
  "id": 1,
  "name": "A green door",
  "price": 12.50,
  "tags": ["home", "green"]
}`;

export const JsonSchemaGenerator: React.FC = () => {
    const [json, setJson] = useState(exampleJson);
    const [schema, setSchema] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleGenerate = useCallback(async () => {
        try {
            JSON.parse(json);
        } catch (e) {
            setError('Invalid JSON input.');
            return;
        }
        setIsLoading(true);
        setError('');
        setSchema('');
        try {
            const stream = generateJsonSchemaStream(json);
            let fullResponse = '';
            for await (const chunk of stream) {
                fullResponse += chunk;
                setSchema(fullResponse);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    }, [json]);

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8 text-text-primary">
            <header className="mb-6">
                <h1 className="text-3xl font-bold flex items-center">
                    <JsonSchemaGeneratorIcon />
                    <span className="ml-3">AI JSON Schema Generator</span>
                </h1>
                <p className="text-text-secondary mt-1">Generate a JSON Schema from a sample JSON object.</p>
            </header>
            <div className="flex-grow grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0">
                <div className="flex flex-col h-full">
                    <label htmlFor="json-input" className="text-sm font-medium text-text-secondary mb-2">Sample JSON</label>
                    <textarea
                        id="json-input"
                        value={json}
                        onChange={(e) => setJson(e.target.value)}
                        className="flex-grow p-4 bg-surface border border-border rounded-md resize-none font-mono text-sm"
                    />
                     <button
                        onClick={handleGenerate}
                        disabled={isLoading}
                        className="btn-primary mt-4 w-full flex items-center justify-center px-6 py-3"
                    >
                        {isLoading ? <LoadingSpinner /> : 'Generate Schema'}
                    </button>
                </div>
                <div className="flex flex-col h-full">
                    <label className="text-sm font-medium text-text-secondary mb-2">Generated JSON Schema</label>
                    <div className="flex-grow p-1 bg-background border border-border rounded-md overflow-y-auto">
                        {isLoading && !schema && <div className="flex items-center justify-center h-full"><LoadingSpinner /></div>}
                        {error && <p className="p-4 text-red-500">{error}</p>}
                        {schema && <MarkdownRenderer content={schema} />}
                        {!isLoading && !schema && !error && <div className="text-text-secondary h-full flex items-center justify-center">Generated schema will appear here.</div>}
                    </div>
                </div>
            </div>
        </div>
    );
};