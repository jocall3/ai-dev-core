import React from 'react';
import { useGlobalState } from '../contexts/GlobalStateContext.tsx';
import { clearAllFiles } from '../services/index.ts';
import { useLocalStorage } from '../hooks/useLocalStorage.ts';
import { ALL_FEATURES } from './index.ts';
import { SunIcon, MoonIcon, TrashIcon, ArrowLeftOnRectangleIcon } from './icons.tsx';

const ToggleSwitch: React.FC<{ checked: boolean, onChange: () => void }> = ({ checked, onChange }) => {
    return (
        <button
            role="switch"
            aria-checked={checked}
            onClick={onChange}
            className={`${checked ? 'bg-primary' : 'bg-gray-300'} relative inline-flex h-6 w-11 items-center rounded-full transition-colors`}
        >
            <span className={`${checked ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform`} />
        </button>
    );
};

export const SettingsView: React.FC = () => {
    const { state, dispatch } = useGlobalState();
    const [, setSnippets] = useLocalStorage('gemini_toolkit_snippets', []);
    const [, setNotes] = useLocalStorage('gemini_toolkit_moodboard', []);
    const [, setDevNotes] = useLocalStorage('gemini_toolkit_notes', []);

    const handleClearGeneratedFiles = async () => {
        if (window.confirm("Are you sure you want to delete all AI-generated files? This cannot be undone.")) {
            await clearAllFiles();
            alert("Generated files cleared.");
        }
    };
    
    const handleClearSnippets = () => {
        if (window.confirm("Are you sure you want to delete all saved snippets? This cannot be undone.")) {
            setSnippets([]);
            alert("Snippets cleared.");
        }
    };

    const handleClearNotes = () => {
        if (window.confirm("Are you sure you want to delete all notes and moodboard items? This cannot be undone.")) {
            setNotes([]);
            setDevNotes([]);
            alert("Notes & Moodboard cleared.");
        }
    };

    return (
        <div className="w-full text-text-primary">
            <header className="sticky top-0 z-10 p-4 sm:p-6 lg:p-8 border-b border-border bg-surface/80 backdrop-blur-sm">
                <div className="max-w-4xl mx-auto w-full">
                    <h1 className="text-4xl font-extrabold tracking-tight">Settings</h1>
                    <p className="mt-2 text-lg text-text-secondary">Manage application preferences and data.</p>
                </div>
            </header>

            <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-4xl mx-auto w-full">
                {/* Appearance Section */}
                <section>
                    <h2 className="text-2xl font-bold border-b border-border pb-2 mb-4">Appearance</h2>
                    <div className="flex items-center justify-between p-4 bg-surface border border-border rounded-lg">
                        <span className="font-medium">Theme</span>
                        <p className="text-sm text-text-secondary">
                            Light mode is enforced in the current version.
                        </p>
                    </div>
                </section>
                
                 {/* Feature Visibility Section */}
                <section>
                    <h2 className="text-2xl font-bold border-b border-border pb-2 mb-4">Feature Visibility</h2>
                     <p className="text-sm text-text-secondary mb-4">
                        Hide or show features in the main sidebar. This does not disable them; they can still be accessed via the AI Command Center.
                    </p>
                    <div className="space-y-2">
                        {ALL_FEATURES.filter(f => f.id !== 'ai-command-center').map(feature => {
                            const isVisible = !state.hiddenFeatures.includes(feature.id);
                            return (
                                <div key={feature.id} className="flex items-center justify-between p-4 bg-surface border border-border rounded-lg">
                                    <div>
                                        <p className="font-medium">{feature.name}</p>
                                        <p className="text-sm text-text-secondary">{feature.description}</p>
                                    </div>
                                    <ToggleSwitch 
                                        checked={isVisible}
                                        onChange={() => dispatch({ type: 'TOGGLE_FEATURE_VISIBILITY', payload: { featureId: feature.id } })}
                                    />
                                </div>
                            );
                        })}
                    </div>
                </section>
                
                {/* Data Management Section */}
                <section>
                    <h2 className="text-2xl font-bold border-b border-border pb-2 mb-4">Data Management</h2>
                    <div className="space-y-4">
                         <div className="flex items-center justify-between p-4 bg-surface border border-border rounded-lg">
                             <div>
                                <p className="font-medium">Clear Generated Files</p>
                                <p className="text-sm text-text-secondary">Removes all files created by the AI Feature Builder.</p>
                             </div>
                             <button onClick={handleClearGeneratedFiles} className="flex items-center gap-2 px-4 py-2 rounded-md bg-red-500/10 text-red-600 hover:bg-red-500/20 transition-colors">
                                <TrashIcon /> Clear
                             </button>
                         </div>
                         <div className="flex items-center justify-between p-4 bg-surface border border-border rounded-lg">
                             <div>
                                <p className="font-medium">Clear Snippet Vault</p>
                                <p className="text-sm text-text-secondary">Removes all saved code snippets.</p>
                             </div>
                             <button onClick={handleClearSnippets} className="flex items-center gap-2 px-4 py-2 rounded-md bg-red-500/10 text-red-600 hover:bg-red-500/20 transition-colors">
                                <TrashIcon /> Clear
                             </button>
                         </div>
                         <div className="flex items-center justify-between p-4 bg-surface border border-border rounded-lg">
                             <div>
                                <p className="font-medium">Clear Notes & Moodboard</p>
                                <p className="text-sm text-text-secondary">Removes all items from Dev Notes and Moodboard.</p>
                             </div>
                             <button onClick={handleClearNotes} className="flex items-center gap-2 px-4 py-2 rounded-md bg-red-500/10 text-red-600 hover:bg-red-500/20 transition-colors">
                                <TrashIcon /> Clear
                             </button>
                         </div>
                    </div>
                </section>

                {/* About Section */}
                <section>
                    <h2 className="text-2xl font-bold border-b border-border pb-2 mb-4">About</h2>
                     <div className="p-4 bg-surface border border-border rounded-lg text-text-secondary">
                        <p><strong>Gemini AI Toolkit</strong></p>
                        <p>Version 2.0.0</p>
                        <p>An open-access toolkit powered by the Google Gemini API.</p>
                     </div>
                </section>
            </div>
        </div>
    );
};