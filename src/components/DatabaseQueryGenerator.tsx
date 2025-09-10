import React, { useState, useCallback } from 'react';
import { DatabaseQueryGeneratorIcon } from './icons.tsx';
import { generateSqlQueryStream } from '../services/geminiService.ts';
import { LoadingSpinner, MarkdownRenderer } from './shared/index.tsx';

const exampleSchema = `Table: users
Columns: id (integer), name (varchar), email (varchar), signup_date (date)

Table: orders
Columns: id (integer), user_id (integer), amount (decimal), order_date (date)`;

const examplePrompt = "Find the total order amount for each user who signed up in the last month.";

export const DatabaseQueryGenerator: React.FC = () => {
    const [schema, setSchema] = useState(exampleSchema);
    const [prompt, setPrompt] = useState(examplePrompt);
    const [query, setQuery] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleGenerate = useCallback(async () => {
        if (!schema.trim() || !prompt.trim()) {
            setError('Please provide both a schema and a natural language query.');
            return;
        }
        setIsLoading(true);
        setError('');
        setQuery('');
        try {
            const stream = generateSqlQueryStream(schema, prompt);
            let fullResponse = '';
            for await (const chunk of stream) {
                fullResponse += chunk;
                setQuery(fullResponse);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    }, [schema, prompt]);

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8 text-text-primary">
            <header className="mb-6">
                <h1 className="text-3xl font-bold flex items-center">
                    <DatabaseQueryGeneratorIcon />
                    <span className="ml-3">AI SQL Query Generator</span>
                </h1>
                <p className="text-text-secondary mt-1">Describe your database schema and write what you want in plain English to generate a SQL query.</p>
            </header>
            <div className="flex-grow grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0">
                <div className="flex flex-col h-full gap-4">
                    <div className="flex flex-col flex-1">
                        <label htmlFor="schema-input" className="text-sm font-medium text-text-secondary mb-2">Database Schema</label>
                        <textarea
                            id="schema-input"
                            value={schema}
                            onChange={(e) => setSchema(e.target.value)}
                            className="flex-grow p-4 bg-surface border border-border rounded-md resize-none font-mono text-sm"
                        />
                    </div>
                     <div className="flex flex-col flex-1">
                        <label htmlFor="prompt-input" className="text-sm font-medium text-text-secondary mb-2">What data do you need?</label>
                        <textarea
                            id="prompt-input"
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            className="flex-grow p-4 bg-surface border border-border rounded-md resize-none font-sans text-sm"
                        />
                    </div>
                     <button
                        onClick={handleGenerate}
                        disabled={isLoading}
                        className="btn-primary w-full flex items-center justify-center px-6 py-3"
                    >
                        {isLoading ? <LoadingSpinner /> : 'Generate SQL Query'}
                    </button>
                </div>
                <div className="flex flex-col h-full">
                    <label className="text-sm font-medium text-text-secondary mb-2">Generated SQL</label>
                    <div className="flex-grow p-1 bg-background border border-border rounded-md overflow-y-auto">
                        {isLoading && !query && <div className="flex items-center justify-center h-full"><LoadingSpinner /></div>}
                        {error && <p className="p-4 text-red-500">{error}</p>}
                        {query && <MarkdownRenderer content={query} />}
                        {!isLoading && !query && !error && <div className="text-text-secondary h-full flex items-center justify-center">Generated SQL will appear here.</div>}
                    </div>
                </div>
            </div>
        </div>
    );
};