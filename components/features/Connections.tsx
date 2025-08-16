import React, { useState, useEffect } from 'react';
import { useGlobalState } from '../../contexts/GlobalStateContext.tsx';
import { GithubIcon } from '../icons.tsx';
import { getRepos, deleteRepo } from '../../services/index.ts';
import type { Repo } from '../../types.ts';
import { LoadingSpinner } from '../shared/index.tsx';


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

const RepoSelector: React.FC = () => {
    const { state, dispatch } = useGlobalState();
    const [repos, setRepos] = useState<Repo[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    
    useEffect(() => {
        if (state.isGithubConnected) {
            setIsLoading(true);
            getRepos().then(setRepos).finally(() => setIsLoading(false));
        }
    }, [state.isGithubConnected]);

    const handleSelectRepo = (fullName: string) => {
        if (!fullName) {
            dispatch({ type: 'SET_SELECTED_REPO', payload: null });
            dispatch({ type: 'LOAD_PROJECT_FILES', payload: null });
            return;
        }
        const [owner, repo] = fullName.split('/');
        dispatch({ type: 'SET_SELECTED_REPO', payload: { owner, repo } });
    };

    const handleDeleteRepo = async () => {
        if (!state.selectedRepo) return;
        const { owner, repo } = state.selectedRepo;
        if (window.confirm(`Are you sure you want to PERMANENTLY DELETE the repository "${owner}/${repo}"? This action cannot be undone.`)) {
            try {
                await deleteRepo(owner, repo);
                dispatch({ type: 'SET_SELECTED_REPO', payload: null });
                dispatch({ type: 'LOAD_PROJECT_FILES', payload: null });
                setIsLoading(true);
                getRepos().then(setRepos).finally(() => setIsLoading(false));
            } catch (e) {
                alert("Failed to delete repository.");
            }
        }
    };

    return (
        <div className="bg-surface border border-border rounded-lg p-6">
            <h3 className="text-lg font-bold text-text-primary mb-2">Active Repository</h3>
            <p className="text-sm text-text-secondary mb-4">Select a repository for the AI to interact with in the Project Explorer and other tools.</p>
            {isLoading ? <LoadingSpinner /> : (
                <div className="flex items-center gap-2">
                    <select
                        value={state.selectedRepo ? `${state.selectedRepo.owner}/${state.selectedRepo.repo}` : ''}
                        onChange={e => handleSelectRepo(e.target.value)}
                        className="flex-grow p-2 rounded bg-background border border-border"
                    >
                        <option value="">-- Select a Repository --</option>
                        {repos.map(r => <option key={r.id} value={r.full_name}>{r.full_name}</option>)}
                    </select>
                    {state.selectedRepo && (
                         <button onClick={handleDeleteRepo} className="px-4 py-2 bg-red-100 text-red-700 font-semibold rounded-md hover:bg-red-200">Delete</button>
                    )}
                </div>
            )}
        </div>
    );
}

export const Connections: React.FC = () => {
    const { state, dispatch } = useGlobalState();
    const { isGithubConnected, user } = state;
    
    const handleDisconnectGitHub = () => {
        dispatch({ type: 'LOGOUT' });
    };

    return (
        <div className="h-full p-4 sm:p-6 lg:p-8">
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
                    {isGithubConnected && <RepoSelector />}
                </div>
            </div>
        </div>
    );
};