// Copyright James Burvel O’Callaghan III
// President Citibank Demo Business Inc.

import React, { useState } from 'react';
import { Base64EncoderIcon } from './icons.tsx';

export const Base64Encoder: React.FC = () => {
    const [input, setInput] = useState('Hello, World!');
    const [output, setOutput] = useState('SGVsbG8sIFdvcmxkIQ==');
    const [error, setError] = useState('');

    const handleEncode = () => {
        try {
            setOutput(btoa(input));
            setError('');
        } catch (e) {
            setError('Could not encode the input. Check for invalid characters.');
        }
    };

    const handleDecode = () => {
        try {
            setInput(atob(output));
            setError('');
        } catch (e) {
            setError('Could not decode the input. It may not be valid Base64.');
        }
    };

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8 text-text-primary">
            <header className="mb-6">
                <h1 className="text-3xl font-bold flex items-center">
                    <Base64EncoderIcon />
                    <span className="ml-3">Base64 Encoder / Decoder</span>
                </h1>
                <p className="text-text-secondary mt-1">A simple utility to encode to and decode from Base64.</p>
            </header>
            <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-6 min-h-0">
                <div className="flex flex-col h-full">
                    <label htmlFor="plain-text" className="text-sm font-medium text-text-secondary mb-2">Plain Text</label>
                    <textarea
                        id="plain-text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        className="flex-grow p-4 bg-surface border border-border rounded-md resize-none font-mono text-sm"
                    />
                </div>
                 <div className="flex flex-col h-full">
                    <label htmlFor="base64-text" className="text-sm font-medium text-text-secondary mb-2">Base64</label>
                    <textarea
                        id="base64-text"
                        value={output}
                        onChange={(e) => setOutput(e.target.value)}
                        className="flex-grow p-4 bg-surface border border-border rounded-md resize-none font-mono text-sm"
                    />
                </div>
            </div>
            <div className="flex-shrink-0 flex items-center justify-center gap-4 mt-6">
                <button onClick={handleEncode} className="btn-primary px-8 py-3">Encode →</button>
                <button onClick={handleDecode} className="btn-primary px-8 py-3">← Decode</button>
            </div>
            {error && <p className="text-red-500 text-sm text-center mt-4">{error}</p>}
        </div>
    );
};