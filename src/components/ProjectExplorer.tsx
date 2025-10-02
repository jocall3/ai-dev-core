// Copyright James Burvel O’Callaghan III
// President Citibank Demo Business Inc.

import React, { useState, useEffect, useCallback } from 'react';
import { useGlobalState } from '../contexts/GlobalStateContext.tsx';
import type { FileNode } from '../types.ts';
import { getRepoTree, getFileContent } from '../services/index.ts';
import { LoadingSpinner } from './shared/index.tsx';
import { FolderIcon, DocumentIcon, BeakerIcon, CodeExplainerIcon, CodeReviewBotIcon, CodePerformanceAnalyzerIcon, ConnectionsIcon } from './icons.tsx';

// Recursive component to render the file tree
const FileTree: React.FC<{ node: FileNode, onFileSelect: (path: string) => void, level?: number }> = ({ node, onFileSelect, level = 0 }) => {
    const [isOpen, setIsOpen] = useState(level < 2); // Auto-open first few levels
    const isFolder = node.type === 'folder';

    const handleToggle = () => {
        if (isFolder) {
            setIsOpen(!isOpen);
        }
    };
    
    const handleFileClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!isFolder) {
            onFileSelect(node.path);
        } else {
            handleToggle();
        }
    };

    return (
        <div className="text-sm">
            <div 
                className="flex items-center p-1 rounded-md cursor-pointer hover:bg-gray-100"
                onClick={handleFileClick}
                style={{ paddingLeft: `${level * 16}px`}}
            >
                {isFolder ? <FolderIcon /> : <DocumentIcon />}
                <span className="ml-2 truncate">{node.name}</span>
            </div>
            {isFolder && isOpen && node.children && (
                <div>
                    {node.children.sort((a,b) => a.type === 'folder' ? -1 : 1).map(child => (
                        <FileTree key={child.path} node={child} onFileSelect={onFileSelect} level={level + 1} />
                    ))}
                </div>
            )}
        </div>
    );
};

const ActionToolbar: React.FC<{ fileContent: string }> = ({ fileContent }) => {
    const { dispatch } = useGlobalState();
    
    const actions = [
        { id: 'ai-code-explainer', label: 'Explain', icon: <CodeExplainerIcon />, props: { initialCode: fileContent } },
        { id: 'ai-unit-test-generator', label: 'Tests', icon: <BeakerIcon />, props: { initialCode: fileContent } },
        { id: 'code-review-bot', label: 'Review', icon: <CodeReviewBotIcon />, props: { initialCode: fileContent } },
        { id: 'code-performance-analyzer', label: 'Performance', icon: <CodePerformanceAnalyzerIcon />, props: { initialCode: fileContent } }
    ];

    const handleAction = (view: string, props: any) => {
        dispatch({ type: 'SET_VIEW', payload: { view, props } });
    };

    return (
        <div className="flex items-center gap-2 p-2 border-b border-border bg-surface mb-2 rounded-t-md">
            {actions.map(action => (
                <button
                    key={action.id}
                    onClick={() => handleAction(action.id, action.props)}
                    className="flex items-center gap-1.5 px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-md"
                    title={action.label}
                >
                    <div className="w-4 h-4">{action.icon}</div>
                    {action.label}
                </button>
            ))}
        </div>
    );
};

export const ProjectExplorer: React.FC = () => {
    const { state, dispatch } = useGlobalState();
    const { isGithubConnected, selectedRepo, projectFiles } = state;
    const [isLoading, setIsLoading] = useState(false);
    const [activeFileContent, setActiveFileContent] = useState<string | null>(null);
    const [activeFilePath, setActiveFilePath] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (selectedRepo && !projectFiles) {
            setIsLoading(true);
            setError(null);
            getRepoTree(selectedRepo.owner, selectedRepo.repo)
                .then(tree => dispatch({ type: 'LOAD_PROJECT_FILES', payload: tree }))
                .catch(err => {
                    console.error(err);
                    setError('Could not load repository file tree. It might be empty or you may not have access.');
                })
                .finally(() => setIsLoading(false));
        } else if (!selectedRepo && projectFiles) {
            // Clear files if repo is deselected
            dispatch({ type: 'LOAD_PROJECT_FILES', payload: null });
        }
    }, [selectedRepo, projectFiles, dispatch]);
    
    const handleFileSelect = useCallback(async (path: string) => {
        if (!selectedRepo) return;
        setIsLoading(true);
        setActiveFilePath(path);
        setActiveFileContent(null);
        setError(null);
        try {
            const content = await getFileContent(selectedRepo.owner, selectedRepo.repo, path);
            setActiveFileContent(content);
        } catch (e) {
            console.error(e);
            setError(`Could not load file: ${path}`);
            setActiveFileContent(null);
        } finally {
            setIsLoading(false);
        }
    }, [selectedRepo]);
    
    if (!isGithubConnected) {
         return (
            <div className="h-full flex flex-col items-center justify-center text-center text-text-secondary p-4">
                <ConnectionsIcon />
                <h2 className="text-lg font-semibold mt-2">GitHub Connection Required</h2>
                <p className="mb-4">Please connect your GitHub account in the 'Connections' hub to explore repositories.</p>
                <button onClick={() => dispatch({ type: 'SET_VIEW', payload: { view: 'connections' } })} className="btn-primary px-4 py-2">
                    Go to Connections
                </button>
            </div>
        );
    }

    if (!selectedRepo) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-center text-text-secondary p-4">
                <FolderIcon />
                <h2 className="text-lg font-semibold mt-2">No Repository Selected</h2>
                <p>Please select a repository in the 'Connections' tab to explore its files.</p>
            </div>
        );
    }
    
    if (isLoading && !projectFiles) {
        return (
            <div className="h-full flex items-center justify-center">
                <LoadingSpinner />
                <span className="ml-2 text-text-secondary">Loading repository tree...</span>
            </div>
        )
    }

    if (error && !projectFiles) {
         return (
            <div className="h-full flex flex-col items-center justify-center text-red-500 p-4">
                 <h2 className="text-lg font-semibold">Error Loading Repository</h2>
                <p>{error}</p>
            </div>
        );
    }

    return (
        <div className="h-full flex">
            <aside className="w-1/3 max-w-xs bg-surface border-r border-border p-2 overflow-y-auto">
                {projectFiles && <FileTree node={projectFiles} onFileSelect={handleFileSelect} />}
            </aside>
            <main className="flex-1 bg-background p-4 overflow-y-auto">
                 {isLoading && activeFilePath && 
                    <div className="h-full flex items-center justify-center">
                        <LoadingSpinner />
                        <span className="ml-2 text-text-secondary">Loading {activeFilePath}...</span>
                    </div>
                 }
                 {error && activeFilePath && <div className="p-4 text-red-500">{error}</div>}
                 {!isLoading && activeFileContent !== null && (
                    <div className="h-full flex flex-col">
                        <div className="flex-shrink-0">
                            <h3 className="font-mono text-sm mb-2 text-text-secondary">{activeFilePath}</h3>
                            <ActionToolbar fileContent={activeFileContent} />
                        </div>
                        <div className="flex-grow bg-surface rounded-md border border-border overflow-auto">
                            <pre className="p-4 text-sm whitespace-pre-wrap">
                                <code>{activeFileContent}</code>
                            </pre>
                        </div>
                    </div>
                 )}
                 {!isLoading && activeFileContent === null && !error && (
                     <div className="h-full flex items-center justify-center text-text-secondary">
                        <p>Select a file to view its content.</p>
                    </div>
                 )}
            </main>
        </div>
    );
};