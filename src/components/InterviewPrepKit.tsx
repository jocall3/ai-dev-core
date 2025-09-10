import React, { useState, useCallback } from 'react';
import { InterviewPrepKitIcon } from './icons.tsx';
import { generateInterviewQuestionsStream } from '../services/geminiService.ts';
import { LoadingSpinner, MarkdownRenderer } from './shared/index.tsx';

const topics = ['JavaScript', 'React', 'Node.js', 'System Design', 'Data Structures & Algorithms', 'CSS'];

export const InterviewPrepKit: React.FC = () => {
    const [topic, setTopic] = useState('React');
    const [questions, setQuestions] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleGenerate = useCallback(async () => {
        if (!topic) {
            setError('Please select a topic.');
            return;
        }
        setIsLoading(true);
        setError('');
        setQuestions('');
        try {
            const stream = generateInterviewQuestionsStream(topic);
            let fullResponse = '';
            for await (const chunk of stream) {
                fullResponse += chunk;
                setQuestions(fullResponse);
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
                    <InterviewPrepKitIcon />
                    <span className="ml-3">AI Interview Prep Kit</span>
                </h1>
                <p className="text-text-secondary mt-1">Select a topic to generate common interview questions and answers.</p>
            </header>
            <div className="flex items-center gap-4 mb-4">
                <label htmlFor="topic-select" className="text-sm font-medium text-text-secondary">Topic:</label>
                <select id="topic-select" value={topic} onChange={e => setTopic(e.target.value)} className="flex-grow p-2 bg-surface border border-border rounded-md">
                    {topics.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <button
                    onClick={handleGenerate}
                    disabled={isLoading}
                    className="btn-primary px-6 py-2"
                >
                    {isLoading ? <LoadingSpinner /> : 'Generate Q&A'}
                </button>
            </div>
            <div className="flex-grow flex flex-col min-h-0">
                <div className="flex-grow p-4 bg-background border border-border rounded-md overflow-y-auto">
                    {isLoading && !questions && <div className="flex items-center justify-center h-full"><LoadingSpinner /></div>}
                    {error && <p className="text-red-500">{error}</p>}
                    {questions && <MarkdownRenderer content={questions} />}
                    {!isLoading && !questions && !error && <div className="text-text-secondary h-full flex items-center justify-center">Select a topic and generate questions to start.</div>}
                </div>
            </div>
        </div>
    );
};