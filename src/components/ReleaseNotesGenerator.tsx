// Copyright James Burvel O’Callaghan III
// President Citibank Demo Business Inc.

import React, { useState, useCallback } from 'react';
import { ReleaseNotesGeneratorIcon } from './icons.tsx';
import { generateReleaseNotesStream } from '../services/geminiService.ts';
import { LoadingSpinner, MarkdownRenderer } from './shared/index.tsx';

const exampleCommits = `feat: Add user profile page
fix: Correct login button alignment
chore: Update dependencies
feat: Implement password reset flow
perf: Optimize image loading on homepage
fix: Prevent form double submission`;

export const ReleaseNotesGenerator: React.FC = () => {
    const [commits, setCommits] = useState(exampleCommits);
    const [version, setVersion] = useState('1.2.0');
    const [notes, setNotes] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleGenerate = useCallback(async () => {
        if (!commits.trim()) {
            setError('Please provide commit messages or PR titles.');
            return;
        }
        setIsLoading(true);
        setError('');
        setNotes('');
        try {
            const stream = generateReleaseNotesStream(commits, version);
            let fullResponse = '';
            for await (const chunk of stream) {
                fullResponse += chunk;
                setNotes(fullResponse);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    }, [commits, version]);

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8 text-text-primary">
            <header className="mb-6">
                <h1 className="text-3xl font-bold flex items-center">
                    <ReleaseNotesGeneratorIcon />
                    <span className="ml-3">AI Release Notes Generator</span>
                </h1>
                <p className="text-text-secondary mt-1">Paste commit messages or PR titles to generate formatted release notes.</p>
            </header>
            <div className="flex-grow grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0">
                <div className="flex flex-col h-full">
                    <label htmlFor="commits-input" className="text-sm font-medium text-text-secondary mb-2">Commits / PR Titles (one per line)</label>
                    <textarea
                        id="commits-input"
                        value={commits}
                        onChange={(e) => setCommits(e.target.value)}
                        className="flex-grow p-4 bg-surface border border-border rounded-md resize-none font-mono text-sm"
                    />
                    <div className="flex items-end gap-4 mt-4">
                        <div className="flex-grow">
                             <label htmlFor="version-input" className="text-sm font-medium text-text-secondary">Release Version</label>
                            <input id="version-input" type="text" value={version} onChange={e => setVersion(e.target.value)} className="w-full mt-1 p-2 bg-surface border border-border rounded-md" />
                        </div>
                         <button
                            onClick={handleGenerate}
                            disabled={isLoading}
                            className="btn-primary flex-shrink-0 px-6 py-2"
                        >
                            {isLoading ? <LoadingSpinner /> : 'Generate Notes'}
                        </button>
                    </div>
                </div>
                <div className="flex flex-col h-full">
                    <label className="text-sm font-medium text-text-secondary mb-2">Generated Release Notes</label>
                    <div className="flex-grow p-4 bg-background border border-border rounded-md overflow-y-auto">
                        {isLoading && !notes && <div className="flex items-center justify-center h-full"><LoadingSpinner /></div>}
                        {error && <p className="text-red-500">{error}</p>}
                        {notes && <MarkdownRenderer content={notes} />}
                        {!isLoading && !notes && !error && <div className="text-text-secondary h-full flex items-center justify-center">Release notes will appear here.</div>}
                    </div>
                </div>
            </div>
        </div>
    );
};