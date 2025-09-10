import React, { useState, useEffect, useCallback } from 'react';
import { useGlobalState } from '../contexts/GlobalStateContext.tsx';
import { GithubIcon, PlusCircleIcon, TrashIcon } from './icons.tsx';
import { getRepos, deleteRepo } from '../services/index.ts';
import type { Repo, GetReposOptions } from '../types.ts';
import { LoadingSpinner } from './shared/index.tsx';

const ConnectionCard: React.FC<{
    name: string;
    icon: React.ReactNode;
    isConnected: boolean;
    userLogin?: string;
    onDisconnect: () => void;
}> = ({ name, icon, isConnected, userLogin, onDisconnect }) => {
    return (
        <div className="bg-surface border border-border rounded-lg p-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
                <div className="w-10 h-10">{icon}</div>
                <div>
                    <h3 className="text-lg font-bold text-text-primary">{name}</h3>
                    <p className={`text-sm ${isConnected ? 'text-green-600' : 'text-text-secondary'}`}>
                        {isConnected ? `Connected as ${userLogin}` : 'Not Connected'}
                    </p>
                </div>
            </div>
            {isConnected && (
                <button onClick={onDisconnect} className="px-4 py-2 bg-red-100 text-red-700 font-semibold rounded-md hover:bg-red-200">Disconnect</button>
            )}
        </div>
    );
};

const RepoList: React.FC<{
    repos: Repo[];
    selectedRepoFullName: string | null;
    onSelect: (fullName: string) => void;
    onDelete: (owner: string, repo: string) => Promise<void>;
    isLoading: boolean;
}> = ({ repos, selectedRepoFullName, onSelect, onDelete, isLoading }) => {
    if (isLoading) {
        return <div className="flex justify-center p-8"><LoadingSpinner /></div>;
    }
    if (repos.length === 0) {
        return <p className="text-text-secondary text-center p-4">No repositories found with the current filters.</p>;
    }

    return (
        <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
            {repos.map(repo => (
                <div
                    key={repo.id}
                    onClick={() => onSelect(repo.full_name)}
                    className={`p-3 border rounded-lg cursor-pointer flex justify-between items-center transition-all duration-150 ${selectedRepoFullName === repo.full_name ? 'bg-primary/10 border-primary shadow-sm' : 'bg-background border-border hover:border-gray-300'}`}
                >
                    <div>
                        <p className="font-semibold text-text-primary">{repo.full_name}</p>
                        <p className="text-xs text-text-secondary truncate max-w-md">{repo.description}</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full">{repo.language || 'N/A'}</span>
                        <button
                            onClick={async (e) => {
                                e.stopPropagation();
                                const [owner, repoName] = repo.full_name.split('/');
                                if (window.confirm(`Are you sure you want to PERMANENTLY DELETE the repository "${repo.full_name}"? This action cannot be undone.`)) {
                                    await onDelete(owner, repoName);
                                }
                            }}
                            className="text-red-500 hover:text-red-700 p-1"
                            title={`Delete ${repo.full_name}`}
                        >
                            <TrashIcon/>
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
};

export const Connections: React.FC = () => {
    const { state, dispatch } = useGlobalState();
    const { isGithubConnected, user, selectedRepo } = state;
    const [repos, setRepos] = useState<Repo[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [filters, setFilters] = useState<GetReposOptions>({
        visibility: 'all',
        affiliation: 'owner,collaborator,organization_member',
        sort: 'pushed',
        direction: 'desc',
        per_page: 30,
        page: 1,
    });
    
    const fetchRepos = useCallback(() => {
        setIsLoading(true);
        setError('');
        getRepos(filters)
            .then(setRepos)
            .catch(err => setError('Failed to load repositories. Please check your connection and filters.'))
            .finally(() => setIsLoading(false));
    }, [filters]);

    useEffect(() => {
        if (isGithubConnected) {
            fetchRepos();
        }
    }, [isGithubConnected, fetchRepos]);

    const handleDisconnectGitHub = () => {
        dispatch({ type: 'LOGOUT' });
    };
    
    const handleSelectRepo = (fullName: string) => {
        const [owner, repo] = fullName.split('/');
        dispatch({ type: 'SET_SELECTED_REPO', payload: { owner, repo } });
    };

    const handleDeleteRepo = async (owner: string, repoName: string) => {
        try {
            await deleteRepo(owner, repoName);
            if (selectedRepo?.owner === owner && selectedRepo?.repo === repoName) {
                dispatch({ type: 'SET_SELECTED_REPO', payload: null });
                dispatch({ type: 'LOAD_PROJECT_FILES', payload: null });
            }
            fetchRepos();
        } catch (e) {
            alert("Failed to delete repository.");
        }
    };
    
    const handleCreateRepo = () => {
        dispatch({ type: 'SET_VIEW', payload: { view: 'ai-repo-creator' } });
    };

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    return (
        <div className="h-full p-4 sm:p-6 lg:p-8 overflow-y-auto">
            <div className="max-w-4xl mx-auto">
                <header className="mb-8">
                    <h1 className="text-4xl font-extrabold tracking-tight">Connections</h1>
                    <p className="mt-2 text-lg text-text-secondary">Manage your GitHub connection to unlock powerful workflows.</p>
                </header>

                <div className="space-y-6">
                    <ConnectionCard
                        name="GitHub"
                        icon={<GithubIcon />}
                        isConnected={isGithubConnected}
                        userLogin={user?.login}
                        onDisconnect={handleDisconnectGitHub}
                    />
                    {isGithubConnected && (
                         <div className="bg-surface border border-border rounded-lg p-6">
                            <div className="flex justify-between items-center mb-4">
                                <div>
                                    <h3 className="text-lg font-bold text-text-primary">Your Repositories</h3>
                                    <p className="text-sm text-text-secondary">Select a repository to use with the Project Explorer and other tools.</p>
                                </div>
                                <button onClick={handleCreateRepo} className="btn-primary flex items-center gap-2 px-4 py-2">
                                    <PlusCircleIcon /> Create New
                                </button>
                            </div>
                            <div className="bg-background p-3 rounded-lg border border-border mb-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div>
                                    <label className="text-xs font-semibold">Visibility</label>
                                    <select name="visibility" value={filters.visibility} onChange={handleFilterChange} className="w-full mt-1 p-1 bg-surface border border-border rounded">
                                        <option value="all">All</option><option value="public">Public</option><option value="private">Private</option>
                                    </select>
                                </div>
                                 <div>
                                    <label className="text-xs font-semibold">Affiliation</label>
                                     <input type="text" name="affiliation" value={filters.affiliation} onChange={handleFilterChange} className="w-full mt-1 p-1 bg-surface border border-border rounded" placeholder="owner,collaborator"/>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold">Sort By</label>
                                    <select name="sort" value={filters.sort} onChange={handleFilterChange} className="w-full mt-1 p-1 bg-surface border border-border rounded">
                                        <option value="pushed">Last Pushed</option><option value="updated">Last Updated</option><option value="created">Created Date</option><option value="full_name">Full Name</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold">Direction</label>
                                    <select name="direction" value={filters.direction} onChange={handleFilterChange} className="w-full mt-1 p-1 bg-surface border border-border rounded">
                                        <option value="desc">Desc</option><option value="asc">Asc</option>
                                    </select>
                                </div>
                            </div>
                             {error ? <p className="text-red-500 text-center p-4">{error}</p> :
                             <RepoList 
                                repos={repos} 
                                selectedRepoFullName={selectedRepo ? `${selectedRepo.owner}/${selectedRepo.repo}` : null}
                                onSelect={handleSelectRepo}
                                onDelete={handleDeleteRepo}
                                isLoading={isLoading}
                             />}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};