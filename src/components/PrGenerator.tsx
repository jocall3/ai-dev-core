// Copyright James Burvel O’Callaghan III
// President Citibank Demo Business Inc.

import React, { useState, useMemo } from 'react';
import { GitBranchIcon } from './icons.tsx';

export const PrGenerator: React.FC = () => {
    const [title, setTitle] = useState('feat: Implement new login flow');
    const [description, setDescription] = useState('This PR introduces a new, more secure login flow using OAuth.');
    const [fromBranch, setFromBranch] = useState('feature/new-login');
    const [toBranch, setToBranch] = useState('main');
    const [changeType, setChangeType] = useState('feat');
    const [relatedIssue, setRelatedIssue] = useState('#123');
    const [testingSteps, setTestingSteps] = useState('1. Navigate to /login\n2. Click "Login with OAuth"\n3. Verify you are redirected to the dashboard.');
    
    const markdownPreview = useMemo(() => {
        return `
# ${changeType}: ${title}
${relatedIssue ? `\n**Closes:** ${relatedIssue}\n` : ''}
**Branch:** \`${fromBranch}\` -> \`${toBranch}\`

## Description
${description}

## Testing Steps
${testingSteps}
        `.trim();
    }, [title, description, fromBranch, toBranch, changeType, relatedIssue, testingSteps]);

    const handleCopy = () => {
        navigator.clipboard.writeText(markdownPreview);
    };

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8 text-text-primary">
            <header className="mb-6">
                <h1 className="text-3xl flex items-center"><GitBranchIcon /><span className="ml-3">Pull Request Generator</span></h1>
                <p className="text-text-secondary mt-1">Draft a professional pull request from a structured template.</p>
            </header>
            <div className="flex-grow grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0">
                <form className="flex flex-col gap-4 overflow-y-auto pr-2 bg-surface border border-border p-4 rounded-lg">
                    <div className="bg-background p-4 rounded-lg flex items-center gap-4 border border-border">
                        <input type="text" value={fromBranch} onChange={e => setFromBranch(e.target.value)} className="w-full px-3 py-1.5 rounded-md bg-surface text-sm font-mono border border-border"/>
                        <span className="font-bold text-text-secondary">→</span>
                         <input type="text" value={toBranch} onChange={e => setToBranch(e.target.value)} className="w-full px-3 py-1.5 rounded-md bg-surface text-sm font-mono border border-border"/>
                    </div>
                    <div className="flex gap-2">
                        <div className="w-1/4"><label className="block text-sm">Type</label><select value={changeType} onChange={e => setChangeType(e.target.value)} className="w-full mt-1 p-2 rounded bg-surface border border-border"><option>feat</option><option>fix</option><option>chore</option><option>docs</option><option>refactor</option></select></div>
                        <div className="w-3/4"><label className="block text-sm">Title</label><input type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full mt-1 p-2 rounded bg-surface border border-border"/></div>
                    </div>
                    <div><label className="block text-sm">Related Issue (optional)</label><input type="text" value={relatedIssue} onChange={e => setRelatedIssue(e.target.value)} className="w-full mt-1 p-2 rounded bg-surface border border-border"/></div>
                    <div><label className="block text-sm">Description</label><textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full mt-1 p-2 rounded bg-surface border border-border resize-y h-24"/></div>
                    <div><label className="block text-sm">Testing Steps</label><textarea value={testingSteps} onChange={e => setTestingSteps(e.target.value)} className="w-full mt-1 p-2 rounded bg-surface border border-border resize-y h-24"/></div>
                </form>
                <div className="flex flex-col">
                    <div className="flex justify-between items-center mb-2">
                        <label className="text-sm font-medium text-text-secondary">Markdown Preview</label>
                        <button onClick={handleCopy} className="px-3 py-1 bg-gray-100 text-xs rounded-md hover:bg-gray-200">Copy Markdown</button>
                    </div>
                    <div className="relative flex-grow"><pre className="w-full h-full bg-background border border-border p-4 rounded-md text-sm overflow-auto whitespace-pre-wrap">{markdownPreview}</pre></div>
                </div>
            </div>
        </div>
    );
};