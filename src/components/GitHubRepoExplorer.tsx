// Copyright James Burvel O’Callaghan III
// President Citibank Demo Business Inc.

import React, { useState, useCallback } from 'react';
import { MagnifyingGlassIcon } from './icons.tsx';
import { getPublicReposForUser } from '../services/index.ts';
import type { Repo, GetReposOptions } from '../types.ts';
import { LoadingSpinner } from './shared/index.tsx';

const RepoList: React.FC<{ repos: Repo[] }> = ({ repos }) => {
    if (repos.length === 0) {
        return <p className="text-text-secondary text-center p-4">No public repositories found for this user.</p>;
    }

    return (
        <div className="space-y-2">
            {repos.map(repo => (
                <a
                    key={repo.id}
                    href={repo.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-3 border bg-background border-border rounded-lg cursor-pointer hover:border-primary transition-colors"
                >
                    <p className="font-semibold text-primary">{repo.full_name}</p>
                    <p className="text-xs text-text-secondary mt-1 truncate">{repo.description}</p>
                    <div className="text-xs text-text-secondary mt-2">
                        <span>{repo.language || 'N/A'}</span>
                        <span className="mx-2">·</span>
                        <span>Updated {new Date(repo.pushed_at).toLocaleDateString()}</span>
                    </div>
                </a>
            ))}
        </div>
    );
};

export const GitHubRepoExplorer: React.FC = () => {
    const [username, setUsername] = useState('google');
    const [repos, setRepos] = useState<Repo[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [filters, setFilters] = useState<GetReposOptions>({
        type: 'all',
        sort: 'pushed',
        direction: 'desc',
        per_page: 30,
    });

    const fetchRepos = useCallback((userToFetch: string) => {
        if (!userToFetch) {
            setError('Please enter a GitHub username.');
            return;
        }
        setIsLoading(true);
        setError('');
        getPublicReposForUser(userToFetch, filters)
            .then(setRepos)
            .catch(err => setError(err.message))
            .finally(() => setIsLoading(false));
    }, [filters]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        fetchRepos(username);
    };

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8 text-text-primary">
            <header className="mb-6">
                <h1 className="text-3xl font-bold flex items-center">
                    <MagnifyingGlassIcon />
                    <span className="ml-3">GitHub Public Repo Explorer</span>
                </h1>
                <p className="text-text-secondary mt-1">Find and view public repositories for any GitHub user.</p>
            </header>
            <form onSubmit={handleSubmit} className="flex gap-2 mb-4">
                <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter GitHub username..."
                    className="flex-grow p-2 bg-surface border border-border rounded-md"
                />
                <button type="submit" className="btn-primary px-6 py-2" disabled={isLoading}>
                    {isLoading ? <LoadingSpinner /> : 'Search'}
                </button>
            </form>
            {error && <p className="text-red-500 text-center p-4">{error}</p>}
            <div className="flex-grow overflow-y-auto">
                <RepoList repos={repos} />
            </div>
        </div>
    );
};
