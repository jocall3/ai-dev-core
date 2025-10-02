// Copyright James Burvel O’Callaghan III
// President Citibank Demo Business Inc.

import React, { useState, useCallback, useEffect } from 'react';
import * as Diff from 'diff';
import { generatePrSummaryStructured, downloadFile } from '../services/index.ts';
import type { StructuredPrSummary } from '../types.ts';
import { GitBranchIcon, ArrowDownTrayIcon } from './icons.tsx';
import { LoadingSpinner } from './shared/index.tsx';

const exampleBefore = `function Greeter(props) {
  return <h1>Hello, {props.name}!</h1>;
}`;
const exampleAfter = `function Greeter({ name, enthusiasmLevel = 1 }) {
  const punctuation = '!'.repeat(enthusiasmLevel);
  return <h1>Hello, {name}{punctuation}</h1>;
}`;

export const PrSummaryGenerator: React.FC<{ beforeCode?: string, afterCode?: string }> = ({ beforeCode: initialBefore, afterCode: initialAfter }) => {
    const [beforeCode, setBeforeCode] = useState<string>(initialBefore || exampleBefore);
    const [afterCode, setAfterCode] = useState<string>(initialAfter || exampleAfter);
    const [summary, setSummary] = useState<StructuredPrSummary | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');

    const handleGenerate = useCallback(async (b: string, a: string) => {
        if (!b.trim() && !a.trim()) {
            setError('Please provide code to generate a summary.');
            return;
        }
        setIsLoading(true);
        setError('');
        setSummary(null);

        try {
            const diff = Diff.createPatch('component.tsx', b, a);
            const result = await generatePrSummaryStructured(diff);
            setSummary(result);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
            setError(`Failed to generate summary: ${errorMessage}`);
        } finally {
            setIsLoading(false);
        }
    }, []);
    
    const getMarkdownOutput = () => {
        if (!summary) return '';
        return `# ${summary.title}\n\n## Summary\n${summary.summary}\n\n## Key Changes\n${summary.changes.map(c => `- ${c}`).join('\n')}`;
    };

    useEffect(() => {
        if (initialBefore || initialAfter) {
            setBeforeCode(initialBefore || '');
            setAfterCode(initialAfter || '');
            handleGenerate(initialBefore || '', initialAfter || '');
        }
    }, [initialBefore, initialAfter, handleGenerate]);

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8 text-text-primary">
            <header className="mb-6">
                <h1 className="text-3xl font-bold flex items-center">
                    <GitBranchIcon />
                    <span className="ml-3">AI PR Summary Generator</span>
                </h1>
                <p className="text-text-secondary mt-1">Paste 'before' and 'after' code snippets to generate a comprehensive PR summary.</p>
            </header>
            <div className="flex-grow grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0">
                <div className="flex flex-col gap-4 min-h-0">
                    <div className="flex flex-col flex-1 min-h-0">
                         <label htmlFor="before-code" className="text-sm font-medium text-text-secondary mb-2">Before</label>
                         <textarea id="before-code" value={beforeCode} onChange={e => setBeforeCode(e.target.value)} className="flex-grow p-4 bg-surface border border-border rounded-md resize-none font-mono text-sm" />
                    </div>
                     <div className="flex flex-col flex-1 min-h-0">
                         <label htmlFor="after-code" className="text-sm font-medium text-text-secondary mb-2">After</label>
                         <textarea id="after-code" value={afterCode} onChange={e => setAfterCode(e.target.value)} className="flex-grow p-4 bg-surface border border-border rounded-md resize-none font-mono text-sm" />
                    </div>
                     <button onClick={() => handleGenerate(beforeCode, afterCode)} disabled={isLoading} className="btn-primary w-full flex items-center justify-center px-6 py-3">
                        {isLoading ? <LoadingSpinner /> : 'Generate Summary'}
                    </button>
                </div>
                <div className="flex flex-col min-h-0">
                    <div className="flex justify-between items-center mb-2">
                        <label className="text-sm font-medium text-text-secondary">Generated Summary</label>
                        {summary && (
                            <div className="flex items-center gap-2">
                                <button onClick={() => navigator.clipboard.writeText(getMarkdownOutput())} className="px-3 py-1 bg-gray-100 text-xs rounded-md hover:bg-gray-200">Copy Markdown</button>
                                <button onClick={() => downloadFile(getMarkdownOutput(), 'PR_summary.md', 'text/markdown')} className="flex items-center gap-1 px-3 py-1 bg-gray-100 text-xs rounded-md hover:bg-gray-200">
                                    <ArrowDownTrayIcon className="w-4 h-4" /> Download
                                </button>
                            </div>
                        )}
                    </div>
                    <div className="flex-grow p-4 bg-background border border-border rounded-md overflow-y-auto">
                        {isLoading && <div className="flex items-center justify-center h-full"><LoadingSpinner /></div>}
                        {error && <p className="text-red-500">{error}</p>}
                        {summary && !isLoading && (
                            <div className="prose prose-sm max-w-none">
                                <h3 className="border-b border-border pb-2 mb-2">{summary.title}</h3>
                                <p>{summary.summary}</p>
                                <h4 className="mt-4">Key Changes:</h4>
                                <ul>
                                    {summary.changes.map((change, i) => <li key={i}>{change}</li>)}
                                </ul>
                            </div>
                        )}
                         {!isLoading && !summary && !error && <div className="text-text-secondary h-full flex items-center justify-center">The summary will appear here.</div>}
                    </div>
                </div>
            </div>
        </div>
    );
};