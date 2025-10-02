// Copyright James Burvel O’Callaghan III
// President Citibank Demo Business Inc.

import React, { useState } from 'react';
import JSZip from 'jszip';
import { getAllFiles } from '../services/index.ts';
import { ArrowDownTrayIcon } from './icons.tsx';
import { LoadingSpinner } from './shared/index.tsx';

export const DownloadManager: React.FC = () => {
    const [isLoading, setIsLoading] = useState(false);

    const handleDownload = async () => {
        setIsLoading(true);
        try {
            const files = await getAllFiles();
            if (files.length === 0) {
                alert("No files have been generated yet.");
                return;
            }

            const zip = new JSZip();
            files.forEach(file => {
                // Create folders if necessary
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
            
            // Create a link and trigger download
            const link = document.createElement('a');
            link.href = URL.createObjectURL(zipBlob);
            link.download = 'devcore-project.zip';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

        } catch (error) {
            console.error("Failed to create ZIP file", error);
            alert("An error occurred while preparing the download.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="absolute bottom-6 right-6 z-10">
            <button
                onClick={handleDownload}
                disabled={isLoading}
                className="w-14 h-14 bg-cyan-500 text-slate-900 rounded-full flex items-center justify-center shadow-lg hover:bg-cyan-400 transition-colors disabled:bg-slate-600"
                aria-label="Download Project as ZIP"
                title="Download Project as ZIP"
            >
                {isLoading ? <LoadingSpinner /> : <ArrowDownTrayIcon />}
            </button>
        </div>
    );
};