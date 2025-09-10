import React, { useState, useCallback, useRef } from 'react';
import { generateComponentFromImageStream } from '../services/geminiService.ts';
import { PhotoIcon, ArrowDownTrayIcon } from './icons.tsx';
import { LoadingSpinner, MarkdownRenderer } from './shared/index.tsx';
import { fileToBase64, blobToDataURL, downloadFile } from '../services/fileUtils.ts';

export const ScreenshotToComponent: React.FC = () => {
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [rawCode, setRawCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleGenerate = async (base64Image: string) => {
        setIsLoading(true);
        setError('');
        setRawCode('');
        try {
            const stream = generateComponentFromImageStream(base64Image);
            let fullResponse = '';
            for await (const chunk of stream) {
                fullResponse += chunk;
                setRawCode(fullResponse.replace(/^```(?:\w+\n)?/, '').replace(/```$/, ''));
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    const processImageBlob = async (blob: Blob) => {
        try {
            const [dataUrl, base64Image] = await Promise.all([blobToDataURL(blob), fileToBase64(blob as File)]);
            setPreviewImage(dataUrl);
            handleGenerate(base64Image);
        } catch (e) {
            setError('Could not process the image.');
        }
    };
    
    const handlePaste = useCallback(async (event: React.ClipboardEvent) => {
        const items = event.clipboardData.items;
        for (const item of items) {
            if (item.type.indexOf('image') !== -1) {
                const blob = item.getAsFile();
                if (blob) await processImageBlob(blob);
                return;
            }
        }
    }, []);

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) await processImageBlob(file);
    };

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8">
            <header className="mb-6"><h1 className="text-3xl font-bold text-slate-100 flex items-center"><PhotoIcon /><span className="ml-3">AI Screenshot-to-Component</span></h1><p className="text-slate-400 mt-1">Paste or upload a screenshot of a UI element to generate React/Tailwind code.</p></header>
            <div className="flex-grow grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0">
                <div onPaste={handlePaste} className="flex flex-col items-center justify-center bg-slate-800/50 p-6 rounded-lg border-2 border-dashed border-slate-700 focus:outline-none focus:border-cyan-500 overflow-y-auto" tabIndex={0}>
                    {previewImage ? (<img src={previewImage} alt="Pasted content" className="max-w-full max-h-full object-contain rounded-md shadow-lg" />) : (<div className="text-center text-slate-400">
                            <h2 className="text-xl font-bold">Paste an image here</h2>
                            <p className="mb-2">(Cmd/Ctrl + V)</p>
                            <p className="text-sm">or</p>
                            <button onClick={() => fileInputRef.current?.click()} className="mt-2 btn-primary px-4 py-2 text-sm">Upload File</button>
                            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden"/>
                        </div>)}
                </div>
                <div className="flex flex-col h-full">
                    <div className="flex justify-between items-center mb-2">
                        <label className="text-sm font-medium text-slate-400">Generated Code</label>
                        {rawCode && !isLoading && (
                            <div className="flex items-center gap-2">
                                <button onClick={() => navigator.clipboard.writeText(rawCode)} className="px-3 py-1 bg-slate-700 text-xs rounded-md hover:bg-slate-600">Copy Code</button>
                                <button onClick={() => downloadFile(rawCode, 'Component.tsx', 'text/typescript')} className="flex items-center gap-1 px-3 py-1 bg-slate-700 text-xs rounded-md hover:bg-slate-600">
                                    <ArrowDownTrayIcon className="w-4 h-4" /> Download
                                </button>
                            </div>
                        )}
                    </div>
                    <div className="flex-grow bg-slate-900 border border-slate-700 rounded-md overflow-y-auto">
                        {isLoading && (<div className="flex items-center justify-center h-full"><LoadingSpinner /></div>)}
                        {error && <p className="p-4 text-red-400">{error}</p>}
                        {rawCode && !isLoading && <MarkdownRenderer content={`\`\`\`tsx\n${rawCode}\n\`\`\``} />}
                        {!isLoading && !rawCode && !error && (<div className="text-slate-500 h-full flex items-center justify-center">Generated component code will appear here.</div>)}
                    </div>
                </div>
            </div>
        </div>
    );
};