// Copyright James Burvel O’Callaghan III
// President Citibank Demo Business Inc.

import React, { useState, useCallback } from 'react';
import { useGlobalState } from '../contexts/GlobalStateContext.tsx';
import { createRepo, generateRepoDetailsFromPrompt } from '../services/index.ts';
import type { RepoTemplate, CreateRepoOptions } from '../types.ts';
import { PlusCircleIcon, SparklesIcon, ChevronDownIcon, ConnectionsIcon } from './icons.tsx';
import { LoadingSpinner } from './shared/index.tsx';

const Checkbox: React.FC<{ label: string, checked: boolean, onChange: (checked: boolean) => void, name: string }> = ({ label, checked, onChange, name }) => (
    <label className="flex items-center gap-2 text-sm"><input type="checkbox" name={name} checked={checked} onChange={e => onChange(e.target.checked)} className="rounded" />{label}</label>
);

export const AiRepoCreator: React.FC = () => {
    const { state, dispatch } = useGlobalState();
    const { isGithubConnected } = state;
    const [prompt, setPrompt] = useState('A new TypeScript project for a recipe sharing app.');
    const [isGenerating, setIsGenerating] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [error, setError] = useState('');
    const [showAdvanced, setShowAdvanced] = useState(false);

    const [formState, setFormState] = useState<CreateRepoOptions>({
        name: '',
        description: '',
        private: false,
        auto_init: true,
        gitignore_template: 'Node',
        has_issues: true,
        has_projects: true,
        has_wiki: true,
        is_template: false,
        allow_squash_merge: true,
        allow_merge_commit: true,
        allow_rebase_merge: true,
        delete_branch_on_merge: false,
    });

    const handleGenerateDetails = useCallback(async () => {
        if (!prompt) {
            setError('Please enter a description for your repository.');
            return;
        }
        setIsGenerating(true);
        setError('');
        try {
            const details = await generateRepoDetailsFromPrompt(prompt);
            setFormState(prev => ({ ...prev, name: details.name, description: details.description }));
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to generate details from prompt.');
        } finally {
            setIsGenerating(false);
        }
    }, [prompt]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const isCheckbox = type === 'checkbox';
        // @ts-ignore
        const checked = e.target.checked;
        setFormState(prev => ({ ...prev, [name]: isCheckbox ? checked : value }));
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formState.name) {
            setError('Repository name is required.');
            return;
        }
        setIsCreating(true);
        setError('');
        try {
            const newRepo = await createRepo(formState);
            alert(`Successfully created repository: ${formState.name}`);
            if (state.user) {
                dispatch({ type: 'SET_SELECTED_REPO', payload: { owner: newRepo.owner.login, repo: newRepo.name } });
            }
            dispatch({ type: 'SET_VIEW', payload: { view: 'connections' } });
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create the repository.');
        } finally {
            setIsCreating(false);
        }
    };
    
    if (!isGithubConnected) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-center text-text-secondary p-4">
                <ConnectionsIcon />
                <h2 className="text-lg font-semibold mt-2">GitHub Connection Required</h2>
                <p className="mb-4">Please connect your GitHub account in the 'Connections' hub to create repositories.</p>
                <button onClick={() => dispatch({ type: 'SET_VIEW', payload: { view: 'connections' } })} className="btn-primary px-4 py-2">
                    Go to Connections
                </button>
            </div>
        );
    }

    return (
        <div className="h-full p-4 sm:p-6 lg:p-8 text-text-primary overflow-y-auto">
            <div className="max-w-2xl mx-auto">
                <header className="mb-8">
                    <h1 className="text-4xl font-extrabold flex items-center">
                        <PlusCircleIcon />
                        <span className="ml-3">AI Repository Creator</span>
                    </h1>
                    <p className="mt-2 text-lg text-text-secondary">Describe your new project, and let AI set up the repository on GitHub for you.</p>
                </header>

                <div className="space-y-6">
                    <div>
                        <label htmlFor="ai-prompt" className="block text-sm font-medium text-text-secondary mb-1">1. Describe your project</label>
                        <textarea id="ai-prompt" value={prompt} onChange={e => setPrompt(e.target.value)} className="w-full p-2 bg-surface border border-border rounded-md resize-y h-24" placeholder="e.g., A Python script to analyze stock market data"/>
                         <button onClick={handleGenerateDetails} disabled={isGenerating || isCreating} className="btn-primary w-full flex items-center justify-center gap-2 mt-2 px-4 py-2">
                            {isGenerating ? <LoadingSpinner /> : <SparklesIcon />} Generate Name & Description
                        </button>
                    </div>

                    <form onSubmit={handleCreate} className="space-y-4 p-6 bg-surface border border-border rounded-lg">
                        <h3 className="text-lg font-bold text-text-primary">2. Configure Repository</h3>
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-text-secondary mb-1">Repository Name</label>
                            <input id="name" name="name" type="text" value={formState.name} onChange={handleChange} className="w-full p-2 bg-background border border-border rounded-md" required />
                        </div>
                         <div>
                            <label htmlFor="description" className="block text-sm font-medium text-text-secondary mb-1">Description</label>
                            <input id="description" name="description" type="text" value={formState.description ?? ''} onChange={handleChange} className="w-full p-2 bg-background border border-border rounded-md" />
                        </div>
                        <div className="flex items-center gap-4"><Checkbox label="Private Repository" name="private" checked={!!formState.private} onChange={c => setFormState(p => ({...p, private: c}))} /></div>
                        
                        <div className="pt-4 mt-4 border-t border-border">
                            <h4 className="font-semibold mb-2">Initialization</h4>
                             <div className="flex flex-col gap-2">
                                <Checkbox label="Initialize with a README" name="auto_init" checked={!!formState.auto_init} onChange={c => setFormState(p => ({...p, auto_init: c}))} />
                                <div className="flex items-center gap-2 text-sm"><label htmlFor="gitignore_template">.gitignore template:</label><input id="gitignore_template" name="gitignore_template" value={formState.gitignore_template} onChange={handleChange} className="p-1 bg-background border border-border rounded-md" placeholder="e.g., Node"/></div>
                                <div className="flex items-center gap-2 text-sm"><label htmlFor="license_template">License template:</label><input id="license_template" name="license_template" value={formState.license_template ?? ''} onChange={handleChange} className="p-1 bg-background border border-border rounded-md" placeholder="e.g., mit"/></div>
                            </div>
                        </div>

                        <div className="pt-4 mt-4 border-t border-border">
                            <button type="button" onClick={() => setShowAdvanced(!showAdvanced)} className="flex justify-between items-center w-full font-semibold">
                                Advanced Options <ChevronDownIcon />
                            </button>
                            {showAdvanced && (
                                <div className="mt-4 grid grid-cols-2 gap-4">
                                    <Checkbox label="Enable Issues" name="has_issues" checked={!!formState.has_issues} onChange={c => setFormState(p => ({...p, has_issues: c}))} />
                                    <Checkbox label="Enable Projects" name="has_projects" checked={!!formState.has_projects} onChange={c => setFormState(p => ({...p, has_projects: c}))} />
                                    <Checkbox label="Enable Wiki" name="has_wiki" checked={!!formState.has_wiki} onChange={c => setFormState(p => ({...p, has_wiki: c}))} />
                                    <Checkbox label="Is a Template" name="is_template" checked={!!formState.is_template} onChange={c => setFormState(p => ({...p, is_template: c}))} />
                                    <Checkbox label="Allow Squash Merging" name="allow_squash_merge" checked={!!formState.allow_squash_merge} onChange={c => setFormState(p => ({...p, allow_squash_merge: c}))} />
                                    <Checkbox label="Allow Merge Commits" name="allow_merge_commit" checked={!!formState.allow_merge_commit} onChange={c => setFormState(p => ({...p, allow_merge_commit: c}))} />
                                    <Checkbox label="Allow Rebase Merging" name="allow_rebase_merge" checked={!!formState.allow_rebase_merge} onChange={c => setFormState(p => ({...p, allow_rebase_merge: c}))} />
                                    <Checkbox label="Delete branch on merge" name="delete_branch_on_merge" checked={!!formState.delete_branch_on_merge} onChange={c => setFormState(p => ({...p, delete_branch_on_merge: c}))} />
                                </div>
                            )}
                        </div>

                        {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                        
                        <button type="submit" disabled={isCreating || isGenerating || !formState.name} className="btn-primary w-full flex items-center justify-center px-6 py-3 mt-4">
                            {isCreating ? <LoadingSpinner /> : 'Create Repository'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};