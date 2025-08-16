import React, { useState, useCallback } from 'react';
import { FileCodeIcon, SparklesIcon } from '../icons.tsx';
import { useLocalStorage } from '../../hooks/useLocalStorage.ts';
import { summarizeNotesStream } from '../../services/index.ts';
import { LoadingSpinner } from '../shared/index.tsx';
import { MarkdownRenderer } from '../shared/index.tsx';

interface Note {
    id: number;
    text: string;
    x: number;
    y: number;
    color: string;
}

const colors = ['bg-yellow-400 text-yellow-900', 'bg-green-400 text-green-900', 'bg-blue-400 text-blue-900', 'bg-pink-400 text-pink-900', 'bg-purple-400 text-purple-900'];

export const DevNotesStickyPanel: React.FC = () => {
    const [notes, setNotes] = useLocalStorage<Note[]>('devcore_notes', []);
    const [dragging, setDragging] = useState<{ id: number; offsetX: number; offsetY: number } | null>(null);
    const [isSummarizing, setIsSummarizing] = useState(false);
    const [summary, setSummary] = useState('');

    const handleSummarize = useCallback(async () => {
        if (notes.length === 0) return;
        setIsSummarizing(true);
        setSummary('');
        try {
            const allNotesText = notes.map((n: Note) => `- ${n.text}`).join('\n');
            const stream = summarizeNotesStream(allNotesText);
            let fullResponse = '';
            for await (const chunk of stream) {
                fullResponse += chunk;
                setSummary(fullResponse);
            }
        } catch (error) {
            console.error(error);
            setSummary('Sorry, an error occurred while summarizing.');
        } finally {
            setIsSummarizing(false);
        }
    }, [notes]);


    const addNote = () => {
        const newNote: Note = {
            id: Date.now(),
            text: 'New note...',
            x: 50 + (notes.length % 10) * 20,
            y: 50 + (notes.length % 10) * 20,
            color: colors[notes.length % colors.length],
        };
        setNotes([...notes, newNote]);
    };

    const updateText = (id: number, text: string) => {
        setNotes(notes.map((n: Note) => n.id === id ? { ...n, text } : n));
    };
    
    const deleteNote = (id: number, e: React.MouseEvent) => {
        e.stopPropagation();
        setNotes(notes.filter((n: Note) => n.id !== id));
    };

    const onMouseDown = (e: React.MouseEvent<HTMLDivElement>, id: number) => {
        if((e.target as HTMLElement).tagName === 'TEXTAREA' || (e.target as HTMLElement).tagName === 'BUTTON') return;
        const noteElement = e.currentTarget;
        const rect = noteElement.getBoundingClientRect();
        setDragging({ id, offsetX: e.clientX - rect.left, offsetY: e.clientY - rect.top });
    };

    const onMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!dragging) return;
        const boardRect = e.currentTarget.getBoundingClientRect();
        setNotes(
            notes.map((n: Note) =>
                n.id === dragging.id
                    ? { ...n, x: e.clientX - dragging.offsetX - boardRect.left, y: e.clientY - dragging.offsetY - boardRect.top }
                    : n
            )
        );
    };

    const onMouseUp = () => setDragging(null);

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8 text-text-primary">
            <header className="mb-6 flex justify-between items-center">
                 <div>
                    <h1 className="text-3xl font-bold flex items-center"><FileCodeIcon /><span className="ml-3">Dev Notes Sticky Panel</span></h1>
                    <p className="text-text-secondary mt-1">A place for your thoughts, todos, and random ideas.</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={handleSummarize} disabled={isSummarizing || notes.length === 0} className="btn-primary flex items-center gap-2 px-4 py-2">
                        <SparklesIcon/> {isSummarizing ? 'Summarizing...' : 'AI Summarize'}
                    </button>
                    <button onClick={addNote} className="btn-primary px-6 py-2">Add Note</button>
                </div>
            </header>
            <div
                className="relative flex-grow bg-background border-2 border-dashed border-border rounded-lg overflow-hidden"
                onMouseMove={onMouseMove}
                onMouseUp={onMouseUp}
                onMouseLeave={onMouseUp}
            >
                {notes.map((note: Note) => (
                    <div
                        key={note.id}
                        className={`group absolute w-48 h-48 p-2 flex flex-col shadow-lg cursor-grab active:cursor-grabbing rounded-md transition-transform duration-100 border border-black/40 ${note.color}`}
                        style={{ top: note.y, left: note.x, transform: dragging?.id === note.id ? 'scale(1.05)' : 'scale(1)' }}
                        onMouseDown={e => onMouseDown(e, note.id)}
                    >
                         <button onClick={(e) => deleteNote(note.id, e)} className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-gray-700 text-white font-bold text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-red-500 transition-all">&times;</button>
                        <textarea
                            value={note.text}
                            onChange={(e) => updateText(note.id, e.target.value)}
                            className="w-full h-full bg-transparent resize-none focus:outline-none font-medium p-1 placeholder:text-inherit/50"
                        />
                    </div>
                ))}
            </div>
            {(isSummarizing || summary) && (
                 <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm z-50 flex items-center justify-center" onClick={() => setSummary('')}>
                    <div className="w-full max-w-2xl bg-surface border border-border rounded-lg shadow-2xl p-6" onClick={e => e.stopPropagation()}>
                        <h2 className="text-xl font-bold mb-4">AI Summary of Notes</h2>
                        {isSummarizing && !summary ? <LoadingSpinner /> : <MarkdownRenderer content={summary} />}
                    </div>
                </div>
            )}
        </div>
    );
};