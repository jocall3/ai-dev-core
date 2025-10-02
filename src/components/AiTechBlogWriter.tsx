// Copyright James Burvel O’Callaghan III
// President Citibank Demo Business Inc.

import React, { useState, useCallback } from 'react';
import { AiTechBlogWriterIcon } from './icons.tsx';
import { generateTechBlogPostStream } from '../services/geminiService.ts';
import { LoadingSpinner, MarkdownRenderer } from './shared/index.tsx';
import { downloadFile } from '../services/fileUtils.ts';
import { ArrowDownTrayIcon } from './icons.tsx';

export const AiTechBlogWriter: React.FC = () => {
    const [topic, setTopic] = useState('The differences between useEffect and useLayoutEffect in React.');
    const [article, setArticle] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleGenerate = useCallback(async () => {
        if (!topic.trim()) {
            setError('Please enter a topic for the blog post.');
            return;
        }
        setIsLoading(true);
        setError('');
        setArticle('');
        try {
            const stream = generateTechBlogPostStream(topic);
            let fullResponse = '';
            for await (const chunk of stream) {
                fullResponse += chunk;
                setArticle(fullResponse);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    }, [topic]);

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8 text-text-primary">
            <header className="mb-6">
                <h1 className="text-3xl font-bold flex items-center">
                    <AiTechBlogWriterIcon />
                    <span className="ml-3">AI Tech Blog Writer</span>
                </h1>
                <p className="text-text-secondary mt-1">Provide a topic and let AI generate a draft for your next tech blog post.</p>
            </header>
            <div className="flex flex-col gap-4 mb-4">
                 <label htmlFor="topic-input" className="text-sm font-medium text-text-secondary">Blog Post Topic</label>
                <textarea
                    id="topic-input"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="e.g., How to build a REST API with Node.js and Express"
                    className="w-full p-3 rounded-md bg-surface border border-border focus:ring-2 focus:ring-primary focus:outline-none resize-y"
                    rows={2}
                />
                 <button
                    onClick={handleGenerate}
                    disabled={isLoading}
                    className="btn-primary w-full max-w-sm mx-auto flex items-center justify-center px-6 py-3"
                >
                    {isLoading ? <LoadingSpinner /> : 'Write Article Draft'}
                </button>
            </div>
            <div className="flex-grow flex flex-col min-h-0">
                <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-medium text-text-secondary">Generated Article</label>
                    {article && !isLoading && (
                        <button onClick={() => downloadFile(article, 'article.md', 'text/markdown')} className="flex items-center gap-1 px-3 py-1 bg-gray-100 text-xs rounded-md hover:bg-gray-200">
                            <ArrowDownTrayIcon className="w-4 h-4"/> Download Markdown
                        </button>
                    )}
                </div>
                <div className="flex-grow p-4 bg-background border border-border rounded-md overflow-y-auto">
                    {isLoading && !article && <div className="flex items-center justify-center h-full"><LoadingSpinner /></div>}
                    {error && <p className="text-red-500">{error}</p>}
                    {article && <MarkdownRenderer content={article} />}
                    {!isLoading && !article && !error && <div className="text-text-secondary h-full flex items-center justify-center">Your generated blog post will appear here.</div>}
                </div>
            </div>
        </div>
    );
};