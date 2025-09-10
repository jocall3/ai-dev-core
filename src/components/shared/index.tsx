import React, { useMemo } from 'react';
import { marked } from 'marked';

export const LoadingIndicator: React.FC = () => (
    <div className="w-full h-full flex items-center justify-center bg-surface">
        <div className="flex items-center justify-center space-x-2">
            <div className="w-4 h-4 rounded-full bg-primary animate-pulse" style={{ animationDelay: '0s' }}></div>
            <div className="w-4 h-4 rounded-full bg-primary animate-pulse" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-4 h-4 rounded-full bg-primary animate-pulse" style={{ animationDelay: '0.4s' }}></div>
            <span className="text-text-secondary ml-2">Loading Feature...</span>
        </div>
    </div>
);

export const LoadingSpinner: React.FC = () => (
    <svg className="animate-spin h-5 w-5 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

export const MarkdownRenderer: React.FC<{ content: string }> = ({ content }) => {
    const html = useMemo(() => {
        try {
            return marked.parse(content || '', { gfm: true, breaks: true });
        } catch (e) {
            console.error("Markdown parsing error:", e);
            return "<p>Error parsing markdown.</p>";
        }
    }, [content]);

    return <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: html as string }} />;
};