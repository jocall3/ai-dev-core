import React, { useState, useCallback } from 'react';
import { HexColorPicker } from 'react-colorful';
import { generateColorPalette } from '../../services/index.ts';
import { SparklesIcon } from '../icons.tsx';
import { LoadingSpinner } from '../shared/index.tsx';

export const ColorPaletteGenerator: React.FC = () => {
    const [baseColor, setBaseColor] = useState("#0047AB");
    const [palette, setPalette] = useState<string[]>(['#0047AB', '#3366CC', '#6688D1', '#99AADD', '#CCD3E8', '#F0F2F5']);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');

    const handleGenerate = useCallback(async () => {
        setIsLoading(true);
        setError('');
        try {
            const result = await generateColorPalette(baseColor);
            setPalette(result.colors);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
            setError(`Failed to generate palette: ${errorMessage}`);
        } finally {
            setIsLoading(false);
        }
    }, [baseColor]);

    const handleCopy = (color: string) => {
        navigator.clipboard.writeText(color);
    };

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8 text-text-primary">
            <header className="mb-6 text-center">
                <h1 className="text-3xl font-bold flex items-center justify-center">
                    <SparklesIcon />
                    <span className="ml-3">AI Color Palette Generator</span>
                </h1>
                <p className="text-text-secondary mt-1">Pick a base color and let Gemini design a beautiful palette for you.</p>
            </header>
            <div className="flex-grow flex flex-col md:flex-row items-center justify-center gap-8">
                <div className="flex flex-col items-center gap-4">
                     <HexColorPicker color={baseColor} onChange={setBaseColor} className="!w-64 !h-64"/>
                     <div className="p-2 bg-surface rounded-md font-mono text-lg border border-border" style={{color: baseColor}}>{baseColor}</div>
                      <button
                        onClick={handleGenerate}
                        disabled={isLoading}
                        className="btn-primary w-full flex items-center justify-center px-6 py-3"
                    >
                        {isLoading ? <LoadingSpinner /> : 'Generate Palette'}
                    </button>
                    {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
                </div>
                <div className="flex flex-col gap-2 w-full max-w-sm">
                    <label className="text-sm font-medium text-text-secondary mb-2">Generated Palette:</label>
                    {isLoading ? (
                         <div className="flex items-center justify-center h-48"><LoadingSpinner /></div>
                    ) : (
                        palette.map((color) => (
                            <div key={color} className="group flex items-center justify-between p-4 rounded-md shadow-md border border-border" style={{ backgroundColor: color }}>
                                <span className="font-mono font-bold text-black/70 mix-blend-overlay">{color}</span>
                                <button
                                    onClick={() => handleCopy(color)}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/30 hover:bg-white/50 px-3 py-1 rounded text-xs text-black font-semibold backdrop-blur-sm">
                                    Copy
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};