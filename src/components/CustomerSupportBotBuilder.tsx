// Copyright James Burvel O’Callaghan III
// President Citibank Demo Business Inc.

import React, { useState, useCallback } from 'react';
import { CustomerSupportBotBuilderIcon } from './icons.tsx';
import { generateChatbotSystemPromptStream } from '../services/geminiService.ts';
import { LoadingSpinner, MarkdownRenderer } from './shared/index.tsx';

const exampleKnowledgeBase = `Q: What are your shipping times?
A: Standard shipping takes 5-7 business days. Express shipping is 1-2 business days.

Q: What is your return policy?
A: We accept returns within 30 days of purchase for a full refund. Items must be in original condition.

Q: Do you ship internationally?
A: Yes, we ship to most countries worldwide. Shipping costs and times vary.`;

export const CustomerSupportBotBuilder: React.FC = () => {
    const [knowledgeBase, setKnowledgeBase] = useState(exampleKnowledgeBase);
    const [systemPrompt, setSystemPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleGenerate = useCallback(async () => {
        if (!knowledgeBase.trim()) {
            setError('Please provide a knowledge base.');
            return;
        }
        setIsLoading(true);
        setError('');
        setSystemPrompt('');
        try {
            const stream = generateChatbotSystemPromptStream(knowledgeBase);
            let fullResponse = '';
            for await (const chunk of stream) {
                fullResponse += chunk;
                setSystemPrompt(fullResponse);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    }, [knowledgeBase]);

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8 text-text-primary">
            <header className="mb-6">
                <h1 className="text-3xl font-bold flex items-center">
                    <CustomerSupportBotBuilderIcon />
                    <span className="ml-3">AI Customer Support Bot Builder</span>
                </h1>
                <p className="text-text-secondary mt-1">Provide a knowledge base to generate a system prompt for a helpful support chatbot.</p>
            </header>
            <div className="flex-grow grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0">
                <div className="flex flex-col h-full">
                    <label htmlFor="kb-input" className="text-sm font-medium text-text-secondary mb-2">Knowledge Base (FAQ, product info, etc.)</label>
                    <textarea
                        id="kb-input"
                        value={knowledgeBase}
                        onChange={(e) => setKnowledgeBase(e.target.value)}
                        className="flex-grow p-4 bg-surface border border-border rounded-md resize-none font-sans text-sm"
                    />
                     <button
                        onClick={handleGenerate}
                        disabled={isLoading}
                        className="btn-primary mt-4 w-full flex items-center justify-center px-6 py-3"
                    >
                        {isLoading ? <LoadingSpinner /> : 'Generate System Prompt'}
                    </button>
                </div>
                <div className="flex flex-col h-full">
                    <label className="text-sm font-medium text-text-secondary mb-2">Generated System Prompt</label>
                    <div className="relative flex-grow p-4 bg-background border border-border rounded-md overflow-y-auto">
                        {isLoading && !systemPrompt && <div className="flex items-center justify-center h-full"><LoadingSpinner /></div>}
                        {error && <p className="text-red-500">{error}</p>}
                        {systemPrompt && (
                            <>
                                <button onClick={() => navigator.clipboard.writeText(systemPrompt)} className="absolute top-2 right-2 px-2 py-1 bg-gray-100 text-xs rounded-md hover:bg-gray-200">Copy</button>
                                <pre className="whitespace-pre-wrap font-sans text-sm">{systemPrompt}</pre>
                            </>
                        )}
                        {!isLoading && !systemPrompt && !error && <div className="text-text-secondary h-full flex items-center justify-center">The system prompt for your chatbot will appear here.</div>}
                    </div>
                </div>
            </div>
        </div>
    );
};