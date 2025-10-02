// Copyright James Burvel O’Callaghan III
// President Citibank Demo Business Inc.

import React, { useState, useMemo } from 'react';
import { ColorContrastCheckerIcon } from './icons.tsx';

// Function to parse a hex color string
const parseHex = (hex: string): [number, number, number] | null => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)] : null;
};

// Function to calculate luminance
const getLuminance = (r: number, g: number, b: number): number => {
    const a = [r, g, b].map(v => {
        v /= 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
};

// Function to calculate contrast ratio
const getContrastRatio = (color1: string, color2: string): number | null => {
    const rgb1 = parseHex(color1);
    const rgb2 = parseHex(color2);

    if (!rgb1 || !rgb2) return null;

    const lum1 = getLuminance(...rgb1);
    const lum2 = getLuminance(...rgb2);

    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);

    return (brightest + 0.05) / (darkest + 0.05);
};

const ResultRow: React.FC<{ label: string; ratio: number; pass: boolean }> = ({ label, ratio, pass }) => (
    <div className="flex justify-between items-center p-3 bg-background rounded-md border border-border">
        <div className="text-sm">
            <p className="font-semibold">{label}</p>
            <p className="text-xs text-text-secondary">WCAG requirement: {ratio}:1</p>
        </div>
        <span className={`px-3 py-1 text-sm font-bold rounded-full ${pass ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {pass ? 'Pass' : 'Fail'}
        </span>
    </div>
);


export const ColorContrastChecker: React.FC = () => {
    const [textColor, setTextColor] = useState('#FFFFFF');
    const [bgColor, setBgColor] = useState('#0047AB');

    const contrast = useMemo(() => getContrastRatio(textColor, bgColor), [textColor, bgColor]);

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8 text-text-primary">
            <header className="mb-6 text-center">
                <h1 className="text-3xl font-bold flex items-center justify-center">
                    <ColorContrastCheckerIcon />
                    <span className="ml-3">Color Contrast Checker</span>
                </h1>
                <p className="text-text-secondary mt-1">Check if your color combinations meet WCAG accessibility standards.</p>
            </header>

            <div className="w-full max-w-4xl mx-auto flex-grow flex flex-col md:flex-row gap-8">
                <div className="md:w-1/2 flex flex-col gap-6">
                    <div>
                        <label htmlFor="text-color" className="block text-sm font-medium mb-1">Text Color</label>
                        <input id="text-color" type="color" value={textColor} onChange={e => setTextColor(e.target.value)} className="w-full h-12 border border-border rounded-md" />
                        <input type="text" value={textColor} onChange={e => setTextColor(e.target.value)} className="w-full mt-2 p-2 bg-surface border border-border rounded-md font-mono" />
                    </div>
                    <div>
                        <label htmlFor="bg-color" className="block text-sm font-medium mb-1">Background Color</label>
                        <input id="bg-color" type="color" value={bgColor} onChange={e => setBgColor(e.target.value)} className="w-full h-12 border border-border rounded-md" />
                        <input type="text" value={bgColor} onChange={e => setBgColor(e.target.value)} className="w-full mt-2 p-2 bg-surface border border-border rounded-md font-mono" />
                    </div>
                </div>

                <div className="md:w-1/2 flex flex-col">
                    <div className="flex-grow p-8 rounded-lg flex flex-col justify-center items-center text-center transition-colors" style={{ backgroundColor: bgColor, color: textColor }}>
                        <h2 className="text-3xl font-bold">Live Preview</h2>
                        <p className="mt-2 max-w-sm">The quick brown fox jumps over the lazy dog.</p>
                    </div>
                    <div className="mt-6 p-4 bg-surface rounded-lg border border-border">
                         <div className="text-center mb-4">
                            <p className="text-sm text-text-secondary">Contrast Ratio</p>
                            <p className="text-4xl font-bold text-primary">{contrast ? contrast.toFixed(2) : 'N/A'}:1</p>
                        </div>
                        <div className="space-y-2">
                           {contrast && (
                                <>
                                    <ResultRow label="Normal Text (AA)" ratio={4.5} pass={contrast >= 4.5} />
                                    <ResultRow label="Large Text (AA)" ratio={3} pass={contrast >= 3} />
                                    <ResultRow label="Normal Text (AAA)" ratio={7} pass={contrast >= 7} />
                                    <ResultRow label="Large Text (AAA)" ratio={4.5} pass={contrast >= 4.5} />
                                </>
                           )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};