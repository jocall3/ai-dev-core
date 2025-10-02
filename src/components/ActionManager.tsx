// Copyright James Burvel O’Callaghan III
// President Citibank Demo Business Inc.

import React, { useState } from 'react';
import JSZip from 'jszip';
import { getAllFiles, commitFiles } from '../services/index.ts';
import { ArrowDownTrayIcon, XMarkIcon, GithubIcon } from './icons.tsx';
import { LoadingSpinner } from './shared/index.tsx';
import { useGlobalState } from '../contexts/GlobalStateContext.tsx';

interface CommitModalProps {
    fileCount: number;
    repoName: string;
    onCommit: (message: string) => void;
    onClose: () => void;
    isLoading: boolean;
}

const CommitModal: React.FC<CommitModalProps> = ({ fileCount, repoName, onCommit, onClose, isLoading }) => {
    const [commitMessage, setCommitMessage] = useState(`feat: Add ${fileCount} new files via DevCore AI`);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (commitMessage.trim()) {
            onCommit(commitMessage);
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm z-40 flex items-center justify-center fade-in">
            <form 
              onSubmit={handleSubmit}
              className="bg-surface border border-border rounded-2xl shadow-2xl w-full max-w-lg m-4 p-6 animate-pop-in relative"
            >
                <button type="button" onClick={onClose} className="absolute top-3 right-3 p-1 text-text-secondary hover:bg-gray-100 rounded-full">
                    <XMarkIcon className="w-6 h-6" />
                </button>
                <h2 className="text-xl font-bold mb-2">Commit to Repository</h2>
                <p className="text-text-secondary mb-4">
                    You are committing <span className="font-bold text-primary">{fileCount} file(s)</span> to <span className="font-bold text-primary">{repoName}</span>.
                </p>
                <label htmlFor="commit-message" className="block text-sm font-medium text-text-secondary mb-1">Commit Message</label>
                <textarea
                    id="commit-message"
                    value={commitMessage}
                    onChange={(e) => setCommitMessage(e.target.value)}
                    required
                    className="w-full h-28 p-2 bg-background border border-border rounded-md text-sm"
                    placeholder="Enter your commit message..."
                />
                <div className="mt-6 flex justify-end gap-3">
                     <button type="button" onClick={onClose} className="px-6 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300">
                        Cancel
                    </button>
                    <button type="submit" disabled={isLoading} className="btn-primary px-6 py-2 flex items-center justify-center min-w-[100px]">
                        {isLoading ? <LoadingSpinner /> : 'Commit Files'}
                    </button>
                </div>
            </form>
        </div>
    );
};


export const ActionManager: React.FC = () => {
    const { state } = useGlobalState();
    const [isLoading, setIsLoading] = useState<string | null>(null);
    const [isCommitModalOpen, setCommitModalOpen] = useState(false);
    const [filesToCommit, setFilesToCommit] = useState<{filePath: string, content: string}[]>([]);

    const handleDownloadZip = async () => {
        setIsLoading('zip');
        try {
            const files = await getAllFiles();
            if (files.length === 0) {
                alert("No files have been generated to download.");
                return;
            }
            const zip = new JSZip();
            files.forEach(file => {
                const pathParts = file.filePath.split('/').filter(p => p);
                let currentFolder: JSZip | null = zip;
                if (pathParts.length > 1) {
                    for (let i = 0; i < pathParts.length - 1; i++) {
                        const folderName = pathParts[i];
                        if (currentFolder) {
                           currentFolder = currentFolder.folder(folderName);
                        }
                    }
                }
                if (currentFolder) {
                    currentFolder.file(pathParts[pathParts.length - 1], file.content);
                }
            });
            const zipBlob = await zip.generateAsync({ type: 'blob' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(zipBlob);
            link.download = 'devcore-project.zip';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error("Failed to create ZIP file", error);
            alert(`Error creating ZIP: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setIsLoading(null);
        }
    };

    const handleOpenCommitModal = async () => {
        if (!state.selectedRepo) {
            alert("Please select a repository in the 'Connections' tab first.");
            return;
        }
        setIsLoading('repo-check');
        const files = await getAllFiles();
        if (files.length === 0) {
            alert("No files have been generated to save.");
            setIsLoading(null);
            return;
        }
        setFilesToCommit(files);
        setCommitModalOpen(true);
        setIsLoading(null);
    };

    const handleCommit = async (commitMessage: string) => {
        if (!state.selectedRepo) return;
        setIsLoading('repo-commit');
        try {
            await commitFiles(state.selectedRepo.owner, state.selectedRepo.repo, filesToCommit, commitMessage);
            alert(`Successfully committed ${filesToCommit.length} files to ${state.selectedRepo.owner}/${state.selectedRepo.repo}.`);
            setCommitModalOpen(false);
        } catch (error) {
            console.error("Failed to save to repository", error);
            alert(`Error saving to repository: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setIsLoading(null);
        }
    };

    return (
        <>
            <div className="absolute bottom-[calc(theme(spacing.4)_+_24px)] right-6 z-10 flex flex-col gap-3">
                <button
                    onClick={handleOpenCommitModal}
                    disabled={!!isLoading || !state.selectedRepo}
                    className="w-14 h-14 bg-[#24292e] text-white rounded-full flex items-center justify-center shadow-lg hover:bg-[#333] transition-colors disabled:bg-slate-600 disabled:cursor-not-allowed"
                    aria-label="Save generated files to repository"
                    title="Save to Repository"
                >
                    {isLoading === 'repo-check' ? <LoadingSpinner /> : <GithubIcon />}
                </button>
                <button
                    onClick={handleDownloadZip}
                    disabled={!!isLoading}
                    className="w-14 h-14 bg-primary text-text-on-primary rounded-full flex items-center justify-center shadow-lg hover:opacity-90 transition-colors disabled:bg-slate-600"
                    aria-label="Download Project as ZIP"
                    title="Download Project as ZIP (Save to Drive)"
                >
                    {isLoading === 'zip' ? <LoadingSpinner /> : <ArrowDownTrayIcon />}
                </button>
            </div>
            {isCommitModalOpen && state.selectedRepo && (
                <CommitModal 
                    fileCount={filesToCommit.length}
                    repoName={`${state.selectedRepo.owner}/${state.selectedRepo.repo}`}
                    onCommit={handleCommit}
                    onClose={() => setCommitModalOpen(false)}
                    isLoading={isLoading === 'repo-commit'}
                />
            )}
        </>
    );
};