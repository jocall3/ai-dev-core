// Copyright James Burvel O’Callaghan III
// President Citibank Demo Business Inc.

import React, { useState, useCallback } from 'react';
import { SqlFormatterIcon } from './icons.tsx';
import { formatSqlStream } from '../services/geminiService.ts';
import { LoadingSpinner, MarkdownRenderer } from './shared/index.tsx';

const exampleSql = `SELECT u.id, p.product_name, SUM(oi.quantity) as total_quantity FROM users u JOIN orders o ON u.id = o.user_id JOIN order_items oi ON o.id = oi.order_id JOIN products p ON oi.product_id = p.id WHERE u.signup_date > '2023-01-01' GROUP BY u.id, p.product_name ORDER BY total_quantity DESC;`;

export const SqlFormatter: React.FC = () => {
    const [sql, setSql] = useState(exampleSql);
    const [formattedSql, setFormattedSql] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleFormat = useCallback(async () => {
        if (!sql.trim()) {
            setError('Please enter some SQL to format.');
            return;
        }
        setIsLoading(true);
        setError('');
        setFormattedSql('');
        try {
            const stream = formatSqlStream(sql);
            let fullResponse = '';
            for await (const chunk of stream) {
                fullResponse += chunk;
                setFormattedSql(fullResponse);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    }, [sql]);

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8 text-text-primary">
            <header className="mb-6">
                <h1 className="text-3xl font-bold flex items-center">
                    <SqlFormatterIcon />
                    <span className="ml-3">AI SQL Formatter</span>
                </h1>
                <p className="text-text-secondary mt-1">Clean up and format your SQL queries for better readability.</p>
            </header>
            <div className="flex-grow grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0">
                <div className="flex flex-col h-full">
                    <label htmlFor="sql-input" className="text-sm font-medium text-text-secondary mb-2">Unformatted SQL</label>
                    <textarea
                        id="sql-input"
                        value={sql}
                        onChange={(e) => setSql(e.target.value)}
                        className="flex-grow p-4 bg-surface border border-border rounded-md resize-none font-mono text-sm"
                    />
                     <button
                        onClick={handleFormat}
                        disabled={isLoading}
                        className="btn-primary mt-4 w-full flex items-center justify-center px-6 py-3"
                    >
                        {isLoading ? <LoadingSpinner /> : 'Format SQL'}
                    </button>
                </div>
                <div className="flex flex-col h-full">
                    <label className="text-sm font-medium text-text-secondary mb-2">Formatted SQL</label>
                    <div className="flex-grow p-1 bg-background border border-border rounded-md overflow-y-auto">
                        {isLoading && !formattedSql && <div className="flex items-center justify-center h-full"><LoadingSpinner /></div>}
                        {error && <p className="p-4 text-red-500">{error}</p>}
                        {formattedSql && <MarkdownRenderer content={formattedSql} />}
                        {!isLoading && !formattedSql && !error && <div className="text-text-secondary h-full flex items-center justify-center">Formatted SQL will appear here.</div>}
                    </div>
                </div>
            </div>
        </div>
    );
};