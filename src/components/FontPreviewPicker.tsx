// Copyright James Burvel O’Callaghan III
// President Citibank Demo Business Inc.

import React, { useState, useEffect } from 'react';
import { EyeIcon } from './icons.tsx';

const popularFonts = [
    'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Oswald', 'Source Sans Pro', 'Raleway', 'Poppins', 'Nunito', 'Merriweather',
    'Playfair Display', 'Lora', 'Noto Sans', 'Ubuntu', 'PT Sans', 'Slabo 27px'
];

export const FontPreviewPicker: React.FC = () => {
    const [selectedFont, setSelectedFont] = useState('Roboto');
    const [previewText, setPreviewText] = useState('The quick brown fox jumps over the lazy dog.');

    useEffect(() => {
        if (selectedFont) {
            const linkId = 'font-preview-stylesheet';
            let link = document.getElementById(linkId) as HTMLLinkElement;
            if (!link) {
                link = document.createElement('link');
                link.id = linkId;
                link.rel = 'stylesheet';
                document.head.appendChild(link);
            }
            link.href = `https://fonts.googleapis.com/css?family=${selectedFont.replace(/ /g, '+')}&display=swap`;
        }
    }, [selectedFont]);
    
    const importRule = `@import url('https://fonts.googleapis.com/css?family=${selectedFont.replace(/ /g, '+')}&display=swap');`;
    const cssRule = `font-family: '${selectedFont}', sans-serif;`;

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8 text-text-primary">
            <header className="mb-6">
                <h1 className="text-3xl font-bold flex items-center">
                    <EyeIcon />
                    <span className="ml-3">Font Preview & Picker</span>
                </h1>
                <p className="text-text-secondary mt-1">Preview Google Fonts and get the CSS import rule.</p>
            </header>
            <div className="flex-grow grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">
                <div className="lg:col-span-1 flex flex-col gap-4 bg-surface border border-border p-6 rounded-lg">
                    <h3 className="text-xl font-bold">Controls</h3>
                    <div>
                        <label htmlFor="font-select" className="block text-sm font-medium text-text-secondary">Select Font</label>
                        <select id="font-select" value={selectedFont} onChange={e => setSelectedFont(e.target.value)} className="w-full mt-1 px-3 py-2 rounded-md bg-surface border border-border">
                            {popularFonts.map(font => <option key={font} value={font}>{font}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="preview-text" className="block text-sm font-medium text-text-secondary">Preview Text</label>
                        <textarea id="preview-text" value={previewText} onChange={e => setPreviewText(e.target.value)} className="w-full mt-1 p-2 rounded-md bg-surface border border-border h-24 resize-none"></textarea>
                    </div>
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-text-secondary">CSS Rules</label>
                        <div className="relative"><pre className="bg-background p-2 rounded-md text-primary text-xs overflow-x-auto">{importRule}</pre><button onClick={() => navigator.clipboard.writeText(importRule)} className="absolute top-1 right-1 px-2 py-0.5 bg-gray-100 hover:bg-gray-200 rounded-md text-xs">Copy</button></div>
                        <div className="relative"><pre className="bg-background p-2 rounded-md text-primary text-xs overflow-x-auto">{cssRule}</pre><button onClick={() => navigator.clipboard.writeText(cssRule)} className="absolute top-1 right-1 px-2 py-0.5 bg-gray-100 hover:bg-gray-200 rounded-md text-xs">Copy</button></div>
                    </div>
                </div>
                <div className="lg:col-span-2 bg-background border border-border rounded-lg p-8 flex items-center justify-center">
                    <p className="text-4xl" style={{ fontFamily: `'${selectedFont}', sans-serif` }}>
                        {previewText}
                    </p>
                </div>
            </div>
        </div>
    );
};