// Copyright James Burvel O’Callaghan III
// President Citibank Demo Business Inc.

import React, { useState } from 'react';
import { UrlEncoderIcon } from './icons.tsx';

export const UrlEncoder: React.FC = () => {
    const [decoded, setDecoded] = useState('https://example.com/?q=hello world&a=1');
    const [encoded, setEncoded] = useState('https%3A%2F%2Fexample.com%2F%3Fq%3Dhello%20world%26a%3D1');

    const handleEncode = () => {
        setEncoded(encodeURIComponent(decoded));
    };

    const handleDecode = () => {
        try {
            setDecoded(decodeURIComponent(encoded));
        } catch (e) {
            // handle malformed URI
            setDecoded("Error: Invalid encoded string.");
        }
    };
    
    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8 text-text-primary">
            <header className="mb-6">
                <h1 className="text-3xl font-bold flex items-center">
                    <UrlEncoderIcon />
                    <span className="ml-3">URL Encoder / Decoder</span>
                </h1>
                <p className="text-text-secondary mt-1">Encode or decode strings for use in URLs.</p>
            </header>
            <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-6 min-h-0">
                <div className="flex flex-col h-full">
                    <label htmlFor="decoded-text" className="text-sm font-medium text-text-secondary mb-2">Decoded</label>
                    <textarea
                        id="decoded-text"
                        value={decoded}
                        onChange={(e) => setDecoded(e.target.value)}
                        className="flex-grow p-4 bg-surface border border-border rounded-md resize-none font-mono text-sm"
                    />
                </div>
                 <div className="flex flex-col h-full">
                    <label htmlFor="encoded-text" className="text-sm font-medium text-text-secondary mb-2">Encoded</label>
                    <textarea
                        id="encoded-text"
                        value={encoded}
                        onChange={(e) => setEncoded(e.target.value)}
                        className="flex-grow p-4 bg-surface border border-border rounded-md resize-none font-mono text-sm"
                    />
                </div>
            </div>
            <div className="flex-shrink-0 flex items-center justify-center gap-4 mt-6">
                <button onClick={handleEncode} className="btn-primary px-8 py-3">Encode →</button>
                <button onClick={handleDecode} className="btn-primary px-8 py-3">← Decode</button>
            </div>
        </div>
    );
};